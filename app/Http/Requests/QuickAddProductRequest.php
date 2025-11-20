<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class QuickAddProductRequest extends FormRequest
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
        $negocioId = optional($this->user()->negocio()->first())->id;

        return [
            'sku_base' => [
                'nullable',
                'string',
                'max:64',
                function ($attribute, $value, $fail) use ($negocioId) {
                    if ($value && trim($value) !== '') {
                        $exists = \App\Models\ProductBase::where('sku_base', $value)
                            ->where('origin_negocio_id', $negocioId)
                            ->exists();
                        if ($exists) {
                            $fail('El SKU ya existe en tu negocio.');
                        }
                    }
                },
            ],
            'name' => ['required', 'string', 'max:255'],
            'brand_id' => ['required', 'exists:brands,id'],
            'category_id' => ['required', 'exists:categories,id'],
            'uom_id' => ['required', 'exists:units,id'],
            'tax_code' => ['nullable', 'string', 'max:64'],
            'specs_json' => ['nullable', 'array'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'sale_type' => ['required', 'string', 'in:' . implode(',', \App\Models\ProductBaseBranch::SALE_TYPES)],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'El nombre del producto es obligatorio.',
            'brand_id.required' => 'Debes seleccionar una marca.',
            'category_id.required' => 'Debes seleccionar una categoría.',
            'uom_id.required' => 'Debes seleccionar una unidad de medida.',
            'price.required' => 'El precio es obligatorio.',
            'price.min' => 'El precio debe ser mayor o igual a 0.',
            'stock.required' => 'El stock es obligatorio.',
            'stock.min' => 'El stock debe ser mayor o igual a 0.',
            'sale_type.required' => 'El tipo de venta es obligatorio.',
            'sale_type.in' => 'El tipo de venta seleccionado no es válido.',
        ];
    }
}
