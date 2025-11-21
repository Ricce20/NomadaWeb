<?php

namespace App\Http\Requests\Ownership;

use Illuminate\Foundation\Http\FormRequest;

class StoreInventoryMovementRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // La autorización se maneja en el controlador/middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'product_base_branch_id' => ['required', 'integer', 'exists:product_base_branch,id'],
            'type' => ['required', 'string', 'in:in,adjust'],
            'quantity' => ['required', 'integer', 'min:1'],
            'reason' => ['nullable', 'string', 'max:500'],
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
            'warehouse_id.required' => 'Debe seleccionar un almacén.',
            'warehouse_id.exists' => 'El almacén seleccionado no existe.',
            'product_base_branch_id.required' => 'Debe seleccionar un producto.',
            'product_base_branch_id.exists' => 'El producto seleccionado no existe.',
            'type.required' => 'Debe seleccionar el tipo de movimiento.',
            'type.in' => 'El tipo de movimiento debe ser Entrada o Ajuste.',
            'quantity.required' => 'La cantidad es obligatoria.',
            'quantity.integer' => 'La cantidad debe ser un número entero.',
            'quantity.min' => 'La cantidad debe ser al menos 1.',
            'reason.max' => 'El motivo no puede exceder 500 caracteres.',
        ];
    }
}
