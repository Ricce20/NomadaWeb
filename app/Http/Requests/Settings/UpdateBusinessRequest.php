<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

use App\Models\Negocio;
use Illuminate\Validation\Rule;

class UpdateBusinessRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Obtener el negocio del usuario actual si existe
        $business = Negocio::where('user_id', auth()->id())->first();

       return [
        'nombre' => ['required', 'string', 'max:255'],
        'correo' => [
            'required',
            'string',
            'email',
            'lowercase',
            'max:255',
            Rule::unique('negocios', 'correo')->ignore($business->id ?? null),
        ],
        'telefono' => ['required', 'string', 'max:15'],
        'logo' => ['nullable', 'image', 'max:2048'], // Máximo 2MB
        'descripcion' => ['nullable', 'string', 'max:1000'],
    ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre del negocio es obligatorio.',
            'correo.required' => 'El correo general es obligatorio.',
            'correo.email' => 'El correo debe ser una dirección válida.',
            'correo.unique' => 'Este correo ya está registrado para otro negocio.',
            'telefono.required' => 'El teléfono es obligatorio.',
            'telefono.max' => 'El teléfono no debe exceder 15 caracteres.',
            'logo.image' => 'El archivo debe ser una imagen.',
            'logo.max' => 'El logo no debe exceder 2MB.',
        ];
    }
}
