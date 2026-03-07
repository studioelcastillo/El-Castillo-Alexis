<?php

namespace App\Http\Controllers;

use App\Models\ModelLivejasminScore;
use App\Models\ModelAccount;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DynamicBonusController extends Controller
{
    /**
     * Obtiene bonos dinámicos para un modelo específico
     */
    public function getBonusesForModel(Request $request, $modelId): JsonResponse
    {
        try {
            $request->validate([
                'period_start' => 'nullable|date',
                'period_end' => 'nullable|date',
                'limit' => 'nullable|integer|min:1|max:100'
            ]);

            $query = ModelLivejasminScore::where('modacc_id', $modelId)
                ->with(['modelAccount.studioModel.userModel'])
                ->orderBy('modlj_period_start', 'desc');

            // Filtrar por período si se proporciona
            if ($request->period_start) {
                $query->where('modlj_period_start', '>=', $request->period_start);
            }
            if ($request->period_end) {
                $query->where('modlj_period_end', '<=', $request->period_end);
            }

            $limit = $request->get('limit', 10);
            $scores = $query->limit($limit)->get();

            $result = $scores->map(function ($score) {
                return [
                    'score_id' => $score->modlj_id,
                    'period_start' => $score->modlj_period_start,
                    'period_end' => $score->modlj_period_end,
                    'screen_name' => $score->modlj_screen_name,
                    'earnings_usd' => $score->modlj_earnings_usd,
                    'legacy_bonuses' => [
                        'bonus_5_percent' => $score->modlj_bonus_5_percent,
                        'bonus_10_percent' => $score->modlj_bonus_10_percent
                    ],
                    'dynamic_bonuses' => $score->dynamic_bonuses,
                    'combined_summary' => $score->combined_bonus_summary,
                    'bonus_evaluations' => $score->dynamic_bonuses['bonuses'] ?? []
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $result,
                'total' => $scores->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting bonuses for model:', [
                'model_id' => $modelId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error retrieving bonuses data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtiene estadísticas de bonos dinámicos
     */
    public function getDynamicBonusStats(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'period_start' => 'nullable|date',
                'period_end' => 'nullable|date'
            ]);

            // Período por defecto: mes actual
            $periodStart = $request->get('period_start', Carbon::now()->startOfMonth()->toDateString());
            $periodEnd = $request->get('period_end', Carbon::now()->endOfMonth()->toDateString());

            // Estadísticas generales
            $totalScores = ModelLivejasminScore::whereBetween('modlj_period_start', [$periodStart, $periodEnd])->count();
            
            $scoresWithDynamicBonuses = ModelLivejasminScore::whereBetween('modlj_period_start', [$periodStart, $periodEnd])
                ->whereNotNull('modlj_dynamic_bonus_data')
                ->count();

            // Estadísticas de bonos dinámicos
            $dynamicBonusStats = DB::table('models_livejasmin_scores')
                ->select(
                    DB::raw('COUNT(*) as total_evaluations'),
                    DB::raw('AVG(CAST(JSON_EXTRACT(modlj_dynamic_bonus_data, "$.total_bonus_percentage") AS DECIMAL(10,2))) as avg_bonus_percentage'),
                    DB::raw('SUM(CAST(JSON_EXTRACT(modlj_dynamic_bonus_data, "$.total_bonus_amount") AS DECIMAL(10,2))) as total_bonus_amount'),
                    DB::raw('AVG(CAST(JSON_EXTRACT(modlj_dynamic_bonus_data, "$.qualifying_bonuses_count") AS UNSIGNED)) as avg_qualifying_bonuses')
                )
                ->whereBetween('modlj_period_start', [$periodStart, $periodEnd])
                ->whereNotNull('modlj_dynamic_bonus_data')
                ->first();

            // Top modelos por bonos dinámicos
            $topModelsByBonuses = ModelLivejasminScore::select(
                'modacc_id',
                'modlj_screen_name',
                DB::raw('AVG(CAST(JSON_EXTRACT(modlj_dynamic_bonus_data, "$.total_bonus_percentage") AS DECIMAL(10,2))) as avg_bonus_percentage'),
                DB::raw('SUM(CAST(JSON_EXTRACT(modlj_dynamic_bonus_data, "$.total_bonus_amount") AS DECIMAL(10,2))) as total_bonus_amount')
            )
                ->whereBetween('modlj_period_start', [$periodStart, $periodEnd])
                ->whereNotNull('modlj_dynamic_bonus_data')
                ->groupBy('modacc_id', 'modlj_screen_name')
                ->orderBy('total_bonus_amount', 'desc')
                ->limit(10)
                ->get();

            // Estadísticas por tipo de bono (desde datos JSON)
            $bonusTypeStats = collect();

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => [
                        'start' => $periodStart,
                        'end' => $periodEnd
                    ],
                    'general_stats' => [
                        'total_scores' => $totalScores,
                        'scores_with_dynamic_bonuses' => $scoresWithDynamicBonuses,
                        'dynamic_bonus_coverage' => $totalScores > 0 ? round(($scoresWithDynamicBonuses / $totalScores) * 100, 2) : 0
                    ],
                    'dynamic_bonus_stats' => [
                        'total_evaluations' => $dynamicBonusStats->total_evaluations ?? 0,
                        'avg_bonus_percentage' => round($dynamicBonusStats->avg_bonus_percentage ?? 0, 2),
                        'total_bonus_amount' => round($dynamicBonusStats->total_bonus_amount ?? 0, 2),
                        'avg_qualifying_bonuses' => round($dynamicBonusStats->avg_qualifying_bonuses ?? 0, 1)
                    ],
                    'top_models' => $topModelsByBonuses,
                    'bonus_type_stats' => $bonusTypeStats->toArray()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting dynamic bonus stats:', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error retrieving bonus statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtiene el resumen de bonos para el dashboard
     */
    public function getBonusDashboardSummary(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'studio_id' => 'nullable|integer',
                'period_start' => 'nullable|date',
                'period_end' => 'nullable|date'
            ]);

            // Período por defecto: mes actual
            $periodStart = $request->get('period_start', Carbon::now()->startOfMonth()->toDateString());
            $periodEnd = $request->get('period_end', Carbon::now()->endOfMonth()->toDateString());

            $query = ModelLivejasminScore::whereBetween('modlj_period_start', [$periodStart, $periodEnd]);

            // Filtrar por estudio si se proporciona
            if ($request->studio_id) {
                $query->whereHas('modelAccount.studioModel', function ($q) use ($request) {
                    $q->where('std_id', $request->studio_id)
                      ->where('stdmod_active', true);
                });
            }

            $scores = $query->with(['modelAccount.studioModel.userModel'])->get();

            // Calcular métricas
            $totalModels = $scores->groupBy('modacc_id')->count();
            $totalEarnings = $scores->sum('modlj_earnings_usd');
            $totalLegacyBonuses = $scores->where('modlj_bonus_5_percent', true)->count() * 5 +
                                $scores->where('modlj_bonus_10_percent', true)->count() * 10;
            
            $dynamicBonusAmount = $scores->sum(function ($score) {
                return $score->dynamic_bonus_amount;
            });

            $modelsWithDynamicBonuses = $scores->filter(function ($score) {
                return $score->hasQualifyingDynamicBonuses();
            })->groupBy('modacc_id')->count();

            // Tendencias por día
            $dailyTrends = $scores->groupBy(function ($score) {
                return Carbon::parse($score->modlj_period_start)->format('Y-m-d');
            })->map(function ($dayScores, $date) {
                return [
                    'date' => $date,
                    'total_earnings' => $dayScores->sum('modlj_earnings_usd'),
                    'dynamic_bonus_amount' => $dayScores->sum(function ($score) {
                        return $score->dynamic_bonus_amount;
                    }),
                    'models_count' => $dayScores->groupBy('modacc_id')->count()
                ];
            })->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => [
                        'start' => $periodStart,
                        'end' => $periodEnd
                    ],
                    'summary' => [
                        'total_models' => $totalModels,
                        'total_earnings' => round($totalEarnings, 2),
                        'legacy_bonus_percentage' => $totalLegacyBonuses,
                        'dynamic_bonus_amount' => round($dynamicBonusAmount, 2),
                        'models_with_dynamic_bonuses' => $modelsWithDynamicBonuses,
                        'dynamic_bonus_coverage' => $totalModels > 0 ? round(($modelsWithDynamicBonuses / $totalModels) * 100, 2) : 0
                    ],
                    'daily_trends' => $dailyTrends
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting bonus dashboard summary:', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error retrieving dashboard summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtiene detalles de evaluación de bonos para un score específico
     */
    public function getBonusEvaluationDetails($scoreId): JsonResponse
    {
        try {
            $score = ModelLivejasminScore::with(['modelAccount.studioModel.userModel'])
                ->findOrFail($scoreId);

            $evaluationDetails = [
                'score_info' => [
                    'score_id' => $score->modlj_id,
                    'model_account_id' => $score->modacc_id,
                    'screen_name' => $score->modlj_screen_name,
                    'period_start' => $score->modlj_period_start,
                    'period_end' => $score->modlj_period_end,
                    'earnings_usd' => $score->modlj_earnings_usd
                ],
                'performance_data' => [
                    'hours_connection' => $score->modlj_hours_connection,
                    'hours_preview' => $score->modlj_hours_preview,
                    'score_traffic' => $score->modlj_score_traffic,
                    'score_conversion' => $score->modlj_score_conversion,
                    'score_engagement' => $score->modlj_score_engagement,
                    'offers_initiated' => $score->modlj_offers_initiated,
                    'new_members' => $score->modlj_new_members,
                    'average_hour' => $score->modlj_average_hour
                ],
                'legacy_bonuses' => [
                    'bonus_5_percent' => $score->modlj_bonus_5_percent,
                    'bonus_10_percent' => $score->modlj_bonus_10_percent
                ],
                'dynamic_bonuses' => $score->dynamic_bonuses,
                'combined_summary' => $score->combined_bonus_summary,
                'detailed_evaluations' => $score->dynamic_bonuses['bonuses'] ?? []
            ];

            return response()->json([
                'success' => true,
                'data' => $evaluationDetails
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting bonus evaluation details:', [
                'score_id' => $scoreId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error retrieving evaluation details',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}