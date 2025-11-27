import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { 
    ChevronRight, 
    MapPin, 
    Clock, 
    DollarSign, 
    Truck, 
    Package, 
    CheckCircle,
    Search,
    Filter,
    Building,
    ChevronLeft,
    User,
    Calendar
} from 'lucide-react';
import { debounce } from 'lodash';
import AppLayout from '@/layouts/app-layout';

const breadcrumbs = [
    {
        title: "Pedidos Activos",
        href: '/empleados/pedidos'
    }
];

interface Cliente {
    id: number;
    nombre: string;
    apellidos: string;
    telefono: string;
}

interface Sucursal {
    id: number;
    nombre: string;
}

interface Pedido {
    id: number;
    folio: string;
    cliente?: Cliente | null;
    sucursal: Sucursal;
    user?: {
        id: number;
        name: string;
        email?: string;
    };
    direccion_entrega: string;
    requiere_envio: boolean;
    estado: string;
    estado_pago: 'pendiente' | 'adelanto' | 'pagado';
    subtotal: number | string;
    costo_envio: number | string | null;
    total: number | string;
    monto_adelanto: number | string | null;
    saldo_pendiente: number | string | null;
    fecha_pedido: string;
    created_at: string;
    distancia_km?: number | string | null;
    duracion_minutos?: number | string | null;
    detalles_count?: number;
    productos_count?: number;
    creador?:{
        id:number;
        name:string;
    };
}

interface SucursalItem {
    id: number;
    nombre: string;
}

interface Estadisticas {
    total_activos: number;
    pendientes: number;
    confirmados: number;
    en_camino: number;
    total_por_cobrar: number | string | null;
}

interface Filters {
    sucursal_id?: string;
    estado?: string;
    estado_pago?: string;
    search?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    requiere_envio?: string;
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface PedidosIndexProps {
    pedidos: {
        data: Pedido[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        links: PaginationLinks[];
    };
    sucursal_actual: SucursalItem;
    estadisticas: Estadisticas;
    filters: Filters;
}

export default function PedidosIndex({ 
    pedidos, 
    sucursal_actual, 
    estadisticas, 
    filters 
}: PedidosIndexProps) {
    const { url } = usePage();
    const [showFilters, setShowFilters] = useState(false);
    const [filtersData, setFiltersData] = useState<Filters>(filters);

    // Sincronizar los filtros cuando cambien desde las props
    useEffect(() => {
        setFiltersData(filters);
    }, [filters]);

    // Convertir filtros a payload para router
    const filtersToPayload = (filters: Filters): Record<string, any> => {
        const payload: Record<string, any> = {};
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '' && value !== null) {
                payload[key] = value;
            }
        });

