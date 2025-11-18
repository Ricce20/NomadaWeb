<?php

namespace App\Services;

use Illuminate\Support\Str;

class SkuGenerator
{
    public static function make(?int $negocioId, string $name): string
    {
        $slug = Str::slug(Str::limit($name, 32, ''));
        $rand = Str::upper(Str::random(4));
        $prefix = $negocioId ? "NEG{$negocioId}" : "NEG";
        return "{$prefix}-{$slug}-{$rand}";
    }
}
