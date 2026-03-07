<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ModelAccount;
use App\Models\ModelLivejasminScore;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Services\LivejasminService;
use App\Library\LogController;
use App\Http\Requests\UploadLivejasminManualDataRequest;
use App\Imports\LivejasminScraperDataImport;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class LivejasminController extends Controller
{
    private $log;

    public function __construct()
    {
        $this->log = new LogController();
    }
    /**
     * Get all available periods from local database
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAvailablePeriods(Request $request)
    {
        try {
            // Get distinct periods from scores, ordered by end date descending (most recent first)
            $periods = ModelLivejasminScore::select('modlj_period_start', 'modlj_period_end')
                ->distinct()
                ->orderBy('modlj_period_end', 'desc')
                ->get();

            $latestEndDate = $periods->first()->modlj_period_end ?? null;

            $formattedPeriods = $periods->map(function ($period) use ($latestEndDate) {
                $startDate = Carbon::parse($period->modlj_period_start);
                $endDate = Carbon::parse($period->modlj_period_end);

                // Create a readable label showing exact period range
                // Format: "May 20 - Jun 03" or "Jun 03 - Jun 17"
                $startFormatted = $startDate->locale('en')->format('M d');
                $endFormatted = $endDate->locale('en')->format('M d');

                // If same month, show "Jun 03 - 17", otherwise "May 20 - Jun 03"
                if ($startDate->month === $endDate->month && $startDate->year === $endDate->year) {
                    $label = $startFormatted . ' - ' . $endDate->format('d');
                } else {
                    $label = $startFormatted . ' - ' . $endFormatted;
                }

                return [
                    'start_date' => $period->modlj_period_start,
                    'end_date' => $period->modlj_period_end,
                    'label' => $label,
                    'is_current' => $period->modlj_period_end === $latestEndDate
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedPeriods
            ]);
        } catch (\Exception $e) {
            Log::error('LiveJasmin get available periods error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve available periods',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the current LiveJasmin period from local database
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCurrentPeriod(Request $request)
    {
        try {
            // Get the most recent period from existing scores
            $latestScore = ModelLivejasminScore::orderBy('modlj_period_end', 'desc')->first();

            if ($latestScore) {
                $period = [
                    'start_date' => $latestScore->modlj_period_start,
                    'end_date' => $latestScore->modlj_period_end,
                ];
            } else {
                // Fallback to current month if no data exists
                $now = Carbon::now();
                $period = [
                    'start_date' => $now->copy()->startOfMonth()->format('Y-m-d'),
                    'end_date' => $now->copy()->endOfMonth()->format('Y-m-d'),
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $period
            ]);
        } catch (\Exception $e) {
            Log::error('LiveJasmin get period error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve period information',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get performance data for a specific model from local database
     *
     * @param int $modaccId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getModelPerformance($modaccId, Request $request)
    {
        try {
            $modelAccount = ModelAccount::with('studioModel.studio', 'studioModel.userModel')->findOrFail($modaccId);

            $periodStart = $request->input('period_start');
            $periodEnd = $request->input('period_end');

            // Use current period if not specified
            if (!$periodStart || !$periodEnd) {
                $period = $this->getCurrentPeriodData();
                $periodStart = $period['start_date'];
                $periodEnd = $period['end_date'];
            }

            // Get score from local database
            $score = ModelLivejasminScore::where('modacc_id', $modaccId)
                ->where('modlj_period_start', '<=', $periodEnd)
                ->where('modlj_period_end', '>=', $periodStart)
                ->first();

            if (!$score) {
                return response()->json([
                    'success' => false,
                    'message' => 'No performance data available for this period. Data needs to be synced from microservice.',
                ], 404);
            }

            // Calculate bonuses using local logic
            $bonuses = $this->calculateBonuses($score);

            return response()->json([
                'success' => true,
                'data' => [
                    'model' => [
                        'id' => $modelAccount->modacc_id,
                        'name' => $modelAccount->studioModel->userModel ?
                            ($modelAccount->studioModel->userModel->user_name . ' ' . $modelAccount->studioModel->userModel->user_surname) :
                            null,
                        'username' => $modelAccount->modacc_username,
                        'payment_username' => $modelAccount->modacc_payment_username,
                        'screen_name' => $score->modlj_screen_name,
                        'studio' => $modelAccount->studioModel->studio->std_name ?? null,
                    ],
                    'period' => [
                        'start_date' => $score->modlj_period_start,
                        'end_date' => $score->modlj_period_end,
                    ],
                    'performance' => [
                        'hours_connection' => $score->modlj_hours_connection,
                        'hours_preview' => $score->modlj_hours_preview,
                        'hours_total_connection' => $score->modlj_hours_total_connection,
                        'hours_member_other' => $score->modlj_hours_member_other,
                        'score_traffic' => $score->modlj_score_traffic,
                        'score_conversion' => $score->modlj_score_conversion,
                        'score_engagement' => $score->modlj_score_engagement,
                        'offers_initiated' => $score->modlj_offers_initiated,
                        'new_members' => $score->modlj_new_members,
                        'hot_deals' => $score->modlj_hot_deals,
                        'average_hour' => $score->modlj_average_hour,
                        'earnings_usd' => $score->modlj_earnings_usd,
                        // Earnings distribution
                        'earnings_private' => $score->modlj_earnings_private,
                        'earnings_vip_show' => $score->modlj_earnings_vip_show,
                        'earnings_video_voice_call' => $score->modlj_earnings_video_voice_call,
                        'earnings_cam2cam' => $score->modlj_earnings_cam2cam,
                        'earnings_surprise' => $score->modlj_earnings_surprise,
                        'earnings_message' => $score->modlj_earnings_message,
                        'earnings_interactive_toy' => $score->modlj_earnings_interactive_toy,
                        'earnings_bonus' => $score->modlj_earnings_bonus,
                        'earnings_other' => $score->modlj_earnings_other,
                        'earnings_my_content' => $score->modlj_earnings_my_content,
                        // Manual bonus approval status
                        'bonus_5_percent' => $score->modlj_bonus_5_percent,
                        'bonus_10_percent' => $score->modlj_bonus_10_percent,
                    ],
                    'bonuses' => [
                        'bonus_5_percent' => $bonuses['bonus_5_percent'],
                        'bonus_10_percent' => $bonuses['bonus_10_percent'],
                        'total_bonus' => $bonuses['bonus_5_percent'] + $bonuses['bonus_10_percent'],
                    ],
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("LiveJasmin get model $modaccId error: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve model performance data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get performance data for all models for current period from local database
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllModelsPerformance(Request $request)
    {
        try {
            $studios = $request->input('studios');
            $periodStart = $request->input('period_start');
            $periodEnd = $request->input('period_end');

            // Use current period if not specified
            if (!$periodStart || !$periodEnd) {
                $period = $this->getCurrentPeriodData();
                $periodStart = $period['start_date'];
                $periodEnd = $period['end_date'];
            }

            $query = ModelLivejasminScore::with(['modelAccount.studioModel.studio'])
                ->where('modlj_period_start', '<=', $periodEnd)
                ->where('modlj_period_end', '>=', $periodStart);

            if ($studios) {
                $studiosArray = explode(',', $studios);
                $query->whereHas('modelAccount.studioModel.studio', function ($q) use ($studiosArray) {
                    $q->whereIn('std_id', $studiosArray);
                });
            }

            $scores = $query->get();

            $data = $scores->map(function ($score) {
                $bonuses = $this->calculateBonuses($score);

                return [
                    'model' => [
                        'id' => $score->modelAccount->modacc_id ?? null,
                        'name' => $score->modelAccount->studioModel->stdmod_name ?? null,
                        'username' => $score->modelAccount->modacc_username ?? null,
                        'screen_name' => $score->modlj_screen_name ?? null,
                        'studio' => $score->modelAccount->studioModel->studio->std_name ?? null,
                    ],
                    'period' => [
                        'start_date' => $score->modlj_period_start,
                        'end_date' => $score->modlj_period_end,
                    ],
                    'performance' => [
                        'hours_connection' => $score->modlj_hours_connection,
                        'hours_preview' => $score->modlj_hours_preview,
                        'hours_total_connection' => $score->modlj_hours_total_connection,
                        'hours_member_other' => $score->modlj_hours_member_other,
                        'score_traffic' => $score->modlj_score_traffic,
                        'score_conversion' => $score->modlj_score_conversion,
                        'score_engagement' => $score->modlj_score_engagement,
                        'offers_initiated' => $score->modlj_offers_initiated,
                        'new_members' => $score->modlj_new_members,
                        'hot_deals' => $score->modlj_hot_deals,
                        'average_hour' => $score->modlj_average_hour,
                        'earnings_usd' => $score->modlj_earnings_usd,
                    ],
                    'bonuses' => [
                        'bonus_5_percent' => $bonuses['bonus_5_percent'],
                        'bonus_10_percent' => $bonuses['bonus_10_percent'],
                        'total_bonus' => $bonuses['bonus_5_percent'] + $bonuses['bonus_10_percent'],
                    ],
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'total' => $data->count(),
            ]);
        } catch (\Exception $e) {
            Log::error("LiveJasmin get all models error: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve models performance data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all models with LiveJasmin accounts for the dashboard
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getModelsWithLiveJasmin(Request $request)
    {
        try {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');
            $studios = $request->input('studios');

            // Use current period if not specified
            if (!$startDate || !$endDate) {
                $period = $this->getCurrentPeriodData();
                $startDate = $period['start_date'];
                $endDate = $period['end_date'];
            }

            // Get models from local database
            $query = ModelLivejasminScore::with(['modelAccount.studioModel.studio'])
                ->where('modlj_period_start', '=', $startDate)
                ->where('modlj_period_end', '=', $endDate);

            // Filter by studios if specified
            if ($studios) {
                $studiosArray = explode(',', $studios);
                $query->whereHas('modelAccount.studioModel.studio', function ($q) use ($studiosArray) {
                    $q->whereIn('std_id', $studiosArray);
                });
            }

            $scores = $query->get();

            Log::info('LiveJasmin models count (from local DB): ' . $scores->count());

        $models = $scores->map(function ($score) {
            return [
                'id' => $score->modacc_id,
                'model_name' => $score->modelAccount->modacc_payment_username,
                'user_id' => optional(optional($score->modelAccount)->studioModel)->user_id_model,
                'modacc_username' => $score->modelAccount->modacc_username,
                'modacc_mail' => $score->modelAccount->modacc_mail,
                'modlj_screen_name' => $score->modlj_screen_name,
                'modlj_hours_connection' => $score->modlj_hours_connection,
                'modlj_hours_preview' => $score->modlj_hours_preview,
                'modlj_score_traffic' => $score->modlj_score_traffic,
                    'modlj_score_conversion' => $score->modlj_score_conversion,
                    'modlj_score_engagement' => $score->modlj_score_engagement,
                    'modlj_offers_initiated' => $score->modlj_offers_initiated,
                    'modlj_new_members' => $score->modlj_new_members,
                    'modlj_hot_deals' => $score->modlj_hot_deals,
                    'modlj_average_hour' => $score->modlj_average_hour,
                    'modlj_earnings_usd' => $score->modlj_earnings_usd,
                    'modlj_bonus_5_percent' => $score->modlj_bonus_5_percent,
                    'modlj_bonus_10_percent' => $score->modlj_bonus_10_percent,
                    'period_start' => $score->modlj_period_start,
                    'period_end' => $score->modlj_period_end,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $models
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting LiveJasmin models: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve models with LiveJasmin accounts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get stats for a specific model for the dashboard
     *
     * @param int $id
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getModelStats($id, Request $request)
    {
        try {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            // Use current period if not specified
            if (!$startDate || !$endDate) {
                $period = $this->getCurrentPeriodData();
                $startDate = $period['start_date'];
                $endDate = $period['end_date'];
            }

            $score = ModelLivejasminScore::where('modacc_id', $id)
                ->where('modlj_period_start', '<=', $endDate)
                ->where('modlj_period_end', '>=', $startDate)
                ->first();

            if (!$score) {
                return response()->json([
                    'success' => false,
                    'message' => 'No data found for this model in the specified period'
                ], 404);
            }

            $modelData = [
                'id' => $score->modacc_id,
                'model_name' => $score->modelAccount->studioModel->stdmod_name ?? 'Unknown',
                'modlj_screen_name' => $score->modlj_screen_name,
                'modlj_hours_connection' => $score->modlj_hours_connection,
                'modlj_hours_preview' => $score->modlj_hours_preview,
                'modlj_score_traffic' => $score->modlj_score_traffic,
                'modlj_score_conversion' => $score->modlj_score_conversion,
                'modlj_score_engagement' => $score->modlj_score_engagement,
                'modlj_offers_initiated' => $score->modlj_offers_initiated,
                'modlj_new_members' => $score->modlj_new_members,
                'modlj_average_hour' => $score->modlj_average_hour,
                'modlj_earnings_usd' => $score->modlj_earnings_usd,
                'period_start' => $score->modlj_period_start,
                'period_end' => $score->modlj_period_end,
                // Earnings distribution
                'modlj_earnings_private' => $score->modlj_earnings_private,
                'modlj_earnings_vip_show' => $score->modlj_earnings_vip_show,
                'modlj_earnings_video_voice_call' => $score->modlj_earnings_video_voice_call,
                'modlj_earnings_cam2cam' => $score->modlj_earnings_cam2cam,
                'modlj_earnings_surprise' => $score->modlj_earnings_surprise,
                'modlj_earnings_message' => $score->modlj_earnings_message,
                'modlj_earnings_interactive_toy' => $score->modlj_earnings_interactive_toy,
                'modlj_earnings_bonus' => $score->modlj_earnings_bonus,
                'modlj_earnings_other' => $score->modlj_earnings_other,
                'modlj_earnings_my_content' => $score->modlj_earnings_my_content,
            ];

            return response()->json([
                'success' => true,
                'data' => $modelData
            ]);
        } catch (\Exception $e) {
            Log::error("Error getting LiveJasmin model stats for id $id: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve model stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate bonuses for a specific model
     *
     * @param int $id
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function calculateModelBonuses($id, Request $request)
    {
        try {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            // Use current period if not specified
            if (!$startDate || !$endDate) {
                $period = $this->getCurrentPeriodData();
                $startDate = $period['start_date'];
                $endDate = $period['end_date'];
            }

            $score = ModelLivejasminScore::where('modacc_id', $id)
                ->where('modlj_period_start', '<=', $endDate)
                ->where('modlj_period_end', '>=', $startDate)
                ->first();

            if (!$score) {
                return response()->json([
                    'success' => false,
                    'message' => 'No data found for this model in the specified period'
                ], 404);
            }

            // Get detailed qualifications using local logic
            $qualifications = $this->getBonusQualifications($score);
            $bonuses = $this->calculateBonuses($score);

            $bonusData = [
                'model_id' => $score->modacc_id,
                'bonus_5_percent' => [
                    'qualifications' => $qualifications['qualifications'],
                    'qualifies_for_bonus' => $qualifications['qualifies_for_bonus_5'],
                    'bonus_amount' => $bonuses['bonus_5_percent'],
                    'criteria' => $qualifications['criteria']
                ],
                'bonus_10_percent' => [
                    'qualifications' => $qualifications['qualifications'],
                    'qualifies_for_bonus' => $qualifications['qualifies_for_bonus_10'],
                    'bonus_amount' => $bonuses['bonus_10_percent'],
                    'criteria' => $qualifications['criteria']
                ],
                'metrics' => [
                    'hours_preview' => $score->modlj_hours_preview,
                    'score_traffic' => $score->modlj_score_traffic,
                    'score_conversion' => $score->modlj_score_conversion,
                    'score_engagement' => $score->modlj_score_engagement,
                    'new_members' => $score->modlj_new_members,
                    'average_hour' => $score->modlj_average_hour,
                    'earnings_usd' => $score->modlj_earnings_usd,
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $bonusData
            ]);
        } catch (\Exception $e) {
            Log::error("Error calculating LiveJasmin bonuses for model id $id: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to calculate model bonuses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get statistics summary for dashboard
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStatsSummary(Request $request)
    {
        try {
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            // Use current period if not specified
            if (!$startDate || !$endDate) {
                $period = $this->getCurrentPeriodData();
                $startDate = $period['start_date'];
                $endDate = $period['end_date'];
            }

            $scores = ModelLivejasminScore::with(['modelAccount.studioModel'])
                ->where('modlj_period_start', '=', $startDate)
                ->where('modlj_period_end', '=', $endDate)
                ->get();

            $totalModels = $scores->count();
            $totalEarnings = $scores->sum('modlj_earnings_usd');
            $totalHours = $scores->sum('modlj_hours_connection');

            $models5Percent = $scores->filter(function ($score) {
                $qualifications = $this->getBonusQualifications($score);
                return $qualifications['qualifies_for_bonus_5'];
            })->count();

            $models10Percent = $scores->filter(function ($score) {
                $qualifications = $this->getBonusQualifications($score);
                return $qualifications['qualifies_for_bonus_10'];
            })->count();

            $stats = [
                'total_models' => $totalModels,
                'total_earnings' => round($totalEarnings, 2),
                'total_hours' => round($totalHours, 2),
                'average_earnings_per_model' => $totalModels > 0 ? round($totalEarnings / $totalModels, 2) : 0,
                'average_hours_per_model' => $totalModels > 0 ? round($totalHours / $totalModels, 2) : 0,
                'models_qualifying_5_percent' => $models5Percent,
                'models_qualifying_10_percent' => $models10Percent,
                'qualification_rate_5_percent' => $totalModels > 0 ? round(($models5Percent / $totalModels) * 100, 2) : 0,
                'qualification_rate_10_percent' => $totalModels > 0 ? round(($models10Percent / $totalModels) * 100, 2) : 0,
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error("Error getting LiveJasmin stats summary: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve stats summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current period data from database
     *
     * @return array
     */
    private function getCurrentPeriodData(): array
    {
        $latestScore = ModelLivejasminScore::orderBy('modlj_period_end', 'desc')->first();

        if ($latestScore) {
            return [
                'start_date' => $latestScore->modlj_period_start,
                'end_date' => $latestScore->modlj_period_end,
            ];
        }

        // Fallback to current month
        $now = Carbon::now();
        return [
            'start_date' => $now->copy()->startOfMonth()->format('Y-m-d'),
            'end_date' => $now->copy()->endOfMonth()->format('Y-m-d'),
        ];
    }

    /**
     * Calculate bonus percentages based on model performance
     *
     * @param ModelLivejasminScore|null $score
     * @return array
     */
    private function calculateBonuses($score): array
    {
        $bonuses = [
            'bonus_5_percent' => 0,
            'bonus_10_percent' => 0,
        ];

        if (!$score || !$score->modlj_earnings_usd) {
            return $bonuses;
        }

        $earningsUsd = $score->modlj_earnings_usd;

        // Criteria for bonuses
        $qualifies_hours_preview = $score->modlj_hours_preview >= 13;
        $qualifies_score_traffic = $score->modlj_score_traffic >= 60;
        $qualifies_score_conversion = $score->modlj_score_conversion >= 75;
        $qualifies_score_engagement = $score->modlj_score_engagement >= 30;
        $qualifies_new_members = $score->modlj_new_members >= 25;
        $qualifies_hot_deals = $score->modlj_hot_deals >= 150;
        $qualifies_hours_total_connection = $score->modlj_hours_total_connection >= 100;
        // Dynamic limit based on total connection hours
        $hours_member_other_limit = $score->modlj_hours_total_connection >= 120 ? 4 : 3;
        $qualifies_hours_member_other = $score->modlj_hours_member_other <= $hours_member_other_limit;
        $qualifies_average_hour_5 = $score->modlj_average_hour >= 20;
        $qualifies_average_hour_10 = $score->modlj_average_hour >= 30;

        // 5% bonus: all conditions including $20 average hour
        if (
            $qualifies_hours_preview &&
            $qualifies_score_traffic &&
            $qualifies_score_conversion &&
            $qualifies_score_engagement &&
            $qualifies_new_members &&
            $qualifies_hot_deals &&
            $qualifies_hours_total_connection &&
            $qualifies_hours_member_other &&
            $qualifies_average_hour_5
        ) {
            $bonuses['bonus_5_percent'] = round($earningsUsd * 0.05, 2);
        }

        // 10% bonus: same conditions but with $30 average hour
        if (
            $qualifies_hours_preview &&
            $qualifies_score_traffic &&
            $qualifies_score_conversion &&
            $qualifies_score_engagement &&
            $qualifies_new_members &&
            $qualifies_hot_deals &&
            $qualifies_hours_total_connection &&
            $qualifies_hours_member_other &&
            $qualifies_average_hour_10
        ) {
            $bonuses['bonus_10_percent'] = round($earningsUsd * 0.1, 2);
        }

        return $bonuses;
    }

    /**
     * Get detailed bonus qualifications for a model
     *
     * @param ModelLivejasminScore|null $score
     * @return array
     */
    private function getBonusQualifications($score): array
    {
        if (!$score) {
            return [
                'qualifications' => [
                    'hours_preview' => false,
                    'score_traffic' => false,
                    'score_conversion' => false,
                    'score_engagement' => false,
                    'new_members' => false,
                    'hot_deals' => false,
                    'hours_total_connection' => false,
                    'hours_member_other' => false,
                    'average_hour_5' => false,
                    'average_hour_10' => false,
                ],
                'qualifies_for_bonus_5' => false,
                'qualifies_for_bonus_10' => false,
                'criteria' => [
                    'hours_preview_target' => 13,
                    'score_traffic_target' => 60,
                    'score_conversion_target' => 75,
                    'score_engagement_target' => 30,
                    'new_members_target' => 25,
                    'hot_deals_target' => 150,
                    'hours_total_connection_target' => 100,
                    'hours_member_other_target' => 3, // Default when no score available
                    'average_hour_5_target' => 20,
                    'average_hour_10_target' => 30,
                ]
            ];
        }

        $qualifies_hours_preview = $score->modlj_hours_preview >= 13;
        $qualifies_score_traffic = $score->modlj_score_traffic >= 60;
        $qualifies_score_conversion = $score->modlj_score_conversion >= 75;
        $qualifies_score_engagement = $score->modlj_score_engagement >= 30;
        $qualifies_new_members = $score->modlj_new_members >= 25;
        $qualifies_hot_deals = $score->modlj_hot_deals >= 150;
        $qualifies_hours_total_connection = $score->modlj_hours_total_connection >= 100;
        // Dynamic limit based on total connection hours
        $hours_member_other_limit = $score->modlj_hours_total_connection >= 120 ? 4 : 3;
        $qualifies_hours_member_other = $score->modlj_hours_member_other <= $hours_member_other_limit;
        $qualifies_average_hour_5 = $score->modlj_average_hour >= 20;
        $qualifies_average_hour_10 = $score->modlj_average_hour >= 30;

        $qualifies_for_bonus_5 =
            $qualifies_hours_preview &&
            $qualifies_score_traffic &&
            $qualifies_score_conversion &&
            $qualifies_score_engagement &&
            $qualifies_new_members &&
            $qualifies_hot_deals &&
            $qualifies_hours_total_connection &&
            $qualifies_hours_member_other &&
            $qualifies_average_hour_5;

        $qualifies_for_bonus_10 =
            $qualifies_hours_preview &&
            $qualifies_score_traffic &&
            $qualifies_score_conversion &&
            $qualifies_score_engagement &&
            $qualifies_new_members &&
            $qualifies_hot_deals &&
            $qualifies_hours_total_connection &&
            $qualifies_hours_member_other &&
            $qualifies_average_hour_10;

        return [
            'qualifications' => [
                'hours_preview' => $qualifies_hours_preview,
                'score_traffic' => $qualifies_score_traffic,
                'score_conversion' => $qualifies_score_conversion,
                'score_engagement' => $qualifies_score_engagement,
                'new_members' => $qualifies_new_members,
                'hot_deals' => $qualifies_hot_deals,
                'hours_total_connection' => $qualifies_hours_total_connection,
                'hours_member_other' => $qualifies_hours_member_other,
                'average_hour_5' => $qualifies_average_hour_5,
                'average_hour_10' => $qualifies_average_hour_10,
            ],
            'qualifies_for_bonus_5' => $qualifies_for_bonus_5,
            'qualifies_for_bonus_10' => $qualifies_for_bonus_10,
            'criteria' => [
                'hours_preview_target' => 13,
                'score_traffic_target' => 60,
                'score_conversion_target' => 75,
                'score_engagement_target' => 30,
                'new_members_target' => 25,
                'hot_deals_target' => 150,
                'hours_total_connection_target' => 100,
                'hours_member_other_target' => $hours_member_other_limit,
                'average_hour_5_target' => 20,
                'average_hour_10_target' => 30,
            ]
        ];
    }

    /**
     * Get performance data for models assigned to a specific monitor
     *
     * @param int $monitorId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMonitorModelsPerformance($monitorId, Request $request)
    {
        try {
            $periodStart = $request->input('period_start');
            $periodEnd = $request->input('period_end');

            // Use current period if not specified
            if (!$periodStart || !$periodEnd) {
                $period = $this->getCurrentPeriodData();
                $periodStart = $period['start_date'];
                $periodEnd = $period['end_date'];
            }

            // Get models assigned to this monitor using the monitors relations
            $monitorModels = DB::table('users_users')
                ->where('userparent_id', $monitorId)
                ->pluck('userchild_id');

            if ($monitorModels->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'message' => 'No models assigned to this monitor'
                ]);
            }

            // Get LiveJasmin scores for these models
            $scores = ModelLivejasminScore::with(['modelAccount.studioModel.userModel'])
                ->whereHas('modelAccount.studioModel', function ($q) use ($monitorModels) {
                    $q->whereIn('user_id_model', $monitorModels);
                })
                ->where('modlj_period_start', '<=', $periodEnd)
                ->where('modlj_period_end', '>=', $periodStart)
                ->get();

            $data = $scores->map(function ($score) {
                $bonuses = $this->calculateBonuses($score);
                $qualifications = $this->getBonusQualifications($score);

                return [
                    'id' => $score->modelAccount->modacc_id ?? null,
                    'model_name' => $score->modelAccount->studioModel->userModel->user_name ?? 'Unknown',
                    'modacc_id' => $score->modelAccount->modacc_id ?? null,
                    'modlj_hours_connection' => $score->modlj_hours_connection,
                    'modlj_hours_preview' => $score->modlj_hours_preview,
                    'modlj_score_traffic' => $score->modlj_score_traffic,
                    'modlj_score_conversion' => $score->modlj_score_conversion,
                    'modlj_score_engagement' => $score->modlj_score_engagement,
                    'modlj_new_members' => $score->modlj_new_members,
                    'modlj_average_hour' => $score->modlj_average_hour,
                    'modlj_earnings_usd' => $score->modlj_earnings_usd,
                    'qualifies_hours_connection' => $score->modlj_hours_connection >= 100,
                    'qualifies_hours_preview' => $qualifications['qualifications']['hours_preview'],
                    'qualifies_score_traffic' => $qualifications['qualifications']['score_traffic'],
                    'qualifies_score_conversion' => $qualifications['qualifications']['score_conversion'],
                    'qualifies_score_engagement' => $qualifications['qualifications']['score_engagement'],
                    'qualifies_new_members' => $qualifications['qualifications']['new_members'],
                    'qualifies_average_hour' => $qualifications['qualifications']['average_hour_5'],
                    'qualifies_for_bonus_5' => $qualifications['qualifies_for_bonus_5'],
                    'qualifies_for_bonus_10' => $qualifications['qualifies_for_bonus_10'],
                    'bonus_type' => $qualifications['qualifies_for_bonus_10'] ? 'Bono 10%' : ($qualifications['qualifies_for_bonus_5'] ? 'Bono 5%' : 'Ninguno'),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            Log::error("LiveJasmin get monitor $monitorId models error: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve monitor models performance data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get accumulated stats for models assigned to a specific monitor
     *
     * @param int $monitorId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMonitorAccumulatedStats($monitorId, Request $request)
    {
        try {
            $periodStart = $request->input('period_start');
            $periodEnd = $request->input('period_end');

            // Use current period if not specified
            if (!$periodStart || !$periodEnd) {
                $period = $this->getCurrentPeriodData();
                $periodStart = $period['start_date'];
                $periodEnd = $period['end_date'];
            }

            // Get models assigned to this monitor
            $monitorModels = DB::table('users_users')
                ->where('userparent_id', $monitorId)
                ->pluck('userchild_id');

            if ($monitorModels->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'total_earnings' => 0,
                        'total_hours_connection' => 0,
                        'average_per_hour' => 0,
                        'models_with_bonus' => 0,
                        'total_models' => 0
                    ]
                ]);
            }

            // Get LiveJasmin scores for these models
            $scores = ModelLivejasminScore::whereHas('modelAccount.studioModel', function ($q) use ($monitorModels) {
                $q->whereIn('user_id_model', $monitorModels);
            })
                ->where('modlj_period_start', '<=', $periodEnd)
                ->where('modlj_period_end', '>=', $periodStart)
                ->get();

            // Calculate accumulated stats
            $totalEarnings = $scores->sum('modlj_earnings_usd');
            $totalHours = $scores->sum('modlj_hours_connection');
            $averagePerHour = $totalHours > 0 ? $totalEarnings / $totalHours : 0;

            // Count models with bonus
            $modelsWithBonus = $scores->filter(function ($score) {
                $qualifications = $this->getBonusQualifications($score);
                return $qualifications['qualifies_for_bonus_5'] || $qualifications['qualifies_for_bonus_10'];
            })->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_earnings' => round($totalEarnings, 2),
                    'total_hours_connection' => $totalHours,
                    'average_per_hour' => round($averagePerHour, 2),
                    'models_with_bonus' => $modelsWithBonus,
                    'total_models' => $scores->count()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("LiveJasmin get monitor $monitorId accumulated stats error: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve monitor accumulated stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get modacc_id from user_id for model redirection
     *
     * @param int $userId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getModelAccountByUserId($userId, Request $request)
    {
        try {
            // Find the model account for this user that has LiveJasmin data
            $modelAccount = DB::table('models_accounts')
                ->join('studios_models', 'studios_models.stdmod_id', '=', 'models_accounts.stdmod_id')
                ->join('models_livejasmin_scores', 'models_livejasmin_scores.modacc_id', '=', 'models_accounts.modacc_id')
                ->where('studios_models.user_id_model', $userId)
                ->where('models_accounts.modacc_app', 'LiveJasmin') // Only LiveJasmin accounts
                ->select('models_accounts.modacc_id')
                ->first();

            if (!$modelAccount) {
                return response()->json([
                    'success' => false,
                    'message' => 'No LiveJasmin account found for this user. Please contact your administrator to set up a LiveJasmin account.'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'modacc_id' => $modelAccount->modacc_id
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Error getting model account for user $userId: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve model account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update model performance data (placeholder for now)
     *
     * @param int $modaccId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateModelPerformance($modaccId, Request $request)
    {
        try {
            // For now, just return success as this would typically sync with external API
            // In a real implementation, this would call the LiveJasmin API to get fresh data
            Log::info("Update model performance called for modacc_id: $modaccId");

            return response()->json([
                'success' => true,
                'message' => 'Performance data update initiated',
                'data' => [
                    'modacc_id' => $modaccId,
                    'status' => 'updated'
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Error updating model performance for modacc_id $modaccId: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to update model performance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sync API data only for a specific period (no scraping)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function syncApiForPeriod(Request $request)
    {
        try {
            $request->validate([
                'fromDate' => 'required|date',
                'toDate' => 'required|date|after_or_equal:fromDate',
            ]);

            $fromDate = $request->input('fromDate');
            $toDate = $request->input('toDate');

            Log::info("API sync requested for period: $fromDate to $toDate");

            $livejasminService = new LivejasminService();
            $result = $livejasminService->syncApiForPeriod($fromDate, $toDate);

            Log::info('API sync result', $result);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => $result['message'],
                    'data' => [
                        'updated_models' => $result['updated_models'],
                        'period' => [
                            'from_date' => $fromDate,
                            'to_date' => $toDate
                        ]
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                    'data' => [
                        'updated_models' => $result['updated_models']
                    ]
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error("Error syncing API data for period: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to sync API data: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Manually approve or reject a bonus for a model
     *
     * @param int $modaccId
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function approveBonus($modaccId, Request $request)
    {
        try {
            $request->validate([
                'bonus_type' => 'required|in:5,10',
                'approved' => 'required|boolean',
                'period_start' => 'required|date',
                'period_end' => 'required|date',
            ]);

            $uAuth = $request->user();
            
            // validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            $bonusType = $request->input('bonus_type');
            $approved = $request->input('approved');
            $periodStart = $request->input('period_start');
            $periodEnd = $request->input('period_end');

            // Find the model score for the specified period
            $score = ModelLivejasminScore::where('modacc_id', $modaccId)
                ->where('modlj_period_start', '<=', $periodEnd)
                ->where('modlj_period_end', '>=', $periodStart)
                ->first();

            if (!$score) {
                return response()->json([
                    'success' => false,
                    'message' => 'No performance data found for this model in the specified period'
                ], 404);
            }

            // Get model account info for logging
            $modelAccount = ModelAccount::find($modaccId);
            
            // Store old values for logging
            $oldScore = clone $score;

            // Update the appropriate bonus field
            $fieldName = $bonusType == '5' ? 'modlj_bonus_5_percent' : 'modlj_bonus_10_percent';
            $score->$fieldName = $approved;
            $score->save();

            // Log the action in system log
            $this->log::storeLog(
                $uAuth, 
                'models_livejasmin_scores', 
                $score->modlj_id, 
                'UPDATE', 
                $oldScore, 
                $score, 
                $request->ip()
            );

            // Log the action
            Log::info("Manual bonus approval: Model {$modaccId}, Bonus {$bonusType}%, Approved: " . ($approved ? 'Yes' : 'No') . " by user {$uAuth->user_id}");

            return response()->json([
                'success' => true,
                'message' => 'Bonus approval updated successfully',
                'data' => [
                    'modacc_id' => $modaccId,
                    'bonus_type' => $bonusType . '%',
                    'approved' => $approved,
                    'period' => [
                        'start' => $score->modlj_period_start,
                        'end' => $score->modlj_period_end
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Error approving bonus for model {$modaccId}: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to update bonus approval',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download Excel template with model payment usernames for manual data upload
     *
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function downloadTemplate(Request $request)
    {
        try {
            $request->validate([
                'period_start' => 'required|date',
                'period_end' => 'required|date|after_or_equal:period_start',
            ]);

            $periodStart = $request->input('period_start');
            $periodEnd = $request->input('period_end');

            // Get all models with scores for the selected period
            $scores = ModelLivejasminScore::with('modelAccount')
                ->where('modlj_period_start', $periodStart)
                ->where('modlj_period_end', $periodEnd)
                ->get();

            // Sort scores alphabetically by payment_username
            $scores = $scores->sortBy(function($score) {
                return $score->modelAccount ? strtolower($score->modelAccount->modacc_payment_username) : '';
            });

            // Create Excel file
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Set headers
            $sheet->setCellValue('A1', 'payment_username');
            $sheet->setCellValue('B1', 'hot_deals');
            $sheet->setCellValue('C1', 'new_members');

            // Style headers
            $sheet->getStyle('A1:C1')->getFont()->setBold(true);
            $sheet->getStyle('A1:C1')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FFD3D3D3');

            // Add model data with current values
            $row = 2;
            foreach ($scores as $score) {
                if ($score->modelAccount) {
                    $sheet->setCellValue('A' . $row, $score->modelAccount->modacc_payment_username);
                    $sheet->setCellValue('B' . $row, $score->modlj_hot_deals ?? 0); // Current hot_deals value
                    $sheet->setCellValue('C' . $row, $score->modlj_new_members ?? 0); // Current new_members value
                    $row++;
                }
            }

            // Auto-size columns
            foreach (range('A', 'C') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }

            // Freeze first row (headers)
            $sheet->freezePane('A2');

            // Generate filename
            $filename = 'livejasmin_manual_data_' . $periodStart . '_' . $periodEnd . '.xlsx';
            $tempFile = storage_path('app/temp/' . $filename);

            // Create temp directory if it doesn't exist
            if (!file_exists(storage_path('app/temp'))) {
                mkdir(storage_path('app/temp'), 0755, true);
            }

            // Save to temp file
            $writer = new Xlsx($spreadsheet);
            $writer->save($tempFile);

            Log::info("Excel template generated for period {$periodStart} to {$periodEnd}");

            return response()->download($tempFile, $filename)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            Log::error("Error generating Excel template: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al generar la plantilla',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload and process manual data from Excel file
     *
     * @param UploadLivejasminManualDataRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadManualData(UploadLivejasminManualDataRequest $request)
    {
        try {
            $periodStart = $request->input('period_start');
            $periodEnd = $request->input('period_end');
            $file = $request->file('file');

            Log::info("Manual data upload started for period {$periodStart} to {$periodEnd}");

            // Create importer instance
            $import = new LivejasminScraperDataImport($periodStart, $periodEnd);

            // Import the file
            Excel::import($import, $file);

            // Get results
            $results = $import->getResults();

            Log::info('Manual data upload completed', [
                'updated_count' => count($results['updated']),
                'not_processed_count' => count($results['not_processed'])
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Datos cargados exitosamente',
                'data' => [
                    'updated' => $results['updated'],
                    'not_processed' => $results['not_processed'],
                    'summary' => [
                        'total_updated' => count($results['updated']),
                        'total_not_processed' => count($results['not_processed'])
                    ]
                ]
            ]);

        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = $e->failures();
            $errors = [];

            foreach ($failures as $failure) {
                $errors[] = [
                    'row' => $failure->row(),
                    'attribute' => $failure->attribute(),
                    'errors' => $failure->errors(),
                    'values' => $failure->values()
                ];
            }

            Log::error('Excel validation failed', ['errors' => $errors]);

            return response()->json([
                'success' => false,
                'message' => 'Error de validación en el archivo Excel',
                'errors' => $errors
            ], 422);

        } catch (\Exception $e) {
            Log::error("Error uploading manual data: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al procesar el archivo',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
