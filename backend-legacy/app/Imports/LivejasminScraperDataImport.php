<?php

namespace App\Imports;

use App\Models\ModelAccount;
use App\Models\ModelLivejasminScore;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class LivejasminScraperDataImport implements ToCollection, WithHeadingRow, WithValidation
{
    protected $periodStart;
    protected $periodEnd;
    protected $results = [
        'updated' => [],
        'not_processed' => []
    ];

    public function __construct($periodStart, $periodEnd)
    {
        $this->periodStart = $periodStart;
        $this->periodEnd = $periodEnd;
    }

    /**
     * Process the collection of rows from Excel
     *
     * @param Collection $rows
     * @return void
     */
    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $this->processRow($row);
        }
    }

    /**
     * Process a single row
     *
     * @param Collection $row
     * @return void
     */
    protected function processRow(Collection $row)
    {
        // Sanitize payment_username - keep original case from Excel (case-sensitive)
        $paymentUsername = trim($row['payment_username'] ?? '');
        $hotDeals = (int) ($row['hot_deals'] ?? 0);
        $newMembers = (int) ($row['new_members'] ?? 0);

        // Skip if payment_username is empty
        if (empty($paymentUsername)) {
            return;
        }

        try {
            // Find ModelAccount by payment_username (case-sensitive exact match)
            $modelAccount = ModelAccount::where('modacc_payment_username', $paymentUsername)
                ->where('modacc_active', true)
                ->first();

            if (!$modelAccount) {
                $this->results['not_processed'][] = [
                    'payment_username' => $paymentUsername,
                    'reason' => 'Cuenta de modelo no encontrada o inactiva'
                ];
                return;
            }

            // Find LivejasminScore for this model in the selected period
            $score = ModelLivejasminScore::where('modacc_id', $modelAccount->modacc_id)
                ->where('modlj_period_start', $this->periodStart)
                ->where('modlj_period_end', $this->periodEnd)
                ->first();

            if (!$score) {
                $this->results['not_processed'][] = [
                    'payment_username' => $paymentUsername,
                    'reason' => 'No hay registro de score para el período seleccionado'
                ];
                return;
            }

            // Always overwrite values (even if 0 or null)
            $score->modlj_hot_deals = $hotDeals;
            $score->modlj_new_members = $newMembers;

            // Recalculate bonuses based on updated data
            $this->recalculateBonuses($score);

            // Save changes
            $score->save();

            // Add to updated list
            $this->results['updated'][] = [
                'payment_username' => $paymentUsername,
                'hot_deals' => $hotDeals,
                'new_members' => $newMembers,
                'bonus_5_percent' => $score->modlj_bonus_5_percent,
                'bonus_10_percent' => $score->modlj_bonus_10_percent
            ];

            Log::info("Manual data uploaded for model {$paymentUsername}: hot_deals={$hotDeals}, new_members={$newMembers}");

        } catch (\Exception $e) {
            Log::error("Error processing row for {$paymentUsername}: " . $e->getMessage());
            $this->results['not_processed'][] = [
                'payment_username' => $paymentUsername,
                'reason' => 'Error al procesar: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Recalculate bonuses based on criteria
     * Uses the same logic as LivejasminController::calculateBonuses()
     *
     * @param ModelLivejasminScore $score
     * @return void
     */
    protected function recalculateBonuses(ModelLivejasminScore $score)
    {
        // Reset bonuses
        $score->modlj_bonus_5_percent = false;
        $score->modlj_bonus_10_percent = false;

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

        // Check for 5% bonus (all conditions with $20 average hour)
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
            $score->modlj_bonus_5_percent = true;
        }

        // Check for 10% bonus (same conditions but with $30 average hour)
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
            $score->modlj_bonus_10_percent = true;
        }
    }

    /**
     * Get the results of the import
     *
     * @return array
     */
    public function getResults(): array
    {
        return $this->results;
    }

    /**
     * Define validation rules for the Excel columns
     *
     * @return array
     */
    public function rules(): array
    {
        return [
            'payment_username' => 'required|string',
            'hot_deals' => 'nullable|integer|min:0',
            'new_members' => 'nullable|integer|min:0',
        ];
    }

    /**
     * Custom validation messages
     *
     * @return array
     */
    public function customValidationMessages(): array
    {
        return [
            'payment_username.required' => 'El campo payment_username es requerido',
            'hot_deals.integer' => 'El campo hot_deals debe ser un número entero',
            'new_members.integer' => 'El campo new_members debe ser un número entero',
        ];
    }
}
