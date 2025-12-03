<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Reporte de Pedidos - {{ $sucursal->nombre }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            color: #333;
            background: #fff;
        }
        .header {
            background: linear-gradient(135deg, #1B1B1B 0%, #323232 100%);
            color: #FEE8D0;
            padding: 20px;
            margin-bottom: 20px;
        }
        .header-content {
            display: table;
            width: 100%;
        }
        .logo-section {
            display: table-cell;
            width: 60%;
            vertical-align: middle;
        }
        .logo-text {
            font-size: 28px;
            font-weight: bold;
            color: #FC6F20;
            letter-spacing: 2px;
        }
        .logo-subtitle {
            font-size: 10px;
            color: #FEE8D0;
            margin-top: 5px;
        }
        .info-section {
            display: table-cell;
            width: 40%;
            text-align: right;
            vertical-align: middle;
            font-size: 10px;
        }
        .report-title {
            background: #FC6F20;
            color: white;
            padding: 10px 20px;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .filters-box {
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-left: 4px solid #FC6F20;
            padding: 15px;
            margin-bottom: 20px;
        }
        .filters-title {
            font-weight: bold;
            color: #1B1B1B;
            margin-bottom: 10px;
        }
        .filters-grid {
            display: table;
            width: 100%;
        }
        .filter-item {
            display: table-cell;
            width: 25%;
        }
        .filter-label {
            font-size: 9px;
            color: #666;
            text-transform: uppercase;
        }
        .filter-value {
            font-weight: bold;
            color: #1B1B1B;
        }
        .summary-box {
            margin-bottom: 20px;
        }
        .summary-grid {
            display: table;
            width: 100%;
        }
        .summary-item {
            display: table-cell;
            width: 20%;
            text-align: center;
            padding: 15px 10px;
            background: #f9f9f9;
            border: 1px solid #eee;
        }
        .summary-item.highlight {
            background: #FC6F20;
            color: white;
        }
        .summary-number {
            font-size: 24px;
            font-weight: bold;
        }
        .summary-label {
            font-size: 9px;
            text-transform: uppercase;
            margin-top: 5px;
        }
        .summary-item.highlight .summary-number,
        .summary-item.highlight .summary-label {
            color: white;
        }
        table.pedidos {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table.pedidos th {
            background: #1B1B1B;
            color: #FEE8D0;
            padding: 10px 8px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
        }
        table.pedidos td {
            padding: 8px;
            border-bottom: 1px solid #eee;
            font-size: 10px;
        }
        table.pedidos tr:nth-child(even) {
            background: #f9f9f9;
        }
        .estado {
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .estado-pendiente { background: #FEF3C7; color: #92400E; }
        .estado-confirmado { background: #DBEAFE; color: #1E40AF; }
        .estado-en_preparacion { background: #E0E7FF; color: #3730A3; }
        .estado-en_ruta { background: #D1FAE5; color: #065F46; }
        .estado-entregado { background: #D1FAE5; color: #065F46; }
        .estado-cancelado { background: #FEE2E2; color: #991B1B; }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #1B1B1B;
            color: #FEE8D0;
            padding: 10px 20px;
            font-size: 9px;
        }
        .footer-content {
            display: table;
            width: 100%;
        }
        .footer-left {
            display: table-cell;
            width: 50%;
        }
        .footer-right {
            display: table-cell;
            width: 50%;
            text-align: right;
        }
        .page-break {
            page-break-after: always;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .total-row {
            background: #1B1B1B !important;
            color: #FEE8D0;
            font-weight: bold;
        }
        .total-row td {
            border-bottom: none;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="header-content">
            <div class="logo-section">
                <div class="logo-text">NÓMADA</div>
                <div class="logo-subtitle">Sistema de Gestión de Pedidos e Inventarios</div>
            </div>
            <div class="info-section">
                <strong>{{ $negocio->nombre ?? 'Negocio' }}</strong><br>
                {{ $sucursal->nombre }}<br>
                {{ $sucursal->direccion ?? '' }}
            </div>
        </div>
    </div>

    <!-- Título del reporte -->
    <div class="report-title">
        REPORTE DE PEDIDOS
    </div>

    <!-- Filtros aplicados -->
    <div class="filters-box">
        <div class="filters-title">Parámetros del Reporte</div>
        <div class="filters-grid">
            <div class="filter-item">
                <div class="filter-label">Fecha Inicio</div>
                <div class="filter-value">{{ $fecha_inicio }}</div>
            </div>
            <div class="filter-item">
                <div class="filter-label">Fecha Fin</div>
                <div class="filter-value">{{ $fecha_fin }}</div>
            </div>
            <div class="filter-item">
                <div class="filter-label">Estado</div>
                <div class="filter-value">{{ ucfirst($estado_filtro) }}</div>
            </div>
            <div class="filter-item">
                <div class="filter-label">Generado</div>
                <div class="filter-value">{{ $fecha_generacion }}</div>
            </div>
        </div>
    </div>

    <!-- Resumen -->
    <div class="summary-box">
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-number">{{ $totales['cantidad'] }}</div>
                <div class="summary-label">Total Pedidos</div>
            </div>
            <div class="summary-item">
                <div class="summary-number">{{ $totales['pendientes'] }}</div>
                <div class="summary-label">Pendientes</div>
            </div>
            <div class="summary-item">
                <div class="summary-number">{{ $totales['entregados'] }}</div>
                <div class="summary-label">Entregados</div>
            </div>
            <div class="summary-item">
                <div class="summary-number">{{ $totales['cancelados'] }}</div>
                <div class="summary-label">Cancelados</div>
            </div>
            <div class="summary-item highlight">
                <div class="summary-number">${{ number_format($totales['ingresos'], 2) }}</div>
                <div class="summary-label">Ingresos</div>
            </div>
        </div>
    </div>

    <!-- Tabla de pedidos -->
    <table class="pedidos">
        <thead>
            <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @forelse($pedidos as $pedido)
            <tr>
                <td><strong>{{ $pedido->folio }}</strong></td>
                <td>{{ \Carbon\Carbon::parse($pedido->fecha_pedido)->format('d/m/Y H:i') }}</td>
                <td>{{ $pedido->cliente->nombre ?? 'Sin cliente' }}</td>
                <td>
                    <span class="estado estado-{{ $pedido->estado }}">
                        {{ str_replace('_', ' ', $pedido->estado) }}
                    </span>
                </td>
                <td class="text-right">${{ number_format($pedido->total, 2) }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="5" class="text-center">No se encontraron pedidos con los filtros seleccionados</td>
            </tr>
            @endforelse
            @if($pedidos->count() > 0)
            <tr class="total-row">
                <td colspan="4" class="text-right">TOTAL INGRESOS (Entregados):</td>
                <td class="text-right">${{ number_format($totales['ingresos'], 2) }}</td>
            </tr>
            @endif
        </tbody>
    </table>

    <!-- Footer -->
    <div class="footer">
        <div class="footer-content">
            <div class="footer-left">
                NÓMADA - Sistema de Gestión | {{ $negocio->nombre ?? '' }}
            </div>
            <div class="footer-right">
                Generado el {{ $fecha_generacion }}
            </div>
        </div>
    </div>
</body>
</html>
