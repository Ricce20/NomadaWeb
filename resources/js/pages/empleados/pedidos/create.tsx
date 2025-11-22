import React, { useState, useCallback, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { debounce } from 'lodash';
import { ChevronDown, ChevronUp, MapPin, Check, Plus } from 'lucide-react';
import { SucursalItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import orders from '@/routes/sucursal/orders';
import CalculadoraRutaEnvio from '@/components/calcular-ruta-envio';
import SelectorUbicacionSucursal from '@/components/selectorUbicacionSucursal';

const breadcrumbs = [
    {
        title: "Generar Pedido",
        href: '/'
    }
];

interface Producto {
    id: number;
    product_base_id: number;
    nombre: string;
    descripcion: string;
    sku: string;
    unidad_medida: string;
    precio: number;
    imagen_url: string | null;
    marca: string | null;
    categoria: string | null;
    sale_type: string;
}

interface Direccion {
    id: number;
    direccion_completa: string;
    referencias: string;
    codigo_postal: string;
    latitud?: number;
    longitud?: number;
    activo: boolean;
}

interface Cliente {
    id: number;
    nombre: string;
    apellidos: string;
    telefono: string;
    direcciones: Direccion[] | null;
}

interface CartItem {
    product_id: number;
    nombre: string;
    precio: number;
    cantidad: number;
    unidad_medida: string;
    subtotal: number;
}

interface vehiculo {
    id: number;
    placa: string;
    modelo: string;
    capacidad_carga_kg: number;
    kilometros_por_litro: number;
    precio_litro_combustible: number;
    tipo: string;
}

interface PedidoProps {
    cliente: Cliente;
    sucursal: SucursalItem;
    vehiculos: vehiculo[];
}

export default function PedidosLocales({ cliente, sucursal, vehiculos }: PedidoProps) {
    // Estados del carrito y direcciones
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedDireccion, setSelectedDireccion] = useState<Direccion | null>(null);
    const [mostrarModalNuevaDireccion, setMostrarModalNuevaDireccion] = useState(false);
    const [nuevaDireccion, setNuevaDireccion] = useState<Partial<Direccion>>({
        direccion_completa: '',
        referencias: '',
        codigo_postal: '',
        latitud: undefined,
        longitud: undefined
    });
    
    // Estados para acordeones
    const [seccionDireccionAbierta, setSeccionDireccionAbierta] = useState(true);
    const [seccionProductosAbierta, setSeccionProductosAbierta] = useState(false);
    const [seccionTransporteAbierta, setSeccionTransporteAbierta] = useState(false);
    
    // Estados de búsqueda de productos
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Producto[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Estados de transporte y ruta
    const [requiereEnvio, setRequiereEnvio] = useState(true);
    const [datosRuta, setDatosRuta] = useState<{
        distanciaKm: number;
        duracionMinutos: number;
        costoEnvio: number;
    } | null>(null);

    // Inicializar el cliente y su dirección al cargar el componente
    useEffect(() => {
        if (cliente.direcciones && cliente.direcciones.length > 0) {
            setSelectedDireccion(cliente.direcciones[0]);
        }
    }, [cliente]);

    // Búsqueda debounced de productos
    const searchProducts = useCallback(
        debounce(async (search: string) => {
            if (!search.trim()) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const params = new URLSearchParams({
                    search: search.trim(),
                    sucursal_id: sucursal.id.toString()
                });
                
                const response = await fetch(`${orders.searchProducts().url}?${params.toString()}`, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error en la búsqueda');
                }
                
                const productos = await response.json();
                setSearchResults(productos);
            } catch (error) {
                console.error('Error buscando productos:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300),
        [sucursal.id]
    );

    useEffect(() => {
        searchProducts(searchTerm);
    }, [searchTerm, searchProducts]);

    // Funciones del carrito
    const agregarAlCarrito = (producto: Producto) => {
        const existingItem = cart.find(item => item.product_id === producto.id);
        
        if (existingItem) {
            setCart(cart.map(item =>
                item.product_id === producto.id
                    ? { 
                        ...item, 
                        cantidad: item.cantidad + 1,
                        subtotal: (item.cantidad + 1) * item.precio
                    }
                    : item
            ));
        } else {
            setCart([...cart, {
                product_id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: 1,
                unidad_medida: producto.unidad_medida,
                subtotal: producto.precio
            }]);
        }
        
        setSearchTerm('');
        setSearchResults([]);
    };

    const eliminarDelCarrito = (productId: number) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const actualizarCantidad = (productId: number, cantidad: number) => {
        if (cantidad < 1) return;
        
        setCart(cart.map(item =>
            item.product_id === productId
                ? { 
                    ...item, 
                    cantidad: cantidad,
                    subtotal: cantidad * item.precio
                }
                : item
        ));
    };

    // Funciones de dirección
    const handleUbicacionSeleccionada = (ubicacionData: {
        coordenadas: [number, number];
        direccion: string;
    }) => {
        setNuevaDireccion(prev => ({
            ...prev,
            direccion_completa: ubicacionData.direccion,
            latitud: ubicacionData.coordenadas[0],
            longitud: ubicacionData.coordenadas[1]
        }));
    };

    const guardarNuevaDireccion = () => {
        if (!nuevaDireccion.direccion_completa || !nuevaDireccion.codigo_postal) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }

        if (!nuevaDireccion.latitud || !nuevaDireccion.longitud) {
            alert('Por favor selecciona la ubicación en el mapa');
            return;
        }

        const direccionGuardada: Direccion = {
            id: Date.now(),
            direccion_completa: nuevaDireccion.direccion_completa,
            referencias: nuevaDireccion.referencias || '',
            codigo_postal: nuevaDireccion.codigo_postal,
            latitud: nuevaDireccion.latitud,
            longitud: nuevaDireccion.longitud,
            activo: true
        };

        setSelectedDireccion(direccionGuardada);
        setMostrarModalNuevaDireccion(false);
        
        setNuevaDireccion({
            direccion_completa: '',
            referencias: '',
            codigo_postal: '',
            latitud: undefined,
            longitud: undefined
        });

        setSeccionDireccionAbierta(false);
        setSeccionProductosAbierta(true);
    };

    // Callback cuando se calcula la ruta
    const handleRutaCalculada = useCallback((data: {
        distanciaKm: number;
        duracionMinutos: number;
        costoEnvio: number;
    }) => {
        setDatosRuta(data);
    }, []); // Sin dependencias porque solo setea el estado

    // Calcular totales
    const totalCarrito = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const totalFinal = totalCarrito + (requiereEnvio && datosRuta ? datosRuta.costoEnvio : 0);

    // Enviar pedido
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedDireccion) {
            alert('Selecciona o agrega una dirección de entrega');
            return;
        }

        if (cart.length === 0) {
            alert('Agrega productos al carrito');
            return;
        }

        const orderData = {
            cliente_id: cliente.id,
            sucursal_id: sucursal.id,
            direccion_entrega: selectedDireccion.direccion_completa,
            direccion_id: selectedDireccion.id,
            latitud: selectedDireccion.latitud,
            longitud: selectedDireccion.longitud,
            requiere_envio: requiereEnvio,
            ...(requiereEnvio && datosRuta && {
                distancia_km: datosRuta.distanciaKm,
                duracion_minutos: datosRuta.duracionMinutos,
                costo_envio: datosRuta.costoEnvio
            }),
            productos: cart.map(item => ({
                producto_id: item.product_id,
                cantidad: item.cantidad,
                precio_unitario: item.precio
            })),
            total: totalFinal
        };

        setIsSubmitting(true);

        router.post('/orders/store', orderData, {
            preserveScroll: true,
            onSuccess: () => {
                setCart([]);
                setSearchTerm('');
                setSearchResults([]);
                setDatosRuta(null);
                setIsSubmitting(false);
            },
            onError: (errors) => {
                console.error('Error al crear pedido:', errors);
                alert('Hubo un error al crear el pedido. Por favor, intenta nuevamente.');
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Generar Pedido" />

            <div className="min-h-screen bg-gray-50 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header del Cliente */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    {cliente.nombre} {cliente.apellidos}
                                </h1>
                                <div className="flex items-center gap-6 text-sm text-gray-600">
                                    <span className="flex items-center gap-2">
                                        📞 {cliente.telefono}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        🏪 {sucursal.nombre}
                                    </span>
                                </div>
                            </div>
                            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                                ✅ Activo
                            </span>
                        </div>
                    </div>

                    {/* Layout de 2 columnas */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Columna Izquierda: Secciones Colapsables */}
                        <div className="lg:col-span-2 space-y-4">
                            
                            {/* SECCIÓN 1: DIRECCIÓN DE ENTREGA */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    onClick={() => setSeccionDireccionAbierta(!seccionDireccionAbierta)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            selectedDireccion ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                            {selectedDireccion ? <Check className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                                        </div>
                                        <div className="text-left">
                                            <h2 className="text-xl font-bold text-gray-900">
                                                1. Dirección de Entrega
                                            </h2>
                                            {selectedDireccion && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {selectedDireccion.direccion_completa.substring(0, 50)}...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {seccionDireccionAbierta ? (
                                        <ChevronUp className="w-6 h-6 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-6 h-6 text-gray-400" />
                                    )}
                                </button>

                                {seccionDireccionAbierta && (
                                    <div className="px-6 pb-6 border-t border-gray-200">
                                        <div className="pt-6 space-y-4">
                                            {cliente.direcciones && cliente.direcciones.length > 0 && (
                                                <div className="space-y-3">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Selecciona una dirección guardada:
                                                    </label>
                                                    <div className="grid gap-3">
                                                        {cliente.direcciones.map(direccion => (
                                                            <div
                                                                key={direccion.id}
                                                                onClick={() => {
                                                                    setSelectedDireccion(direccion);
                                                                    setSeccionDireccionAbierta(false);
                                                                    setSeccionProductosAbierta(true);
                                                                }}
                                                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                                                    selectedDireccion?.id === direccion.id
                                                                        ? 'border-blue-500 bg-blue-50'
                                                                        : 'border-gray-200 hover:border-blue-300'
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <p className="font-medium text-gray-900">
                                                                            {direccion.direccion_completa}
                                                                        </p>
                                                                        {direccion.referencias && (
                                                                            <p className="text-sm text-gray-600 mt-1">
                                                                                <span className="font-medium">Referencias:</span> {direccion.referencias}
                                                                            </p>
                                                                        )}
                                                                        <p className="text-sm text-gray-500 mt-1">
                                                                            CP: {direccion.codigo_postal}
                                                                        </p>
                                                                    </div>
                                                                    {selectedDireccion?.id === direccion.id && (
                                                                        <div className="ml-3">
                                                                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                                                                <Check className="w-4 h-4 text-white" />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setMostrarModalNuevaDireccion(true)}
                                                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus className="w-5 h-5" />
                                                <span className="font-medium">Agregar nueva dirección</span>
                                            </button>

                                            {selectedDireccion && (
                                                <button
                                                    onClick={() => {
                                                        setSeccionDireccionAbierta(false);
                                                        setSeccionProductosAbierta(true);
                                                    }}
                                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                                >
                                                    Continuar a Productos →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* SECCIÓN 2: PRODUCTOS */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    onClick={() => setSeccionProductosAbierta(!seccionProductosAbierta)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            cart.length > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {cart.length > 0 ? <Check className="w-5 h-5" /> : '🔍'}
                                        </div>
                                        <div className="text-left">
                                            <h2 className="text-xl font-bold text-gray-900">
                                                2. Seleccionar Productos
                                            </h2>
                                            {cart.length > 0 && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {cart.length} producto{cart.length !== 1 ? 's' : ''} en el carrito
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {seccionProductosAbierta ? (
                                        <ChevronUp className="w-6 h-6 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-6 h-6 text-gray-400" />
                                    )}
                                </button>

                                {seccionProductosAbierta && (
                                    <div className="px-6 pb-6 border-t border-gray-200">
                                        <div className="pt-6">
                                            <div className="relative mb-6">
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    placeholder="Buscar productos por nombre, SKU, marca..."
                                                    className="w-full border-gray-300 rounded-xl shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 text-lg"
                                                />
                                                {isSearching && (
                                                    <div className="absolute right-4 top-3.5">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                    </div>
                                                )}
                                            </div>

                                            {searchResults.length > 0 && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                                                    {searchResults.map(producto => (
                                                        <div
                                                            key={producto.id}
                                                            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                                                            onClick={() => agregarAlCarrito(producto)}
                                                        >
                                                            <div className="flex gap-3">
                                                                {producto.imagen_url && (
                                                                    <img 
                                                                        src={producto.imagen_url} 
                                                                        alt={producto.nombre}
                                                                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                                                    />
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <h3 className="font-bold text-gray-900 mb-1">
                                                                        {producto.nombre}
                                                                    </h3>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xl font-bold text-green-600">
                                                                            ${producto.precio.toFixed(2)}
                                                                        </span>
                                                                        <button className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-blue-700">
                                                                            Agregar
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {cart.length > 0 && (
                                                <button
                                                    onClick={() => {
                                                        setSeccionProductosAbierta(false);
                                                        setSeccionTransporteAbierta(true);
                                                    }}
                                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-6"
                                                >
                                                    Continuar a Método de Entrega →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* SECCIÓN 3: TRANSPORTE */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    onClick={() => setSeccionTransporteAbierta(!seccionTransporteAbierta)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            datosRuta ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {datosRuta ? <Check className="w-5 h-5" /> : '🚚'}
                                        </div>
                                        <div className="text-left">
                                            <h2 className="text-xl font-bold text-gray-900">
                                                3. Método de Entrega
                                            </h2>
                                            {datosRuta && requiereEnvio && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Envío a domicilio • {datosRuta.distanciaKm.toFixed(2)} km • ${datosRuta.costoEnvio.toFixed(2)}
                                                </p>
                                            )}
                                            {!requiereEnvio && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Cliente recoge en tienda
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {seccionTransporteAbierta ? (
                                        <ChevronUp className="w-6 h-6 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-6 h-6 text-gray-400" />
                                    )}
                                </button>

                                {seccionTransporteAbierta && (
                                    <div className="px-6 pb-6 border-t border-gray-200">
                                        <div className="pt-6 space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                    Selecciona el método de entrega:
                                                </label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <button
                                                        onClick={() => setRequiereEnvio(false)}
                                                        className={`p-6 rounded-lg border-2 transition-all ${
                                                            !requiereEnvio
                                                                ? 'border-blue-500 bg-blue-50'
                                                                : 'border-gray-200 hover:border-blue-300'
                                                        }`}
                                                    >
                                                        <div className="text-4xl mb-3">🏪</div>
                                                        <div className="font-semibold text-lg mb-1">Cliente recoge</div>
                                                        <div className="text-sm text-gray-600">En sucursal</div>
                                                        <div className="text-xs text-gray-500 mt-2">Sin costo de envío</div>
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => setRequiereEnvio(true)}
                                                        disabled={!selectedDireccion?.latitud || !selectedDireccion?.longitud}
                                                        className={`p-6 rounded-lg border-2 transition-all ${
                                                            requiereEnvio
                                                                ? 'border-blue-500 bg-blue-50'
                                                                : 'border-gray-200 hover:border-blue-300'
                                                        } ${
                                                            (!selectedDireccion?.latitud || !selectedDireccion?.longitud)
                                                                ? 'opacity-50 cursor-not-allowed'
                                                                : ''
                                                        }`}
                                                    >
                                                        <div className="text-4xl mb-3">🚚</div>
                                                        <div className="font-semibold text-lg mb-1">Envío a domicilio</div>
                                                        <div className="text-sm text-gray-600">A la dirección seleccionada</div>
                                                        {datosRuta && (
                                                            <div className="text-xs text-green-600 font-semibold mt-2">
                                                                ${datosRuta.costoEnvio.toFixed(2)} • {datosRuta.distanciaKm.toFixed(2)} km
                                                            </div>
                                                        )}
                                                    </button>
                                                </div>
                                                
                                                {(!selectedDireccion?.latitud || !selectedDireccion?.longitud) && (
                                                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                        <p className="text-yellow-700 text-sm">
                                                            ⚠️ <strong>Nota:</strong> Para calcular el costo de envío, necesitas seleccionar una dirección con ubicación en el mapa.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {requiereEnvio && selectedDireccion?.latitud && selectedDireccion?.longitud && sucursal.latitud && sucursal.longitud && (
                                                <div className="border-t border-gray-200 pt-6">
                                                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                        📍 Ruta de Entrega
                                                    </h4>
                                                    
                                                    <CalculadoraRutaEnvio
                                                        origenCoordenadas={[
                                                            Number(sucursal.latitud),
                                                            Number(sucursal.longitud)
                                                        ]}
                                                        destinoCoordenadas={[
                                                            Number(selectedDireccion.latitud),
                                                            Number(selectedDireccion.longitud)
                                                        ]}
                                                        origenNombre={sucursal.nombre}
                                                        destinoNombre={selectedDireccion.direccion_completa}
                                                        onRutaCalculada={handleRutaCalculada}
                                                    />
                                                </div>
                                            )}

                                            {((!requiereEnvio) || (requiereEnvio && datosRuta)) && (
                                                <div className="border-t border-gray-200 pt-6">
                                                    <button
                                                        onClick={() => {
                                                            setSeccionTransporteAbierta(false);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Check className="w-5 h-5" />
                                                        Listo para generar pedido
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Columna Derecha: Carrito Sticky */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-4">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        🛒 Resumen del Pedido
                                        {cart.length > 0 && (
                                            <span className="bg-blue-600 text-white text-sm font-semibold px-2 py-1 rounded-full">
                                                {cart.length}
                                            </span>
                                        )}
                                    </h2>
                                </div>
                                
                                <div className="p-6">
                                    {cart.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="text-gray-400 text-5xl mb-3">🛒</div>
                                            <p className="text-gray-500">Carrito vacío</p>
                                            <p className="text-gray-400 text-sm mt-1">Agrega productos desde la búsqueda</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 mb-4">
                                                {cart.map(item => (
                                                    <div key={item.product_id} className="border border-gray-200 rounded-lg p-3">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h3 className="font-semibold text-sm flex-1">{item.nombre}</h3>
                                                            <button
                                                                onClick={() => eliminarDelCarrito(item.product_id)}
                                                                className="text-red-500 hover:text-red-700 ml-2"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                        <div className="text-xs text-gray-600 mb-2">
                                                            ${item.precio.toFixed(2)} / {item.unidad_medida}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <button
                                                                    onClick={() => actualizarCantidad(item.product_id, item.cantidad - 1)}
                                                                    className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="font-bold w-8 text-center">{item.cantidad}</span>
                                                                <button
                                                                    onClick={() => actualizarCantidad(item.product_id, item.cantidad + 1)}
                                                                    className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                            <span className="font-bold text-lg">
                                                                ${item.subtotal.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div className="border-t border-gray-200 pt-4 mb-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-gray-600">Subtotal:</span>
                                                    <span className="font-semibold">${totalCarrito.toFixed(2)}</span>
                                                </div>
                                                {requiereEnvio && datosRuta && (
                                                    <>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-gray-600">
                                                                Envío ({datosRuta.distanciaKm.toFixed(2)} km):
                                                            </span>
                                                            <span className="font-semibold text-blue-600">
                                                                ${datosRuta.costoEnvio.toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
                                                            <span>Tiempo estimado:</span>
                                                            <span>{datosRuta.duracionMinutos} min</span>
                                                        </div>
                                                    </>
                                                )}
                                                {requiereEnvio && !datosRuta && (
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-gray-600">Envío:</span>
                                                        <span className="text-sm text-yellow-600">Calculando...</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center text-xl font-bold pt-2 border-t border-gray-200">
                                                    <span>Total:</span>
                                                    <span className="text-green-600">
                                                        ${totalFinal.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <button
                                                    onClick={handleSubmit}
                                                    disabled={isSubmitting || !selectedDireccion || cart.length === 0}
                                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {isSubmitting ? (
                                                        <span className="flex items-center justify-center gap-2">
                                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                            Procesando...
                                                        </span>
                                                    ) : (
                                                        '🎉 Generar Pedido'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => router.visit('/dashboard')}
                                                    className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>

                                            {/* Validaciones antes de generar pedido */}
                                            {!selectedDireccion && (
                                                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                    <p className="text-yellow-700 text-xs">
                                                        ⚠️ Selecciona una dirección de entrega
                                                    </p>
                                                </div>
                                            )}
                                            {requiereEnvio && !datosRuta && selectedDireccion?.latitud && (
                                                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                    <p className="text-blue-700 text-xs">
                                                        ℹ️ Calculando ruta y costo de envío...
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para Nueva Dirección */}
            {mostrarModalNuevaDireccion && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <MapPin className="w-6 h-6 text-blue-600" />
                                Nueva Dirección de Entrega
                            </h3>
                            <button
                                onClick={() => setMostrarModalNuevaDireccion(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Formulario de Dirección */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Código Postal *
                                    </label>
                                    <input
                                        type="text"
                                        value={nuevaDireccion.codigo_postal || ''}
                                        onChange={(e) => setNuevaDireccion(prev => ({
                                            ...prev,
                                            codigo_postal: e.target.value
                                        }))}
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5"
                                        placeholder="45050"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Referencias (opcional)
                                    </label>
                                    <textarea
                                        value={nuevaDireccion.referencias || ''}
                                        onChange={(e) => setNuevaDireccion(prev => ({
                                            ...prev,
                                            referencias: e.target.value
                                        }))}
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5"
                                        rows={3}
                                        placeholder="Entre calles, puntos de referencia, color de casa, etc."
                                    />
                                </div>
                            </div>

                            {/* Selector de Ubicación con Mapa */}
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <SelectorUbicacionSucursal
                                    onUbicacionSeleccionada={handleUbicacionSeleccionada}
                                    ubicacionInicial={
                                        nuevaDireccion.latitud && nuevaDireccion.longitud
                                            ? [Number(nuevaDireccion.latitud), Number(nuevaDireccion.longitud)] as [number, number]
                                            : null
                                    }
                                    direccionInicial={nuevaDireccion.direccion_completa || ''}
                                />
                            </div>

                            {/* Resumen de la dirección a guardar */}
                            {nuevaDireccion.direccion_completa && nuevaDireccion.latitud && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-800 mb-2">
                                        ✅ Dirección lista para guardar:
                                    </h4>
                                    <p className="text-green-700 text-sm">
                                        {nuevaDireccion.direccion_completa}
                                    </p>
                                    {nuevaDireccion.referencias && (
                                        <p className="text-green-600 text-xs mt-1">
                                            Referencias: {nuevaDireccion.referencias}
                                        </p>
                                    )}
                                    <p className="text-green-600 text-xs mt-1">
                                        CP: {nuevaDireccion.codigo_postal}
                                    </p>
                                </div>
                            )}

                            {/* Botones de Acción */}
                            <div className="flex gap-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setMostrarModalNuevaDireccion(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={guardarNuevaDireccion}
                                    disabled={!nuevaDireccion.direccion_completa || !nuevaDireccion.codigo_postal || !nuevaDireccion.latitud}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    ✅ Guardar y Usar Dirección
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}