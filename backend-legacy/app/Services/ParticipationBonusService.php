<?php

namespace App\Services;

use App\Models\ModelLivejasminScore;
use App\Models\ModelAccount;
use App\Models\StudioModel;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ParticipationBonusService
{
    // Constantes de participación base
    const BASE_ON_SITE = 50;
    const BASE_SATELLITE = 70;

    // Constantes de modificadores
    const PENALTY_ON_SITE_HOURS_80 = -5;
    const PENALTY_SATELLITE_HOURS_60 = -10;
    const BONUS_ON_SITE_TOOLS_100H = 10;
    const BONUS_ON_SITE_REVENUE_100H = 10;
    const BONUS_ON_SITE_REVENUE_80H = 5;
    const BONUS_SATELLITE_TOOLS_100H = 5;
    const BONUS_CONVERSION = 10;
    const WELCOME_BONUS_PARTICIPATION = 90;

    /**
     * Evaluar participación completa de un modelo
     *
     * @param ModelLivejasminScore $score
     * @param int|null $modaccId
     * @return array
     */
    public function evaluateModelParticipation(ModelLivejasminScore $score, $modaccId = null): array
    {
        try {
            // Obtener datos del modelo del estudio
            $modaccId = $modaccId ?? $score->modacc_id;
            $modelAccount = ModelAccount::with('studioModel')->find($modaccId);

            if (!$modelAccount || !$modelAccount->studioModel) {
                Log::warning('ParticipationBonusService: No studio model found', [
                    'modacc_id' => $modaccId
                ]);
                return $this->getEmptyResult('Studio model not found');
            }

            $studioModel = $modelAccount->studioModel;

            // 1. Determinar tipo de modelo
            $modelType = $this->determineModelType($studioModel);

            // 2. Verificar si es modelo nuevo (bono de bienvenida)
            $welcomeBonusCheck = $this->checkWelcomeBonus($studioModel, $score);
            if ($welcomeBonusCheck['qualifies']) {
                return $this->buildWelcomeBonusResult($modelType, $welcomeBonusCheck, $score);
            }

            // 3. Establecer participación base
            $baseParticipation = $modelType === 'on_site' ? self::BASE_ON_SITE : self::BASE_SATELLITE;

            // 4. Evaluar penalidades
            $penalties = $this->evaluatePenalties($score, $modelType);

            // 5. Evaluar bonos
            $bonuses = $this->evaluateBonuses($score, $modelType);

            // 6. Verificar bono de conversión
            $conversionBonus = $this->checkConversionBonus($bonuses);

            // 7. Calcular participación final
            $finalParticipation = $this->calculateFinalParticipation(
                $baseParticipation,
                $penalties,
                $bonuses,
                $conversionBonus
            );

            // Calcular monto del bono basado en ganancias
            $earnings = (float) ($score->modlj_earnings_usd ?? 0);
            $bonusAmount = $this->calculateBonusAmount($earnings, $baseParticipation, $finalParticipation);

            // Preparar respuesta para UI
            $appliedPenalties = array_filter($penalties, fn($p) => $p['applies']);
            $appliedBonus = $this->getAppliedBonus($bonuses);
            $availableBonuses = $this->prepareAvailableBonuses($bonuses, $appliedBonus);

            return [
                'success' => true,
                'model_type' => $modelType,
                'model_type_label' => $modelType === 'on_site' ? 'Modelo en Sede' : 'Modelo Satélite',
                'base_participation' => $baseParticipation,
                'final_participation' => $finalParticipation,
                'bonus_percentage' => $finalParticipation - $baseParticipation,
                'bonus_amount' => $bonusAmount,
                'earnings_usd' => $earnings,
                'penalties' => array_values($appliedPenalties),
                'bonuses' => array_values($bonuses),
                'applied_bonus' => $appliedBonus,
                'available_bonuses' => array_values($availableBonuses),
                'has_welcome_bonus' => false,
                'welcome_bonus' => [
                    'applies' => false,
                    'meets_hours' => false,
                    'participation' => null
                ],
                'has_conversion_bonus' => $conversionBonus['qualifies'],
                'conversion_bonus' => [
                    'qualifies' => $conversionBonus['qualifies'],
                    'modifier' => $conversionBonus['modifier'],
                    'modifier_percentage' => $conversionBonus['modifier'],
                    'reason' => $conversionBonus['reason']
                ],
                'summary' => $this->buildSummary($baseParticipation, $penalties, $bonuses, $conversionBonus, $finalParticipation)
            ];

        } catch (\Exception $e) {
            Log::error('ParticipationBonusService: Error evaluating participation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->getEmptyResult($e->getMessage());
        }
    }

    /**
     * Determinar si el modelo es en sede o satélite
     */
    public function determineModelType(StudioModel $studioModel): string
    {
        $contractType = $studioModel->stdmod_contract_type;
        return ($contractType === 'MANDANTE - MODELO') ? 'on_site' : 'satellite';
    }

    /**
     * Verificar si aplica bono de bienvenida (primer período)
     * El bono de bienvenida aplica si es el primer período del modelo.
     * Si cumple 100 horas = 90%, si no cumple = 50%
     */
    private function checkWelcomeBonus(StudioModel $studioModel, ModelLivejasminScore $score): array
    {
        // Verificar si es el primer período del modelo
        $previousPeriodsCount = ModelLivejasminScore::where('modacc_id', $score->modacc_id)
            ->where('modlj_period_start', '<', $score->modlj_period_start)
            ->count();

        $isFirstPeriod = $previousPeriodsCount === 0;

        if (!$isFirstPeriod) {
            return [
                'qualifies' => false,
                'reason' => 'No es el primer período del modelo',
                'criteria' => []
            ];
        }

        // Verificar requisitos: 100 horas libres
        $freeHours = $this->calculateFreeHours($score);
        $meetsHoursRequirement = $freeHours >= 100;

        // El bono de bienvenida califica si es el primer período
        // La participación será 90% si cumple horas, 50% si no
        $qualifies = $isFirstPeriod;

        return [
            'qualifies' => $qualifies,
            'meets_hours' => $meetsHoursRequirement,
            'reason' => $qualifies
                ? ($meetsHoursRequirement
                    ? 'Modelo nuevo califica para bono de bienvenida completo (90%)'
                    : 'Modelo nuevo califica para bono de bienvenida parcial (50%)')
                : 'No es el primer período del modelo',
            'criteria' => [
                [
                    'name' => 'Primer período',
                    'target' => 'Sí',
                    'actual' => $isFirstPeriod ? 'Sí' : 'No',
                    'met' => $isFirstPeriod
                ],
                [
                    'name' => 'Horas libres (para 90%)',
                    'target' => 100,
                    'actual' => round($freeHours, 2),
                    'met' => $meetsHoursRequirement,
                    'operator' => '>='
                ]
            ]
        ];
    }

    /**
     * Evaluar penalidades según tipo de modelo
     */
    private function evaluatePenalties(ModelLivejasminScore $score, string $modelType): array
    {
        $penalties = [];
        $freeHours = $this->calculateFreeHours($score);

        if ($modelType === 'on_site') {
            // Penalidad por no cumplir 80 horas (en sede)
            $requiredHours = 80;
            $meetsRequirement = $freeHours >= $requiredHours;
            $penalties[] = [
                'id' => 'penalty_on_site_hours_80',
                'code' => 'penalty_on_site_hours_80',
                'label' => 'No cumplimiento de 80 horas',
                'name' => 'No cumplimiento de 80 horas',
                'modifier' => self::PENALTY_ON_SITE_HOURS_80,
                'modifier_percentage' => self::PENALTY_ON_SITE_HOURS_80,
                'applies' => !$meetsRequirement,
                'current_hours' => round($freeHours, 2),
                'required_hours' => $requiredHours,
                'reason' => !$meetsRequirement
                    ? "Solo tienes " . round($freeHours, 1) . "h libres de las {$requiredHours}h requeridas"
                    : null,
                'criteria' => [
                    [
                        'name' => 'Horas conexión (libres)',
                        'target' => $requiredHours,
                        'actual' => round($freeHours, 2),
                        'met' => $meetsRequirement,
                        'operator' => '>='
                    ]
                ]
            ];
        } else {
            // Penalidad por no cumplir 60 horas (satélite)
            $requiredHours = 60;
            $meetsRequirement = $freeHours >= $requiredHours;
            $penalties[] = [
                'id' => 'penalty_satellite_hours_60',
                'code' => 'penalty_satellite_hours_60',
                'label' => 'No cumplimiento de 60 horas',
                'name' => 'No cumplimiento de 60 horas',
                'modifier' => self::PENALTY_SATELLITE_HOURS_60,
                'modifier_percentage' => self::PENALTY_SATELLITE_HOURS_60,
                'applies' => !$meetsRequirement,
                'current_hours' => round($freeHours, 2),
                'required_hours' => $requiredHours,
                'reason' => !$meetsRequirement
                    ? "Solo tienes " . round($freeHours, 1) . "h libres de las {$requiredHours}h requeridas"
                    : null,
                'criteria' => [
                    [
                        'name' => 'Horas conexión (libres)',
                        'target' => $requiredHours,
                        'actual' => round($freeHours, 2),
                        'met' => $meetsRequirement,
                        'operator' => '>='
                    ]
                ]
            ];
        }

        return $penalties;
    }

    /**
     * Evaluar bonos según tipo de modelo
     */
    private function evaluateBonuses(ModelLivejasminScore $score, string $modelType): array
    {
        $bonuses = [];

        if ($modelType === 'on_site') {
            // Bono +10% por herramientas eficientes (100h + criterios + $30/h)
            $toolsBonus = $this->evaluateToolsBonus($score, 100, 30);
            $bonuses[] = [
                'id' => 'bonus_on_site_tools_100h',
                'code' => 'bonus_on_site_tools_100h',
                'label' => 'Uso eficiente herramientas (100h)',
                'name' => '+10% Uso eficiente herramientas',
                'description' => 'Bono por uso eficiente del tiempo y herramientas: 100 horas de conexión, 13 horas de preview, scores de tráfico/conversión/compromiso, 150 ofertas especiales y $30/hora de promedio.',
                'modifier' => self::BONUS_ON_SITE_TOOLS_100H,
                'modifier_percentage' => self::BONUS_ON_SITE_TOOLS_100H,
                'qualifies' => $toolsBonus['qualifies'],
                'criteria' => $this->transformCriteriaForUI($toolsBonus['criteria']),
                'criteria_met' => $toolsBonus['criteria_met'],
                'criteria_total' => $toolsBonus['total_criteria'],
                'total_criteria' => $toolsBonus['total_criteria']
            ];

            // Bono +10% por ingresos (100h + $5000)
            $revenueBonus100h = $this->evaluateRevenueBonus($score, 100, 5000);
            $bonuses[] = [
                'id' => 'bonus_on_site_revenue_100h',
                'code' => 'bonus_on_site_revenue_100h',
                'label' => 'Ingresos generados (100h)',
                'name' => '+10% Ingresos generados (100h)',
                'description' => 'Bono por facturación: 100 horas de conexión y $5,000 USD de ganancias. Este bono no requiere cumplir los otros indicadores de herramientas.',
                'modifier' => self::BONUS_ON_SITE_REVENUE_100H,
                'modifier_percentage' => self::BONUS_ON_SITE_REVENUE_100H,
                'qualifies' => $revenueBonus100h['qualifies'],
                'criteria' => $this->transformCriteriaForUI($revenueBonus100h['criteria']),
                'criteria_met' => $revenueBonus100h['criteria_met'],
                'criteria_total' => $revenueBonus100h['total_criteria'],
                'total_criteria' => $revenueBonus100h['total_criteria']
            ];

            // Bono +5% por ingresos (80h + $5000)
            $revenueBonus80h = $this->evaluateRevenueBonus($score, 80, 5000);
            $bonuses[] = [
                'id' => 'bonus_on_site_revenue_80h',
                'code' => 'bonus_on_site_revenue_80h',
                'label' => 'Ingresos generados (80h)',
                'name' => '+5% Ingresos generados (80h)',
                'description' => 'Bono por facturación: 80 horas de conexión y $5,000 USD de ganancias.',
                'modifier' => self::BONUS_ON_SITE_REVENUE_80H,
                'modifier_percentage' => self::BONUS_ON_SITE_REVENUE_80H,
                'qualifies' => $revenueBonus80h['qualifies'],
                'criteria' => $this->transformCriteriaForUI($revenueBonus80h['criteria']),
                'criteria_met' => $revenueBonus80h['criteria_met'],
                'criteria_total' => $revenueBonus80h['total_criteria'],
                'total_criteria' => $revenueBonus80h['total_criteria']
            ];
        } else {
            // Bono +5% para satélites (herramientas + 25 nuevos miembros)
            $satelliteBonus = $this->evaluateSatelliteToolsBonus($score);
            $bonuses[] = [
                'id' => 'bonus_satellite_tools_100h',
                'code' => 'bonus_satellite_tools_100h',
                'label' => 'Uso eficiente herramientas (Satélite)',
                'name' => '+5% Uso eficiente herramientas',
                'description' => 'Bono para satélites por uso eficiente: 100 horas, 13h preview, scores requeridos, 150 ofertas, 25 nuevos miembros y $25/hora promedio.',
                'modifier' => self::BONUS_SATELLITE_TOOLS_100H,
                'modifier_percentage' => self::BONUS_SATELLITE_TOOLS_100H,
                'qualifies' => $satelliteBonus['qualifies'],
                'criteria' => $this->transformCriteriaForUI($satelliteBonus['criteria']),
                'criteria_met' => $satelliteBonus['criteria_met'],
                'criteria_total' => $satelliteBonus['total_criteria'],
                'total_criteria' => $satelliteBonus['total_criteria']
            ];
        }

        return $bonuses;
    }

    /**
     * Transformar criterios al formato esperado por la UI
     */
    private function transformCriteriaForUI(array $criteria): array
    {
        return array_map(function ($criterion) {
            $unit = $this->determineUnitFromCriterion($criterion);

            return [
                'label' => $criterion['name'],
                'current_value' => $criterion['actual'],
                'required_value' => $criterion['target'],
                'met' => $criterion['met'],
                'unit' => $unit,
                'operator' => $criterion['operator'] ?? '>=',
                'description' => $criterion['note'] ?? null
            ];
        }, $criteria);
    }

    /**
     * Determinar la unidad de medida basada en el criterio
     */
    private function determineUnitFromCriterion(array $criterion): string
    {
        $name = strtolower($criterion['name']);

        if (str_contains($name, 'hora') || str_contains($name, 'hour') || str_contains($name, 'conexión') || str_contains($name, 'preview')) {
            return 'hours';
        }

        if (str_contains($name, 'score') || str_contains($name, '%') || isset($criterion['unit']) && $criterion['unit'] === '%') {
            return 'percentage';
        }

        if (str_contains($name, 'ganancia') || str_contains($name, 'earning') || str_contains($name, 'promedio') || str_contains($name, 'usd')) {
            return 'currency';
        }

        return 'count';
    }

    /**
     * Obtener el bono aplicado (el más alto que califique)
     */
    private function getAppliedBonus(array $bonuses): ?array
    {
        $appliedBonus = null;
        $highestModifier = 0;

        foreach ($bonuses as $bonus) {
            if ($bonus['qualifies'] && $bonus['modifier'] > $highestModifier) {
                $appliedBonus = $bonus;
                $highestModifier = $bonus['modifier'];
            }
        }

        return $appliedBonus;
    }

    /**
     * Preparar array de bonos disponibles con flag is_applied
     */
    private function prepareAvailableBonuses(array $bonuses, ?array $appliedBonus): array
    {
        return array_map(function ($bonus) use ($appliedBonus) {
            $isApplied = $appliedBonus && $bonus['id'] === $appliedBonus['id'];
            return array_merge($bonus, ['is_applied' => $isApplied]);
        }, $bonuses);
    }

    /**
     * Evaluar bono de herramientas eficientes
     */
    private function evaluateToolsBonus(ModelLivejasminScore $score, float $hoursRequired, float $avgHourRequired): array
    {
        $freeHours = $this->calculateFreeHours($score);
        $memberOtherLimit = ($score->modlj_hours_total_connection ?? 0) >= 120 ? 4 : 3;
        $memberOtherHours = (float) ($score->modlj_hours_member_other ?? 0);

        $criteria = [
            [
                'name' => 'Horas conexión (libres)',
                'target' => $hoursRequired,
                'actual' => round($freeHours, 2),
                'met' => $freeHours >= $hoursRequired,
                'operator' => '>='
            ],
            [
                'name' => 'Horas miembro/otros',
                'target' => $memberOtherLimit,
                'actual' => round($memberOtherHours, 2),
                'met' => $memberOtherHours <= $memberOtherLimit,
                'operator' => '<=',
                'note' => $memberOtherLimit === 4 ? 'Límite extendido por +120h' : null
            ],
            [
                'name' => 'Horas Pre VIP Show',
                'target' => 13,
                'actual' => round((float) ($score->modlj_hours_preview ?? 0), 2),
                'met' => ($score->modlj_hours_preview ?? 0) >= 13,
                'operator' => '>='
            ],
            [
                'name' => 'Score Tráfico',
                'target' => 60,
                'actual' => (float) ($score->modlj_score_traffic ?? 0),
                'met' => ($score->modlj_score_traffic ?? 0) >= 60,
                'operator' => '>=',
                'unit' => '%'
            ],
            [
                'name' => 'Score Conversión',
                'target' => 75,
                'actual' => (float) ($score->modlj_score_conversion ?? 0),
                'met' => ($score->modlj_score_conversion ?? 0) >= 75,
                'operator' => '>=',
                'unit' => '%'
            ],
            [
                'name' => 'Score Compromiso',
                'target' => 30,
                'actual' => (float) ($score->modlj_score_engagement ?? 0),
                'met' => ($score->modlj_score_engagement ?? 0) >= 30,
                'operator' => '>=',
                'unit' => '%'
            ],
            [
                'name' => 'Ofertas Especiales',
                'target' => 150,
                'actual' => (int) ($score->modlj_offers_initiated ?? 0),
                'met' => ($score->modlj_offers_initiated ?? 0) >= 150,
                'operator' => '>='
            ],
            [
                'name' => 'Promedio/Hora',
                'target' => $avgHourRequired,
                'actual' => round((float) ($score->modlj_average_hour ?? 0), 2),
                'met' => ($score->modlj_average_hour ?? 0) >= $avgHourRequired,
                'operator' => '>=',
                'unit' => 'USD'
            ]
        ];

        $criteriaMet = collect($criteria)->filter(fn($c) => $c['met'])->count();
        $qualifies = $criteriaMet === count($criteria);

        return [
            'qualifies' => $qualifies,
            'criteria' => $criteria,
            'criteria_met' => $criteriaMet,
            'total_criteria' => count($criteria)
        ];
    }

    /**
     * Evaluar bono por ingresos
     */
    private function evaluateRevenueBonus(ModelLivejasminScore $score, float $hoursRequired, float $earningsRequired): array
    {
        $freeHours = $this->calculateFreeHours($score);
        $earnings = (float) ($score->modlj_earnings_usd ?? 0);

        $criteria = [
            [
                'name' => 'Horas conexión (libres)',
                'target' => $hoursRequired,
                'actual' => round($freeHours, 2),
                'met' => $freeHours >= $hoursRequired,
                'operator' => '>='
            ],
            [
                'name' => 'Ganancias USD',
                'target' => $earningsRequired,
                'actual' => round($earnings, 2),
                'met' => $earnings >= $earningsRequired,
                'operator' => '>=',
                'unit' => 'USD'
            ]
        ];

        $criteriaMet = collect($criteria)->filter(fn($c) => $c['met'])->count();
        $qualifies = $criteriaMet === count($criteria);

        return [
            'qualifies' => $qualifies,
            'criteria' => $criteria,
            'criteria_met' => $criteriaMet,
            'total_criteria' => count($criteria)
        ];
    }

    /**
     * Evaluar bono de herramientas para satélites
     */
    private function evaluateSatelliteToolsBonus(ModelLivejasminScore $score): array
    {
        // Usar criterios base con $25/h promedio
        $base = $this->evaluateToolsBonus($score, 100, 25);

        // Agregar requisito de nuevos miembros
        $newMembersCriteria = [
            'name' => 'Nuevos Miembros',
            'target' => 25,
            'actual' => (int) ($score->modlj_new_members ?? 0),
            'met' => ($score->modlj_new_members ?? 0) >= 25,
            'operator' => '>='
        ];

        $base['criteria'][] = $newMembersCriteria;
        $base['total_criteria']++;

        if ($newMembersCriteria['met']) {
            $base['criteria_met']++;
        }

        $base['qualifies'] = $base['criteria_met'] === $base['total_criteria'];

        return $base;
    }

    /**
     * Verificar bono de conversión
     */
    private function checkConversionBonus(array $bonuses): array
    {
        // Bono de conversión aplica si califica para tools o revenue bonuses principales
        $qualifyingCodes = [
            'bonus_on_site_tools_100h',
            'bonus_on_site_revenue_100h',
            'bonus_satellite_tools_100h'
        ];

        $qualifies = false;
        $qualifyingBonus = null;

        foreach ($bonuses as $bonus) {
            if (in_array($bonus['code'], $qualifyingCodes) && $bonus['qualifies']) {
                $qualifies = true;
                $qualifyingBonus = $bonus['name'];
                break;
            }
        }

        return [
            'qualifies' => $qualifies,
            'modifier' => self::BONUS_CONVERSION,
            'reason' => $qualifies
                ? "Califica por: {$qualifyingBonus}"
                : 'No califica para bonos principales'
        ];
    }

    /**
     * Calcular participación final
     */
    private function calculateFinalParticipation(
        float $baseParticipation,
        array $penalties,
        array $bonuses,
        array $conversionBonus
    ): float {
        $participation = $baseParticipation;

        // Aplicar todas las penalidades (se acumulan)
        foreach ($penalties as $penalty) {
            if ($penalty['applies']) {
                $participation += $penalty['modifier'];
            }
        }

        // Aplicar solo el bono más alto (NO se acumulan)
        $highestBonus = 0;
        foreach ($bonuses as $bonus) {
            if ($bonus['qualifies'] && $bonus['modifier'] > $highestBonus) {
                $highestBonus = $bonus['modifier'];
            }
        }
        $participation += $highestBonus;

        // Aplicar bono de conversión
        if ($conversionBonus['qualifies']) {
            $participation += $conversionBonus['modifier'];
        }

        // Limitar entre 0 y 100
        return max(0, min(100, $participation));
    }

    /**
     * Calcular horas libres (total - miembro/otros)
     */
    private function calculateFreeHours(ModelLivejasminScore $score): float
    {
        $totalHours = (float) ($score->modlj_hours_connection ?? 0);
        $memberOtherHours = (float) ($score->modlj_hours_member_other ?? 0);
        return $totalHours - $memberOtherHours;
    }

    /**
     * Calcular monto del bono basado en ganancias
     */
    private function calculateBonusAmount(float $earnings, float $baseParticipation, float $finalParticipation): float
    {
        $bonusPercentage = $finalParticipation - $baseParticipation;
        if ($bonusPercentage <= 0) {
            return 0;
        }
        return round(($earnings * $bonusPercentage) / 100, 2);
    }

    /**
     * Construir resultado para bono de bienvenida
     */
    private function buildWelcomeBonusResult(string $modelType, array $welcomeCheck, ModelLivejasminScore $score): array
    {
        $baseParticipation = $modelType === 'on_site' ? self::BASE_ON_SITE : self::BASE_SATELLITE;
        $earnings = (float) ($score->modlj_earnings_usd ?? 0);

        // Usar meets_hours directamente del welcomeCheck
        $meetsHours = $welcomeCheck['meets_hours'] ?? false;

        // Si no cumple las horas, participación es 50% en lugar de 90%
        $finalParticipation = $meetsHours ? self::WELCOME_BONUS_PARTICIPATION : self::BASE_ON_SITE;
        $bonusPercentage = $finalParticipation - $baseParticipation;
        $bonusAmount = round(($earnings * max(0, $bonusPercentage)) / 100, 2);

        return [
            'success' => true,
            'model_type' => $modelType,
            'model_type_label' => $modelType === 'on_site' ? 'Modelo en Sede' : 'Modelo Satélite',
            'base_participation' => $baseParticipation,
            'final_participation' => $finalParticipation,
            'bonus_percentage' => $bonusPercentage,
            'bonus_amount' => $bonusAmount,
            'earnings_usd' => $earnings,
            'penalties' => [],
            'bonuses' => [],
            'applied_bonus' => null,
            'available_bonuses' => [],
            'has_welcome_bonus' => true,
            'welcome_bonus' => [
                'applies' => true,
                'qualifies' => true,
                'meets_hours' => $meetsHours,
                'participation' => $finalParticipation,
                'criteria' => $welcomeCheck['criteria']
            ],
            'has_conversion_bonus' => false,
            'conversion_bonus' => [
                'qualifies' => false,
                'modifier' => 0,
                'modifier_percentage' => 0
            ],
            'summary' => [
                [
                    'type' => 'base',
                    'label' => 'Base (' . ($modelType === 'on_site' ? 'En Sede' : 'Satélite') . ')',
                    'value' => $baseParticipation,
                    'icon' => 'account_balance'
                ],
                [
                    'type' => 'welcome',
                    'label' => 'Bono de Bienvenida' . ($meetsHours ? '' : ' (Parcial)'),
                    'value' => $bonusPercentage >= 0 ? '+' . $bonusPercentage : $bonusPercentage,
                    'icon' => 'celebration',
                    'color' => $meetsHours ? 'purple' : 'amber'
                ],
                [
                    'type' => 'total',
                    'label' => 'TOTAL',
                    'value' => $finalParticipation,
                    'icon' => 'functions'
                ]
            ]
        ];
    }

    /**
     * Construir resumen de participación
     */
    private function buildSummary(
        float $baseParticipation,
        array $penalties,
        array $bonuses,
        array $conversionBonus,
        float $finalParticipation
    ): array {
        $summary = [];

        // Base
        $summary[] = [
            'type' => 'base',
            'label' => 'Base',
            'value' => $baseParticipation,
            'icon' => 'account_balance'
        ];

        // Penalidades aplicadas
        foreach ($penalties as $penalty) {
            if ($penalty['applies']) {
                $summary[] = [
                    'type' => 'penalty',
                    'label' => $penalty['name'],
                    'value' => $penalty['modifier'],
                    'icon' => 'remove_circle',
                    'color' => 'negative'
                ];
            }
        }

        // Bono más alto aplicado
        $appliedBonus = null;
        $highestModifier = 0;
        foreach ($bonuses as $bonus) {
            if ($bonus['qualifies'] && $bonus['modifier'] > $highestModifier) {
                $appliedBonus = $bonus;
                $highestModifier = $bonus['modifier'];
            }
        }

        if ($appliedBonus) {
            $summary[] = [
                'type' => 'bonus',
                'label' => $appliedBonus['name'],
                'value' => '+' . $appliedBonus['modifier'],
                'icon' => 'add_circle',
                'color' => 'positive'
            ];
        }

        // Bono de conversión
        if ($conversionBonus['qualifies']) {
            $summary[] = [
                'type' => 'conversion',
                'label' => 'Bono de Conversión',
                'value' => '+' . $conversionBonus['modifier'],
                'icon' => 'trending_up',
                'color' => 'info'
            ];
        }

        // Total
        $summary[] = [
            'type' => 'total',
            'label' => 'TOTAL',
            'value' => $finalParticipation,
            'icon' => 'functions'
        ];

        return $summary;
    }

    /**
     * Resultado vacío en caso de error
     */
    private function getEmptyResult(string $error = null): array
    {
        return [
            'success' => false,
            'error' => $error,
            'model_type' => null,
            'model_type_label' => null,
            'base_participation' => 0,
            'final_participation' => 0,
            'bonus_percentage' => 0,
            'bonus_amount' => 0,
            'earnings_usd' => 0,
            'penalties' => [],
            'bonuses' => [],
            'has_welcome_bonus' => false,
            'has_conversion_bonus' => false,
            'summary' => []
        ];
    }

    /**
     * Obtener resumen de participación para dashboard
     */
    public function getDashboardSummary(string $periodStart, string $periodEnd, int $studioId = null): array
    {
        try {
            $query = ModelLivejasminScore::where('modlj_period_start', $periodStart)
                ->where('modlj_period_end', $periodEnd);

            if ($studioId) {
                $query->whereHas('modelAccount.studioModel', function ($q) use ($studioId) {
                    $q->where('std_id', $studioId);
                });
            }

            $scores = $query->get();
            $results = [];

            foreach ($scores as $score) {
                $evaluation = $this->evaluateModelParticipation($score);
                if ($evaluation['success']) {
                    $results[] = [
                        'modacc_id' => $score->modacc_id,
                        'model_type' => $evaluation['model_type'],
                        'base_participation' => $evaluation['base_participation'],
                        'final_participation' => $evaluation['final_participation'],
                        'bonus_percentage' => $evaluation['bonus_percentage'],
                        'bonus_amount' => $evaluation['bonus_amount'],
                        'has_penalty' => collect($evaluation['penalties'])->contains('applies', true),
                        'has_bonus' => collect($evaluation['bonuses'])->contains('qualifies', true),
                        'has_welcome_bonus' => $evaluation['has_welcome_bonus'],
                        'has_conversion_bonus' => $evaluation['has_conversion_bonus']
                    ];
                }
            }

            // Calcular estadísticas
            $totalModels = count($results);
            $onSiteModels = collect($results)->where('model_type', 'on_site')->count();
            $satelliteModels = collect($results)->where('model_type', 'satellite')->count();
            $modelsWithBonus = collect($results)->where('has_bonus', true)->count();
            $modelsWithPenalty = collect($results)->where('has_penalty', true)->count();
            $totalBonusAmount = collect($results)->sum('bonus_amount');
            $avgParticipation = $totalModels > 0 ? collect($results)->avg('final_participation') : 0;

            return [
                'success' => true,
                'period' => [
                    'start' => $periodStart,
                    'end' => $periodEnd
                ],
                'stats' => [
                    'total_models' => $totalModels,
                    'on_site_models' => $onSiteModels,
                    'satellite_models' => $satelliteModels,
                    'models_with_bonus' => $modelsWithBonus,
                    'models_with_penalty' => $modelsWithPenalty,
                    'total_bonus_amount' => round($totalBonusAmount, 2),
                    'average_participation' => round($avgParticipation, 2)
                ],
                'models' => $results
            ];

        } catch (\Exception $e) {
            Log::error('ParticipationBonusService: Error getting dashboard summary', [
                'error' => $e->getMessage()
            ]);
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
