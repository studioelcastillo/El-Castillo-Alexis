<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\LivejasminBonusService;
use App\Models\LivejasminBonusType;
use App\Models\ModelLivejasminScore;
use App\Models\User;
use Carbon\Carbon;

class TestDynamicBonuses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bonuses:test {--model-id=} {--period=} {--username=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the dynamic bonus calculation system';

    protected $bonusService;

    public function __construct(LivejasminBonusService $bonusService)
    {
        parent::__construct();
        $this->bonusService = $bonusService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Iniciando prueba del sistema de bonos dinámicos...');
        
        // Obtener parámetros
        $modelId = $this->option('model-id');
        $period = $this->option('period') ?? Carbon::now()->format('Y-m');
        $username = $this->option('username');
        
        // Si no se especifica modelo, usar el primero disponible
        if (!$modelId && !$username) {
            $model = User::whereHas('studioModel.modelsAccounts.livejasminScores')->first();
            if (!$model) {
                $this->error('❌ No se encontraron modelos con scores de LiveJasmin');
                return 1;
            }
            $modelId = $model->user_id;
            $username = $model->user_name;
        } elseif ($username && !$modelId) {
            $model = User::where('user_name', $username)->first();
            if (!$model) {
                $this->error("❌ No se encontró el modelo con username: {$username}");
                return 1;
            }
            $modelId = $model->user_id;
        } elseif ($modelId && !$username) {
            $model = User::find($modelId);
            if (!$model) {
                $this->error("❌ No se encontró el modelo con ID: {$modelId}");
                return 1;
            }
            $username = $model->user_name;
        }
        
        $this->info("📊 Probando bonos para modelo: {$username} (ID: {$modelId}) - Período: {$period}");
        
        // Verificar que existan tipos de bonos activos
        $activeBonusTypes = LivejasminBonusType::where('ljbt_active', true)->get();
        if ($activeBonusTypes->isEmpty()) {
            $this->warn('⚠️  No hay tipos de bonos activos configurados');
            $this->createSampleBonusTypes();
            $activeBonusTypes = LivejasminBonusType::where('ljbt_active', true)->get();
        }
        
        $this->info("✅ Encontrados {$activeBonusTypes->count()} tipos de bonos activos:");
        foreach ($activeBonusTypes as $bonusType) {
            $this->line("   - {$bonusType->ljbt_name}: {$bonusType->ljbt_percentage}%");
        }
        
        // Verificar que existan scores para el modelo
         $score = ModelLivejasminScore::whereHas('modelAccount.studioModel', function($query) use ($modelId) {
                 $query->where('user_id_model', $modelId);
             })
             ->whereRaw("CONCAT(EXTRACT(YEAR FROM modlj_period_start), '-', LPAD(EXTRACT(MONTH FROM modlj_period_start)::text, 2, '0')) = ?", [$period])
             ->first();
            
        if (!$score) {
             $this->warn("⚠️  No se encontraron scores para el modelo en el período {$period}");
             $this->createSampleScore($modelId, $period);
             $score = ModelLivejasminScore::whereHas('modelAccount.studioModel', function($query) use ($modelId) {
                     $query->where('user_id_model', $modelId);
                 })
                 ->whereRaw("CONCAT(EXTRACT(YEAR FROM modlj_period_start), '-', LPAD(EXTRACT(MONTH FROM modlj_period_start)::text, 2, '0')) = ?", [$period])
                 ->first();
         }
        
        $this->info('📈 Datos del modelo:');
         $this->line("   - Horas transmitidas: {$score->modlj_hours_preview}");
         $this->line("   - Score de tráfico: {$score->modlj_score_traffic}");
         $this->line("   - Score de conversión: {$score->modlj_score_conversion}");
         $this->line("   - Score de engagement: {$score->modlj_score_engagement}");
         $this->line("   - Nuevos miembros: {$score->modlj_new_members}");
         $this->line("   - Ganancias promedio por hora: $" . number_format($score->modlj_average_hour, 2));
        
        // Calcular bonos
        $this->info('🔄 Calculando bonos dinámicos...');
        
        try {
            $result = $this->bonusService->calculateDynamicBonuses($score, $username);
            
            $this->info('✅ Cálculo completado exitosamente!');
            $this->displayResults($result);
            
        } catch (\Exception $e) {
            $this->error("❌ Error al calcular bonos: {$e->getMessage()}");
            $this->line("Stack trace: {$e->getTraceAsString()}");
            return 1;
        }
        
        return 0;
    }
    
