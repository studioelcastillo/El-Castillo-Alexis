<?php

namespace App\Http\Controllers;

use App\Models\ModelLivejasminScore;
use App\Models\ModelAccount;
use App\Services\ParticipationBonusService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ParticipationBonusController extends Controller
{
    protected ParticipationBonusService $participationService;

    public function __construct(ParticipationBonusService $participationService)
    {
        $this->participationService = $participationService;
    }

    /**
     * Evaluar participación de un modelo específico
     */
    public function evaluateModel(Request $request, $modaccId): JsonResponse
    {
        try {
            $request->validate([
                'period_start' => 'required|date',
                'period_end' => 'required|date'
            ]);

            $periodStart = $request->get('period_start');
            $periodEnd = $request->get('period_end');

            // Buscar el score del modelo para el período
            $score = ModelLivejasminScore::where('modacc_id', $modaccId)
                ->where('modlj_period_start', $periodStart)
                ->where('modlj_period_end', $periodEnd)
                ->first();

            if (!$score) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron datos para el modelo en el período especificado'
                ], 404);
            }

            // Evaluar participación
            $evaluation = $this->participationService->evaluateModelParticipation($score, $modaccId);

            // Agregar información del modelo
            $modelAccount = ModelAccount::with(['studioModel.userModel', 'studioModel.studio'])
                ->find($modaccId);

            if ($modelAccount) {
                $evaluation['model_info'] = [
                    'modacc_id' => $modaccId,
                    'username' => $modelAccount->modacc_username,
                    'payment_username' => $modelAccount->modacc_payment_username,
                    'screen_name' => $score->modlj_screen_name ?? $modelAccount->modacc_screen_name,
                    'model_name' => $modelAccount->studioModel->userModel->name ?? null,
                    'studio_name' => $modelAccount->studioModel->studio->std_name ?? null
                ];
            }

            $evaluation['period'] = [
                'start' => $periodStart,
                'end' => $periodEnd
            ];

            return response()->json([
                'success' => true,
                'data' => $evaluation
            ]);

        } catch (\Exception $e) {
            Log::error('ParticipationBonusController: Error evaluating model', [
                'modacc_id' => $modaccId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al evaluar la participación del modelo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener resumen de participación para dashboard
     */
    public function getDashboard(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'period_start' => 'nullable|date',
                'period_end' => 'nullable|date',
                'studio_id' => 'nullable|integer'
            ]);

            // Período por defecto: período actual de LiveJasmin
            $periodStart = $request->get('period_start');
            $periodEnd = $request->get('period_end');

            if (!$periodStart || !$periodEnd) {
                // Usar el período más reciente disponible
                $latestScore = ModelLivejasminScore::orderBy('modlj_period_start', 'desc')->first();
                if ($latestScore) {
                    $periodStart = $latestScore->modlj_period_start;
                    $periodEnd = $latestScore->modlj_period_end;
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'No hay datos de períodos disponibles'
                    ], 404);
                }
            }

            $studioId = $request->get('studio_id');

            $dashboardData = $this->participationService->getDashboardSummary(
                $periodStart,
                $periodEnd,
                $studioId
            );

            return response()->json($dashboardData);

        } catch (\Exception $e) {
            Log::error('ParticipationBonusController: Error getting dashboard', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener lista de modelos con su participación
     */
    public function getModelsList(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'period_start' => 'required|date',
                'period_end' => 'required|date',
                'studio_id' => 'nullable|integer'
            ]);

            $periodStart = $request->get('period_start');
            $periodEnd = $request->get('period_end');
            $studioId = $request->get('studio_id');

            $query = ModelLivejasminScore::where('modlj_period_start', $periodStart)
                ->where('modlj_period_end', $periodEnd)
                ->with(['modelAccount.studioModel.userModel', 'modelAccount.studioModel.studio']);

            if ($studioId) {
                $query->whereHas('modelAccount.studioModel', function ($q) use ($studioId) {
                    $q->where('std_id', $studioId)
                      ->where('stdmod_active', true);
                });
            }

            $scores = $query->get();
            $results = [];

            foreach ($scores as $score) {
                $evaluation = $this->participationService->evaluateModelParticipation($score);

                if ($evaluation['success']) {
                    $modelAccount = $score->modelAccount;
                    $studioModel = $modelAccount?->studioModel;
                    $userModel = $studioModel?->userModel;

                    $results[] = [
                        'modacc_id' => $score->modacc_id,
                        'model_name' => $userModel?->name ?? 'Sin nombre',
                        'username' => $modelAccount?->modacc_username,
                        'payment_username' => $modelAccount?->modacc_payment_username,
                        'screen_name' => $score->modlj_screen_name,
                        'model_type' => $evaluation['model_type'],
                        'model_type_label' => $evaluation['model_type_label'],
                        'base_participation' => $evaluation['base_participation'],
                        'final_participation' => $evaluation['final_participation'],
                        'bonus_percentage' => $evaluation['bonus_percentage'],
                        'bonus_amount' => $evaluation['bonus_amount'],
                        'earnings_usd' => $evaluation['earnings_usd'],
                        'has_penalty' => collect($evaluation['penalties'])->contains('applies', true),
                        'has_bonus' => collect($evaluation['bonuses'])->contains('qualifies', true),
                        'has_welcome_bonus' => $evaluation['has_welcome_bonus'],
                        'has_conversion_bonus' => $evaluation['has_conversion_bonus'],
                        // Métricas adicionales para la tabla
                        'hours_connection' => $score->modlj_hours_connection,
                        'hours_member_other' => $score->modlj_hours_member_other,
                        'hours_preview' => $score->modlj_hours_preview,
                        'score_traffic' => $score->modlj_score_traffic,
                        'score_conversion' => $score->modlj_score_conversion,
                        'score_engagement' => $score->modlj_score_engagement,
                        'offers_initiated' => $score->modlj_offers_initiated,
                        'new_members' => $score->modlj_new_members,
                        'average_hour' => $score->modlj_average_hour
                    ];
                }
            }

            // Ordenar por participación final descendente
            usort($results, function ($a, $b) {
                return $b['final_participation'] <=> $a['final_participation'];
            });

            return response()->json([
                'success' => true,
                'period' => [
                    'start' => $periodStart,
                    'end' => $periodEnd
                ],
                'total' => count($results),
                'data' => $results
            ]);

        } catch (\Exception $e) {
            Log::error('ParticipationBonusController: Error getting models list', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la lista de modelos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener detalle completo de participación de un modelo
     */
    public function getModelDetail(Request $request, $modaccId): JsonResponse
    {
        try {
            $request->validate([
                'period_start' => 'required|date',
                'period_end' => 'required|date'
            ]);

            $periodStart = $request->get('period_start');
            $periodEnd = $request->get('period_end');

            // Buscar el score del modelo
            $score = ModelLivejasminScore::where('modacc_id', $modaccId)
                ->where('modlj_period_start', $periodStart)
                ->where('modlj_period_end', $periodEnd)
                ->with(['modelAccount.studioModel.userModel', 'modelAccount.studioModel.studio'])
                ->first();

            if (!$score) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron datos para el modelo en el período especificado'
                ], 404);
            }

            // Evaluar participación
            $evaluation = $this->participationService->evaluateModelParticipation($score, $modaccId);

            // Agregar información completa del modelo
            $modelAccount = $score->modelAccount;
            $studioModel = $modelAccount?->studioModel;

            $response = [
                'success' => true,
                'model_info' => [
                    'modacc_id' => $modaccId,
                    'username' => $modelAccount?->modacc_username,
                    'payment_username' => $modelAccount?->modacc_payment_username,
                    'screen_name' => $score->modlj_screen_name,
                    'model_name' => $studioModel?->userModel?->name,
                    'studio_name' => $studioModel?->studio?->std_name,
                    'contract_type' => $studioModel?->stdmod_contract_type,
                    'start_date' => $studioModel?->stdmod_start_at
                ],
                'period' => [
                    'start' => $periodStart,
                    'end' => $periodEnd
                ],
                'performance' => [
                    'earnings_usd' => $score->modlj_earnings_usd,
                    'hours_connection' => $score->modlj_hours_connection,
                    'hours_total_connection' => $score->modlj_hours_total_connection,
                    'hours_member_other' => $score->modlj_hours_member_other,
                    'hours_preview' => $score->modlj_hours_preview,
                    'score_traffic' => $score->modlj_score_traffic,
                    'score_conversion' => $score->modlj_score_conversion,
                    'score_engagement' => $score->modlj_score_engagement,
                    'offers_initiated' => $score->modlj_offers_initiated,
                    'new_members' => $score->modlj_new_members,
                    'hot_deals' => $score->modlj_hot_deals,
                    'average_hour' => $score->modlj_average_hour
                ],
                'legacy_bonuses' => [
                    'bonus_5_percent' => $score->modlj_bonus_5_percent,
                    'bonus_10_percent' => $score->modlj_bonus_10_percent
                ],
                'participation' => $evaluation
            ];

            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('ParticipationBonusController: Error getting model detail', [
                'modacc_id' => $modaccId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el detalle del modelo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener tipos de bonos y penalidades disponibles
     */
    public function getBonusTypes(): JsonResponse
    {
        try {
            $bonusTypes = [
                'base' => [
                    [
                        'code' => 'base_on_site',
                        'name' => 'Base Modelos en Sede',
                        'applies_to' => 'on_site',
                        'participation' => 50,
                        'description' => 'Participación base para modelos que trabajan en sede'
                    ],
                    [
                        'code' => 'base_satellite',
                        'name' => 'Base Modelos Satélites',
                        'applies_to' => 'satellite',
                        'participation' => 70,
                        'description' => 'Participación base para modelos satélites'
                    ]
                ],
                'penalties' => [
                    [
                        'code' => 'penalty_on_site_hours_80',
                        'name' => 'No cumplimiento 80 horas',
                        'applies_to' => 'on_site',
                        'modifier' => -5,
                        'description' => 'Penalización por no cumplir con 80 horas de conexión libres',
                        'criteria' => ['Menos de 80 horas de conexión libres de chat de miembro y otros']
                    ],
                    [
                        'code' => 'penalty_satellite_hours_60',
                        'name' => 'No cumplimiento 60 horas',
                        'applies_to' => 'satellite',
                        'modifier' => -10,
                        'description' => 'Penalización por no cumplir con 60 horas de conexión libres',
                        'criteria' => ['Menos de 60 horas de conexión libres de chat de miembro y otros']
                    ]
                ],
                'bonuses' => [
                    [
                        'code' => 'bonus_on_site_tools_100h',
                        'name' => '+10% Uso eficiente herramientas',
                        'applies_to' => 'on_site',
                        'modifier' => 10,
                        'description' => 'Bono por uso eficiente del tiempo y herramientas',
                        'criteria' => [
                            '100 horas de conexión libres',
                            'Máximo 3 horas miembro/otros (4 si +120h)',
                            '13 horas Pre VIP Show',
                            'Score Tráfico >= 60%',
                            'Score Conversión >= 75%',
                            'Score Compromiso >= 30%',
                            '150 Ofertas Especiales',
                            'Promedio >= $30/hora'
                        ]
                    ],
                    [
                        'code' => 'bonus_on_site_revenue_100h',
                        'name' => '+10% Ingresos generados (100h)',
                        'applies_to' => 'on_site',
                        'modifier' => 10,
                        'description' => 'Bono por ingresos generados con 100 horas',
                        'criteria' => [
                            '100 horas de conexión libres',
                            '$5000 USD en ganancias'
                        ]
                    ],
                    [
                        'code' => 'bonus_on_site_revenue_80h',
                        'name' => '+5% Ingresos generados (80h)',
                        'applies_to' => 'on_site',
                        'modifier' => 5,
                        'description' => 'Bono por ingresos generados con 80 horas',
                        'criteria' => [
                            '80 horas de conexión libres',
                            '$5000 USD en ganancias'
                        ]
                    ],
                    [
                        'code' => 'bonus_satellite_tools_100h',
                        'name' => '+5% Uso eficiente herramientas',
                        'applies_to' => 'satellite',
                        'modifier' => 5,
                        'description' => 'Bono para satélites por uso eficiente del tiempo',
                        'criteria' => [
                            '100 horas de conexión libres',
                            'Máximo 3 horas miembro/otros (4 si +120h)',
                            '13 horas Pre VIP Show',
                            'Score Tráfico >= 60%',
                            'Score Conversión >= 75%',
                            'Score Compromiso >= 30%',
                            '150 Ofertas Especiales',
                            '25 Nuevos Miembros',
                            'Promedio >= $25/hora'
                        ]
                    ]
                ],
                'special' => [
                    [
                        'code' => 'welcome_bonus',
                        'name' => 'Bono de Bienvenida',
                        'applies_to' => 'all',
                        'participation' => 90,
                        'description' => 'Participación especial para modelos nuevos en su primer período',
                        'criteria' => [
                            'Primer período del modelo',
                            '100 horas de conexión libres',
                            'Cumplir requisitos LiveJasmin (bono 5% o 10%)'
                        ]
                    ],
                    [
                        'code' => 'conversion_bonus',
                        'name' => 'Bono de Conversión',
                        'applies_to' => 'all',
                        'modifier' => 10,
                        'description' => 'Bono adicional por calificar para bonos de herramientas o ingresos',
                        'criteria' => [
                            'Calificar para bono de herramientas (+10%) O',
                            'Calificar para bono de ingresos (+10%)'
                        ]
                    ]
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $bonusTypes
            ]);

        } catch (\Exception $e) {
            Log::error('ParticipationBonusController: Error getting bonus types', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los tipos de bonos',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
