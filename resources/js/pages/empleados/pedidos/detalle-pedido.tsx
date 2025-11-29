import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ChevronLeft,
    MapPin,
    Clock,
    DollarSign,
    Truck,
    Package,
    CheckCircle,
    Building,
    User,
    Calendar,
    Phone,
    Mail,
    ArrowRight,
    AlertCircle,
    Edit,
    Eye,
    RefreshCw,
    Smartphone,
    Globe,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { asignarVehiculo, completar, cancelar, actualizarAsignacion } from '@/routes/sucursal/pedido';
import MapaRuta from '@/components/map-ruta';

interface ProductoDetalle {
    id: number;
    cantidad: number;
    precio_unitario: number | string;
    subtotal: number | string;
    product_base_branch: {
        id: number;
        price: number | string;
        sale_type: string;
        product_base: {
            id: number;
            name: string;
            sku_base: string;
            brand_id: number;
        };
        branch: {
            id: number;
            nombre: string;
        };
    };
}

interface StatusHistory {
    id: number;
    pedido_id: number;
    estado_anterior: string;
    estado_nuevo: string;
    created_at: string;
}

interface Viaje {
    id: number;
    pedido_id: number;
    vehiculo_id: number;
    estado: string;
    fecha_asignacion: string;
    fecha_salida?: string | null;
    fecha_entrega?: string | null;
    conductor?: {
        id: number;
        name: string;
    } | null;
    vehiculo?: Vehiculo | null;
}

interface Cliente {
    id: number;
    nombre: string;
    apellidos: string;
    telefono: string;
}

interface Usuario {
    id: number;
    name: string;
    email?: string;
    phone?: string;
}

interface Sucursal {
    id: number;
    nombre: string;
    latitud: number;
    longitud: number;
}

interface Vehiculo {
    id: number;
    placa: string;
    marca: string;
    modelo: string;
    color: string;
    tipo: string;
    capacidad_carga_kg: number;
    estado: string;
}

interface Pedido {
    id: number;
    folio: string;
    cliente?: Cliente | null;
    user?: Usuario;
    creador?: Usuario;
    sucursal: Sucursal;
    direccion_entrega: string;
    latitud?: string;
    longitud?: string;
    requiere_envio: boolean;
    distancia_km?: string;
    duracion_minutos?: string;
    costo_envio?: string;
    subtotal: number | string;
    total: number | string;
    monto_adelanto?: string;
    saldo_pendiente?: string;
    estado_pago: 'pendiente' | 'adelanto' | 'pagado';
    estado: string;
    fecha_pedido: string;
    fecha_entrega?: string;
    fecha_cancelacion?: string;
    motivo_cancelacion?: string;
    notas_pago?: string;
    created_at: string;
    detalles: ProductoDetalle[];
    statusHistories: StatusHistory[];
}

interface DetallePedidoProps {
    pedido: Pedido;
    vehiculos: Vehiculo[];
    sucursal: Sucursal;
    viaje?: Viaje;
    drivers?: Usuario[];
}

interface AsignacionFormData {
    vehiculo_id: number | null;
    conductor_id: number | null;
    estado: string;
    fecha_asignacion: string;
    fecha_salida: string | null;
    fecha_entrega: string | null;
    motivo_cancelacion: string | null;
}

