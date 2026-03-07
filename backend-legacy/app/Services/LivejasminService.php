<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use App\Models\LivejasminBonusType;
use App\Models\ModelLivejasminScore;

class LivejasminService
{
    /**
     * Get the current LiveJasmin period
     * Returns the current month's start and end dates
     *
     * @return array|null
     */
    public function getCurrentPeriod()
    {
        try {
            $apiUrl = env('LIVEJASMIN_API_URL');

            if (!$apiUrl) {
                Log::error('LIVEJASMIN_API_URL environment variable is not set');
                return null;
            }

            Log::info('Requesting current period from LiveJasmin API', [
                'url' => $apiUrl . '/api/v1/period/current'
            ]);

            $response = Http::timeout(30)->get($apiUrl . '/api/v1/period/current');

            Log::info('LiveJasmin API response', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            if ($response->successful()) {
                $data = $response->json();

                if (isset($data['success']) && $data['success'] && isset($data['data'])) {
                    $result = [
                        'start_date' => $data['data']['start_date'],
                        'end_date' => $data['data']['end_date']
                    ];

                    Log::info('Successfully parsed current period', $result);
                    return $result;
                } else {
                    Log::error('Invalid response structure from LiveJasmin API', [
                        'response_data' => $data
                    ]);
                }
            }

            Log::error('Failed to get current period from LiveJasmin API', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            return null;
        } catch (\Exception $e) {
            Log::error('Error getting current LiveJasmin period: ' . $e->getMessage(), [
                'exception' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    /**
     * Get LiveJasmin periods from the microservice
     *
     * @param string|null $fromDate
     * @param string|null $toDate
     * @return array
     */
    public function getPeriods($fromDate = null, $toDate = null)
    {
        try {
            $apiUrl = env('LIVEJASMIN_API_URL');

            if (!$apiUrl) {
                Log::error('LIVEJASMIN_API_URL environment variable is not set');
                return [];
            }

            // Si no se proporcionan fechas, usar el período actual para evitar traer todos los períodos
            if (!$fromDate || !$toDate) {
                $currentPeriod = $this->getCurrentPeriod();

                if (!$currentPeriod) {
                    Log::error('Could not get current period to filter periods request');
                    return [];
                }

                // Validar que el período actual tenga la estructura esperada
                if (!isset($currentPeriod['start_date']) || !isset($currentPeriod['end_date'])) {
                    Log::error('Current period does not have expected structure', [
                        'current_period' => $currentPeriod
                    ]);
                    return [];
                }

                $fromDate = $currentPeriod['start_date'];
                $toDate = $currentPeriod['end_date'];

                Log::info('Using current period for getPeriods', [
                    'fromDate' => $fromDate,
                    'toDate' => $toDate
                ]);
            }

            $params = [];
            if ($fromDate) $params['fromDate'] = $fromDate;
            if ($toDate) $params['toDate'] = $toDate;

            $response = Http::timeout(60)->get($apiUrl . '/api/v1/periods', $params);

            if ($response->successful()) {
                $data = $response->json();
                return $data['data'] ?? [];
            }

            Log::error('Failed to get periods from LiveJasmin API: ' . $response->body());
            return [];
        } catch (\Exception $e) {
            Log::error('Error getting LiveJasmin periods: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Update models performance (placeholder method)
     * This method should be implemented based on your API requirements
     *
     * @return array
     */
    public function updateModelsPerformance()
    {
        try {
            // Placeholder implementation
            // This should be replaced with actual API calls to LiveJasmin
            return [
                'status' => 'success',
                'message' => 'Performance update completed',
                'updated_models' => 0
            ];
        } catch (\Exception $e) {
            Log::error('Error updating models performance: ' . $e->getMessage());
            return [
                'status' => 'error',
                'message' => 'Failed to update performance: ' . $e->getMessage(),
                'updated_models' => 0
            ];
        }
    }

    /**
     * Sync API data only for a specific period (no scraping)
     *
     * @param string $fromDate
     * @param string $toDate
     * @return array
     */
    public function syncApiForPeriod($fromDate, $toDate)
    {
        try {
            // Aumentar el timeout de PHP para este proceso largo
            $originalTimeLimit = ini_get('max_execution_time');
            ini_set('max_execution_time', 300); // 5 minutos

            Log::info('🕐 Increased PHP execution timeout', [
                'original_timeout' => $originalTimeLimit,
                'new_timeout' => 300
            ]);

            $apiUrl = env('LIVEJASMIN_API_URL', 'https://liveapi-gold-line.bygeckode.com'); // Default to localhost if not found

            if (!$apiUrl) {
                return [
                    'success' => false,
                    'message' => 'LiveJasmin API URL not configured',
                    'updated_models' => 0
                ];
            }


            // Aumentar timeout HTTP a 3 minutos para operaciones largas
            $response = Http::timeout(180)->post($apiUrl . '/api/v1/sync/api', [
                'fromDate' => $fromDate,
                'toDate' => $toDate
            ]);


            if ($response->successful()) {
                $data = $response->json();

                $result = [
                    'success' => $data['success'] ?? true,
                    'message' => $data['message'] ?? 'API sync completed',
                    'updated_models' => $data['updated_models'] ?? 0
                ];

                // Si el sync fue exitoso, también poblar models_streams con los datos de LiveJasmin
                if ($result['success']) {

                    // Verificar que hay datos en models_livejasmin_scores antes de proceder
                    $scoresCount = DB::table('models_livejasmin_scores')
                        ->where('modlj_period_start', $fromDate)
                        ->where('modlj_period_end', $toDate)
                        ->count();

                    if ($scoresCount === 0) {
                        Log::warning('⚠️ No records found in models_livejasmin_scores for this period', [
                            'fromDate' => $fromDate,
                            'toDate' => $toDate,
                            'updated_models_from_sync' => $result['updated_models']
                        ]);
                    }

                    $modelStreamController = new \App\Http\Controllers\ModelStreamController();
                    $populateResult = $modelStreamController->populateStreamsFromLivejasminApi($fromDate, $toDate);

                    if ($populateResult) {
                        Log::info('✅ Successfully populated models_streams from LiveJasmin API data', [
                            'fromDate' => $fromDate,
                            'toDate' => $toDate
                        ]);
                        $result['message'] .= ' + Models_streams populated successfully';
                    } else {
                        Log::warning('❌ Failed to populate models_streams from LiveJasmin API data', [
                            'fromDate' => $fromDate,
                            'toDate' => $toDate,
                            'scores_available' => $scoresCount
                        ]);
                        $result['message'] .= ' + Warning: Models_streams population failed';
                    }
                } else {
                    Log::error('❌ API sync failed, skipping models_streams population', [
                        'fromDate' => $fromDate,
                        'toDate' => $toDate,
                        'sync_message' => $result['message']
                    ]);
                }

                // Restaurar timeout original de PHP
                ini_set('max_execution_time', $originalTimeLimit);

                return $result;
            }
            // Restaurar timeout original de PHP
            ini_set('max_execution_time', $originalTimeLimit);

            return [
                'success' => false,
                'message' => 'Failed to sync API data: ' . $response->body(),
                'updated_models' => 0
            ];
        } catch (\Exception $e) {
            // Restaurar timeout original de PHP en caso de error
            if (isset($originalTimeLimit)) {
                ini_set('max_execution_time', $originalTimeLimit);
                Log::info('🕐 Restored PHP execution timeout after error', [
                    'restored_timeout' => $originalTimeLimit
                ]);
            }

            // Verificar si es un error de timeout
            if (
                strpos($e->getMessage(), 'Maximum execution time') !== false ||
                strpos($e->getMessage(), 'cURL error 28') !== false
            ) {
                Log::error('⏰ TIMEOUT ERROR in API sync', [
                    'fromDate' => $fromDate,
                    'toDate' => $toDate,
                    'error_message' => $e->getMessage(),
                    'suggestion' => 'Consider increasing timeout or splitting the request'
                ]);

                return [
                    'success' => false,
                    'message' => 'Sync timeout: The operation took too long. Try with a smaller date range.',
                    'updated_models' => 0
                ];
            }

            Log::error('Error syncing API data for period: ' . $e->getMessage(), [
                'fromDate' => $fromDate,
                'toDate' => $toDate,
                'exception' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Error syncing API data: ' . $e->getMessage(),
                'updated_models' => 0
            ];
        }
    }

    /**
     * Get active bonus types with their criteria
     *
     * @return array
     */
    public function getActiveBonusTypes()
    {
        try {
            $bonusTypes = LivejasminBonusType::with('criteria')
                ->where('active', true)
                ->orderBy('order')
                ->get();

            return $bonusTypes->map(function ($bonusType) {
                return [
                    'id' => $bonusType->id,
                    'name' => $bonusType->name,
                    'description' => $bonusType->description,
                    'percentage' => $bonusType->percentage,
                    'target_profile' => $bonusType->target_profile,
                    'active' => $bonusType->active,
                    'qualifying' => false, // Will be calculated dynamically
                    'criteria' => $bonusType->criteria->map(function ($criteria) {
                        return [
                            'id' => $criteria->id,
                            'api_endpoint' => $criteria->api_endpoint,
                            'json_path' => $criteria->json_path,
                            'operator' => $criteria->operator,
                            'operator_symbol' => $criteria->operator_symbol,
                            'target_value' => $criteria->target_value,
                            'condition_type' => $criteria->condition_type,
                            'order' => $criteria->order,
                            'description' => $criteria->description,
                        ];
                    })->toArray()
                ];
            })->toArray();
        } catch (\Exception $e) {
            Log::error('Error getting active bonus types: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Calculate dynamic bonuses for a model using the microservice
     *
     * @param ModelLivejasminScore $score
     * @param string $modelUsername
     * @return array
     */
    public function calculateDynamicBonuses(ModelLivejasminScore $score, $modelUsername)
    {
        try {
            $apiUrl = env('LIVEJASMIN_API_URL');

            if (!$apiUrl) {
                Log::error('LIVEJASMIN_API_URL environment variable is not set');
                return [
                    'success' => false,
                    'message' => 'LiveJasmin API URL not configured',
                    'data' => null
                ];
            }

            // Get active bonus types
            $bonusTypes = $this->getActiveBonusTypes();

            if (empty($bonusTypes)) {
                Log::info('No active bonus types found for dynamic calculation');
                return [
                    'success' => true,
                    'message' => 'No active bonus types configured',
                    'data' => [
                        'legacy_bonuses' => [
                            'bonus_5_percent' => false,
                            'bonus_10_percent' => false
                        ],
                        'dynamic_bonuses' => [],
                        'total_bonus_percentage' => 0,
                        'total_bonus_amount' => 0,
                        'qualifying_bonuses_count' => 0
                    ]
                ];
            }

            // Prepare performance data
            $performanceData = [
                'hours_connection' => $score->modlj_hours_connection ?? 0,
                'hours_preview' => $score->modlj_hours_preview ?? 0,
                'hours_total_connection' => $score->modlj_hours_total_connection ?? 0,
                'hours_member_other' => $score->modlj_hours_member_other ?? 0,
                'score_traffic' => $score->modlj_score_traffic ?? 0,
                'score_conversion' => $score->modlj_score_conversion ?? 0,
                'score_engagement' => $score->modlj_score_engagement ?? 0,
                'offers_initiated' => $score->modlj_offers_initiated ?? 0,
                'new_members' => $score->modlj_new_members ?? 0,
                'hot_deals' => $score->modlj_hot_deals ?? 0,
                'average_hour' => $score->modlj_average_hour ?? 0,
                'earnings_usd' => $score->modlj_earnings_usd ?? 0,
                'earnings_private' => $score->modlj_earnings_private ?? 0,
                'earnings_vip_show' => $score->modlj_earnings_vip_show ?? 0,
                'earnings_video_voice_call' => $score->modlj_earnings_video_voice_call ?? 0,
                'earnings_cam2cam' => $score->modlj_earnings_cam2cam ?? 0,
                'earnings_surprise' => $score->modlj_earnings_surprise ?? 0,
                'earnings_message' => $score->modlj_earnings_message ?? 0,
                'earnings_interactive_toy' => $score->modlj_earnings_interactive_toy ?? 0,
                'earnings_bonus' => $score->modlj_earnings_bonus ?? 0,
                'earnings_other' => $score->modlj_earnings_other ?? 0,
                'earnings_my_content' => $score->modlj_earnings_my_content ?? 0,
            ];

            Log::info('Requesting dynamic bonus calculation from microservice', [
                'model_username' => $modelUsername,
                'bonus_types_count' => count($bonusTypes),
                'earnings_usd' => $performanceData['earnings_usd']
            ]);

            // Call microservice to calculate dynamic bonuses
            $response = Http::timeout(30)->post($apiUrl . '/api/v1/bonuses/calculate-dynamic', [
                'performanceData' => $performanceData,
                'bonusTypes' => $bonusTypes,
                'modelUsername' => $modelUsername
            ]);

            if ($response->successful()) {
                $data = $response->json();

                Log::info('Dynamic bonuses calculated successfully', [
                    'model_username' => $modelUsername,
                    'qualifying_bonuses' => $data['data']['qualifying_bonuses_count'] ?? 0,
                    'total_percentage' => $data['data']['total_bonus_percentage'] ?? 0
                ]);

                return [
                    'success' => true,
                    'message' => 'Dynamic bonuses calculated successfully',
                    'data' => $data['data'] ?? null
                ];
            }

            Log::error('Failed to calculate dynamic bonuses', [
                'status' => $response->status(),
                'body' => $response->body(),
                'model_username' => $modelUsername
            ]);

            return [
                'success' => false,
                'message' => 'Failed to calculate dynamic bonuses: ' . $response->body(),
                'data' => null
            ];
        } catch (\Exception $e) {
            Log::error('Error calculating dynamic bonuses: ' . $e->getMessage(), [
                'model_username' => $modelUsername,
                'exception' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Error calculating dynamic bonuses: ' . $e->getMessage(),
                'data' => null
            ];
        }
    }

    /**
     * Sync bonus calculations for all models in a period
     *
     * @param string $fromDate
     * @param string $toDate
     * @return array
     */
    public function syncBonusesForPeriod($fromDate, $toDate)
    {
        try {
            Log::info('Starting bonus sync for period', [
                'fromDate' => $fromDate,
                'toDate' => $toDate
            ]);

            // Get all scores for the period
            $scores = ModelLivejasminScore::where('modlj_period_start', $fromDate)
                ->where('modlj_period_end', $toDate)
                ->with('modelAccount.model')
                ->get();

            if ($scores->isEmpty()) {
                Log::warning('No scores found for period', [
                    'fromDate' => $fromDate,
                    'toDate' => $toDate
                ]);

                return [
                    'success' => true,
                    'message' => 'No scores found for the specified period',
                    'processed_models' => 0,
                    'successful_calculations' => 0,
                    'failed_calculations' => 0
                ];
            }

            $processedModels = 0;
            $successfulCalculations = 0;
            $failedCalculations = 0;

            foreach ($scores as $score) {
                $processedModels++;
                $modelUsername = $score->modelAccount->model->username ?? 'unknown';

                try {
                    $result = $this->calculateDynamicBonuses($score, $modelUsername);

                    if ($result['success']) {
                        $successfulCalculations++;

                        // Store bonus results in the database if needed
                        // This could be implemented to save detailed bonus calculations

                        Log::debug('Bonus calculation successful for model', [
                            'model_username' => $modelUsername,
                            'qualifying_bonuses' => $result['data']['qualifying_bonuses_count'] ?? 0
                        ]);
                    } else {
                        $failedCalculations++;
                        Log::warning('Bonus calculation failed for model', [
                            'model_username' => $modelUsername,
                            'error' => $result['message']
                        ]);
                    }
                } catch (\Exception $e) {
                    $failedCalculations++;
                    Log::error('Exception during bonus calculation for model', [
                        'model_username' => $modelUsername,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            Log::info('Bonus sync completed for period', [
                'fromDate' => $fromDate,
                'toDate' => $toDate,
                'processed_models' => $processedModels,
                'successful_calculations' => $successfulCalculations,
                'failed_calculations' => $failedCalculations
            ]);

            return [
                'success' => true,
                'message' => 'Bonus sync completed successfully',
                'processed_models' => $processedModels,
                'successful_calculations' => $successfulCalculations,
                'failed_calculations' => $failedCalculations
            ];
        } catch (\Exception $e) {
            Log::error('Error syncing bonuses for period: ' . $e->getMessage(), [
                'fromDate' => $fromDate,
                'toDate' => $toDate,
                'exception' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Error syncing bonuses: ' . $e->getMessage(),
                'processed_models' => 0,
                'successful_calculations' => 0,
                'failed_calculations' => 0
            ];
        }
    }
}
