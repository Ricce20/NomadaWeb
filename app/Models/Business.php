<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Business extends Model
{
    public function branches()
    {
        return $this->hasMany(Branch::class);
    }
}
