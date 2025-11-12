<?php

namespace App\Http\Requests\Management;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\User;
use Illuminate\Validation\Rule;

class StoreUpdateProductBaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Permitir temporalmente a propietarios (owner) gestionar Product Base
        // También mantener acceso para super_admin si existe
        return $this->user() instanceof User
            && in_array($this->user()->type, [User::TYPE_OWNER, User::TYPE_SUPER_ADMIN], true);
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