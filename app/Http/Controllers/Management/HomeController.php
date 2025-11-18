<?php

namespace App\Http\Controllers\Management;

use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController
{
    public function index()
    {
        return Inertia::render('management');
    }
}