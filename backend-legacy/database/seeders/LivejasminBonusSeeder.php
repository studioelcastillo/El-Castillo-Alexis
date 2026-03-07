<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\LivejasminBonusType;
use App\Models\LivejasminBonusCriteria;
use Illuminate\Support\Facades\DB;

class LivejasminBonusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // Crear el bono del 5%
            $bonus5Percent = LivejasminBonusType::create([
                'ljbt_name' => 'Bono 5% LiveJasmin',
                'ljbt_code' => 'LJ_BONUS_5',
                'ljbt_percentage' => 5.00,
                'ljbt_description' => 'Bono del 5% para modelos que cumplen criterios básicos de rendimiento',
                'ljbt_target_profiles' => ['model', 'all'],
                'ljbt_active' => true
            ]);

            // Criterios para el bono del 5%
            LivejasminBonusCriteria::create([
                'ljbt_id' => $bonus5Percent->ljbt_id,
                'ljbc_condition_name' => 'Horas Mínimas',
                'ljbc_api_endpoint' => '/models/{id}/stats',
                'ljbc_json_path' => 'data.performance.hours_preview',
                'ljbc_operator' => 'gte',
                'ljbc_target_value' => 30.0,
                'ljbc_condition_type' => 'AND',
                'ljbc_order' => 1
            ]);

            LivejasminBonusCriteria::create([
                'ljbt_id' => $bonus5Percent->ljbt_id,
                'ljbc_condition_name' => 'Score Tráfico',
                'ljbc_api_endpoint' => '/models/{id}/stats',
                'ljbc_json_path' => 'data.performance.score_traffic',
                'ljbc_operator' => 'gte',
                'ljbc_target_value' => 7.0,
                'ljbc_condition_type' => 'AND',
                'ljbc_order' => 2
            ]);

            // Crear el bono del 10%
            $bonus10Percent = LivejasminBonusType::create([
                'ljbt_name' => 'Bono 10% LiveJasmin',
                'ljbt_code' => 'LJ_BONUS_10',
                'ljbt_percentage' => 10.00,
                'ljbt_description' => 'Bono del 10% para modelos con excelente rendimiento',
                'ljbt_target_profiles' => ['model', 'all'],
                'ljbt_active' => true
            ]);

            // Criterios para el bono del 10%
            LivejasminBonusCriteria::create([
                'ljbt_id' => $bonus10Percent->ljbt_id,
                'ljbc_condition_name' => 'Horas Premium',
                'ljbc_api_endpoint' => '/models/{id}/stats',
                'ljbc_json_path' => 'data.performance.hours_preview',
                'ljbc_operator' => 'gte',
                'ljbc_target_value' => 50.0,
                'ljbc_condition_type' => 'AND',
                'ljbc_order' => 1
            ]);

            LivejasminBonusCriteria::create([
                'ljbt_id' => $bonus10Percent->ljbt_id,
                'ljbc_condition_name' => 'Score Tráfico Premium',
                'ljbc_api_endpoint' => '/models/{id}/stats',
                'ljbc_json_path' => 'data.performance.score_traffic',
                'ljbc_operator' => 'gte',
                'ljbc_target_value' => 8.0,
                'ljbc_condition_type' => 'AND',
                'ljbc_order' => 2
            ]);

            LivejasminBonusCriteria::create([
                'ljbt_id' => $bonus10Percent->ljbt_id,
                'ljbc_condition_name' => 'Score Conversión',
                'ljbc_api_endpoint' => '/models/{id}/stats',
                'ljbc_json_path' => 'data.performance.score_conversion',
                'ljbc_operator' => 'gte',
                'ljbc_target_value' => 7.5,
                'ljbc_condition_type' => 'AND',
                'ljbc_order' => 3
            ]);

            LivejasminBonusCriteria::create([
                'ljbt_id' => $bonus10Percent->ljbt_id,
                'ljbc_condition_name' => 'Score Engagement',
                'ljbc_api_endpoint' => '/models/{id}/stats',
                'ljbc_json_path' => 'data.performance.score_engagement',
                'ljbc_operator' => 'gte',
                'ljbc_target_value' => 7.5,
                'ljbc_condition_type' => 'AND',
                'ljbc_order' => 4
            ]);

            // Crear un bono adicional de ejemplo para demostrar flexibilidad
            $bonusTraffic = LivejasminBonusType::create([
                'ljbt_name' => 'Bono Tráfico Excepcional',
                'ljbt_code' => 'LJ_TRAFFIC_BONUS',
                'ljbt_percentage' => 3.00,
                'ljbt_description' => 'Bono adicional para modelos con tráfico excepcional',
                'ljbt_target_profiles' => ['model'],
                'ljbt_active' => true
            ]);

            LivejasminBonusCriteria::create([
                'ljbt_id' => $bonusTraffic->ljbt_id,
                'ljbc_condition_name' => 'Tráfico Excepcional',
                'ljbc_api_endpoint' => '/models/{id}/stats',
                'ljbc_json_path' => 'data.performance.score_traffic',
                'ljbc_operator' => 'gte',
                'ljbc_target_value' => 9.0,
                'ljbc_condition_type' => 'AND',
                'ljbc_order' => 1
            ]);

            $this->command->info('✅ Bonos de LiveJasmin creados exitosamente:');
            $this->command->info('   - Bono 5%: ' . $bonus5Percent->ljbt_id);
            $this->command->info('   - Bono 10%: ' . $bonus10Percent->ljbt_id);
            $this->command->info('   - Bono Tráfico: ' . $bonusTraffic->ljbt_id);
        });
    }
}
