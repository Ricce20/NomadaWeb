<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use App\Models\User;
class ApiProfileClientController extends Controller
{
    /**
     * Obtener perfil del usuario autenticado
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getProfile(Request $request)
    {
        try {
            $user = $request->user();
            
            return response()->json([
                'success' => true,
                'message' => 'Perfil obtenido correctamente',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone ?? null,
                    'created_at' => $user->created_at,
                ]
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el perfil',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar email del usuario
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function updateEmail(Request $request)
    {
        try {
            // Validación
            $validator = Validator::make($request->all(), [
                'email' => 'required|email|unique:users,email,' . $request->user()->id
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Actualizar email
            $user = $request->user();
            $user->email = $request->email;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Email actualizado correctamente',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone ?? null,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el email',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar teléfono del usuario
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function updatePhone(Request $request)
    {
        try {
            // Validación
            $validator = Validator::make($request->all(), [
                'phone' => 'required|string|min:10|max:15'
            ]);

            if(User::where('phone',$request->phone)->whereNot('id',$request->user()->id)->exists()){
                return response()->json([
                    'success' => false,
                    'message' => 'Este numero ya esta en uso',
                ], 422);
            }

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Actualizar teléfono
            $user = $request->user();
            $user->phone = $request->phone;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Teléfono actualizado correctamente',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el teléfono',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cambiar contraseña del usuario
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function updatePassword(Request $request)
    {
        try {
            // Validación
            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:6|different:current_password',
                'new_password_confirmation' => 'required|same:new_password'
            ], [
                'current_password.required' => 'La contraseña actual es requerida',
                'new_password.required' => 'La nueva contraseña es requerida',
                'new_password.min' => 'La nueva contraseña debe tener al menos 6 caracteres',
                'new_password.different' => 'La nueva contraseña debe ser diferente a la actual',
                'new_password_confirmation.same' => 'Las contraseñas no coinciden'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = $request->user();

            // Verificar que la contraseña actual sea correcta
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La contraseña actual no es correcta',
                ], 401);
            }

            // Actualizar contraseña
            $user->password = Hash::make($request->new_password);
            $user->save();

            // Opcional: Revocar todos los tokens excepto el actual
            // $user->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Contraseña actualizada correctamente',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar la contraseña',
                'error' => $e->getMessage()
            ], 500);
        }
    }

}
