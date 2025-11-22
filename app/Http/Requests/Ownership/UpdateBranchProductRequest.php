<?php

namespace App\Http\Requests\Ownership;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBranchProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var \App\Models\Sucursal $sucursal */
        $sucursal = $this->route('sucursal');
        
        if (!$sucursal) {
            return false;
        }

        // Solo se permite editar precio y tipo de venta (stock se maneja desde inventario)
        return $this->user()->can('manage', $sucursal);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'price' => ['sometimes', 'numeric', 'min:0'],
            // NOTA: 'stock' eliminado - ahora se maneja automáticamente desde inventario por almacén
            'sale_type' => ['sometimes', 'string', 'in:' . implode(',', \App\Models\ProductBaseBranch::SALE_TYPES)],
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
            'price.required' => 'El precio es obligatorio.',
            'price.numeric' => 'El precio debe ser un número.',
            'price.min' => 'El precio no puede ser negativo.',
            'stock.integer' => 'El stock debe ser un número entero.',
            'stock.min' => 'El stock no puede ser negativo.',
            'sale_type.in' => 'El tipo de venta seleccionado no es válido.',
        ];
    }
}
