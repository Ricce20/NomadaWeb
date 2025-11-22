<?php

namespace App\Http\Controllers\empleados;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\NegocioCliente;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Vehiculo;
class PedidosController extends Controller
{
    public function crearPedidoLocal(string|int $clienteId)
    {
        $sucursal = auth()->user()->sucursales()->first();
        $cliente = NegocioCliente::with('direcciones_cliente')->where('id',$clienteId)->first();
        $vehiculos = Vehiculo::where('sucursal_id', $sucursal->id)->get(); 

        if(!$cliente){
            return redirect()->back()->with('error','Cliente no encontrado');
        }

        if($cliente->negocio_id !== $sucursal->negocio_id){
            return redirect()->back()->with('error','El cliente no pertenece a esta sucursal');
        }

        return Inertia::render('empleados/pedidos/create',[
            'sucursal' => $sucursal,
            'cliente' => $cliente,
            'vehiculos' => $vehiculos,
        ]);
    }


}
