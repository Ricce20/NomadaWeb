import React, { useEffect, useMemo, useState } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import { debounce } from "lodash";
import { Clock, CheckCircle, XCircle, DollarSign, Filter, Search, Truck, Package, Building, Eye } from "lucide-react";
import AppLayout from "@/layouts/app-layout";

const breadcrumbs = [
	{
		title: "Historial de Pedidos",
		href: '/empleados/pedidos/historial'
	}
];

interface Pedido {
	id: number;
	folio: string;
	fecha_pedido: string | null;
	fecha_entrega: string | null;
	cliente_nombre: string;
	cliente_telefono: string | null;
	estado: string;
	estado_pago: string;
	requiere_envio: boolean;
	total: number | string;
	monto_adelanto: number | string;
	saldo_pendiente: number | string;
	atendido_por: string;
	created_at: string;
}

interface SucursalItem {
	id: number;
	nombre: string;
}

interface Filters {
	estado?: string;
	estado_pago?: string;
	search?: string;
	fecha_desde?: string;
	fecha_hasta?: string;
	requiere_envio?: string;
	monto_min?: string;
	monto_max?: string;
}

interface PaginationLinks {
	url: string | null;
	label: string;
	active: boolean;
}

interface HistorialPedidosProps {
	pedidos: {
		data: Pedido[];
		current_page: number;
		last_page: number;
		total: number;
		from: number;
		to: number;
		links: PaginationLinks[];
	};
	sucursal: SucursalItem;
	filters: Filters;
	fecha_rango: {
		desde: string;
		hasta: string;
	};
}

