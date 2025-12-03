<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Models\Sucursal;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class PedidosReportController extends Controller
{
    /**
     * Mostrar página de reportes
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Obtener sucursales según el rol
        if ($user->isOwner()) {
            $negocioId = $user->negocio()->pluck('id')->first();
            $sucursales = Sucursal::where('negocio_id', $negocioId)->get(['id', 'nombre']);
        } elseif ($user->isAdmin()) {
            $sucursales = $user->sucursales()->get(['sucursales.id', 'nombre']);
        } else {
            $sucursales = collect();
        }

        return Inertia::render('reports/pedidos-report', [
            'sucursales' => $sucursales,
        ]);
    }

    /**
     * Generar reporte PDF
     */
    public function generatePdf(Request $request)
    {
        $validated = $request->validate([
            'sucursal_id' => 'required|exists:sucursales,id',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
            'estado' => 'nullable|string',
        ]);

        $user = $request->user();
        $sucursal = Sucursal::with('negocio')->findOrFail($validated['sucursal_id']);

        // Verificar permisos
        if ($user->isOwner()) {
            $negocioId = $user->negocio()->pluck('id')->first();
            if ($sucursal->negocio_id !== $negocioId) {
                abort(403, 'No tienes acceso a esta sucursal');
            }
        } elseif ($user->isAdmin()) {
            if (!$user->sucursales()->where('sucursales.id', $sucursal->id)->exists()) {
                abort(403, 'No tienes acceso a esta sucursal');
            }
        }

        // Construir query
        $query = Pedido::where('sucursal_id', $validated['sucursal_id'])
            ->whereBetween('fecha_pedido', [
                $validated['fecha_inicio'] . ' 00:00:00',
                $validated['fecha_fin'] . ' 23:59:59'
            ])
            ->with(['cliente', 'detalles.productBaseBranch.productBase']);

        if (!empty($validated['estado'])) {
            $query->where('estado', $validated['estado']);
        }

        $pedidos = $query->orderBy('fecha_pedido', 'desc')->get();

        // Calcular totales
        $totales = [
            'cantidad' => $pedidos->count(),
            'ingresos' => $pedidos->where('estado', 'entregado')->sum('total'),
            'pendientes' => $pedidos->whereIn('estado', ['pendiente', 'confirmado', 'en_preparacion', 'en_ruta'])->count(),
            'entregados' => $pedidos->where('estado', 'entregado')->count(),
            'cancelados' => $pedidos->where('estado', 'cancelado')->count(),
        ];

        $data = [
            'sucursal' => $sucursal,
            'negocio' => $sucursal->negocio,
            'pedidos' => $pedidos,
            'totales' => $totales,
            'fecha_inicio' => Carbon::parse($validated['fecha_inicio'])->format('d/m/Y'),
            'fecha_fin' => Carbon::parse($validated['fecha_fin'])->format('d/m/Y'),
            'estado_filtro' => $validated['estado'] ?? 'Todos',
            'fecha_generacion' => now()->format('d/m/Y H:i'),
        ];

        $pdf = Pdf::loadView('reports.pedidos-pdf', $data);
        $pdf->setPaper('letter', 'portrait');

        $filename = "reporte_pedidos_{$sucursal->nombre}_{$validated['fecha_inicio']}_{$validated['fecha_fin']}.pdf";
        
        return $pdf->download($filename);
    }
}
