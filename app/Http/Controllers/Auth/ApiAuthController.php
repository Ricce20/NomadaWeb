<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class ApiAuthController extends Controller
{
    //login
    public function login(Request $request){
        //se requiere un email o username y su password en el cuerpo de la solucitud
        $validated = $request->validate([
            'username' => 'nullable|string|max:30',
            'email' => 'nullable|string|max:100|email',
            'password' => 'required|string|max:255'
        ]);

        // Verificar que al menos email o username esté presente
        if(empty($validated['email']) && empty($validated['username'])){
            return response()->json([
                'error' => 'Se requiere un username o email para poder iniciar sesión'
            ], 401);
        }

        $query = User::query();

        // Si se proporciona email
        if(!empty($validated['email'])){
            $query->where('email', $validated['email']);
        }
        // Si se proporciona username
        elseif(!empty($validated['username'])){
            $query->where('username', $validated['username']);
        }

        $user = $query->first();
        if(!$user){
            return response()->json([
                'error' => 'Credenciales invalidas'
            ], 401);
        }

        //NO HACEPTA OTRO TIPO DE USUARIO QUE NO SEAN ESTOS DOS DE ABAJO!!
        if(!in_array($user->type, ['driver', 'client'])){
            return response()->json([
                'error' => 'Usuario no autorizado'
            ], 401);
        }

        // Verificar si el usuario existe y la contraseña es correcta
        if(!$user || !Hash::check($validated['password'], $user->password)){
            return response()->json([
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        // En tu controlador de login
        if($user->type === 'driver'){
            $sucursal = $user->sucursales()->first();
            
            if($sucursal) {
                $user->sucursal = [
                    'id' => $sucursal->id,
                    'nombre' =>  $sucursal->nombre,
                    'negocio_id' => $sucursal->negocio_id
                ];
            }
        }

        // Crear token
        $token = $user->createToken('mobile-token')->plainTextToken;

        return response()->json([
            'message' => 'Bienvenido -'.$user->name,
            'token'   => $token,
            'user'    => $user
        ], 200);
    }

    //register
    public function registerClient(Request $request){
    try {
        $validated = $request->validate([
            'email' => 'required|string|max:255|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'required|string|max:12|unique:users',
            'name' => 'required|string|max:100'
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'],
            'type' => 'client' // Cambié de 'driver' a 'client' según el nombre de la función
        ]);

        $token = $user->createToken('mobile-token')->plainTextToken;

        return response()->json([
            'message' => 'Usuario registrado exitosamente',
            'user' => $user,
            'token' => $token
        ], 201);

    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'message' => 'Error de validación',
            'errors' => $e->errors()
        ], 422);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Error al registrar usuario',
            'error' => $e->getMessage()
        ], 500);
    }
}

    public function logout(Request $request) {
        try {
            // Verificar si el usuario está autenticado
            if (!$request->user()) {
                return response()->json([
                    'message' => 'No autenticado'
                ], 401);
            }

            // Eliminar el token actual
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'message' => 'Sesión cerrada exitosamente'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al cerrar sesión',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}