export default function HistorialPedidos({ pedidos, sucursal, filters, fecha_rango }: HistorialPedidosProps) {
	const { url } = usePage();
	const [showFilters, setShowFilters] = useState(false);
	const [filtersData, setFiltersData] = useState<Filters>(filters);

	useEffect(() => {
		setFiltersData(filters);
	}, [filters]);

	const filtersToPayload = (filters: Filters): Record<string, any> => {
		const payload: Record<string, any> = {};
		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined && value !== '' && value !== null) {
				payload[key] = value;
			}
		});
		return payload;
	};

	const debouncedSearch = useMemo(
		() => debounce((filters: Filters) => {
			router.get(url, filtersToPayload(filters), {
				preserveState: true,
				replace: true,
			});
		}, 500),
		[url]
	);

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

	const resetFilters = () => {
		const resetFilters: Filters = {
			search: '',
			estado: '',
			estado_pago: '',
			requiere_envio: '',
			fecha_desde: '',
			fecha_hasta: '',
			monto_min: '',
			monto_max: ''
		};
		setFiltersData(resetFilters);
		setShowFilters(false);
		router.get(url, filtersToPayload(resetFilters), {
			preserveState: true,
			replace: true,
		});
	};

	const applyFilters = () => {
		router.get(url, filtersToPayload(filtersData), {
			preserveState: true,
			replace: true,
		});
	};

	const handlePageChange = (url: string | null) => {
		if (url) {
			router.get(url, {}, {
				preserveState: true,
				preserveScroll: true,
			});
		}
	};

	useEffect(() => {
		return () => {
			debouncedSearch.cancel();
		};
	}, [debouncedSearch]);

	const formatMonto = (monto: number | string | null | undefined): string => {
		if (monto === null || monto === undefined) return '$0.00';
		const numero = typeof monto === 'string' ? parseFloat(monto) : monto;
		if (isNaN(numero)) return '$0.00';
		return `$${numero.toFixed(2)}`;
	};

	const getEstadoInfo = (estado: string) => {
		const estadoLower = estado.toLowerCase();
		switch (estadoLower) {
			case 'entregado':
				return {
					color: 'bg-green-100 text-green-800 border-green-200',
					texto: 'Entregado',
					icon: <CheckCircle className="w-4 h-4" />
				};
			case 'cancelado':
				return {
					color: 'bg-red-100 text-red-800 border-red-200',
					texto: 'Cancelado',
					icon: <XCircle className="w-4 h-4" />
				};
			default:
				return {
					color: 'bg-gray-100 text-gray-800 border-gray-200',
					texto: estado,
					icon: <Clock className="w-4 h-4" />
				};
		}
	};

	const getEstadoPagoInfo = (estado: string) => {
		switch (estado) {
			case 'pagado':
				return {
					color: 'bg-green-100 text-green-800 border-green-200',
					texto: 'Pagado',
					icon: <DollarSign className="w-4 h-4" />
				};
			case 'adelanto':
				return {
					color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
					texto: 'Con Adelanto',
					icon: <DollarSign className="w-4 h-4" />
				};
			case 'pendiente':
				return {
					color: 'bg-red-100 text-red-800 border-red-200',
					texto: 'Pendiente',
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

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Historial de Pedidos" />

			<div className="min-h-screen bg-gray-50 py-6">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* Header */}
					<div className="mb-8">
						<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
							<div>
								<h1 className="text-3xl font-bold text-gray-900">
									Historial de Pedidos
								</h1>
								<p className="text-gray-600 mt-2">
									Consulta los pedidos completados y cancelados
								</p>
							</div>
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-2 text-sm text-gray-600">
									<Building className="w-4 h-4" />
									<span>{sucursal.nombre}</span>
								</div>
							</div>
						</div>
					</div>

					{/* Barra de Búsqueda y Filtros */}
					<div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
						<div className="flex flex-col lg:flex-row gap-4">
							{/* Búsqueda */}
							<div className="flex-1">
								<div className="relative">
									<input
										type="text"
										className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-200"
										placeholder="Buscar por folio, cliente o teléfono..."
										value={filtersData.search || ''}
										onChange={e => handleFilterChange('search', e.target.value)}
									/>
									<span className="absolute right-3 top-2.5 text-gray-400">
										<Search className="w-5 h-5" />
									</span>
								</div>
							</div>

							<button
								onClick={() => setShowFilters(!showFilters)}
								className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
							>
								<Filter className="w-4 h-4" />
								Filtros
							</button>

							<div className="flex gap-2">
								<button
									onClick={resetFilters}
									className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
								>
									Limpiar
								</button>
								<button
									onClick={applyFilters}
									className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
								>
									Aplicar
								</button>
							</div>
						</div>

						{/* Filtros Expandibles */}
						{showFilters && (
							<div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
								{/* Estado */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
									<select
										className="w-full border border-gray-300 rounded-lg px-3 py-2"
										value={filtersData.estado || ''}
										onChange={e => handleFilterChange('estado', e.target.value)}
									>
										<option value="">Todos</option>
										<option value="entregado">Entregado</option>
										<option value="cancelado">Cancelado</option>
									</select>
								</div>
								{/* Estado de pago */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Estado de Pago</label>
									<select
										className="w-full border border-gray-300 rounded-lg px-3 py-2"
										value={filtersData.estado_pago || ''}
										onChange={e => handleFilterChange('estado_pago', e.target.value)}
									>
										<option value="">Todos</option>
										<option value="pagado">Pagado</option>
										<option value="adelanto">Con Adelanto</option>
										<option value="pendiente">Pendiente</option>
									</select>
								</div>
								{/* Fechas */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Fecha desde</label>
									<input
										type="date"
										className="w-full border border-gray-300 rounded-lg px-3 py-2"
										value={filtersData.fecha_desde || fecha_rango.desde}
										onChange={e => handleFilterChange('fecha_desde', e.target.value)}
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Fecha hasta</label>
									<input
										type="date"
										className="w-full border border-gray-300 rounded-lg px-3 py-2"
										value={filtersData.fecha_hasta || fecha_rango.hasta}
										onChange={e => handleFilterChange('fecha_hasta', e.target.value)}
									/>
								</div>
								{/* Tipo de entrega */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Entrega</label>
									<select
										className="w-full border border-gray-300 rounded-lg px-3 py-2"
										value={filtersData.requiere_envio || ''}
										onChange={e => handleFilterChange('requiere_envio', e.target.value)}
									>
										<option value="">Todos</option>
										<option value="true">Con Envío</option>
										<option value="false">Recoge en tienda</option>
									</select>
								</div>
								{/* Rango de montos */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Monto mínimo</label>
									<input
										type="number"
										className="w-full border border-gray-300 rounded-lg px-3 py-2"
										placeholder="$0.00"
										value={filtersData.monto_min || ''}
										onChange={e => handleFilterChange('monto_min', e.target.value)}
										min={0}
										step={0.01}
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Monto máximo</label>
									<input
										type="number"
										className="w-full border border-gray-300 rounded-lg px-3 py-2"
										placeholder="$0.00"
										value={filtersData.monto_max || ''}
										onChange={e => handleFilterChange('monto_max', e.target.value)}
										min={0}
										step={0.01}
									/>
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
							<div className="text-gray-500">
								Rango: {fecha_rango.desde} a {fecha_rango.hasta}
							</div>
						</div>
					)}

					{/* Lista de Pedidos */}
					<div className="space-y-4">
						{pedidos.data.length === 0 ? (
							<div className="text-center py-12 bg-white rounded-lg border border-gray-200">
								<div className="text-2xl text-gray-400 mb-2">
									<Clock className="w-10 h-10 mx-auto" />
								</div>
								<div className="text-gray-600">
									No hay pedidos en el historial con los filtros seleccionados.
								</div>
							</div>
						) : (
							pedidos.data.map((pedido) => {
								const estadoInfo = getEstadoInfo(pedido.estado);
								const estadoPagoInfo = getEstadoPagoInfo(pedido.estado_pago);
								return (
									<div key={pedido.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
										<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
											{/* Información principal */}
											<div className="flex-1 space-y-3">
												{/* Badges y Folio */}
												<div className="flex flex-wrap items-center gap-2">
													<span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${estadoInfo.color}`}>
														{estadoInfo.icon}
														{estadoInfo.texto}
													</span>
													<span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${estadoPagoInfo.color}`}>
														{estadoPagoInfo.icon}
														{estadoPagoInfo.texto}
													</span>
													<span className="font-mono text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded">
														{pedido.folio}
													</span>
												</div>

												{/* Cliente y Montos */}
												<div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
													<div>
														<span className="text-gray-500">Cliente:</span>{' '}
														<span className="font-medium text-gray-900">{pedido.cliente_nombre}</span>
														{pedido.cliente_telefono && (
															<span className="text-gray-500 ml-2">• {pedido.cliente_telefono}</span>
														)}
													</div>
													<div>
														<span className="text-gray-500">Total:</span>{' '}
														<span className="font-bold text-gray-900">{formatMonto(pedido.total)}</span>
													</div>
													{pedido.saldo_pendiente && parseFloat(pedido.saldo_pendiente.toString()) > 0 && (
														<div>
															<span className="text-gray-500">Saldo pendiente:</span>{' '}
															<span className="font-semibold text-red-600">{formatMonto(pedido.saldo_pendiente)}</span>
														</div>
													)}
													{pedido.monto_adelanto && parseFloat(pedido.monto_adelanto.toString()) > 0 && (
														<div>
															<span className="text-gray-500">Adelanto:</span>{' '}
															<span className="font-medium text-green-600">{formatMonto(pedido.monto_adelanto)}</span>
														</div>
													)}
												</div>

												{/* Fechas y detalles */}
												<div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
													{pedido.fecha_pedido && (
														<div className="flex items-center gap-1">
															<Clock className="w-3.5 h-3.5" />
															<span>Pedido: {pedido.fecha_pedido}</span>
														</div>
													)}
													{pedido.fecha_entrega && (
														<div className="flex items-center gap-1">
															<CheckCircle className="w-3.5 h-3.5" />
															<span>Entrega: {pedido.fecha_entrega}</span>
														</div>
													)}
													<div className="flex items-center gap-1">
														{pedido.requiere_envio ? <Truck className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
														<span>{pedido.requiere_envio ? 'Con envío' : 'Recoge en tienda'}</span>
													</div>
													<div>
														<span>Atendido por: {pedido.atendido_por}</span>
													</div>
												</div>
											</div>

											{/* Botón de acción */}
											<div className="flex md:flex-col gap-2">
												<a
													href={`/sucursal/pedidos/${pedido.id}`}
													className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
												>
													<Eye className="w-4 h-4" />
													Ver Detalles
												</a>
											</div>
										</div>
									</div>
								);
							})
						)}
					</div>

					{/* Paginación */}
					{pedidos.data.length > 0 && pedidos.links && pedidos.links.length > 3 && (
						<div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
							<div className="text-sm text-gray-700">
								Mostrando {pedidos.from} a {pedidos.to} de {pedidos.total} resultados
							</div>
							<div className="flex items-center flex-wrap justify-center gap-1">
								{pedidos.links.map((link, idx) => (
									<button
										key={idx}
										disabled={!link.url}
										className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
											link.active 
												? 'bg-blue-600 text-white' 
												: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
										} ${!link.url ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
										dangerouslySetInnerHTML={{ __html: link.label }}
										onClick={() => handlePageChange(link.url)}
									/>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</AppLayout>
	);
}