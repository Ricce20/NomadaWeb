<?php

namespace App\Http\Requests\Management;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\User;
use Illuminate\Validation\Rule;

class StoreUpdateProductBaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Solo super_admin puede gestionar ProductBase en management
        return $this->user() instanceof User
            && $this->user()->type === User::TYPE_SUPER_ADMIN;
    }

    public function rules(): array
    {
        $ignoreId = optional($this->route('product_base'))->id;

        return [
            'sku_base'    => [
                'required', 'string', 'max:64',
                Rule::unique('product_bases', 'sku_base')->ignore($ignoreId)
            ],
            'name'        => ['required', 'string', 'max:180'],
            'brand_id'    => ['nullable', 'exists:brands,id'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'uom_id'      => ['nullable', 'exists:units,id'],
            'tax_code'    => ['nullable', 'string', 'max:32'],
            'specs_json'  => ['nullable', 'array'],
            'is_active'   => ['boolean'],

            'barcodes'    => ['nullable', 'array'],
            'images'      => ['nullable', 'array'],
            'images.*'    => ['file', 'image', 'max:2048'],
        ];
    }
}