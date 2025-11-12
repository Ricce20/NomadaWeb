<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\ProductBase;
use App\Models\ProductBarcode;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Unit;

class FerreteriaProductBaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Detectar nombre de columna de unidad en product_bases
        $unitColumn = null;
        if (Schema::hasColumn('product_bases', 'unit_id')) {
            $unitColumn = 'unit_id';
        } elseif (Schema::hasColumn('product_bases', 'uom_id')) {
            $unitColumn = 'uom_id';
        } else {
            throw new \RuntimeException("product_bases no tiene ni 'unit_id' ni 'uom_id'. Verifica migraciones.");
        }
        // Categorías (name + slug)
        $categorias = [
            'Herramientas',
            'Materiales',
            'Ferretería',
        ];
        $categoriasIds = [];
        foreach ($categorias as $nombre) {
            $slug = Str::slug($nombre);
            $cat = Category::firstOrCreate([
                'slug' => $slug,
            ], [
                'name' => $nombre,
                'description' => null,
                'is_active' => true,
            ]);
            $categoriasIds[$nombre] = $cat->id;
        }

        // Unidades (name + abbreviation + symbol)
        $unidades = [
            ['name' => 'Kilogramo', 'abbreviation' => 'kg', 'symbol' => 'kg'],
            ['name' => 'Pieza',     'abbreviation' => 'pz', 'symbol' => null],
            ['name' => 'Litro',     'abbreviation' => 'L',  'symbol' => 'L'],
            ['name' => 'Metro',     'abbreviation' => 'm',  'symbol' => 'm'],
        ];
        $unidadesIds = [];
        foreach ($unidades as $u) {
            $unit = Unit::firstOrCreate([
                'abbreviation' => $u['abbreviation'],
            ], [
                'name' => $u['name'],
                'symbol' => $u['symbol'],
                'is_active' => true,
            ]);
            $unidadesIds[$u['abbreviation']] = $unit->id;
        }

        // Marca genérica (name + slug)
        $brand = Brand::firstOrCreate([
            'slug' => 'generica',
        ], [
            'name' => 'Genérica',
            'description' => null,
        ]);
        $brandId = $brand->id;

        // Productos base de ferretería/construcción
        $productos = [
            ['name' => 'Cemento gris 50kg',        'descripcion' => 'Saco de cemento para construcción', 'categoria' => 'Materiales',   'unidad' => 'kg'],
            ['name' => 'Tornillos galvanizados 1"','descripcion' => 'Tornillos para madera/metal',      'categoria' => 'Ferretería',  'unidad' => 'pz'],
            ['name' => 'Pegamento blanco 1L',      'descripcion' => 'Adhesivo multiusos',                'categoria' => 'Ferretería',  'unidad' => 'L'],
            ['name' => 'Martillo carpintero',      'descripcion' => 'Martillo de uña',                   'categoria' => 'Herramientas','unidad' => 'pz'],
            ['name' => 'Taladro eléctrico',        'descripcion' => 'Taladro de impacto',                'categoria' => 'Herramientas','unidad' => 'pz'],
            ['name' => 'Brocha 2"',                'descripcion' => 'Brocha para pintura',                'categoria' => 'Herramientas','unidad' => 'pz'],
            ['name' => 'Lija grano 120',           'descripcion' => 'Lija para madera y metal',          'categoria' => 'Herramientas','unidad' => 'pz'],
            ['name' => 'Tubo PVC 1m',              'descripcion' => 'Tubo de PVC para instalaciones',    'categoria' => 'Ferretería',  'unidad' => 'm'],
            ['name' => 'Cinta métrica 5m',         'descripcion' => 'Cinta retráctil de 5 metros',       'categoria' => 'Herramientas','unidad' => 'pz'],
            ['name' => 'Nivel de burbuja',         'descripcion' => 'Nivel manual',                       'categoria' => 'Herramientas','unidad' => 'pz'],
        ];

        foreach ($productos as $i => $p) {
            $pb = ProductBase::where('name', $p['name'])->first();
            if (!$pb) {
                $pb = new ProductBase();
                $pb->name = $p['name'];
                $pb->description = $p['descripcion'];
                $pb->brand_id = $brandId;
                $pb->category_id = $categoriasIds[$p['categoria']];
                // Usar columna detectada dinámicamente
                $pb->{$unitColumn} = $unidadesIds[$p['unidad']];
                $pb->status = true;
                $pb->save();
            }

            // Agregar algunos códigos de barras (simples 13-dígitos)
            $barcodes = [
                str_pad((string)(750000000000 + $i + 1), 13, '0', STR_PAD_LEFT),
                str_pad((string)(750000000100 + $i + 1), 13, '0', STR_PAD_LEFT),
            ];

            foreach ($barcodes as $code) {
                $exists = ProductBarcode::where('product_base_id', $pb->id)
                    ->where('barcode', $code)
                    ->exists();
                if (!$exists) {
                    $barcode = new ProductBarcode();
                    $barcode->product_base_id = $pb->id;
                    $barcode->barcode = $code;
                    $barcode->type = 'EAN13';
                    $barcode->save();
                }
            }
        }
    }
}