export default function DetallePedido({ pedido, vehiculos, sucursal, viaje, drivers = [] }: DetallePedidoProps) {
    
    const [editingAssignment, setEditingAssignment] = useState(false);
    const [isCompletingOrder, setIsCompletingOrder] = useState(false);
    const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
    const [isCancellingOrder, setIsCancellingOrder] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Inicializar el formulario con useForm
    const { data, setData, post, put, processing, errors, reset } = useForm<AsignacionFormData>({
        vehiculo_id: null,
        conductor_id: null,
        estado: 'asignado',
        fecha_asignacion: (() => {
            const d = new Date();
            const pad = (n: number) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        })(),
        fecha_salida: null,
        fecha_entrega: null,
        motivo_cancelacion: null
    });

    const breadcrumbs = [
        {
            title: "Pedidos Activos",
            href: '/empleados/pedidos'
        },
        {
            title: `Pedido #${pedido.folio}`,
            href: '#'
        }
    ];

    // Determinar si mostrar formulario o información del viaje
    const mostrarFormularioAsignacion = !viaje || editingAssignment;
    const mostrarInfoViaje = viaje && !editingAssignment;

    // Determinar tipo de cliente
    const esClienteConCuenta = !!pedido.user;
    const esClienteSinCuenta = !!pedido.cliente;
    const fueCreadoEnSucursal = !!pedido.creador;

    // Función para formatear montos
    const formatMonto = (monto: number | string | null | undefined): string => {
        if (monto === null || monto === undefined) return '$0.00';
        const numero = typeof monto === 'string' ? parseFloat(monto) : monto;
        if (isNaN(numero)) return '$0.00';
        return `$${numero.toFixed(2)}`;
    };

    // Función para formatear números
    const formatNumero = (numero: number | string | null | undefined, decimales: number = 2): string => {
        if (numero === null || numero === undefined) return '0';
        const num = typeof numero === 'string' ? parseFloat(numero) : numero;
        if (isNaN(num)) return '0';
        return num.toFixed(decimales);
    };

    // Función para formatear fechas
    const formatFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Función para obtener información del estado
    const getEstadoInfo = (estado: string) => {
        const estadoLower = estado.toLowerCase();
        switch (estadoLower) {
            case 'pendiente':
                return {
                    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                    texto: '⏳ Pendiente',
                    icon: <Clock className="w-4 h-4" />
                };
            case 'confirmado':
                return {
                    color: 'bg-blue-100 text-blue-800 border-blue-200',
                    texto: '✅ Confirmado',
                    icon: <CheckCircle className="w-4 h-4" />
                };
            case 'en_preparacion':
                return {
                    color: 'bg-orange-100 text-orange-800 border-orange-200',
                    texto: '👨‍🍳 En Preparación',
                    icon: <Package className="w-4 h-4" />
                };
            case 'listo_para_envio':
                return {
                    color: 'bg-purple-100 text-purple-800 border-purple-200',
                    texto: '📦 Listo para Envío',
                    icon: <Package className="w-4 h-4" />
                };
            case 'en_ruta':
                return {
                    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                    texto: '🚚 En Camino',
                    icon: <Truck className="w-4 h-4" />
                };
            case 'entregado':
                return {
                    color: 'bg-green-100 text-green-800 border-green-200',
                    texto: '✅ Entregado',
                    icon: <CheckCircle className="w-4 h-4" />
                };
            case 'cancelado':
                return {
                    color: 'bg-red-100 text-red-800 border-red-200',
                    texto: '❌ Cancelado',
                    icon: <AlertCircle className="w-4 h-4" />
                };
            default:
                return {
                    color: 'bg-gray-100 text-gray-800 border-gray-200',
                    texto: estado,
                    icon: <Clock className="w-4 h-4" />
                };
        }
    };

    // Función para obtener información del estado de pago
    const getEstadoPagoInfo = (estado: string) => {
        switch (estado) {
            case 'pagado':
                return {
                    color: 'bg-green-100 text-green-800 border-green-200',
                    texto: '✅ Pagado',
                    icon: <DollarSign className="w-4 h-4" />
                };
            case 'adelanto':
                return {
                    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                    texto: '💵 Con Adelanto',
                    icon: <DollarSign className="w-4 h-4" />
                };
            case 'pendiente':
                return {
                    color: 'bg-red-100 text-red-800 border-red-200',
                    texto: '⏳ Pendiente',
                    icon: <DollarSign className="w-4 h-4" />
                };
            default:
                return {
                    color: 'bg-gray-100 text-gray-800 border-gray-200',
                    texto: estado,
                    icon: <DollarSign className="w-4 h-4" />
                };
        }
    };

    // Función para obtener información del estado del viaje
    const getEstadoViajeInfo = (estado: string) => {
        const estadoLower = estado.toLowerCase();
        switch (estadoLower) {
            case 'asignado':
                return {
                    color: 'bg-blue-100 text-blue-800 border-blue-200',
                    texto: '📋 Asignado',
                    icon: <Truck className="w-4 h-4" />
                };
            case 'en_ruta':
                return {
                    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                    texto: '🚚 En Camino',
                    icon: <Truck className="w-4 h-4" />
                };
            case 'entregado':
                return {
                    color: 'bg-green-100 text-green-800 border-green-200',
                    texto: '✅ Entregado',
                    icon: <CheckCircle className="w-4 h-4" />
                };
            case 'cancelado':
                return {
                    color: 'bg-red-100 text-red-800 border-red-200',
                    texto: '❌ Cancelado',
                    icon: <AlertCircle className="w-4 h-4" />
                };
            default:
                return {
                    color: 'bg-gray-100 text-gray-800 border-gray-200',
                    texto: estado,
                    icon: <Truck className="w-4 h-4" />
                };
        }
    };

    // Función central para determinar la habilitación de los botones
    const canPerformAction = (estado: string, action: 'confirm' | 'cancel' | 'complete'): boolean => {
    const estadoLower = estado.toLowerCase();
    switch (action) {
        case 'confirm':
            // Solo se puede CONFIRMAR si está PENDIENTE.
            return estadoLower === 'pendiente';
        case 'cancel':
            // Se puede CANCELAR si no está ya ENTREGADO o CANCELADO.
            return !['entregado', 'cancelado'].includes(estadoLower);
        case 'complete':
            // Se puede COMPLETAR (Entregar) si está listo para envío ('en_preparacion' o 'en_ruta').
            return ['en_preparacion', 'en_ruta'].includes(estadoLower);
        default:
            return false;
        }
    };

    // Helpers para formatos de fecha
    const toInputDateTime = (iso?: string | null) => {
        if (!iso) return '';
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    // ✅ CORRECCIÓN: Enviar asignación usando useForm correctamente
    const submitAssignment = () => {
        if (!data.vehiculo_id) {
            alert('Selecciona un vehículo antes de asignar.');
            return;
        }

        if (!confirm('¿Confirmas guardar la asignación del viaje para este pedido?')) return;

        // ✅ Pasar 'data' como segundo parámetro
        post(asignarVehiculo(pedido.id).url, {
            onSuccess: () => {
                setEditingAssignment(false);
            },
            onError: (errors) => {
                console.error('Error asignando vehículo:', errors);
                alert('Error al asignar el vehículo. Verifica los datos.');
            }
        });
    };

    // ✅ CORRECCIÓN: Actualizar asignación de vehículo
    const handleActualizarAsignacion = () => {
        if (!data.vehiculo_id) {
            alert('Selecciona un vehículo antes de actualizar.');
            return;
        }

        if (!confirm('¿Confirmas actualizar la asignación del viaje?')) return;

        // ✅ Pasar 'data' como segundo parámetro
        put(actualizarAsignacion(pedido.id).url, {
            method: 'put',
            onSuccess: () => {
                setEditingAssignment(false);
                // ✅ Inertia actualiza automáticamente, no necesitas router.visit
            },
            onError: (errors) => {
                console.error('Error actualizando asignación:', errors);
                alert('Error al actualizar la asignación');
            }
        });
    };

    // ✅ CORRECCIÓN: Completar pedido
    const handleCompletarPedido = () => {
        if (!confirm('¿Estás seguro de que deseas completar este pedido? Esta acción no se puede deshacer.')) {
            return;
        }

        setIsCompletingOrder(true);
        
        // ✅ Pasar objeto vacío si no hay datos que enviar
        post(completar(pedido.id).url, {
            onSuccess: () => {
                setIsCompletingOrder(false);
            },
            onError: (errors) => {
                console.error('Error completando pedido:', errors);
                setIsCompletingOrder(false);
                alert('Error al completar el pedido');
            }
        });
    };

    // ✅ Nueva: Confirmar pedido (PUT a la ruta 'pedido.confirmar')
    const handleConfirmarPedido = () => {
        if (!confirm('¿Confirmas que deseas confirmar este pedido?')) return;

        setIsConfirmingOrder(true);

        // Usar put del useForm para realizar la petición PUT a la ruta definida en routes/sucursales.php
        put(`/sucursal/pedidos/${pedido.id}/confirmar`, {
            onSuccess: () => {
                setIsConfirmingOrder(false);
            },
            onError: (errors) => {
                console.error('Error confirmando pedido:', errors);
                setIsConfirmingOrder(false);
                alert('Error al confirmar el pedido');
            }
        });
    };

    // ✅ CORRECCIÓN: Cancelar pedido
    const handleCancelarPedido = () => {
        if (!data.motivo_cancelacion?.trim()) {
            alert('Por favor ingresa un motivo de cancelación');
            return;
        }

        setIsCancellingOrder(true);
        
        // ✅ Enviar datos directamente con post
        post(cancelar(pedido.id).url, {
            onSuccess: () => {
                setIsCancellingOrder(false);
                setShowCancelModal(false);
                setCancelReason('');
            },
            onError: (errors) => {
                console.error('Error cancelando pedido:', errors);
                setIsCancellingOrder(false);
                alert('Error al cancelar el pedido');
            }
        });
    };

    // Función para cancelar edición
    const cancelarEdicion = () => {
        reset();
        setEditingAssignment(false);
        
        // Si estamos editando y cancelamos, restaurar valores del viaje existente
        if (viaje && editingAssignment) {
            setData({
                vehiculo_id: viaje.vehiculo ? viaje.vehiculo.id : viaje.vehiculo_id,
                conductor_id: viaje.conductor ? viaje.conductor.id : null,
                estado: viaje.estado || 'asignado',
                fecha_asignacion: toInputDateTime(viaje.fecha_asignacion),
                fecha_salida: viaje.fecha_salida ? toInputDateTime(viaje.fecha_salida) : null,
                fecha_entrega: viaje.fecha_entrega ? toInputDateTime(viaje.fecha_entrega) : null,
            });
        }
    };

    // Inicializar formulario con datos del viaje existente si estamos editando
    useEffect(() => {
        if (viaje && editingAssignment) {
            setData({
                vehiculo_id: viaje.vehiculo ? viaje.vehiculo.id : viaje.vehiculo_id,
                conductor_id: viaje.conductor ? viaje.conductor.id : null,
                estado: viaje.estado || 'asignado',
                fecha_asignacion: toInputDateTime(viaje.fecha_asignacion),
                fecha_salida: viaje.fecha_salida ? toInputDateTime(viaje.fecha_salida) : null,
                fecha_entrega: viaje.fecha_entrega ? toInputDateTime(viaje.fecha_entrega) : null,
            });
        }
    }, [editingAssignment, viaje]);

    const estadoInfo = getEstadoInfo(pedido.estado);
    const estadoPagoInfo = getEstadoPagoInfo(pedido.estado_pago);
    const estadoViajeInfo = viaje ? getEstadoViajeInfo(viaje.estado) : null;
    // Deshabilitar la sección de asignación si el pedido ya fue entregado o cancelado
    const asignacionDisabled = ['entregado', 'cancelado'].includes(pedido.estado);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Pedido #${pedido.folio}`} />

            <div className="min-h-screen bg-gray-50 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header con botón de regreso */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/sucursal/pedidos/index"
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Volver a Pedidos
                            </Link>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    Pedido #{pedido.folio}
                                </h1>
                                <p className="text-gray-600 mt-1 text-sm md:text-base">
                                    Detalles completos del pedido y gestión de envío
                                </p>
                            </div>
                        </div>
                        
                        {/* Botón para recargar */}
                        <button
                            onClick={() => router.reload()}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Actualizar
                        </button>
                    </div>

                    {/* Estados Principales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Estado del Pedido</p>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${estadoInfo.color}`}>
                                        {estadoInfo.icon}
                                        {estadoInfo.texto}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Estado de Pago</p>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${estadoPagoInfo.color}`}>
                                        {estadoPagoInfo.icon}
                                        {estadoPagoInfo.texto}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Estado del Viaje - Solo mostrar si existe */}
                        {mostrarInfoViaje && estadoViajeInfo && (
                            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Estado del Viaje</p>
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${estadoViajeInfo.color}`}>
                                            {estadoViajeInfo.icon}
                                            {estadoViajeInfo.texto}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Columna Principal - Información del Pedido */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Información del Cliente */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <User className="w-5 h-5 text-blue-600" />
                                        Información del Cliente
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        {/* Badge tipo de cliente */}
                                        {esClienteConCuenta && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                <Globe className="w-3 h-3" />
                                                Cliente con Cuenta
                                            </span>
                                        )}
                                        {esClienteSinCuenta && !esClienteConCuenta && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                <Smartphone className="w-3 h-3" />
                                                Cliente Directo
                                            </span>
                                        )}
                                        {fueCreadoEnSucursal && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                <Building className="w-3 h-3" />
                                                Creado en Sucursal
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Información del Cliente Principal */}
                                    <div className="md:col-span-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">Cliente</span>
                                        </div>
                                        <p className="font-medium text-gray-900 text-lg">
                                            {esClienteConCuenta 
                                                ? pedido.user?.name
                                                : esClienteSinCuenta
                                                    ? `${pedido.cliente?.nombre} ${pedido.cliente?.apellidos}`
                                                    : 'Cliente no especificado'
                                            }
                                        </p>
                                        {esClienteConCuenta && pedido.user?.email && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                {pedido.user.email}
                                            </p>
                                        )}
                                    </div>

                                    {/* Información de Contacto */}
                                    {(pedido.cliente?.telefono || pedido.user?.phone) && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">Teléfono</span>
                                            </div>
                                            <p className="font-medium text-gray-900">
                                                {pedido.cliente?.telefono || pedido.user?.phone}
                                            </p>
                                        </div>
                                    )}

                                    {/* Email del cliente con cuenta */}
                                    {esClienteConCuenta && pedido.user?.email && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">Email</span>
                                            </div>
                                            <p className="font-medium text-gray-900">
                                                {pedido.user.email}
                                            </p>
                                        </div>
                                    )}

                                    {/* Sucursal */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Building className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">Sucursal</span>
                                        </div>
                                        <p className="font-medium text-gray-900">
                                            {pedido.sucursal.nombre}
                                        </p>
                                    </div>

                                    {/* Registrado por (empleado) */}
                                    {fueCreadoEnSucursal && pedido.creador && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">Registrado por</span>
                                            </div>
                                            <p className="font-medium text-gray-900">
                                                {pedido.creador.name}
                                            </p>
                                        </div>
                                    )}

                                    {/* Cliente en línea */}
                                    {esClienteConCuenta && !fueCreadoEnSucursal && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Globe className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">Origen</span>
                                            </div>
                                            <p className="font-medium text-gray-900">
                                                Pedido Online
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Información adicional para clientes sin cuenta */}
                                {esClienteSinCuenta && !esClienteConCuenta && (
                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-sm text-blue-700 font-medium mb-1">
                                            📝 Cliente registrado manualmente
                                        </p>
                                        <p className="text-xs text-blue-600">
                                            Este cliente no tiene una cuenta en el sistema. La información fue registrada manualmente.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Resto de las secciones se mantienen igual */}
                            {/* Información de Entrega */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                    Información de Entrega
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-2">Tipo de Entrega</p>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                            pedido.requiere_envio
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {pedido.requiere_envio ? '🚚 Envío a Domicilio' : '🏪 Recoge en Tienda'}
                                        </span>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-600 mb-2">Dirección</p>
                                        <p className="text-gray-900 font-medium">
                                            {pedido.direccion_entrega}
                                        </p>
                                    </div>

                                    {pedido.requiere_envio && pedido.distancia_km && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-2">Distancia</p>
                                                <p className="text-gray-900 font-medium">
                                                    {formatNumero(pedido.distancia_km, 2)} km
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 mb-2">Duración Estimada</p>
                                                <p className="text-gray-900 font-medium">
                                                    {formatNumero(pedido.duracion_minutos, 0)} minutos
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {pedido.latitud && pedido.longitud && (
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-sm text-gray-600 mb-1">Coordenadas</p>
                                            <p className="text-sm text-gray-900 font-mono">
                                                {pedido.latitud}, {pedido.longitud}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {/* En tu componente DetallePedido, en la sección de Información de Entrega: */}
                                {pedido.requiere_envio && pedido.latitud && pedido.longitud && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                    Ruta de Entrega
                                    </h3>
                                    
                                    {/* Obtener coordenadas de la sucursal (necesitarías pasarlas como prop) */}
                                    <MapaRuta
                                    origenCoordenadas={[sucursal.latitud, sucursal.longitud]} // Coordenadas de la sucursal
                                    destinoCoordenadas={[parseFloat(pedido.latitud), parseFloat(pedido.longitud)]}
                                    origenNombre={sucursal.nombre}
                                    destinoNombre={pedido.cliente ? `${pedido.cliente.nombre} ${pedido.cliente.apellidos}` : pedido.user?.name || 'Cliente'}
                                    distanciaKm={pedido.distancia_km ? parseFloat(pedido.distancia_km) : undefined}
                                    duracionMinutos={pedido.duracion_minutos ? parseInt(pedido.duracion_minutos) : undefined}
                                    alturaMapa="350px"
                                    />
                                </div>
                                )}
                            </div>

                            {/* Detalles de Productos */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-purple-600" />
                                    Detalles de Productos
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Producto</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">SKU</th>
                                                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Cantidad</th>
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Precio Unit.</th>
                                                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pedido.detalles.map((detalle, index) => (
                                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {detalle.product_base_branch.product_base.name}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {detalle.product_base_branch.sale_type}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                        {detalle.product_base_branch.product_base.sku_base}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                                                            {detalle.cantidad}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                                                        {formatMonto(detalle.precio_unitario)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                                                        {formatMonto(detalle.subtotal)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Historial de Estados */}
                            {pedido.statusHistories && pedido.statusHistories.length > 0 && (
                                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-orange-600" />
                                        Historial de Estados
                                    </h2>
                                    <div className="space-y-3">
                                        {pedido.statusHistories.map((history, index) => (
                                            <div key={index} className="flex items-start gap-4 pb-3 border-b border-gray-100 last:border-b-0">
                                                <div className="flex-shrink-0">
                                                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm text-gray-600">
                                                            {history.estado_anterior}
                                                        </span>
                                                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {history.estado_nuevo}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {formatFecha(history.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Columna Lateral - Resumen y Vehículos */}
                        <div className="space-y-6">
                            {/* Resumen Financiero */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm sticky top-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                    Resumen Financiero
                                </h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-semibold text-gray-900">
                                            {formatMonto(pedido.subtotal)}
                                        </span>
                                    </div>

                                    {pedido.requiere_envio && pedido.costo_envio && (
                                        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                            <span className="text-gray-600">Costo de Envío</span>
                                            <span className="font-semibold text-gray-900">
                                                {formatMonto(pedido.costo_envio)}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                                        <span className="font-bold text-gray-900 text-lg">Total</span>
                                        <span className="text-xl font-bold text-blue-600">
                                            {formatMonto(pedido.total)}
                                        </span>
                                    </div>

                                    {pedido.monto_adelanto && parseFloat(pedido.monto_adelanto.toString()) > 0 && (
                                        <div className="flex justify-between items-center pt-2 text-sm bg-green-50 px-3 py-2 rounded-lg">
                                            <span className="text-gray-600">Adelanto Recibido</span>
                                            <span className="font-semibold text-green-600">
                                                {formatMonto(pedido.monto_adelanto)}
                                            </span>
                                        </div>
                                    )}

                                    {pedido.saldo_pendiente && parseFloat(pedido.saldo_pendiente.toString()) > 0 && (
                                        <div className="flex justify-between items-center pt-2 text-sm bg-yellow-50 px-3 py-2 rounded-lg">
                                            <span className="text-gray-600">Saldo Pendiente</span>
                                            <span className="font-bold text-yellow-600">
                                                {formatMonto(pedido.saldo_pendiente)}
                                            </span>
                                        </div>
                                    )}

                                    {pedido.notas_pago && (
                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-600 mb-1 font-medium">Notas de Pago</p>
                                            <p className="text-sm text-gray-700">
                                                {pedido.notas_pago}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Información de Fechas */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-orange-600" />
                                    Fechas Importantes
                                </h2>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <p className="text-gray-600 mb-1">Fecha de Pedido</p>
                                        <p className="font-semibold text-gray-900">
                                            {formatFecha(pedido.fecha_pedido)}
                                        </p>
                                    </div>
                                    {pedido.fecha_entrega && (
                                        <div>
                                            <p className="text-gray-600 mb-1">Fecha de Entrega</p>
                                            <p className="font-semibold text-gray-900">
                                                {formatFecha(pedido.fecha_entrega)}
                                            </p>
                                        </div>
                                    )}
                                    {pedido.fecha_cancelacion && (
                                        <div>
                                            <p className="text-gray-600 mb-1">Fecha de Cancelación</p>
                                            <p className="font-semibold text-gray-900">
                                                {formatFecha(pedido.fecha_cancelacion)}
                                            </p>
                                        </div>
                                    )}
                                    {pedido.motivo_cancelacion && (
                                        <div className="bg-red-50 p-3 rounded-lg">
                                            <p className="text-xs text-red-700 font-medium">Motivo de Cancelación</p>
                                            <p className="text-sm text-red-800 mt-1">
                                                {pedido.motivo_cancelacion}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sección de Envíos - Comportamiento condicional */}
                            {pedido.requiere_envio && (
                                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <Truck className="w-5 h-5 text-indigo-600" />
                                            {mostrarInfoViaje ? 'Información del Viaje' : 'Asignar Vehículo'}
                                        </h2>
                                        <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-semibold">
                                            {vehiculos.length} disponibles
                                        </span>
                                    </div>

                                            {/* Mostrar aviso si la asignación está deshabilitada por el estado del pedido */}
                                            {asignacionDisabled && (
                                                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700">
                                                    La asignación de vehículo está deshabilitada porque el pedido está <span className="font-semibold">{pedido.estado}</span>.
                                                </div>
                                            )}

                                    {/* MOSTRAR INFORMACIÓN DEL VIAJE EXISTENTE */}
                                    {mostrarInfoViaje && viaje && (
                                        <div className="space-y-4">
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="text-sm font-semibold text-gray-700">Viaje #{viaje.id}</p>
                                                    {estadoViajeInfo && (
                                                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${estadoViajeInfo.color}`}>
                                                            {estadoViajeInfo.icon}
                                                            {estadoViajeInfo.texto}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    {viaje.vehiculo && (
                                                        <div className="flex items-center justify-between p-2 bg-white rounded-lg border">
                                                            <span className="text-gray-600 text-sm">Vehículo:</span>
                                                            <span className="font-medium text-gray-900 text-sm text-right">
                                                                {viaje.vehiculo.marca} {viaje.vehiculo.modelo}<br />
                                                                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                                                    {viaje.vehiculo.placa}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    {viaje.conductor && (
                                                        <div className="flex items-center justify-between p-2 bg-white rounded-lg border">
                                                            <span className="text-gray-600 text-sm">Conductor:</span>
                                                            <span className="font-medium text-gray-900 text-sm">
                                                                {viaje.conductor.name}
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="grid grid-cols-1 gap-2 text-sm">
                                                        <div className="flex justify-between items-center p-2 bg-white rounded-lg border">
                                                            <span className="text-gray-600">Asignado:</span>
                                                            <span className="text-gray-900 font-medium">
                                                                {viaje.fecha_asignacion ? formatFecha(viaje.fecha_asignacion) : '-'}
                                                            </span>
                                                        </div>
                                                        
                                                        {viaje.fecha_salida && (
                                                            <div className="flex justify-between items-center p-2 bg-white rounded-lg border">
                                                                <span className="text-gray-600">Salida:</span>
                                                                <span className="text-gray-900 font-medium">
                                                                    {formatFecha(viaje.fecha_salida)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        
                                                        {viaje.fecha_entrega && (
                                                            <div className="flex justify-between items-center p-2 bg-white rounded-lg border">
                                                                <span className="text-gray-600">Entrega:</span>
                                                                <span className="text-gray-900 font-medium">
                                                                    {formatFecha(viaje.fecha_entrega)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                {viaje.estado === 'asignado' && !asignacionDisabled && (
                                                    <button
                                                        onClick={() => setEditingAssignment(true)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors flex-1 justify-center"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        Editar Asignación
                                                    </button>
                                                )}

                                                {viaje.estado !== 'asignado' && (
                                                    <div className="flex-1 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-sm text-yellow-800 flex items-center gap-3">
                                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <p className="font-medium">No se pueden modificar los datos del viaje</p>
                                                            <p className="text-xs text-yellow-800/80">El viaje ya está en curso, por lo que la asignación no puede editarse.</p>
                                                        </div>
                                                        
                                                    </div>
                                                )}                                              
                                            </div>
                                        </div>
                                    )}

                                    {/* MOSTRAR FORMULARIO DE ASIGNACIÓN (cuando no hay viaje o se está editando) */}
                                    {mostrarFormularioAsignacion && !asignacionDisabled && (
                                        <>
                                            {vehiculos.length > 0 ? (
                                                <>
                                                    <div className="overflow-x-auto mb-4">
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="border-b-2 border-gray-200">
                                                                    <th className="text-left py-3 px-3 font-semibold text-gray-700">Seleccionar</th>
                                                                    <th className="text-left py-3 px-3 font-semibold text-gray-700">Vehículo</th>
                                                                    <th className="text-left py-3 px-3 font-semibold text-gray-700">Placa</th>
                                                                    <th className="text-right py-3 px-3 font-semibold text-gray-700">Capacidad</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {vehiculos.map((vehiculo) => (
                                                                    <tr
                                                                        key={vehiculo.id}
                                                                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                                                                            data.vehiculo_id === vehiculo.id ? 'bg-blue-50 border-blue-200' : ''
                                                                        }`}
                                                                        onClick={() => setData('vehiculo_id', vehiculo.id)}
                                                                    >
                                                                        <td className="py-3 px-3">
                                                                            <input
                                                                                type="radio"
                                                                                name="vehiculo"
                                                                                checked={data.vehiculo_id === vehiculo.id}
                                                                                onChange={() => setData('vehiculo_id', vehiculo.id)}
                                                                                className="w-4 h-4 cursor-pointer text-blue-600"
                                                                            />
                                                                        </td>
                                                                        <td className="py-3 px-3">
                                                                            <div>
                                                                                <p className="font-semibold text-gray-900">
                                                                                    {vehiculo.marca} {vehiculo.modelo}
                                                                                </p>
                                                                                <p className="text-xs text-gray-500">
                                                                                    {vehiculo.color} • {vehiculo.tipo}
                                                                                </p>
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 px-3">
                                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-mono font-bold bg-gray-100 text-gray-900 border">
                                                                                {vehiculo.placa}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-3 px-3 text-right">
                                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                                                                                {vehiculo.capacidad_carga_kg} kg
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {/* Formulario completo para crear/editar asignación */}
                                                    {(data.vehiculo_id || editingAssignment) && (
                                                        <div className="space-y-4">
                                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                                <p className="text-sm text-blue-700 font-semibold mb-3">
                                                                    {editingAssignment ? 'Editando Asignación de Viaje' : 'Nueva Asignación de Viaje'}
                                                                </p>
                                                                
                                                                {/* Mostrar errores si existen */}
                                                                {errors.vehiculo_id && (
                                                                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                                                        {errors.vehiculo_id}
                                                                    </div>
                                                                )}

                                                                <div className="grid grid-cols-1 gap-3">
                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                            Conductor (opcional)
                                                                        </label>
                                                                        <select
                                                                            value={data.conductor_id ?? ''}
                                                                            onChange={(e) => setData('conductor_id', e.target.value ? parseInt(e.target.value) : null)}
                                                                            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                        >
                                                                            <option value="">-- Sin conductor --</option>
                                                                            {drivers.map((d) => (
                                                                                <option key={d.id} value={d.id}>
                                                                                    {d.name} {d.email ? `(${d.email})` : ''}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                        {errors.conductor_id && (
                                                                            <p className="text-red-500 text-xs mt-1">{errors.conductor_id}</p>
                                                                        )}
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                            Estado del viaje
                                                                        </label>
                                                                        <select 
                                                                            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                                                            value={data.estado} 
                                                                            onChange={(e) => setData('estado', e.target.value)}
                                                                        >
                                                                            <option value="asignado">Asignado</option>
                                                                            <option value="en_ruta">En camino</option>
                                                                            <option value="entregado">Entregado</option>
                                                                            <option value="cancelado">Cancelado</option>
                                                                        </select>
                                                                        {errors.estado && (
                                                                            <p className="text-red-500 text-xs mt-1">{errors.estado}</p>
                                                                        )}
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                                Fecha de asignación
                                                                            </label>
                                                                            <input 
                                                                                type="datetime-local" 
                                                                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                                                                value={data.fecha_asignacion} 
                                                                                onChange={(e) => setData('fecha_asignacion', e.target.value)} 
                                                                            />
                                                                            {errors.fecha_asignacion && (
                                                                                <p className="text-red-500 text-xs mt-1">{errors.fecha_asignacion}</p>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                                Fecha de salida (opcional)
                                                                            </label>
                                                                            <input 
                                                                                type="datetime-local" 
                                                                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                                                                value={data.fecha_salida ?? ''} 
                                                                                onChange={(e) => setData('fecha_salida', e.target.value || null)} 
                                                                            />
                                                                            {errors.fecha_salida && (
                                                                                <p className="text-red-500 text-xs mt-1">{errors.fecha_salida}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                            Fecha de entrega (opcional)
                                                                        </label>
                                                                        <input 
                                                                            type="datetime-local" 
                                                                            className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                                                            value={data.fecha_entrega ?? ''} 
                                                                            onChange={(e) => setData('fecha_entrega', e.target.value || null)} 
                                                                        />
                                                                        {errors.fecha_entrega && (
                                                                            <p className="text-red-500 text-xs mt-1">{errors.fecha_entrega}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={editingAssignment ? handleActualizarAsignacion : submitAssignment}
                                                                    disabled={processing}
                                                                    className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                                                                        processing 
                                                                            ? 'bg-indigo-400 cursor-not-allowed' 
                                                                            : 'bg-indigo-600 hover:bg-indigo-700'
                                                                    }`}
                                                                >
                                                                    {processing ? (
                                                                        <div className="flex items-center gap-2 justify-center">
                                                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                                                            {editingAssignment ? 'Actualizando...' : 'Guardando...'}
                                                                        </div>
                                                                    ) : (
                                                                        editingAssignment ? 'Actualizar Asignación' : 'Guardar Asignación'
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={cancelarEdicion}
                                                                    disabled={processing}
                                                                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors font-medium"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
                                                    <div className="flex gap-3">
                                                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="font-semibold text-yellow-800">Sin vehículos disponibles</p>
                                                            <p className="text-sm text-yellow-700 mt-1">
                                                                No hay vehículos activos en esta sucursal para asignar al envío.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Sección de Acciones del Pedido */}
                   
                            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-purple-600" />
                                    Acciones del Pedido
                                </h2>

                                <div className="space-y-3">
                                    {/* Botón Confirmar Pedido */}
                                    {/* Solo se muestra si NO está entregado/cancelado */}
                                    {!['entregado', 'cancelado'].includes(pedido.estado) && (
                                        <button
                                            onClick={handleConfirmarPedido}
                                            // Deshabilitar: 1. Si se está procesando. 2. Si el estado NO permite confirmación.
                                            disabled={isConfirmingOrder || !canPerformAction(pedido.estado, 'confirm')}
                                            className={`w-full px-4 py-3 rounded-lg text-white font-semibold transition-colors flex items-center justify-center gap-2 ${
                                                isConfirmingOrder || !canPerformAction(pedido.estado, 'confirm')
                                                    ? 'bg-blue-400 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                        >
                                            {isConfirmingOrder ? (
                                                <>
                                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                                    Confirmando...
                                                </>
                                            ) : pedido.estado.toLowerCase() === 'confirmado' ? (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    Confirmado
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    Confirmar Pedido
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {/* Botón Completar Pedido (Entregar) */}
                                    {/* Solo se muestra si NO está entregado/cancelado */}
                                    {!['entregado', 'cancelado'].includes(pedido.estado) && (
                                        <button
                                            onClick={handleCompletarPedido}
                                            // Deshabilitar: 1. Si se está procesando. 2. Si el estado NO permite completarse.
                                            disabled={isCompletingOrder || !canPerformAction(pedido.estado, 'complete')}
                                            className={`w-full px-4 py-3 rounded-lg text-white font-semibold transition-colors flex items-center justify-center gap-2 ${
                                                isCompletingOrder || !canPerformAction(pedido.estado, 'complete')
                                                    ? 'bg-green-400 cursor-not-allowed'
                                                    : 'bg-green-600 hover:bg-green-700'
                                            }`}
                                        >
                                            {isCompletingOrder ? (
                                                <>
                                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                                    Completando...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    Completar Pedido
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {/* Botón Cancelar Pedido */}
                                    {/* Solo se muestra si NO está entregado/cancelado */}
                                    {!['entregado', 'cancelado'].includes(pedido.estado) && (
                                        <button
                                            onClick={() => setShowCancelModal(true)}
                                            // Deshabilitar: 1. Si se está procesando. 2. Si el estado NO permite cancelación.
                                            disabled={isCancellingOrder || !canPerformAction(pedido.estado, 'cancel')}
                                            className={`w-full px-4 py-3 rounded-lg text-white font-semibold transition-colors flex items-center justify-center gap-2 ${
                                                isCancellingOrder || !canPerformAction(pedido.estado, 'cancel')
                                                    ? 'bg-red-400 cursor-not-allowed'
                                                    : 'bg-red-600 hover:bg-red-700'
                                            }`}
                                        >
                                            {isCancellingOrder ? (
                                                <>
                                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                                    Cancelando...
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-5 h-5" />
                                                    Cancelar Pedido
                                                </>
                                            )}
                                        </button>
                                    )}
                                    
                                    {/* Mensaje si el pedido ya está completado o cancelado */}
                                    {['entregado', 'cancelado'].includes(pedido.estado) && (
                                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                                            <p className="text-sm text-gray-600 text-center">
                                               Este pedido ya ha sido **<strong>{pedido.estado === 'entregado' ? 'completado' : 'cancelado'}</strong> **
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modal de Cancelación */}
                    {showCancelModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" onClick={() => setShowCancelModal(false)}>
                            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-[10000]" onClick={(e) => e.stopPropagation()}>
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-red-100 p-3 rounded-full">
                                            <AlertCircle className="w-6 h-6 text-red-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">
                                            Cancelar Pedido
                                        </h3>
                                    </div>

                                    <p className="text-gray-600 text-sm mb-4">
                                        ¿Estás seguro de que deseas cancelar este pedido? Por favor, proporciona un motivo de cancelación.
                                    </p>

                                    <textarea
                                        value={data.motivo_cancelacion || ''}
                                        onChange={(e) => setData('motivo_cancelacion',e.target.value)}
                                        placeholder="Escribe el motivo de la cancelación..."
                                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4 resize-none"
                                        rows={4}
                                    />

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setShowCancelModal(false);
                                                setCancelReason('');
                                            }}
                                            disabled={isCancellingOrder}
                                            className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 font-medium transition-colors"
                                        >
                                            Volver
                                        </button>
                                        <button
                                            onClick={handleCancelarPedido}
                                            disabled={isCancellingOrder || !data.motivo_cancelacion?.trim()}
                                            className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                                                isCancellingOrder || !data.motivo_cancelacion?.trim()
                                                    ? 'bg-red-400 cursor-not-allowed'
                                                    : 'bg-red-600 hover:bg-red-700'
                                            }`}
                                        >
                                            {isCancellingOrder ? 'Cancelando...' : 'Confirmar Cancelación'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}