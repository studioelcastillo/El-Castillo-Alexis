<?php

namespace App\Services;

use App\Models\LivejasminBonusType;
use App\Models\LivejasminBonusCriteria;
use App\Models\ModelLivejasminScore;
use App\Models\ModelLivejasminScoreBonus;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class LivejasminBonusService
{
    /**
     * Get all active bonus types
     *
     * @param string|null $profile
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getActiveBonusTypes($profile = null)
    {
        $query = LivejasminBonusType::active()->with('criteria');

        if ($profile) {
            $query->forProfile($profile);
        }

        return $query->orderBy('ljbt_percentage', 'desc')->get();
    }

    /**
     * Calculate dynamic bonuses for a model using the microservice
     *
     * @param ModelLivejasminScore $score
     * @param string $modelUsername
     * @return array
     */
    public function calculateDynamicBonuses(ModelLivejasminScore $score, $modelUsername = null): array
    {
        try {
            // Use the LivejasminService to calculate dynamic bonuses via microservice
            $livejasminService = new \App\Services\LivejasminService();
            $result = $livejasminService->calculateDynamicBonuses($score, $modelUsername);

            if ($result['success']) {
                return $result['data'];
            } else {
                Log::warning('Microservice calculation failed, falling back to local calculation', [
                    'model_username' => $modelUsername,
                    'error' => $result['message']
                ]);

                // Fallback to local calculation
                return $this->calculateDynamicBonusesLocal($score);
            }
        } catch (\Exception $e) {
            Log::error('Error calculating dynamic bonuses: ' . $e->getMessage());

            // Fallback to local calculation
            return $this->calculateDynamicBonusesLocal($score);
        }
    }

    /**
     * Calculate dynamic bonuses locally (fallback method)
     *
     * @param ModelLivejasminScore $score
     * @return array
     */
    private function calculateDynamicBonusesLocal(ModelLivejasminScore $score, $modelUsername = null): array
    {
        try {
            $bonusTypes = $this->getActiveBonusTypes();
            $result = [
                'legacy_bonuses' => $this->getLegacyBonuses($score),
                'dynamic_bonuses' => [],
                'total_bonus_percentage' => 0,
                'total_bonus_amount' => 0,
                'qualifying_bonuses_count' => 0
            ];

            foreach ($bonusTypes as $bonusType) {
                $bonusEvaluation = $this->evaluateBonusQualification($score, $bonusType);

                $bonusData = [
                    'id' => $bonusType->ljbt_id,
                    'name' => $bonusType->ljbt_name,
                    'description' => $bonusType->ljbt_description,
                    'percentage' => $bonusType->ljbt_percentage,
                    'qualified' => $bonusEvaluation['qualifies'],
                    'criteria_met' => $bonusEvaluation['criteria_met'],
                    'total_criteria' => $bonusEvaluation['total_criteria'],
                    'criteria_results' => $bonusEvaluation['evaluation_details'],
                    'amount' => 0
                ];

                if ($bonusEvaluation['qualifies']) {
                    $bonusData['amount'] = ($score->modlj_earnings_usd * $bonusType->ljbt_percentage) / 100;
                    $result['total_bonus_percentage'] += $bonusType->ljbt_percentage;
                    $result['total_bonus_amount'] += $bonusData['amount'];
                    $result['qualifying_bonuses_count']++;
                }

                $result['dynamic_bonuses'][] = $bonusData;
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('Error in local dynamic bonus calculation: ' . $e->getMessage());
            return [
                'legacy_bonuses' => $this->getLegacyBonuses($score),
                'dynamic_bonuses' => [],
                'total_bonus_percentage' => 0,
                'total_bonus_amount' => 0,
                'qualifying_bonuses_count' => 0
            ];
        }
    }

    /**
     * Evaluate if a model score qualifies for a specific bonus type
     *
     * @param ModelLivejasminScore $score
     * @param LivejasminBonusType $bonusType
     * @return array
     */
    public function evaluateBonusQualification(ModelLivejasminScore $score, LivejasminBonusType $bonusType): array
    {
        $criteria = json_decode($bonusType->ljbt_criteria, true) ?? [];
        $evaluationDetails = [];
        $criteriaMet = 0;
        $totalCriteria = count($criteria);

        foreach ($criteria as $criterion) {
            $result = $this->evaluateSingleCriterionArray($score, $criterion);
            $evaluationDetails[] = $result;

            if ($result['met']) {
                $criteriaMet++;
            }
        }

        // Check if all criteria are met
        $qualifies = ($criteriaMet === $totalCriteria) && ($totalCriteria > 0);

        return [
            'qualifies' => $qualifies,
            'criteria_met' => $criteriaMet,
            'total_criteria' => $totalCriteria,
            'evaluation_details' => $evaluationDetails
        ];
    }

    /**
     * Evaluate a single criterion against model score (from array)
     *
     * @param ModelLivejasminScore $score
     * @param array $criterion
     * @return array
     */
    private function evaluateSingleCriterionArray(ModelLivejasminScore $score, array $criterion): array
    {
        $field = $criterion['field'];
        $operator = $criterion['operator'];
        $targetValue = $criterion['value'];

        // Get the actual value from the score
        $actualValue = $this->getScoreValueByField($score, $field);

        // Evaluate the condition
        $met = $this->evaluateCondition($actualValue, $operator, $targetValue);

        return [
            'field' => $field,
            'operator' => $operator,
            'value' => $targetValue,
            'actual_value' => $actualValue,
            'met' => $met
        ];
    }

    /**
     * Get value from model score using field name
     *
     * @param ModelLivejasminScore $score
     * @param string $field
     * @return mixed
     */
    private function getScoreValueByField(ModelLivejasminScore $score, string $field)
    {
        // Map field names to model attributes
        $fieldMapping = [
            'hours_previewed' => 'modlj_hours_preview',
            'hours_connection' => 'modlj_hours_connection',
            'hours_total_connection' => 'modlj_hours_total_connection',
            'hours_member_other' => 'modlj_hours_member_other',
            'traffic_score' => 'modlj_score_traffic',
            'conversion_score' => 'modlj_score_conversion',
            'engagement_score' => 'modlj_score_engagement',
            'new_members' => 'modlj_new_members',
            'hot_deals' => 'modlj_hot_deals',
            'average_hourly_earnings' => 'modlj_average_hour',
            'total_earnings' => 'modlj_earnings_usd',
            'offers_initiated' => 'modlj_offers_initiated'
        ];

        $modelAttribute = $fieldMapping[$field] ?? $field;

        if (isset($score->{$modelAttribute})) {
            return $score->{$modelAttribute};
        }

        Log::warning('LivejasminBonusService: Unknown field mapping', [
            'field' => $field,
            'model_attribute' => $modelAttribute
        ]);

        return 0;
    }

    /**
     * Get legacy bonuses (5% and 10% bonuses from LiveJasmin)
     *
     * @param ModelLivejasminScore $score
     * @return array
     */
    private function getLegacyBonuses(ModelLivejasminScore $score): array
    {
        $legacyBonuses = [];

        if ($score->modlj_bonus_5_percent) {
            $legacyBonuses[] = [
                'type' => '5% Bonus',
                'percentage' => 5,
                'amount' => ($score->modlj_earnings_usd * 5) / 100
            ];
        }

        if ($score->modlj_bonus_10_percent) {
            $legacyBonuses[] = [
                'type' => '10% Bonus',
                'percentage' => 10,
                'amount' => ($score->modlj_earnings_usd * 10) / 100
            ];
        }

        return $legacyBonuses;
    }

    /**
     * Evaluate a condition based on operator
     *
     * @param mixed $actualValue
     * @param string $operator
     * @param mixed $targetValue
     * @return bool
     */
    private function evaluateCondition($actualValue, string $operator, $targetValue): bool
    {
        switch ($operator) {
            case '>=':
                return $actualValue >= $targetValue;
            case '<=':
                return $actualValue <= $targetValue;
            case '>':
                return $actualValue > $targetValue;
            case '<':
                return $actualValue < $targetValue;
            case '=':
            case '==':
                return $actualValue == $targetValue;
            case '!=':
            case 'neq':
                return $actualValue != $targetValue;
            default:
                Log::warning('LivejasminBonusService: Unknown operator', ['operator' => $operator]);
                return false;
        }
    }

    /**
     * Store or update model bonus record
     *
     * @param ModelLivejasminScore $score
     * @param LivejasminBonusType $bonusType
     * @param array $qualification
     * @param float $bonusAmount
     * @return ModelLivejasminScoreBonus
     */
    private function storeModelBonus(
        ModelLivejasminScore $score,
        LivejasminBonusType $bonusType,
        array $qualification,
        float $bonusAmount
    ): ModelLivejasminScoreBonus {
        return ModelLivejasminScoreBonus::updateOrCreate(
            [
                'modlj_id' => $score->modlj_id,
                'ljbt_id' => $bonusType->ljbt_id
            ],
            [
                'mlsb_qualifies' => $qualification['qualifies'],
                'mlsb_bonus_amount' => $bonusAmount,
                'mlsb_evaluation_details' => json_encode($qualification['evaluation_details']),
                'mlsb_evaluated_at' => now()
            ]
        );
    }



    /**
     * Calculate bonuses in legacy format for backward compatibility
     *
     * @param ModelLivejasminScore $score
     * @return array
     */
    public function getLegacyBonusQualifications(ModelLivejasminScore $score): array
    {
        $dynamicBonuses = $this->calculateDynamicBonuses($score);
        $legacyBonuses = [
            'bonus_5_percent' => 0,
            'bonus_10_percent' => 0
        ];

        foreach ($dynamicBonuses['bonuses'] as $bonusName => $bonusData) {
            if (strpos(strtolower($bonusName), '5') !== false) {
                $legacyBonuses['bonus_5_percent'] = $bonusData['bonus_amount'];
            } elseif (strpos(strtolower($bonusName), '10') !== false) {
                $legacyBonuses['bonus_10_percent'] = $bonusData['bonus_amount'];
            }
        }

        return $legacyBonuses;
    }

    /**
     * Sync bonus calculations for all scores in a period
     *
     * @param string $periodStart
     * @param string $periodEnd
     * @return array
     */
    public function syncBonusesForPeriod(string $periodStart, string $periodEnd): array
    {
        $scores = ModelLivejasminScore::where('modlj_period_start', $periodStart)
            ->where('modlj_period_end', $periodEnd)
            ->get();

        $processed = 0;
        $errors = 0;

        foreach ($scores as $score) {
            try {
                $this->calculateDynamicBonuses($score);
                $processed++;
            } catch (\Exception $e) {
                $errors++;
                Log::error('Error calculating bonuses for score', [
                    'modlj_id' => $score->modlj_id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return [
            'total_scores' => $scores->count(),
            'processed' => $processed,
            'errors' => $errors
        ];
    }

    /**
     * Get model performance data for a specific period
     *
     * @param int $modelId
     * @param string $periodStart
     * @param string $periodEnd
     * @return ModelLivejasminScore|null
     */
    public function getModelPerformanceData($modelId, $periodStart, $periodEnd)
    {
        return ModelLivejasminScore::where('modacc_id', $modelId)
            ->where('modlj_period_start', '>=', $periodStart)
            ->where('modlj_period_end', '<=', $periodEnd)
            ->orderBy('modlj_period_start', 'desc')
            ->first();
    }

    /**
     * Get model's current value for a specific criteria
     *
     * @param ModelLivejasminScore $modelPerformance
     * @param LivejasminBonusCriteria $criteria
     * @return mixed
     */
    public function getModelValueForCriteria($modelPerformance, $criteria)
    {
        // Map JSON paths to model attributes
        $jsonPathMapping = [
            // jQuery-style paths
            '$.performance.screen_name' => 'modlj_screen_name',
            '$.performance.earnings_usd' => 'modlj_earnings_usd',
            '$.performance.hours_connection' => 'modlj_hours_connection',
            '$.performance.hours_preview' => 'modlj_hours_preview',
            '$.performance.score_traffic' => 'modlj_score_traffic',
            '$.performance.score_conversion' => 'modlj_score_conversion',
            '$.performance.score_engagement' => 'modlj_score_engagement',
            '$.performance.offers_initiated' => 'modlj_offers_initiated',
            '$.performance.new_members' => 'modlj_new_members',
            '$.performance.average_hour' => 'modlj_average_hour',
            '$.performance.hours_total_connection' => 'modlj_hours_total_connection',
            '$.performance.earnings_private_chat' => 'modlj_earnings_private_chat',
            '$.performance.earnings_video_voice_call' => 'modlj_earnings_video_voice_call',
            '$.performance.earnings_cam2cam' => 'modlj_earnings_cam2cam',
            '$.performance.earnings_surprise' => 'modlj_earnings_surprise',
            '$.performance.earnings_message' => 'modlj_earnings_message',
            '$.performance.earnings_interactive_toy' => 'modlj_earnings_interactive_toy',
            '$.performance.earnings_bonus' => 'modlj_earnings_bonus',
            '$.performance.earnings_other' => 'modlj_earnings_other',
            '$.performance.earnings_my_content' => 'modlj_earnings_my_content',

            // Data-style paths (used in database)
            'data.performance.screen_name' => 'modlj_screen_name',
            'data.performance.earnings_usd' => 'modlj_earnings_usd',
            'data.performance.hours_connection' => 'modlj_hours_connection',
            'data.performance.hours_preview' => 'modlj_hours_preview',
            'data.performance.score_traffic' => 'modlj_score_traffic',
            'data.performance.score_conversion' => 'modlj_score_conversion',
            'data.performance.score_engagement' => 'modlj_score_engagement',
            'data.performance.offers_initiated' => 'modlj_offers_initiated',
            'data.performance.new_members' => 'modlj_new_members',
            'data.performance.average_hour' => 'modlj_average_hour',
            'data.performance.hours_total_connection' => 'modlj_hours_total_connection',
            'data.performance.earnings_private_chat' => 'modlj_earnings_private_chat',
            'data.performance.earnings_video_voice_call' => 'modlj_earnings_video_voice_call',
            'data.performance.earnings_cam2cam' => 'modlj_earnings_cam2cam',
            'data.performance.earnings_surprise' => 'modlj_earnings_surprise',
            'data.performance.earnings_message' => 'modlj_earnings_message',
            'data.performance.earnings_interactive_toy' => 'modlj_earnings_interactive_toy',
            'data.performance.earnings_bonus' => 'modlj_earnings_bonus',
            'data.performance.earnings_other' => 'modlj_earnings_other',
            'data.performance.earnings_my_content' => 'modlj_earnings_my_content',

            // Special paths for earnings and scores
            'data.total.earnings.value' => 'modlj_earnings_usd',
            'data.score' => 'modlj_score_conversion'
        ];

        $jsonPath = $criteria->ljbc_json_path;

        \Log::info('Mapping criteria value', [
            'json_path' => $jsonPath,
            'mapped_attribute' => $jsonPathMapping[$jsonPath] ?? 'NOT_FOUND',
            'model_performance_keys' => array_keys($modelPerformance->getAttributes())
        ]);

        if (isset($jsonPathMapping[$jsonPath])) {
            $attribute = $jsonPathMapping[$jsonPath];
            $value = $modelPerformance->{$attribute} ?? 0;

            \Log::info('Found mapped value', [
                'attribute' => $attribute,
                'value' => $value
            ]);

            return $value;
        }

        \Log::warning('No mapping found for JSON path', ['json_path' => $jsonPath]);
        // If no mapping found, return 0
        return 0;
    }

    /**
     * Evaluate if criteria is met
     *
     * @param mixed $currentValue
     * @param string $operator
     * @param mixed $targetValue
     * @return bool
     */
    public function evaluateCriteria($currentValue, $operator, $targetValue)
    {
        $currentValue = (float) $currentValue;
        $targetValue = (float) $targetValue;

        switch ($operator) {
            case '>=':
                return $currentValue >= $targetValue;
            case '<=':
                return $currentValue <= $targetValue;
            case '>':
                return $currentValue > $targetValue;
            case '<':
                return $currentValue < $targetValue;
            case '=':
            case '==':
                return $currentValue == $targetValue;
            case '!=':
            case 'neq':
                return $currentValue != $targetValue;
            default:
                return false;
        }
    }
}