    private function displayResults($result)
    {
        $this->info('📊 Resultados del cálculo de bonos:');
        $this->line('');
        
        if (!$result || !is_array($result)) {
            $this->error('❌ No se pudieron obtener resultados válidos del cálculo de bonos');
            return;
        }
        
        // Bonos legacy
        if (!empty($result['legacy_bonuses']) && is_array($result['legacy_bonuses'])) {
            $this->info('🏆 Bonos Legacy:');
            foreach ($result['legacy_bonuses'] as $bonus) {
                if (is_array($bonus) && isset($bonus['type'], $bonus['percentage'], $bonus['amount'])) {
                    $this->line("   - {$bonus['type']}: {$bonus['percentage']}% ($" . number_format($bonus['amount'], 2) . ")");
                } else {
                    $this->line("   - Bono legacy: " . json_encode($bonus));
                }
            }
        } else {
            $this->info('🏆 Bonos Legacy: Ninguno');
        }
        
        // Bonos dinámicos
        if (!empty($result['dynamic_bonuses']) && is_array($result['dynamic_bonuses'])) {
            $this->info('⚡ Bonos Dinámicos:');
            foreach ($result['dynamic_bonuses'] as $bonus) {
                if (is_array($bonus) && isset($bonus['qualified'], $bonus['name'], $bonus['percentage'], $bonus['amount'])) {
                    $status = $bonus['qualified'] ? '✅' : '❌';
                    $this->line("   {$status} {$bonus['name']}: {$bonus['percentage']}% ($" . number_format($bonus['amount'], 2) . ")");
                    if (!empty($bonus['criteria_results']) && is_array($bonus['criteria_results'])) {
                        foreach ($bonus['criteria_results'] as $criteria) {
                            if (is_array($criteria) && isset($criteria['met'], $criteria['field'], $criteria['operator'], $criteria['value'], $criteria['actual_value'])) {
                                $criteriaStatus = $criteria['met'] ? '✓' : '✗';
                                $this->line("      {$criteriaStatus} {$criteria['field']} {$criteria['operator']} {$criteria['value']} (actual: {$criteria['actual_value']})");
                            }
                        }
                    }
                } else {
                    $this->line("   - Bono dinámico: " . json_encode($bonus));
                }
            }
        } else {
            $this->info('⚡ Bonos Dinámicos: Ninguno');
        }
        
        $this->line('');
        $this->info("💰 Total de bonos calificados: " . ($result['qualifying_bonuses_count'] ?? 0));
        $this->info("📈 Porcentaje total de bonos: " . ($result['total_bonus_percentage'] ?? 0) . "%");
        $this->info("💵 Monto total de bonos: $" . number_format($result['total_bonus_amount'] ?? 0, 2));
    }
    
    private function createSampleBonusTypes()
    {
        $this->info('🔧 Creando tipos de bonos de ejemplo...');
        
        $bonusTypes = [
            [
                'name' => 'Bono de Productividad',
                'description' => 'Bono por mantener altas horas de transmisión',
                'bonus_percentage' => 5.0,
                'criteria' => [
                    [
                        'field' => 'hours_previewed',
                        'operator' => '>=',
                        'value' => 100
                    ]
                ]
            ],
            [
                'name' => 'Bono de Excelencia',
                'description' => 'Bono por scores altos en múltiples métricas',
                'bonus_percentage' => 10.0,
                'criteria' => [
                    [
                        'field' => 'traffic_score',
                        'operator' => '>=',
                        'value' => 80
                    ],
                    [
                        'field' => 'conversion_score',
                        'operator' => '>=',
                        'value' => 75
                    ],
                    [
                        'field' => 'engagement_score',
                        'operator' => '>=',
                        'value' => 70
                    ]
                ]
            ],
            [
                'name' => 'Bono de Nuevos Miembros',
                'description' => 'Bono por atraer nuevos miembros',
                'bonus_percentage' => 7.5,
                'criteria' => [
                    [
                        'field' => 'new_members',
                        'operator' => '>=',
                        'value' => 50
                    ]
                ]
            ]
        ];
        
        foreach ($bonusTypes as $bonusData) {
            LivejasminBonusType::create([
                'ljbt_name' => $bonusData['name'],
                'ljbt_description' => $bonusData['description'],
                'ljbt_percentage' => $bonusData['bonus_percentage'],
                'ljbt_active' => true
            ]);
        }
        
        $this->info('✅ Tipos de bonos de ejemplo creados');
    }
    
    private function createSampleScore($modelId, $period)
     {
         $this->info('🔧 Creando score de ejemplo para pruebas...');
         
         // Primero necesitamos encontrar o crear un StudioModel y luego una cuenta del modelo
         $studioModel = \App\Models\StudioModel::where('user_id_model', $modelId)->first();
         if (!$studioModel) {
             $this->warn('⚠️  No se encontró relación StudioModel, creando una de ejemplo...');
             $studio = \App\Models\Studio::first();
             if (!$studio) {
                 $this->error('❌ No hay estudios disponibles para crear la relación');
                 return;
             }
             $studioModel = \App\Models\StudioModel::create([
                 'user_id_model' => $modelId,
                 'std_id' => $studio->std_id,
                 'stdmod_active' => true
             ]);
         }
         
         $modelAccount = \App\Models\ModelAccount::where('stdmod_id', $studioModel->stdmod_id)->first();
         if (!$modelAccount) {
             $this->warn('⚠️  No se encontró cuenta del modelo, creando una de ejemplo...');
             $modelAccount = \App\Models\ModelAccount::create([
                 'stdmod_id' => $studioModel->stdmod_id,
                 'modacc_app' => 'LiveJasmin',
                 'modacc_username' => 'test_model_' . $modelId,
                 'modacc_active' => true
             ]);
         }
         
         $periodStart = \Carbon\Carbon::createFromFormat('Y-m', $period)->startOfMonth();
         $periodEnd = $periodStart->copy()->endOfMonth();
         
         ModelLivejasminScore::create([
             'modacc_id' => $modelAccount->modacc_id,
             'modlj_screen_name' => $modelAccount->modacc_username,
             'modlj_period_start' => $periodStart,
             'modlj_period_end' => $periodEnd,
             'modlj_hours_preview' => 0.2,
             'modlj_score_traffic' => 70,
             'modlj_score_conversion' => 82,
             'modlj_score_engagement' => 20,
             'modlj_new_members' => 1,
             'modlj_hot_deals' => 0,
             'modlj_hours_total_connection' => 0.2,
             'modlj_average_hour' => 2.09,
             'modlj_earnings_usd' => 0.42,
             'modlj_bonus_5_percent' => 1,
             'modlj_bonus_10_percent' => 0
         ]);
         
         $this->info('✅ Score de ejemplo creado');
     }
}