        return payload;
    };

    // Debounced search
    const debouncedSearch = useMemo(
        () => debounce((filters: Filters) => {
            router.get(url, filtersToPayload(filters), {
                preserveState: true,
                replace: true,
            });
        }, 500),
        [url]
    );

    // Manejar cambios en filtros
    const handleFilterChange = (key: keyof Filters, value: string) => {
        const newFilters: Filters = {
            ...filtersData,
            [key]: value,
        };
        setFiltersData(newFilters);

        if (key === "search") {
            debouncedSearch(newFilters);
        } else {
            router.get(url, filtersToPayload(newFilters), {
                preserveState: true,
                replace: true,
            });
        }
    };

    // Limpiar filtros - MEJORADO: mantiene query parameters vacíos
    const resetFilters = () => {
        const resetFilters: Filters = {
            search: '',
            estado: '',
            estado_pago: '',
            requiere_envio: '',
            fecha_desde: '',
            fecha_hasta: ''
        };
        
        setFiltersData(resetFilters);
        setShowFilters(false);
        
        // Enviar filtros vacíos para mantener la estructura de la URL
        router.get(url, filtersToPayload(resetFilters), {
            preserveState: true,
            replace: true,
        });
    };

    // Aplicar filtros manualmente
    const applyFilters = () => {
        router.get(url, filtersToPayload(filtersData), {
            preserveState: true,
            replace: true,
        });
    };

    // Manejar paginación
    const handlePageChange = (url: string | null) => {
        if (url) {
            router.get(url, {}, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    // Cleanup debounce
    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    // Función para formatear montos de manera segura
    const formatMonto = (monto: number | string | null | undefined): string => {
        if (monto === null || monto === undefined) return '$0.00';
        
        const numero = typeof monto === 'string' ? parseFloat(monto) : monto;
        
        if (isNaN(numero)) return '$0.00';
        
        return `$${numero.toFixed(2)}`;
    };

    // Función para formatear números de manera segura (distancia, duración, etc.)
    const formatNumero = (numero: number | string | null | undefined, decimales: number = 2): string => {
        if (numero === null || numero === undefined) return '0';
        
        const num = typeof numero === 'string' ? parseFloat(numero) : numero;
        
        if (isNaN(num)) return '0';
        
        return num.toFixed(decimales);
    };

    // Función para obtener los colores y textos según el estado
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
            case 'en_camino':
                return {
                    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                    texto: '🚚 En Camino',
                    icon: <Truck className="w-4 h-4" />
                };
            case 'completado':
                return {
                    color: 'bg-green-100 text-green-800 border-green-200',
                    texto: '🏁 Completado',
                    icon: <CheckCircle className="w-4 h-4" />
                };
            default:
                return {
                    color: 'bg-gray-100 text-gray-800 border-gray-200',
                    texto: estado,
                    icon: <Clock className="w-4 h-4" />
                };
        }
    };

    // Función para obtener los colores y textos según el estado de pago
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

    // Función para formatear la fecha
    const formatFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pedidos Activos" />

            <div className="min-h-screen bg-gray-50 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Pedidos Activos
                                </h1>
                                <p className="text-gray-600 mt-2">
                                    Gestiona todos los pedidos activos del sistema
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Building className="w-4 h-4" />
                                    <span>Sucursal:</span>
                                    <span className="font-medium">
                                        {sucursal_actual.nombre}
                                    </span>
                                </div>
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                    {estadisticas.total_activos} activos
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Estadísticas Rápidas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-2xl font-bold text-blue-600">
                                {estadisticas.total_activos}
                            </div>
                            <div className="text-sm text-gray-600">Total Activos</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-2xl font-bold text-yellow-600">
                                {estadisticas.pendientes}
                            </div>
                            <div className="text-sm text-gray-600">Pendientes</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-2xl font-bold text-blue-600">
                                {estadisticas.confirmados}
                            </div>
                            <div className="text-sm text-gray-600">Confirmados</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-2xl font-bold text-indigo-600">
                                {estadisticas.en_camino}
                            </div>
                            <div className="text-sm text-gray-600">En Camino</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-2xl font-bold text-red-600">
                                {formatMonto(estadisticas.total_por_cobrar)}
                            </div>
                            <div className="text-sm text-gray-600">Por Cobrar</div>
                        </div>
                    </div>

                    {/* Barra de Búsqueda y Filtros */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Búsqueda */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por folio, cliente o teléfono..."
                                        value={filtersData.search || ''}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Botón Filtros */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <Filter className="w-4 h-4" />
                                Filtros
                                {Object.values(filtersData).filter(val => val !== undefined && val !== '').length > 0 && (
                                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                        {Object.values(filtersData).filter(val => val !== undefined && val !== '').length}
                                    </span>
                                )}
                            </button>

                            {/* Acciones */}
                            <div className="flex gap-2">
                                <button
                                    onClick={applyFilters}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Aplicar
                                </button>
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Limpiar
                                </button>
                            </div>
                        </div>

                        {/* Filtros Expandibles */}
                        {showFilters && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                                {/* Estado */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estado
                                    </label>
                                    <select
                                        value={filtersData.estado || ''}
                                        onChange={(e) => handleFilterChange('estado', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Todos los estados</option>
                                        <option value="pendiente">Pendiente</option>
                                        <option value="confirmado">Confirmado</option>
                                        <option value="en_preparacion">En Preparación</option>
                                        <option value="listo_para_envio">Listo para Envío</option>
                                        <option value="en_camino">En Camino</option>
                                        <option value="completado">Completado</option>
                                    </select>
                                </div>

                                {/* Estado de Pago */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estado de Pago
                                    </label>
                                    <select
                                        value={filtersData.estado_pago || ''}
                                        onChange={(e) => handleFilterChange('estado_pago', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Todos</option>
                                        <option value="pendiente">Pendiente</option>
                                        <option value="adelanto">Adelanto</option>
                                        <option value="pagado">Pagado</option>
                                    </select>
                                </div>

                                {/* Tipo de Entrega */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tipo de Entrega
                                    </label>
                                    <select
                                        value={filtersData.requiere_envio || ''}
                                        onChange={(e) => handleFilterChange('requiere_envio', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Todos</option>
                                        <option value="true">Envío a Domicilio</option>
                                        <option value="false">Recoge en Tienda</option>
                                    </select>
                                </div>

                                {/* Fechas */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Desde
                                        </label>
                                        <input
                                            type="date"
                                            value={filtersData.fecha_desde || ''}
                                            onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Hasta
                                        </label>
                                        <input
                                            type="date"
                                            value={filtersData.fecha_hasta || ''}
                                            onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Información de paginación */}
                    {pedidos.data.length > 0 && (
                        <div className="mb-4 flex justify-between items-center text-sm text-gray-600">
                            <div>
                                Mostrando {pedidos.from} a {pedidos.to} de {pedidos.total} resultados
                            </div>
                        </div>
                    )}

                    {/* Lista de Pedidos */}
                    <div className="space-y-4">
                        {pedidos.data.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                                <div className="text-gray-400 text-6xl mb-4">📦</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No se encontraron pedidos
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    No hay pedidos activos que coincidan con los filtros aplicados.
                                </p>
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        ) : (
                            pedidos.data.map((pedido) => {
                                const estadoInfo = getEstadoInfo(pedido.estado);
                                const estadoPagoInfo = getEstadoPagoInfo(pedido.estado_pago);

                                return (
                                    <div
                                        key={pedido.id}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                    >
                                        <div className="p-6">
                                            {/* Header del Pedido */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-xl font-bold text-gray-900">
                                                            Pedido #{pedido.folio}
                                                        </h3>
                                                        <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${estadoInfo.color}`}>
                                                            {estadoInfo.icon}
                                                            {estadoInfo.texto}
                                                        </div>
                                                        <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${estadoPagoInfo.color}`}>
                                                            {estadoPagoInfo.icon}
                                                            {estadoPagoInfo.texto}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                                        {/* Información del Cliente/Usuario */}
                                                        <div className="flex items-center gap-1">
                                                            <User className="w-4 h-4" />
                                                            <span className="font-medium">Cliente:</span>
                                                            {pedido.cliente ? (
                                                                // Cliente físico (con datos completos)
                                                                <>
                                                                    {pedido.cliente.nombre} {pedido.cliente.apellidos}
                                                                </>
                                                            ) : (
                                                                // Usuario que hizo pedido en línea
                                                                <>
                                                                    {pedido.user?.name || 'Cliente en línea'}
                                                                </>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Teléfono - Solo para clientes físicos */}
                                                        {pedido.cliente?.telefono && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-medium">Teléfono:</span>
                                                                {pedido.cliente.telefono}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Email - Para usuarios en línea */}
                                                        {!pedido.cliente && pedido.user?.email && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-medium">Email:</span>
                                                                {pedido.user.email}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Sucursal */}
                                                        <div className="flex items-center gap-1">
                                                            <Building className="w-4 h-4" />
                                                            <span className="font-medium">Sucursal:</span>
                                                            {pedido.sucursal.nombre}
                                                        </div>
                                                        
                                                        {/* Creado por - Solo si es diferente del cliente */}
                                                        {pedido.user && pedido.cliente && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-medium">Registrado por:</span>
                                                                {pedido.user.name}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Tipo de cliente */}
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-medium">Tipo:</span>
                                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                                pedido.cliente 
                                                                    ? 'bg-blue-100 text-blue-800' 
                                                                    : 'bg-green-100 text-green-800'
                                                            }`}>
                                                                {pedido.cliente ? '🏪 Cliente Local' : '🌐 En Línea'}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Fecha */}
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            <span className="font-medium">Fecha:</span>
                                                            {formatFecha(pedido.fecha_pedido || pedido.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <Link
                                                    href={`/sucursal/pedidos/${pedido.id}`}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    Ver Detalles
                                                    <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </div>

                                            {/* Información Básica del Pedido */}
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                {/* Información de Entrega */}
                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {pedido.requiere_envio ? 'Envío a Domicilio' : 'Recoge en Tienda'}
                                                            </p>
                                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                                {pedido.direccion_entrega}
                                                            </p>
                                                            {pedido.requiere_envio && pedido.distancia_km && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {formatNumero(pedido.distancia_km, 2)} km • {formatNumero(pedido.duracion_minutos, 0)} min
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Información de Productos */}
                                                <div className="lg:col-span-2">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-medium text-gray-900">
                                                            Resumen de Productos
                                                        </h4>
                                                        <span className="text-sm text-gray-500">
                                                            {pedido.detalles_count || 0} producto{pedido.detalles_count !== 1 ? 's' : ''} en total
                                                        </span>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-lg p-4">
                                                        <p className="text-sm text-gray-600 text-center">
                                                            Los detalles completos de los productos están disponibles en la vista de detalles del pedido
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Totales y Resumen Financiero */}
                                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
                                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-600">Subtotal:</span>
                                                        <span className="font-medium text-gray-900 ml-2">
                                                            {formatMonto(pedido.subtotal)}
                                                        </span>
                                                    </div>
                                                    {pedido.requiere_envio && pedido.costo_envio && (
                                                        <div>
                                                            <span className="text-gray-600">Envío:</span>
                                                            <span className="font-medium text-gray-900 ml-2">
                                                                {formatMonto(pedido.costo_envio)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="text-gray-600">Total:</span>
                                                        <span className="font-bold text-lg text-green-600 ml-2">
                                                            {formatMonto(pedido.total)}
                                                        </span>
                                                    </div>
                                                    {pedido.monto_adelanto && parseFloat(pedido.monto_adelanto.toString()) > 0 && (
                                                        <div>
                                                            <span className="text-gray-600">Adelanto:</span>
                                                            <span className="font-medium text-green-600 ml-2">
                                                                {formatMonto(pedido.monto_adelanto)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {pedido.saldo_pendiente && parseFloat(pedido.saldo_pendiente.toString()) > 0 && (
                                                        <div>
                                                            <span className="text-gray-600">Saldo:</span>
                                                            <span className="font-medium text-yellow-600 ml-2">
                                                                {formatMonto(pedido.saldo_pendiente)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Paginación Clásica de Laravel */}
                    {pedidos.data.length > 0 && pedidos.links && pedidos.links.length > 3 && (
                        <div className="mt-6 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Mostrando {pedidos.from} a {pedidos.to} de {pedidos.total} resultados
                            </div>
                            
                            <div className="flex items-center space-x-1">
                                {/* Página anterior */}
                                {pedidos.links.find(link => link.label === '&laquo; Previous')?.url && (
                                    <button
                                        onClick={() => handlePageChange(pedidos.links.find(link => link.label === '&laquo; Previous')?.url || null)}
                                        className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={pedidos.current_page === 1}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                )}

                                {/* Números de página */}
                                {pedidos.links.slice(1, -1).map((link, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handlePageChange(link.url)}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}

                                {/* Página siguiente */}
                                {pedidos.links.find(link => link.label === 'Next &raquo;')?.url && (
                                    <button
                                        onClick={() => handlePageChange(pedidos.links.find(link => link.label === 'Next &raquo;')?.url || null)}
                                        className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={pedidos.current_page === pedidos.last_page}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}