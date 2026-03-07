<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware para autenticar llamadas internas desde microservicios
 *
 * Valida que las peticiones provengan de servicios internos confiables
 * mediante Bearer token y header especial X-Internal-Service
 */
class InternalService
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Obtener el token de autenticación desde el header Authorization
        $token = $request->bearerToken();

        // Obtener el header que identifica al servicio interno
        $internalServiceHeader = $request->header('X-Internal-Service');

        // Obtener el token esperado desde las variables de entorno
        $expectedToken = env('INTERNAL_API_TOKEN');

        // Validar que exista el token
        if (empty($token)) {
            return response()->json([
                'status' => 'error',
                'code' => 'MISSING_TOKEN',
                'message' => 'Bearer token is required for internal service calls',
            ], 401);
        }

        // Validar que el header X-Internal-Service esté presente
        if (empty($internalServiceHeader)) {
            return response()->json([
                'status' => 'error',
                'code' => 'MISSING_INTERNAL_HEADER',
                'message' => 'X-Internal-Service header is required',
            ], 401);
        }

        // Validar que el token coincida con el token interno esperado
        if (empty($expectedToken) || !hash_equals($expectedToken, $token)) {
            return response()->json([
                'status' => 'error',
                'code' => 'INVALID_TOKEN',
                'message' => 'Invalid authentication token for internal service',
            ], 403);
        }

        // Validar que el servicio interno sea conocido (ms-wscrap, ms-sso, etc.)
        $allowedServices = array_filter(array_map('trim', explode(',', (string) env('INTERNAL_API_ALLOWED_SERVICES', 'ms-wscrap,ms-sso,desktop-app,ops-cli'))));
        if (!in_array($internalServiceHeader, $allowedServices)) {
            return response()->json([
                'status' => 'error',
                'code' => 'UNKNOWN_SERVICE',
                'message' => 'Unknown internal service: ' . $internalServiceHeader,
            ], 403);
        }

        return $next($request);
    }
}
