<?php

namespace App\Providers;

use App\Models\Sucursal;
use App\Policies\SucursalPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AppServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Sucursal::class => SucursalPolicy::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register policies
        Gate::policy(Sucursal::class, SucursalPolicy::class);

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(25)->by($request->user()?->id ?: $request->ip())
            ->response(function (Request $request,array $headers) {
                        // Respuesta directa y limpia para la API
                        return response()->json(['message' => 'muchos intentos solicitados, espera para volver a intentar'],429);
                    });
        });
        RateLimiter::for('api-login', function (Request $request) {
                return Limit::perMinute(10)->by($request->input('email')?:$request->ip())
                    ->response(function (Request $request,array $headers) {
                        // Respuesta directa y limpia para la API
                        return response()->json(['message' => 'muchos intentos solicitados, espera para volver a intentar'],429);
                    });
        });
    }
}
