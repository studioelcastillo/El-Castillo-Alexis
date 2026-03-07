<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Controlador para gestionar errores de scraper
 *
 * Proporciona endpoints para consultar el estado de errores de scraping
 * de las cuentas de modelos
 */
class ScraperErrorController extends Controller
{
    /**
     * Obtiene un resumen de usuarios con errores de scraping
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUsersWithErrors(Request $request)
    {
        try {
            // Parámetros de consulta
            $failThreshold = $request->input('fail_threshold', 1); // Mínimo de errores para considerar
            $hoursSinceLastSuccess = $request->input('hours_since_success', 24); // Horas desde último éxito

            // Query para obtener usuarios con errores de scraper
            $usersWithErrors = DB::table('users as u')
                ->select([
                    'u.user_id',
                    'u.user_name',
                    'u.user_surname',
                    'u.user_image',
                    DB::raw('COUNT(DISTINCT ma.modacc_id) as total_accounts'),
                    DB::raw('COUNT(DISTINCT CASE WHEN ma.modacc_fail_count >= ' . $failThreshold . ' THEN ma.modacc_id END) as accounts_with_errors'),
                    DB::raw('SUM(ma.modacc_fail_count) as total_fail_count'),
                    DB::raw('MAX(ma.modacc_fail_count) as max_fail_count'),
                    DB::raw('MAX(ma.modacc_last_search_at) as last_search_at'),
                    DB::raw('MAX(ma.modacc_last_result_at) as last_result_at'),
                    // Obtener un sample de mensajes de error (el más reciente)
                    DB::raw('(
                        SELECT modacc_fail_message
                        FROM models_accounts
                        WHERE stdmod_id IN (
                            SELECT stdmod_id
                            FROM studios_models
                            WHERE user_id_model = u.user_id
                            AND deleted_at IS NULL
                        )
                        AND modacc_fail_count > 0
                        AND modacc_fail_message IS NOT NULL
                        AND deleted_at IS NULL
                        ORDER BY modacc_last_search_at DESC
                        LIMIT 1
                    ) as sample_error_message')
                ])
                ->join('studios_models as sm', 'sm.user_id_model', '=', 'u.user_id')
                ->join('models_accounts as ma', 'ma.stdmod_id', '=', 'sm.stdmod_id')
                ->where('u.prof_id', '=', 4) // Solo modelos (perfil 4)
                ->whereNull('u.deleted_at')
                ->whereNull('sm.deleted_at')
                ->whereNull('ma.deleted_at')
                ->where('ma.modacc_active', true)
                ->where('ma.modacc_fail_count', '>=', $failThreshold)
                ->groupBy('u.user_id', 'u.user_name', 'u.user_surname', 'u.user_image')
                ->having('accounts_with_errors', '>', 0)
                ->orderBy('total_fail_count', 'DESC')
                ->get();

            // Formatear respuesta
            $response = [
                'status' => 'success',
                'data' => [
                    'users_with_errors' => $usersWithErrors->map(function ($user) {
                        return [
                            'user_id' => $user->user_id,
                            'user_name' => $user->user_name,
                            'user_surname' => $user->user_surname,
                            'user_image' => $user->user_image,
                            'total_accounts' => (int) $user->total_accounts,
                            'accounts_with_errors' => (int) $user->accounts_with_errors,
                            'total_fail_count' => (int) $user->total_fail_count,
                            'max_fail_count' => (int) $user->max_fail_count,
                            'last_search_at' => $user->last_search_at,
                            'last_result_at' => $user->last_result_at,
                            'sample_error_message' => $user->sample_error_message ? json_decode($user->sample_error_message, true) : null,
                            'error_severity' => $this->calculateErrorSeverity(
                                (int) $user->accounts_with_errors,
                                (int) $user->total_accounts,
                                (int) $user->max_fail_count
                            )
                        ];
                    }),
                    'summary' => [
                        'total_users_with_errors' => $usersWithErrors->count(),
                        'total_accounts_with_errors' => $usersWithErrors->sum('accounts_with_errors'),
                    ]
                ]
            ];

            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('Error fetching users with scraper errors: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener usuarios con errores de scraper',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtiene los errores de scraping para un usuario específico
     *
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserErrors($userId)
    {
        try {
            $userErrors = DB::table('models_accounts as ma')
                ->select([
                    'ma.modacc_id',
                    'ma.modacc_app',
                    'ma.modacc_username',
                    'ma.modacc_mail',
                    'ma.modacc_screen_name',
                    'ma.modacc_fail_count',
                    'ma.modacc_fail_message',
                    'ma.modacc_last_search_at',
                    'ma.modacc_last_result_at',
                    'ma.modacc_active',
                    'sm.stdmod_id',
                    'std.std_name'
                ])
                ->join('studios_models as sm', 'sm.stdmod_id', '=', 'ma.stdmod_id')
                ->join('studios as std', 'std.std_id', '=', 'sm.std_id')
                ->where('sm.user_id_model', $userId)
                ->whereNull('ma.deleted_at')
                ->whereNull('sm.deleted_at')
                ->where('ma.modacc_fail_count', '>', 0)
                ->orderBy('ma.modacc_fail_count', 'DESC')
                ->get();

            $response = [
                'status' => 'success',
                'data' => [
                    'user_id' => $userId,
                    'accounts_with_errors' => $userErrors->map(function ($account) {
                        return [
                            'modacc_id' => $account->modacc_id,
                            'platform' => $account->modacc_app,
                            'username' => $account->modacc_username,
                            'login_email' => $account->modacc_mail,
                            'screen_name' => $account->modacc_screen_name,
                            'studio_name' => $account->std_name,
                            'fail_count' => (int) $account->modacc_fail_count,
                            'fail_message' => $account->modacc_fail_message ? json_decode($account->modacc_fail_message, true) : null,
                            'last_search_at' => $account->modacc_last_search_at,
                            'last_result_at' => $account->modacc_last_result_at,
                            'is_active' => (bool) $account->modacc_active,
                        ];
                    })
                ]
            ];

            return response()->json($response);

        } catch (\Exception $e) {
            Log::error("Error fetching errors for user {$userId}: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener errores del usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtiene un mapa rápido de user_id => tiene_errores
     * Útil para mostrar badges en listados
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getErrorsMap(Request $request)
    {
        try {
            $failThreshold = $request->input('fail_threshold', 1);

            // Query optimizada para obtener solo user_ids con errores
            $usersWithErrors = DB::table('users as u')
                ->select([
                    'u.user_id',
                    DB::raw('COUNT(DISTINCT CASE WHEN ma.modacc_fail_count >= ' . $failThreshold . ' THEN ma.modacc_id END) as error_count'),
                    DB::raw('SUM(ma.modacc_fail_count) as total_failures')
                ])
                ->join('studios_models as sm', 'sm.user_id_model', '=', 'u.user_id')
                ->join('models_accounts as ma', 'ma.stdmod_id', '=', 'sm.stdmod_id')
                ->where('u.prof_id', '=', 4)
                ->whereNull('u.deleted_at')
                ->whereNull('sm.deleted_at')
                ->whereNull('ma.deleted_at')
                ->where('ma.modacc_active', true)
                ->where('ma.modacc_fail_count', '>=', $failThreshold)
                ->groupBy('u.user_id')
                ->get();

            // Crear un mapa user_id => error_info
            $errorsMap = [];
            foreach ($usersWithErrors as $user) {
                $errorsMap[$user->user_id] = [
                    'has_errors' => true,
                    'error_count' => (int) $user->error_count,
                    'total_failures' => (int) $user->total_failures,
                    'severity' => $this->getSeverityLevel((int) $user->total_failures)
                ];
            }

            return response()->json([
                'status' => 'success',
                'data' => $errorsMap
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching errors map: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error al obtener mapa de errores',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calcula la severidad del error basado en métricas
     *
     * @param int $accountsWithErrors
     * @param int $totalAccounts
     * @param int $maxFailCount
     * @return string low|medium|high|critical
     */
    private function calculateErrorSeverity($accountsWithErrors, $totalAccounts, $maxFailCount)
    {
        $errorRate = $totalAccounts > 0 ? ($accountsWithErrors / $totalAccounts) : 0;

        // Crítico: Más del 75% de cuentas con error O más de 100 fallos consecutivos
        if ($errorRate > 0.75 || $maxFailCount > 100) {
            return 'critical';
        }

        // Alto: Más del 50% de cuentas con error O más de 50 fallos
        if ($errorRate > 0.50 || $maxFailCount > 50) {
            return 'high';
        }

        // Medio: Más del 25% de cuentas con error O más de 10 fallos
        if ($errorRate > 0.25 || $maxFailCount > 10) {
            return 'medium';
        }

        // Bajo: Cualquier otro caso con errores
        return 'low';
    }

    /**
     * Determina el nivel de severidad basado en total de fallos
     *
     * @param int $totalFailures
     * @return string
     */
    private function getSeverityLevel($totalFailures)
    {
        if ($totalFailures > 100) return 'critical';
        if ($totalFailures > 50) return 'high';
        if ($totalFailures > 10) return 'medium';
        return 'low';
    }
}
