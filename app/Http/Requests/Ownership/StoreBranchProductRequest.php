<?php

namespace App\Http\Requests\Ownership;

use App\Models\ProductBase;
use App\Models\ProductBaseBranch;
use Illuminate\Foundation\Http\FormRequest;

class StoreBranchProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $sucursal = $this->route('sucursal');
        return $sucursal && $this->user()->can('manage', $sucursal);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $sucursalId = $this->route('sucursal')->id;

        return [
            'product_base_id' => [
                'required',
                'integer',
                'exists:product_bases,id,deleted_at,NULL,is_active,1',
                function ($attribute, $value, $fail) use ($sucursalId) {
                    // Verificar unicidad (producto + sucursal)
                    $exists = ProductBaseBranch::where('product_base_id', $value)
                        ->where('branch_id', $sucursalId)
                        ->exists();

                    if ($exists) {
                        $fail('Este producto ya está registrado en esta sucursal.');
                    }
                }
            ],
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'sale_type' => ['required', 'string', 'in:' . implode(',', ProductBaseBranch::SALE_TYPES)],
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
            'product_base_id.required' => 'Debe seleccionar un producto.',
            'product_base_id.exists' => 'El producto seleccionado no existe.',
            'price.required' => 'El precio es obligatorio.',
            'price.numeric' => 'El precio debe ser un número.',
            'price.min' => 'El precio no puede ser negativo.',
            'stock.integer' => 'El stock debe ser un número entero.',
            'stock.min' => 'El stock no puede ser negativo.',
            'sale_type.required' => 'El tipo de venta es obligatorio.',
            'sale_type.in' => 'El tipo de venta seleccionado no es válido.',
        ];
    }
}
