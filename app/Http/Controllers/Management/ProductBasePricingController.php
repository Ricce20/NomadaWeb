<?php

namespace App\Http\Controllers\Management;

use App\Http\Controllers\Controller;
use App\Models\ProductBase;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class ProductBasePricingController extends Controller
{
    public function store(ProductBase $product, Request $r)
    {
        $data = $r->validate([
            'branch_id'        => ['required','exists:branches,id'],
            'price'            => ['required','numeric','min:0'],
            'cost'             => ['nullable','numeric','min:0'],
            'tax_rate'         => ['nullable','numeric','min:0','max:100'],
            'status'           => ['required','in:listed,hidden,archived'],
            'min_stock'        => ['nullable','integer','min:0'],
            'max_stock'        => ['nullable','integer','min:0'],
            'reorder_point'    => ['nullable','integer','min:0'],
            'barcode_override' => ['nullable','string','max:64'],
            'note'             => ['nullable','string','max:255'],
        ]);

        $product->branches()->syncWithoutDetaching([
            $data['branch_id'] => Arr::except($data, ['branch_id']),
        ]);

        return back()->with('ok','Precio asignado');
    }

    public function update(ProductBase $product, $id, Request $r)
    {
        $data = $r->validate([
            'price'            => ['required','numeric','min:0'],
            'cost'             => ['nullable','numeric','min:0'],
            'tax_rate'         => ['nullable','numeric','min:0','max:100'],
            'status'           => ['required','in:listed,hidden,archived'],
            'min_stock'        => ['nullable','integer','min:0'],
            'max_stock'        => ['nullable','integer','min:0'],
            'reorder_point'    => ['nullable','integer','min:0'],
            'barcode_override' => ['nullable','string','max:64'],
            'note'             => ['nullable','string','max:255'],
        ]);

        DB::table('branch_product_base')->where('id', $id)->update($data);

        return back()->with('ok','Precio actualizado');
    }

    public function destroy(ProductBase $product, $id)
    {
        DB::table('branch_product_base')->where('id', $id)->delete();

        return back()->with('ok','Precio eliminado');
    }
}