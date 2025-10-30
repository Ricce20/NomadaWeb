<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
            'canRegister' => Route::has('register'),
            'defaultLoginMethod' => $request->session()->get('login.method', 'email'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        try {
            $user = $request->validateCredentials();

            // Verificar autenticación de dos factores si está habilitada
            if (Features::enabled(Features::twoFactorAuthentication()) && $user->hasEnabledTwoFactorAuthentication()) {
                $request->session()->put([
                    'login.id' => $user->getKey(),
                    'login.remember' => $request->boolean('remember'),
                ]);

                return to_route('two-factor.login');
            }

            // Realizar el login
            Auth::login($user, $request->boolean('remember'));
            $request->session()->regenerate();
            
            // Guardar el método de inicio de sesión preferido
            $request->session()->put('login.method', $request->input('loginMethod', 'email'));

            // Almacenar el método de inicio de sesión utilizado para futuros inicios de sesión
            $request->session()->put('preferred_login_method', $request->has('email') ? 'email' : 'username');

            // Redirigir al dashboard correspondiente según el tipo de usuario
            return redirect()->intended(route(Auth::user()->getDashboardRouteName(), absolute: false));

        } catch (\Illuminate\Validation\ValidationException $e) {
            // Agregar el campo correcto al mensaje de error según el método de inicio de sesión
            $field = $request->has('email') ? 'email' : 'username';
            throw \Illuminate\Validation\ValidationException::withMessages([
                $field => [trans('auth.failed')],
            ]);
        }
        
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
