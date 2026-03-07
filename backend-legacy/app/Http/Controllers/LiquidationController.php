<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Profile;

class LiquidationController extends Controller
{
    /**
     * Calculate and insert liquidations for a specific period
     * 
     * This method extracts the models_streams data with prioritization logic
     * and inserts it into the liquidations table for faster querying.
     * 
     * Priority order:
     * 1. CARGUE_ARCHIVO / MANUAL (without addon)
     * 2. ADDON (premiums, bonuses)
     * 3. WEBSCRAPING daily (non-weekly platforms)
     * 4. WEBSCRAPING weekly (weekly platforms)
     *
     * @param string $report_since Start date (Y-m-d)
     * @param string $report_until End date (Y-m-d)
     * @param int|null $period_id Period ID from periods table
     * @return void
     */
    protected function calculateLiquidation($report_since, $report_until, $period_id = null)
    {
        try {
            Log::info("Calculating liquidations for period: {$report_since} to {$report_until}, period_id: {$period_id}");
            
            // Weekly platforms (scraped weekly, not daily)
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

            // Delete existing liquidations for this period to avoid duplicates
            DB::statement("
                DELETE FROM liquidations
                WHERE liq_date BETWEEN ? AND ?
                    AND (period_id = ? OR period_id IS NULL)
            ", [$report_since, $report_until, $period_id]);

            // 1. CARGUE_ARCHIVO / MANUAL (highest priority - user uploaded data)
            $count1 = DB::statement("
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

            // 2. ADDON / PREMIOS (premiums, bonuses - separate records)
            $count2 = DB::statement("
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
                    SELECT modstr_date, modacc_id, modstr_addon, MAX(modstr_id) as modstr_id
                    FROM models_streams
                    WHERE modstr_date BETWEEN ? AND ?
                        AND (modstr_earnings_usd > 0 OR modstr_earnings_eur > 0)
                        AND modstr_addon IS NOT NULL
                    GROUP BY modstr_date, modacc_id, modstr_addon
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
            // Only for accounts that don't have CARGUE_ARCHIVO/MANUAL data
            $count3 = DB::statement("
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
            // Only for accounts that don't have CARGUE_ARCHIVO/MANUAL data
            $count4 = DB::statement("
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

            Log::info("Liquidations calculated successfully for period {$report_since} to {$report_until}");
            
        } catch (\Exception $e) {
            Log::error("Error calculating liquidations: " . $e->getMessage());
            Log::error("Stack trace: " . $e->getTraceAsString());
            // Don't throw exception to avoid breaking the liquidation flow
            // The system can still work with models_streams as fallback
        }
    }
}

