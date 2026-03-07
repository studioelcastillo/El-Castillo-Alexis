<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('liquidations', function (Blueprint $table) {
            $table->id('liq_id');
            $table->unsignedBigInteger('modacc_id');
            $table->date('liq_date');
            $table->string('liq_period', 255);
            $table->timestamp('liq_start_at')->nullable();
            $table->timestamp('liq_finish_at')->nullable();
            $table->float('liq_price')->nullable();
            $table->float('liq_earnings_value');
            $table->float('liq_earnings_trm')->nullable();
            $table->float('liq_earnings_percent')->nullable();
            $table->float('liq_earnings_tokens')->nullable();
            $table->float('liq_earnings_tokens_rate')->nullable();
            $table->float('liq_earnings_usd')->nullable();
            $table->float('liq_earnings_eur')->nullable();
            $table->float('liq_earnings_cop')->nullable();
            $table->float('liq_time')->nullable();
            $table->timestamps();
            $table->timestamp('deleted_at')->nullable();
            $table->unsignedBigInteger('modstrfile_id')->nullable();
            $table->float('liq_earnings_trm_studio')->nullable();
            $table->float('liq_earnings_percent_studio')->nullable();
            $table->float('liq_earnings_cop_studio')->nullable();
            $table->string('liq_source', 255)->nullable();
            $table->unsignedBigInteger('period_id')->nullable();
            $table->unsignedBigInteger('stdmod_id')->nullable();
            $table->unsignedBigInteger('std_id')->nullable();
            $table->unsignedBigInteger('stdacc_id')->nullable();
            $table->string('liq_addon', 255)->nullable();
            $table->float('liq_rtefte_model')->nullable();
            $table->float('liq_rtefte_studio')->nullable();
            $table->unsignedBigInteger('modstr_id')->nullable();

            // Foreign keys
            $table->foreign('modacc_id')->references('modacc_id')->on('models_accounts')->onDelete('no action')->onUpdate('no action');
            $table->foreign('modstrfile_id')->references('modstrfile_id')->on('models_streams_files')->onDelete('no action')->onUpdate('no action');
            $table->foreign('period_id')->references('period_id')->on('periods')->onDelete('no action')->onUpdate('no action');
            $table->foreign('std_id')->references('std_id')->on('studios')->onDelete('no action')->onUpdate('no action');
            $table->foreign('stdacc_id')->references('stdacc_id')->on('studios_accounts')->onDelete('no action')->onUpdate('no action');
            $table->foreign('stdmod_id')->references('stdmod_id')->on('studios_models')->onDelete('no action')->onUpdate('no action');
            $table->foreign('modstr_id')->references('modstr_id')->on('models_streams')->onDelete('no action')->onUpdate('no action');

            // Indexes for performance
            $table->index(['period_id', 'modacc_id'], 'liquidations_period_modacc_idx');
            $table->index(['liq_date', 'modacc_id'], 'liquidations_date_modacc_idx');
            $table->index(['std_id', 'period_id'], 'liquidations_std_period_idx');
        });

        // Pre-populate data from existing models_streams
        $this->populateLiquidations();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('liquidations');
    }

    /**
     * Populate liquidations table with historical data
     */
    private function populateLiquidations(): void
    {
        try {
            Log::info('Starting liquidations table population...');
            
            DB::beginTransaction();

            // Start date: 2025-03-10 (Monday)
            $startDate = new DateTime('2025-03-10');
            $endDate = new DateTime(); // Today
            
            $weekCount = 0;
            $currentDate = clone $startDate;
            
            // Apps that use weekly liquidation
            $weeklyApps = [
                'CAM4',
                'CHATURBATE',
                'CHATURBATE(2)',
                'IMLIVE',
                'LIVEJASMIN',
                'LIVEJASMIN(2)',
                'MYFREECAMS',
                'STREAMATE',
                'STREAMRAY',
                'STRIPCHAT',
                'STRIPCHAT(2)',
                'XLOVECAM',
            ];
            $weeklyAppsStr = "'" . implode("','", $weeklyApps) . "'";

            // Loop through weeks (Monday to Sunday)
            while ($currentDate <= $endDate) {
                // Get Monday of current week
                $mondayDate = clone $currentDate;
                if ($mondayDate->format('N') != 1) {
                    $mondayDate->modify('last monday');
                }
                
                // Get Sunday of current week
                $sundayDate = clone $mondayDate;
                $sundayDate->modify('+6 days');
                
                $report_since = $mondayDate->format('Y-m-d');
                $report_until = $sundayDate->format('Y-m-d');
                
                // Don't process future weeks
                if ($mondayDate > $endDate) {
                    break;
                }
                
                Log::info("Processing week: {$report_since} to {$report_until}");
                
                // Get period_id if exists
                $period = DB::table('periods')
                    ->where('period_start_date', $report_since)
                    ->where('period_end_date', $report_until)
                    ->first();
                
                $period_id = $period ? $period->period_id : null;
                
                // Insert liquidations using the same logic as LiquidationModelController::liquidate()
                // Process 4 types of data sources in priority order
                
                // 1. CARGUE_ARCHIVO / MANUAL (highest priority)
                DB::statement("
                    INSERT INTO liquidations (
                        modacc_id, liq_date, liq_period, liq_start_at, liq_finish_at,
                        liq_price, liq_earnings_value, liq_earnings_trm, liq_earnings_percent,
                        liq_earnings_tokens, liq_earnings_tokens_rate, liq_earnings_usd,
                        liq_earnings_eur, liq_earnings_cop, liq_time, modstrfile_id,
                        liq_earnings_trm_studio, liq_earnings_percent_studio, 
                        liq_earnings_cop_studio, liq_source, period_id, stdmod_id,
                        std_id, stdacc_id, liq_addon, liq_rtefte_model, liq_rtefte_studio,
                        modstr_id, created_at, updated_at
                    )
                    SELECT 
                        ms.modacc_id, ms.modstr_date, ms.modstr_period, ms.modstr_start_at, ms.modstr_finish_at,
                        ms.modstr_price, ms.modstr_earnings_value, ms.modstr_earnings_trm, ms.modstr_earnings_percent,
                        ms.modstr_earnings_tokens, ms.modstr_earnings_tokens_rate, ms.modstr_earnings_usd,
                        ms.modstr_earnings_eur, ms.modstr_earnings_cop, ms.modstr_time, ms.modstrfile_id,
                        ms.modstr_earnings_trm_studio, ms.modstr_earnings_percent_studio,
                        ms.modstr_earnings_cop_studio, ms.modstr_source, ?, ms.stdmod_id,
                        ms.std_id, ms.stdacc_id, ms.modstr_addon, ms.modstr_rtefte_model, ms.modstr_rtefte_studio,
                        ms.modstr_id, ms.created_at, ms.updated_at
                    FROM (
                        SELECT modstr_date, modacc_id, MAX(modstr_id) as modstr_id
                        FROM models_streams
                        WHERE modstr_date BETWEEN ? AND ?
                            AND (modstr_earnings_usd > 0 OR modstr_earnings_eur > 0)
                            AND modstr_source IN ('CARGUE_ARCHIVO', 'MANUAL')
                            AND modstr_addon IS NULL
                        GROUP BY modstr_date, modacc_id
                    ) last_ms
                    INNER JOIN models_streams ms ON ms.modstr_id = last_ms.modstr_id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM liquidations lq
                        WHERE lq.modacc_id = ms.modacc_id
                            AND lq.liq_date = ms.modstr_date
                    )
                ", [$period_id, $report_since, $report_until]);
                
                // 2. ADDON / PREMIOS (premiums, bonuses)
                DB::statement("
                    INSERT INTO liquidations (
                        modacc_id, liq_date, liq_period, liq_start_at, liq_finish_at,
                        liq_price, liq_earnings_value, liq_earnings_trm, liq_earnings_percent,
                        liq_earnings_tokens, liq_earnings_tokens_rate, liq_earnings_usd,
                        liq_earnings_eur, liq_earnings_cop, liq_time, modstrfile_id,
                        liq_earnings_trm_studio, liq_earnings_percent_studio,
                        liq_earnings_cop_studio, liq_source, period_id, stdmod_id,
                        std_id, stdacc_id, liq_addon, liq_rtefte_model, liq_rtefte_studio,
                        modstr_id, created_at, updated_at
                    )
                    SELECT 
                        ms.modacc_id, ms.modstr_date, ms.modstr_period, ms.modstr_start_at, ms.modstr_finish_at,
                        ms.modstr_price, ms.modstr_earnings_value, ms.modstr_earnings_trm, ms.modstr_earnings_percent,
                        ms.modstr_earnings_tokens, ms.modstr_earnings_tokens_rate, ms.modstr_earnings_usd,
                        ms.modstr_earnings_eur, ms.modstr_earnings_cop, ms.modstr_time, ms.modstrfile_id,
                        ms.modstr_earnings_trm_studio, ms.modstr_earnings_percent_studio,
                        ms.modstr_earnings_cop_studio, ms.modstr_source, ?, ms.stdmod_id,
                        ms.std_id, ms.stdacc_id, ms.modstr_addon, ms.modstr_rtefte_model, ms.modstr_rtefte_studio,
                        ms.modstr_id, ms.created_at, ms.updated_at
                    FROM (
                        SELECT modstr_date, modacc_id, MAX(modstr_id) as modstr_id
                        FROM models_streams
                        WHERE modstr_date BETWEEN ? AND ?
                            AND (modstr_earnings_usd > 0 OR modstr_earnings_eur > 0)
                            AND modstr_addon IS NOT NULL
                        GROUP BY modstr_date, modacc_id
                    ) last_ms
                    INNER JOIN models_streams ms ON ms.modstr_id = last_ms.modstr_id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM liquidations lq
                        WHERE lq.modacc_id = ms.modacc_id
                            AND lq.liq_date = ms.modstr_date
                            AND lq.liq_addon = ms.modstr_addon
                    )
                ", [$period_id, $report_since, $report_until]);
                
                // 3. WEBSCRAPING daily (non-weekly platforms)
                DB::statement("
                    INSERT INTO liquidations (
                        modacc_id, liq_date, liq_period, liq_start_at, liq_finish_at,
                        liq_price, liq_earnings_value, liq_earnings_trm, liq_earnings_percent,
                        liq_earnings_tokens, liq_earnings_tokens_rate, liq_earnings_usd,
                        liq_earnings_eur, liq_earnings_cop, liq_time, modstrfile_id,
                        liq_earnings_trm_studio, liq_earnings_percent_studio,
                        liq_earnings_cop_studio, liq_source, period_id, stdmod_id,
                        std_id, stdacc_id, liq_addon, liq_rtefte_model, liq_rtefte_studio,
                        modstr_id, created_at, updated_at
                    )
                    SELECT 
                        ms.modacc_id, ms.modstr_date, ms.modstr_period, ms.modstr_start_at, ms.modstr_finish_at,
                        ms.modstr_price, ms.modstr_earnings_value, ms.modstr_earnings_trm, ms.modstr_earnings_percent,
                        ms.modstr_earnings_tokens, ms.modstr_earnings_tokens_rate, ms.modstr_earnings_usd,
                        ms.modstr_earnings_eur, ms.modstr_earnings_cop, ms.modstr_time, ms.modstrfile_id,
                        ms.modstr_earnings_trm_studio, ms.modstr_earnings_percent_studio,
                        ms.modstr_earnings_cop_studio, ms.modstr_source, ?, ms.stdmod_id,
                        ms.std_id, ms.stdacc_id, ms.modstr_addon, ms.modstr_rtefte_model, ms.modstr_rtefte_studio,
                        ms.modstr_id, ms.created_at, ms.updated_at
                    FROM (
                        SELECT modstr_date, modacc_id, MAX(modstr_id) as modstr_id
                        FROM models_streams
                        WHERE modstr_date BETWEEN ? AND ?
                            AND (modstr_earnings_usd > 0 OR modstr_earnings_eur > 0)
                            AND modacc_id NOT IN (
                                SELECT modacc_id FROM models_streams
                                WHERE modstr_source IN ('CARGUE_ARCHIVO', 'MANUAL')
                                    AND modstr_date BETWEEN ? AND ?
                            )
                        GROUP BY modstr_date, modacc_id
                    ) last_ms
                    INNER JOIN models_streams ms ON ms.modstr_id = last_ms.modstr_id
                    INNER JOIN models_accounts ma ON ma.modacc_id = ms.modacc_id
                    WHERE ma.modacc_app NOT IN ({$weeklyAppsStr})
                        AND NOT EXISTS (
                            SELECT 1 FROM liquidations lq
                            WHERE lq.modacc_id = ms.modacc_id
                                AND lq.liq_date = ms.modstr_date
                        )
                ", [$period_id, $report_since, $report_until, $report_since, $report_until]);
                
                // 4. WEBSCRAPING weekly (weekly platforms - takes the last record of the week)
                DB::statement("
                    INSERT INTO liquidations (
                        modacc_id, liq_date, liq_period, liq_start_at, liq_finish_at,
                        liq_price, liq_earnings_value, liq_earnings_trm, liq_earnings_percent,
                        liq_earnings_tokens, liq_earnings_tokens_rate, liq_earnings_usd,
                        liq_earnings_eur, liq_earnings_cop, liq_time, modstrfile_id,
                        liq_earnings_trm_studio, liq_earnings_percent_studio,
                        liq_earnings_cop_studio, liq_source, period_id, stdmod_id,
                        std_id, stdacc_id, liq_addon, liq_rtefte_model, liq_rtefte_studio,
                        modstr_id, created_at, updated_at
                    )
                    SELECT 
                        ms.modacc_id, ms.modstr_date, ms.modstr_period, ms.modstr_start_at, ms.modstr_finish_at,
                        ms.modstr_price, ms.modstr_earnings_value, ms.modstr_earnings_trm, ms.modstr_earnings_percent,
                        ms.modstr_earnings_tokens, ms.modstr_earnings_tokens_rate, ms.modstr_earnings_usd,
                        ms.modstr_earnings_eur, ms.modstr_earnings_cop, ms.modstr_time, ms.modstrfile_id,
                        ms.modstr_earnings_trm_studio, ms.modstr_earnings_percent_studio,
                        ms.modstr_earnings_cop_studio, ms.modstr_source, ?, ms.stdmod_id,
                        ms.std_id, ms.stdacc_id, ms.modstr_addon, ms.modstr_rtefte_model, ms.modstr_rtefte_studio,
                        ms.modstr_id, ms.created_at, ms.updated_at
                    FROM (
                        SELECT modacc_id, MAX(modstr_id) as modstr_id
                        FROM models_streams
                        WHERE modstr_date BETWEEN ? AND ?
                            AND modacc_id NOT IN (
                                SELECT modacc_id FROM models_streams
                                WHERE modstr_source IN ('CARGUE_ARCHIVO', 'MANUAL')
                                    AND modstr_date BETWEEN ? AND ?
                            )
                        GROUP BY modacc_id
                    ) last_ms
                    INNER JOIN models_streams ms ON ms.modstr_id = last_ms.modstr_id
                    INNER JOIN models_accounts ma ON ma.modacc_id = ms.modacc_id
                    WHERE ma.modacc_app IN ({$weeklyAppsStr})
                        AND NOT EXISTS (
                            SELECT 1 FROM liquidations lq
                            WHERE lq.modacc_id = ms.modacc_id
                                AND lq.liq_date BETWEEN ? AND ?
                        )
                ", [$period_id, $report_since, $report_until, $report_since, $report_until, $report_since, $report_until]);
                
                $weekCount++;
                
                // Move to next week
                $currentDate->modify('+7 days');
            }

            DB::commit();
            
            Log::info("Liquidations table populated successfully! Processed {$weekCount} weeks.");
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error populating liquidations table: ' . $e->getMessage());
            throw $e;
        }
    }
};

