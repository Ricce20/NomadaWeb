import React, { useState, useCallback, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { debounce } from 'lodash';
import { ChevronDown, ChevronUp, MapPin, Check, Plus } from 'lucide-react';
import { SucursalItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import orders from '@/routes/sucursal/orders';
import CalculadoraRutaEnvio from '@/components/calcular-ruta-envio';
import SelectorUbicacionCliente from '@/components/selectorUbicacionCliente';
import pedido from '@/routes/sucursal/pedido';

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
    current_stock?: number;
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

// Tipo para el estado del pago
type EstadoPago = 'pendiente' | 'adelanto' | 'pagado';
type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';

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
    const [seccionPagosAbierta, setSeccionPagosAbierta] = useState(false);
    
    // Estados de búsqueda de productos
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Producto[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Estados de transporte y ruta
    const [requiereEnvio, setRequiereEnvio] = useState<boolean | null>(null);
    const [datosRuta, setDatosRuta] = useState<{
        distanciaKm: number;
        duracionMinutos: number;
        costoEnvio: number;
    } | null>(null);
    const [incluirCostoEnvio, setIncluirCostoEnvio] = useState<boolean>(true); // Control para agregar o no el costo de envío
    
    // Estados de pagos
    const [montoAdelanto, setMontoAdelanto] = useState<string>('');
    const [pagoCompleto, setPagoCompleto] = useState<boolean>(false);
    const [metodoPagoAdelanto, setMetodoPagoAdelanto] = useState<MetodoPago>('efectivo');
    const [notasPago, setNotasPago] = useState<string>('');
    const [estadoPago, setEstadoPago] = useState<EstadoPago>('pendiente');

    // Inicializar el cliente y su dirección al cargar el componente
    useEffect(() => {
        if (cliente.direcciones && cliente.direcciones.length > 0) {
            setSelectedDireccion(cliente.direcciones[0]);
        }
    }, [cliente]);

    // Efecto para actualizar el estado del pago automáticamente
    useEffect(() => {
        if (pagoCompleto) {
            setEstadoPago('pagado');
        } else if (parseFloat(montoAdelanto) > 0) {
            setEstadoPago('adelanto');
        } else {
            setEstadoPago('pendiente');
        }
    }, [pagoCompleto, montoAdelanto]);

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
                const errorData = await response.json().catch(() => null);
                console.error('Error en la búsqueda:', errorData?.message || 'Error desconocido');
                setSearchResults([]);
                return;
            }
            
            const result = await response.json();
            
            // Manejar la nueva estructura de respuesta con success/data
            if (result.success) {
                setSearchResults(result.data || []);
                    console.log(result.data);

            } else {
                console.error('Error en la búsqueda:', result.message);
                setSearchResults([]);
            }
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
        if (!nuevaDireccion.direccion_completa) {
            alert('Por favor selecciona una ubicación en el mapa');
            return;
        }

        if (!nuevaDireccion.latitud || !nuevaDireccion.longitud) {
            alert('Por favor selecciona la ubicación en el mapa');
            return;
        }

        const direccionGuardada: Direccion = {
            id: Date.now(),
            direccion_completa: nuevaDireccion.direccion_completa,
            referencias: '',
            codigo_postal: '',
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
    }, []);

    // Manejar cambio en método de entrega
    const handleMetodoEntregaChange = (envio: boolean) => {
        setRequiereEnvio(envio);
        
        // Si el cliente recoge en tienda, limpiar la dirección seleccionada
        if (!envio) {
            setSelectedDireccion(null);
            setDatosRuta(null);
        }
        
        // Si se selecciona envío a domicilio y hay direcciones guardadas, seleccionar la primera
        if (envio && cliente.direcciones && cliente.direcciones.length > 0 && !selectedDireccion) {
            setSelectedDireccion(cliente.direcciones[0]);
        }
    };

    // Calcular totales
    const totalCarrito = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const costoEnvioAplicable = (requiereEnvio && datosRuta && incluirCostoEnvio) ? datosRuta.costoEnvio : 0;
    const totalFinal = totalCarrito + costoEnvioAplicable;
    let adelantoNumerico:number = 0.0;
    if(!pagoCompleto){
        adelantoNumerico = parseFloat(montoAdelanto) || 0;
    }else{
        adelantoNumerico = totalFinal;
    }
    const saldoPendiente = totalFinal - adelantoNumerico;

    // Verificar si puede continuar a productos
    const puedeContinuarAProductos = requiereEnvio !== null && 
        (requiereEnvio === false || (requiereEnvio === true && selectedDireccion));

    // Enviar pedido
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        
        // Validar que se haya seleccionado método de entrega
        if (requiereEnvio === null) {
            alert('Selecciona un método de entrega');
            return;
        }

        // Validar dirección solo si requiere envío
        if (requiereEnvio && !selectedDireccion) {
            alert('Selecciona o agrega una dirección de entrega');
            return;
        }

        if (cart.length === 0) {
            alert('Agrega productos al carrito');
            return;
        }

        // Validar adelanto
        if (adelantoNumerico > totalFinal) {
            alert('El adelanto no puede ser mayor al total del pedido');
            return;
        }

        // Determinar estado del pago automáticamente
        const estadoPagoFinal: EstadoPago = pagoCompleto 
            ? 'pagado' 
            : (adelantoNumerico > 0 ? 'adelanto' : 'pendiente');

        // Preparar datos según el tipo de pedido
        const orderData: any = {
            // Datos básicos del pedido
            cliente_id: cliente.id,
            sucursal_id: sucursal.id,
            
            // Datos de transporte/envío
            requiere_envio: requiereEnvio,
            
            // Productos
            productos: cart.map(item => ({
                producto_id: item.product_id,
                cantidad: item.cantidad,
                precio_unitario: item.precio
            })),
            
            // Totales
            subtotal: totalCarrito,
            total: totalFinal,
            
            // Datos de pago
            monto_adelanto: adelantoNumerico > 0 ? adelantoNumerico : null,
            pago_completo: pagoCompleto,
            saldo_pendiente: pagoCompleto ? 0 : saldoPendiente,
            notas_pago: notasPago || null,
            estado_pago: estadoPagoFinal
        };

        // Agregar datos de dirección solo si requiere envío
        if (requiereEnvio && selectedDireccion) {
            orderData.direccion_entrega = selectedDireccion.direccion_completa;
            orderData.direccion_id = selectedDireccion.id;
            orderData.latitud = selectedDireccion.latitud;
            orderData.longitud = selectedDireccion.longitud;
        } else {
            // Para recoger en tienda
            orderData.direccion_entrega = 'Recoge en tienda';
            orderData.direccion_id = null;
            orderData.latitud = null;
            orderData.longitud = null;
        }

        // Agregar datos de transporte solo si requiere envío y hay datos de ruta
        if (requiereEnvio && datosRuta && incluirCostoEnvio) {
            orderData.distancia_km = datosRuta.distanciaKm;
            orderData.duracion_minutos = datosRuta.duracionMinutos;
            orderData.costo_envio = datosRuta.costoEnvio;
        } else {
            // Para recoger en tienda, sin incluir costo, o sin datos de ruta
            orderData.distancia_km = null;
            orderData.duracion_minutos = null;
            orderData.costo_envio = null;
        }

        // Agregar método de pago del adelanto solo si hay adelanto
        if (adelantoNumerico > 0) {
            orderData.metodo_pago_adelanto = metodoPagoAdelanto;
        } else {
            orderData.metodo_pago_adelanto = null;
        }

        console.log('Datos a enviar:', orderData); // Para debugging

        setIsSubmitting(true);

        router.post(pedido.generar().url, orderData, {
            preserveScroll: true,
            onSuccess: () => {
                setCart([]);
                setSearchTerm('');
                setSearchResults([]);
                setDatosRuta(null);
                setMontoAdelanto('');
                setPagoCompleto(false);
                setMetodoPagoAdelanto('efectivo');
                setNotasPago('');
                setRequiereEnvio(null);
                setEstadoPago('pendiente');
                setSelectedDireccion(cliente.direcciones && cliente.direcciones.length > 0 ? cliente.direcciones[0] : null);
                setIsSubmitting(false);
            

            },
            onError: (errors) => {
                console.error('Error al crear pedido:', errors);
                alert(errors.error || 'Ocurrió un error al crear el pedido. Por favor intenta nuevamente.');
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    // Función para obtener el color y texto del estado del pago
    const getEstadoPagoInfo = (estado: EstadoPago) => {
        switch (estado) {
            case 'pagado':
                return {
                    color: 'text-green-600 bg-green-100 border-green-200',
                    texto: '✅ Pagado',
                    descripcion: 'El cliente ha pagado el total del pedido'
                };
            case 'adelanto':
                return {
                    color: 'text-yellow-600 bg-yellow-100 border-yellow-200',
                    texto: '💵 Con Adelanto',
                    descripcion: `Adelanto: $${adelantoNumerico.toFixed(2)} • Saldo: $${saldoPendiente.toFixed(2)}`
                };
            case 'pendiente':
                return {
                    color: 'text-gray-600 bg-gray-100 border-gray-200',
                    texto: '⏳ Pendiente',
                    descripcion: 'El cliente pagará al recibir el pedido'
                };
            default:
                return {
                    color: 'text-gray-600 bg-gray-100 border-gray-200',
                    texto: '⏳ Pendiente',
                    descripcion: 'El cliente pagará al recibir el pedido'
                };
        }
    };

    const estadoPagoInfo = getEstadoPagoInfo(estadoPago);

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
                            
                            {/* SECCIÓN 1: MÉTODO DE ENTREGA */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    onClick={() => setSeccionDireccionAbierta(!seccionDireccionAbierta)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            requiereEnvio !== null ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                            {requiereEnvio !== null ? <Check className="w-5 h-5" /> : '🚚'}
                                        </div>
                                        <div className="text-left">
                                            <h2 className="text-xl font-bold text-gray-900">
                                                1. Método de Entrega
                                            </h2>
                                            {requiereEnvio !== null && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {requiereEnvio 
                                                        ? (selectedDireccion 
                                                            ? `Envío a domicilio • ${selectedDireccion.direccion_completa.substring(0, 30)}...`
                                                            : 'Envío a domicilio • Selecciona dirección')
                                                        : 'Cliente recoge en tienda'
                                                    }
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
                                        <div className="pt-6 space-y-6">
                                            {/* Selección de método de entrega */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                                    Selecciona el método de entrega:
                                                </label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <button
                                                        onClick={() => handleMetodoEntregaChange(false)}
                                                        className={`p-6 rounded-lg border-2 transition-all ${
                                                            requiereEnvio === false
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
                                                        onClick={() => handleMetodoEntregaChange(true)}
                                                        className={`p-6 rounded-lg border-2 transition-all ${
                                                            requiereEnvio === true
                                                                ? 'border-blue-500 bg-blue-50'
                                                                : 'border-gray-200 hover:border-blue-300'
                                                        }`}
                                                    >
                                                        <div className="text-4xl mb-3">🚚</div>
                                                        <div className="font-semibold text-lg mb-1">Envío a domicilio</div>
                                                        <div className="text-sm text-gray-600">A dirección del cliente</div>
                                                        <div className="text-xs text-gray-500 mt-2">Con costo de envío</div>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Sección de dirección (solo si requiere envío) */}
                                            {requiereEnvio && (
                                                <div className="border-t border-gray-200 pt-6">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                        <MapPin className="w-5 h-5 text-blue-600" />
                                                        Dirección de Entrega
                                                    </h3>
                                                    
                                                    {cliente.direcciones && cliente.direcciones.length > 0 && (
                                                        <div className="space-y-3 mb-4">
                                                            <label className="block text-sm font-medium text-gray-700">
                                                                Selecciona una dirección guardada:
                                                            </label>
                                                            <div className="grid gap-3">
                                                                {cliente.direcciones.map(direccion => (
                                                                    <div
                                                                        key={direccion.id}
                                                                        onClick={() => setSelectedDireccion(direccion)}
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

                                                    {/* Calculadora de ruta (solo si hay dirección seleccionada) */}
                                                    {selectedDireccion?.latitud && selectedDireccion?.longitud && sucursal.latitud && sucursal.longitud && (
                                                        <div className="border-t border-gray-200 pt-6 mt-4">
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
                                                </div>
                                            )}

                                            {/* Botón para continuar */}
                                            {puedeContinuarAProductos && (
                                                <div className="border-t border-gray-200 pt-6">
                                                    <button
                                                        onClick={() => {
                                                            setSeccionDireccionAbierta(false);
                                                            setSeccionProductosAbierta(true);
                                                        }}
                                                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                                    >
                                                        Continuar a Productos →
                                                    </button>
                                                </div>
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
                                                    {searchResults.map(producto => {
                                                        const outOfStock = typeof producto.current_stock !== 'undefined' && producto.current_stock === 0;
                                                        return (
                                                            <div
                                                                key={producto.id}
                                                                className={`flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${outOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}`}
                                                                onClick={() => { if (!outOfStock) agregarAlCarrito(producto); }}
                                                            >
                                                                {producto.imagen_url ? (
                                                                    <img
                                                                        src={producto.imagen_url}
                                                                        alt={producto.nombre}
                                                                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                                                    />
                                                                ) : (
                                                                    <div className="w-16 h-16 flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg border border-gray-200 text-2xl">
                                                                        📦
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-semibold text-gray-900 text-lg">{producto.nombre}</span>
                                                                        {producto.marca && (
                                                                            <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">{producto.marca}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-gray-500 text-sm mb-1">{producto.descripcion}</div>
                                                                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-1">
                                                                        <span>SKU: <span className="font-mono text-gray-600">{producto.sku}</span></span>
                                                                        {typeof producto.current_stock !== 'undefined' && (
                                                                            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full border border-gray-200 font-semibold">Stock: {producto.current_stock}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="font-bold text-blue-600 text-lg">${producto.precio.toFixed(2)}</div>
                                                                </div>
                                                                <button
                                                                    className="ml-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm shadow disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    onClick={e => { e.stopPropagation(); if (!outOfStock) agregarAlCarrito(producto); }}
                                                                    disabled={outOfStock}
                                                                >
                                                                    {outOfStock ? 'Sin stock' : 'Agregar'}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {cart.length > 0 && (
                                                <button
                                                    onClick={() => {
                                                        setSeccionProductosAbierta(false);
                                                        setSeccionPagosAbierta(true);
                                                    }}
                                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-6"
                                                >
                                                    Continuar a Pagos →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* SECCIÓN 3: PAGOS */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    onClick={() => setSeccionPagosAbierta(!seccionPagosAbierta)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            estadoPago === 'pagado' 
                                                ? 'bg-green-100 text-green-600' 
                                                : estadoPago === 'adelanto'
                                                ? 'bg-yellow-100 text-yellow-600'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {estadoPago === 'pagado' ? <Check className="w-5 h-5" /> : 
                                             estadoPago === 'adelanto' ? '💵' : '💰'}
                                        </div>
                                        <div className="text-left">
                                            <h2 className="text-xl font-bold text-gray-900">
                                                3. Información de Pago
                                            </h2>
                                            <p className={`text-sm mt-1 ${estadoPago === 'pagado' ? 'text-green-600' : 
                                                          estadoPago === 'adelanto' ? 'text-yellow-600' : 'text-gray-600'}`}>
                                                {estadoPagoInfo.descripcion}
                                            </p>
                                        </div>
                                    </div>
                                    {seccionPagosAbierta ? (
                                        <ChevronUp className="w-6 h-6 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-6 h-6 text-gray-400" />
                                    )}
                                </button>

                                {seccionPagosAbierta && (
                                    <div className="px-6 pb-6 border-t border-gray-200">
                                        <div className="pt-6 space-y-6">
                                            {/* Resumen del Total */}
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-blue-900 font-medium">Total del Pedido:</span>
                                                    <span className="text-2xl font-bold text-blue-900">
                                                        ${totalFinal.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-blue-700 space-y-1">
                                                    <div className="flex justify-between">
                                                        <span>Productos:</span>
                                                        <span>${totalCarrito.toFixed(2)}</span>
                                                    </div>
                                                    {requiereEnvio && datosRuta && (
                                                        <div className="flex justify-between items-center">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={incluirCostoEnvio}
                                                                    onChange={(e) => setIncluirCostoEnvio(e.target.checked)}
                                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <span>Envío:</span>
                                                            </label>
                                                            <span>${incluirCostoEnvio ? datosRuta.costoEnvio.toFixed(2) : '0.00'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Estado Actual del Pago */}
                                            <div className={`border rounded-lg p-4 ${estadoPagoInfo.color}`}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-semibold flex items-center gap-2">
                                                            {estadoPagoInfo.texto}
                                                        </div>
                                                        <p className="text-sm mt-1 opacity-80">
                                                            {estadoPagoInfo.descripcion}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold">
                                                            ${totalFinal.toFixed(2)}
                                                        </div>
                                                        {estadoPago === 'adelanto' && (
                                                            <div className="text-sm">
                                                                Saldo: ${saldoPendiente.toFixed(2)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Checkbox de Pago Completo */}
                                            <div className="border border-gray-200 rounded-lg p-4">
                                                <label className="flex items-start gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={pagoCompleto}
                                                        onChange={(e) => {
                                                            setPagoCompleto(e.target.checked);
                                                            if (e.target.checked) {
                                                                setMontoAdelanto(totalFinal.toString());
                                                            } else {
                                                                setMontoAdelanto('');
                                                            }
                                                        }}
                                                        className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                    />
                                                    <div>
                                                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                                                            ✅ Pago Completo
                                                            {pagoCompleto && (
                                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                                    Pagado
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            El cliente ha pagado el total del pedido
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>

                                            {/* Adelanto - Solo si NO es pago completo */}
                                            {!pagoCompleto && (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            💵 Monto de Adelanto (opcional)
                                                        </label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-3 text-gray-500 font-semibold">$</span>
                                                            <input
                                                                type="number"
                                                                value={montoAdelanto}
                                                                onChange={(e) => {
                                                                    const valor = e.target.value;
                                                                    if (valor === '' || parseFloat(valor) <= totalFinal) {
                                                                        setMontoAdelanto(valor);
                                                                    }
                                                                }}
                                                                placeholder="0.00"
                                                                step="0.01"
                                                                min="0"
                                                                max={totalFinal}
                                                                className="w-full pl-8 pr-4 py-3 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Máximo: ${totalFinal.toFixed(2)}
                                                        </p>
                                                    </div>

                                                    {/* Método de Pago del Adelanto */}
                                                    {adelantoNumerico > 0 && (
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Método de Pago del Adelanto
                                                            </label>
                                                            <select
                                                                value={metodoPagoAdelanto}
                                                                onChange={(e) => setMetodoPagoAdelanto(e.target.value as MetodoPago)}
                                                                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3"
                                                            >
                                                                <option value="efectivo">💵 Efectivo</option>
                                                                <option value="tarjeta">💳 Tarjeta</option>
                                                                <option value="transferencia">🏦 Transferencia</option>
                                                                <option value="otro">📱 Otro</option>
                                                            </select>
                                                        </div>
                                                    )}

                                                    {/* Mostrar Saldo Pendiente */}
                                                    {adelantoNumerico > 0 && (
                                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-medium text-yellow-800">
                                                                        Saldo Pendiente:
                                                                    </p>
                                                                    <p className="text-xs text-yellow-600 mt-1">
                                                                        A pagar en la entrega o después
                                                                    </p>
                                                                </div>
                                                                <p className="text-2xl font-bold text-yellow-900">
                                                                    ${saldoPendiente.toFixed(2)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Notas de Pago */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    📝 Notas de Pago (opcional)
                                                </label>
                                                <textarea
                                                    value={notasPago}
                                                    onChange={(e) => setNotasPago(e.target.value)}
                                                    placeholder="Ej: El cliente pagará el resto al recibir el pedido..."
                                                    rows={3}
                                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5"
                                                />
                                            </div>

                                            {/* Advertencia si no hay adelanto */}
                                            {!pagoCompleto && adelantoNumerico === 0 && (
                                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                    <p className="text-sm text-gray-700">
                                                        ℹ️ <strong>Sin adelanto:</strong> El cliente pagará el total al recibir el pedido (${totalFinal.toFixed(2)})
                                                    </p>
                                                </div>
                                            )}

                                            {/* Botón Continuar */}
                                            <div className="border-t border-gray-200 pt-6">
                                                <button
                                                    onClick={() => {
                                                        setSeccionPagosAbierta(false);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Check className="w-5 h-5" />
                                                    Listo para generar pedido
                                                </button>
                                            </div>
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
                                                        <div className="flex justify-between items-center mb-2 p-3 bg-blue-50 border border-blue-200 rounded">
                                                            <label className="flex items-center gap-2 cursor-pointer flex-1">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={incluirCostoEnvio}
                                                                    onChange={(e) => setIncluirCostoEnvio(e.target.checked)}
                                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                />
                                                                <span className="text-gray-700 text-sm">
                                                                    Envío ({datosRuta.distanciaKm.toFixed(2)} km):
                                                                </span>
                                                            </label>
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
                                                <div className="flex justify-between items-center text-xl font-bold pt-2 border-t border-gray-200 mb-2">
                                                    <span>Total:</span>
                                                    <span className="text-green-600">
                                                        ${totalFinal.toFixed(2)}
                                                    </span>
                                                </div>
                                                
                                                {/* Información de Pago */}
                                                {(adelantoNumerico > 0 || pagoCompleto) && (
                                                    <div className="border-t border-gray-200 pt-3 mt-2">
                                                        {pagoCompleto ? (
                                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm font-medium text-green-800">
                                                                        ✅ Pago Completo
                                                                    </span>
                                                                    <span className="text-lg font-bold text-green-900">
                                                                        ${totalFinal.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex justify-between items-center mb-2 text-sm">
                                                                    <span className="text-gray-600">Adelanto:</span>
                                                                    <span className="font-semibold text-green-600">
                                                                        ${adelantoNumerico.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center text-sm">
                                                                    <span className="text-gray-600">Saldo Pendiente:</span>
                                                                    <span className="font-semibold text-yellow-600">
                                                                        ${saldoPendiente.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <button
                                                    onClick={handleSubmit}
                                                    disabled={isSubmitting || requiereEnvio === null || cart.length === 0 || (requiereEnvio && !selectedDireccion)}
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
                                            {requiereEnvio === null && (
                                                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                    <p className="text-yellow-700 text-xs">
                                                        ⚠️ Selecciona un método de entrega
                                                    </p>
                                                </div>
                                            )}
                                            {requiereEnvio && !selectedDireccion && (
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
                            {/* Selector de Ubicación con Mapa */}
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <SelectorUbicacionCliente
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
                                    disabled={!nuevaDireccion.direccion_completa || !nuevaDireccion.latitud}
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