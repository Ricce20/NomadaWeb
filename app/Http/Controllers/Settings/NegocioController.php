<?php

namespace App\Http\Controllers\Settings;

use Illuminate\Http\Request;
use App\Models\Negocio;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateBusinessRequest;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class NegocioController extends Controller
{
    //GET ONE BUSINESS
    public function edit()
    {
        $business = Negocio::where('user_id', auth()->id())
        ->select(['nombre', 'correo', 'telefono','logo', 'activo','descripcion'])
        ->first();
    
        return Inertia::render('settings/negocio', [
        'data' => $business ? [
            'nombre' => $business->nombre,
            'correo' => $business->correo,
            'telefono' => $business->telefono,
            'logo' => $business->logo ? Storage::url($business->logo) : null, // ⬅️ IMPORTANTE
            'activo' => $business->activo,
            'descripcion' => $business->descripcion ?? null,
        ] : [
            'nombre' => null,
            'correo' => null,
            'telefono' => null,
            'logo' => null,
            'activo' => false,
            'descripcion' => null,
        ]
    ]);
    }

    public function update(UpdateBusinessRequest $request):RedirectResponse
    {
         // Validar los datos de entrada
        $validated = $request->validated();
        $business = Negocio::where('user_id', auth()->id())->first();
       // dd($validated);
        // Manejar la subida de logo
        if ($request->hasFile('logo')) {
            // Eliminar logo anterior si existe
            if ($business && $business->logo) {
                Storage::disk('public')->delete($business->logo);
            }
            
            // Guardar nuevo logo
            $validated['logo'] = $request->file('logo')->store('business-logos', 'public');
        }
        // dd($validated);
        // Actualizar o crear
        Negocio::updateOrCreate(
            ['user_id' => auth()->id()],
            [
                'nombre' => $validated['nombre'],
                'correo' => $validated['correo'],
                'telefono' => $validated['telefono'],
                'logo' => $validated['logo'] ?? $business?->logo,
                'activo' => true,
                'descripcion' => $validated['descripcion'] ?? $business?->description,
            ]
        );

        return to_route('settings.business');
    }

    public function updateImage(Request $request): RedirectResponse
    {
        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
        ]);

        $business = Negocio::where('user_id', auth()->id())->firstOrFail();

        if ($request->hasFile('logo')) {
            // Eliminar logo anterior si existe
            if ($business->logo) {
                Storage::disk('public')->delete($business->logo);
            }

            // Guardar nuevo logo
            $business->logo = $request->file('logo')->store('business-logos', 'public');
            $business->save();
        }

        return to_route('settings.business')->with('success', 'Logo actualizado correctamente');
    }
}
