<?php

namespace App\Services;

use App\Models\PayrollPeriod;
use App\Models\Studio;
use App\Models\PayrollTransaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Exception;

class PayrollPeriodService
{
    /**
     * SMMLV (Salario Mínimo Mensual Legal Vigente) para 2025
     */
    const CURRENT_SMMLV = 1400000.00;

    /**
     * Intervalos válidos para períodos de nómina
     */
    const VALID_INTERVALS = ['SEMANAL', 'QUINCENAL', 'MENSUAL'];

    /**
     * Estados válidos para períodos de nómina
     */
    const VALID_STATES = ['ABIERTO', 'CERRADO', 'LIQUIDADO'];

    /**
     * Crear múltiples períodos de nómina según el intervalo especificado
     *
     * @param int $studioId ID del estudio
     * @param Carbon $startDate Fecha de inicio del primer período
     * @param Carbon $endDate Fecha límite para crear períodos
     * @param string $interval Intervalo (SEMANAL, QUINCENAL, MENSUAL)
     * @param float|null $smmlv SMMLV a usar (por defecto usa el actual)
     * @return array Array de períodos creados
     * @throws InvalidArgumentException
     * @throws Exception
     */
    public function createPeriodsForInterval(
        int $studioId,
        Carbon $startDate,
        Carbon $endDate,
        string $interval,
        ?float $smmlv = null
    ): array {
        // Validar entrada
        $this->validateStudioExists($studioId);
        $this->validateInterval($interval);
        $this->validateDateRange($startDate, $endDate);

        $smmlv = $smmlv ?? self::CURRENT_SMMLV;
        $periods = [];
        $currentStart = $startDate->copy();

        Log::info("Iniciando creación de períodos", [
            'studio_id' => $studioId,
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'interval' => $interval,
            'smmlv' => $smmlv
        ]);

        DB::beginTransaction();

        try {
            while ($currentStart->lte($endDate)) {
                $currentEnd = $this->calculatePeriodEndDate($currentStart, $interval);

                // Si el período se extiende más allá de la fecha límite, ajustar
                if ($currentEnd->gt($endDate)) {
                    $currentEnd = $endDate->copy();
                }

                // Validar que no existan períodos solapados
                $this->validateNonOverlappingPeriod($studioId, $currentStart, $currentEnd);

                // Crear el período
                $period = PayrollPeriod::create([
                    'std_id' => $studioId,
                    'payroll_period_start_date' => $currentStart,
                    'payroll_period_end_date' => $currentEnd,
                    'payroll_period_state' => 'ABIERTO',
                    'payroll_period_interval' => $interval,
                    'payroll_period_smmlv' => $smmlv
                ]);

                $periods[] = $period;

                Log::info("Período creado", [
                    'period_id' => $period->payroll_period_id,
                    'start_date' => $currentStart->format('Y-m-d'),
                    'end_date' => $currentEnd->format('Y-m-d')
                ]);

                // Calcular el inicio del siguiente período
                $currentStart = $this->calculateNextPeriodStartDate($currentEnd, $interval);

                // Evitar bucle infinito
                if ($currentStart->gt($endDate)) {
                    break;
                }
            }

            DB::commit();

            Log::info("Períodos creados exitosamente", [
                'studio_id' => $studioId,
                'periods_count' => count($periods)
            ]);

            return $periods;

        } catch (Exception $e) {
            DB::rollBack();
            Log::error("Error creando períodos", [
                'studio_id' => $studioId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Cerrar un período de nómina con validaciones
     *
     * @param int $periodId ID del período a cerrar
     * @return PayrollPeriod Período actualizado
     * @throws InvalidArgumentException
     * @throws Exception
     */
    public function closePeriod(int $periodId): PayrollPeriod
    {
        $period = $this->findPeriodOrFail($periodId);

        // Validar que el período esté abierto
        if (!$period->isOpen()) {
            throw new InvalidArgumentException(
                "El período {$periodId} no está abierto. Estado actual: {$period->payroll_period_state}"
            );
        }

        // Validar que no existan transacciones pendientes
        $this->validateNoPendingTransactions($periodId);

        DB::beginTransaction();

        try {
            $period->close();

            Log::info("Período cerrado exitosamente", [
                'period_id' => $periodId,
                'studio_id' => $period->std_id,
                'period_range' => $period->payroll_period_start_date->format('Y-m-d') . ' a ' .
                                $period->payroll_period_end_date->format('Y-m-d')
            ]);

            DB::commit();
            return $period->fresh();

        } catch (Exception $e) {
            DB::rollBack();
            Log::error("Error cerrando período", [
                'period_id' => $periodId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Abrir un período de nómina cerrado
     *
     * @param int $periodId ID del período a abrir
     * @return PayrollPeriod Período actualizado
     * @throws InvalidArgumentException
     * @throws Exception
     */
    public function openPeriod(int $periodId): PayrollPeriod
    {
        $period = $this->findPeriodOrFail($periodId);

        // Validar que el período esté cerrado
        if (!$period->isClosed()) {
            throw new InvalidArgumentException(
                "El período {$periodId} no está cerrado. Estado actual: {$period->payroll_period_state}"
            );
        }

        // Validar que no esté liquidado
        if ($period->isLiquidated()) {
            throw new InvalidArgumentException(
                "No se puede abrir un período liquidado. ID: {$periodId}"
            );
        }

        DB::beginTransaction();

        try {
            $period->open();

            Log::info("Período abierto exitosamente", [
                'period_id' => $periodId,
                'studio_id' => $period->std_id,
                'period_range' => $period->payroll_period_start_date->format('Y-m-d') . ' a ' .
                                $period->payroll_period_end_date->format('Y-m-d')
            ]);

            DB::commit();
            return $period->fresh();

        } catch (Exception $e) {
            DB::rollBack();
            Log::error("Error abriendo período", [
                'period_id' => $periodId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Obtener períodos de comisiones disponibles para liquidar
     *
     * @param int $studioId ID del estudio
     * @param Carbon|null $fromDate Fecha desde (opcional)
     * @param Carbon|null $toDate Fecha hasta (opcional)
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAvailableCommissionPeriods(
        int $studioId,
        ?Carbon $fromDate = null,
        ?Carbon $toDate = null
    ) {
        $this->validateStudioExists($studioId);

        $query = PayrollPeriod::forStudio($studioId)
            ->closed()
            ->with(['studio', 'transactions']);

        // Aplicar filtros de fecha si se proporcionan
        if ($fromDate) {
            $query->where('payroll_period_end_date', '>=', $fromDate);
        }

        if ($toDate) {
            $query->where('payroll_period_start_date', '<=', $toDate);
        }

        $periods = $query->orderBy('payroll_period_start_date')
            ->get();

        Log::info("Períodos de comisiones obtenidos", [
            'studio_id' => $studioId,
            'from_date' => $fromDate?->format('Y-m-d'),
            'to_date' => $toDate?->format('Y-m-d'),
            'periods_count' => $periods->count()
        ]);

        return $periods;
    }

    /**
     * Obtener estadísticas de períodos para un estudio
     *
     * @param int $studioId ID del estudio
     * @return array
     */
    public function getStudioPeriodsStats(int $studioId): array
    {
        $this->validateStudioExists($studioId);

        $stats = PayrollPeriod::forStudio($studioId)
            ->selectRaw('
                payroll_period_state,
                COUNT(*) as count,
                MIN(payroll_period_start_date) as earliest_date,
                MAX(payroll_period_end_date) as latest_date
            ')
            ->groupBy('payroll_period_state')
            ->get()
            ->keyBy('payroll_period_state');

        return [
            'open_periods' => $stats->get('ABIERTO')?->count ?? 0,
            'closed_periods' => $stats->get('CERRADO')?->count ?? 0,
            'liquidated_periods' => $stats->get('LIQUIDADO')?->count ?? 0,
            'total_periods' => $stats->sum('count'),
            'earliest_period_date' => $stats->min('earliest_date'),
            'latest_period_date' => $stats->max('latest_date')
        ];
    }

    /**
     * Validar que el estudio existe
     *
     * @param int $studioId
     * @throws InvalidArgumentException
     */
    private function validateStudioExists(int $studioId): void
    {
        if (!Studio::where('std_id', $studioId)->exists()) {
            throw new InvalidArgumentException("El estudio con ID {$studioId} no existe");
        }
    }

    /**
     * Validar que el intervalo sea válido
     *
     * @param string $interval
     * @throws InvalidArgumentException
     */
    private function validateInterval(string $interval): void
    {
        if (!in_array($interval, self::VALID_INTERVALS)) {
            throw new InvalidArgumentException(
                "Intervalo inválido: {$interval}. Válidos: " . implode(', ', self::VALID_INTERVALS)
            );
        }
    }

    /**
     * Validar rango de fechas
     *
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @throws InvalidArgumentException
     */
    private function validateDateRange(Carbon $startDate, Carbon $endDate): void
    {
        if ($startDate->gt($endDate)) {
            throw new InvalidArgumentException(
                "La fecha de inicio ({$startDate->format('Y-m-d')}) no puede ser mayor que la fecha fin ({$endDate->format('Y-m-d')})"
            );
        }
    }

    /**
     * Calcular fecha de fin del período según el intervalo
     *
     * @param Carbon $startDate
     * @param string $interval
     * @return Carbon
     */
    private function calculatePeriodEndDate(Carbon $startDate, string $interval): Carbon
    {
        switch ($interval) {
            case 'SEMANAL':
                return $startDate->copy()->addWeek()->subDay();
            case 'QUINCENAL':
                return $startDate->copy()->addWeeks(2)->subDay();
            case 'MENSUAL':
                return $startDate->copy()->addMonth()->subDay();
            default:
                throw new InvalidArgumentException("Intervalo no soportado: {$interval}");
        }
    }

    /**
     * Calcular fecha de inicio del siguiente período
     *
     * @param Carbon $endDate
     * @param string $interval
     * @return Carbon
     */
    private function calculateNextPeriodStartDate(Carbon $endDate, string $interval): Carbon
    {
        return $endDate->copy()->addDay();
    }

    /**
     * Validar que no existan períodos solapados
     *
     * @param int $studioId
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @throws InvalidArgumentException
     */
    private function validateNonOverlappingPeriod(int $studioId, Carbon $startDate, Carbon $endDate): void
    {
        $overlapping = PayrollPeriod::forStudio($studioId)
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('payroll_period_start_date', [$startDate, $endDate])
                    ->orWhereBetween('payroll_period_end_date', [$startDate, $endDate])
                    ->orWhere(function ($q) use ($startDate, $endDate) {
                        $q->where('payroll_period_start_date', '<=', $startDate)
                          ->where('payroll_period_end_date', '>=', $endDate);
                    });
            })
            ->exists();

        if ($overlapping) {
            throw new InvalidArgumentException(
                "Ya existe un período que se solapa con el rango {$startDate->format('Y-m-d')} - {$endDate->format('Y-m-d')}"
            );
        }
    }

    /**
     * Validar que no existan transacciones pendientes
     *
     * @param int $periodId
     * @throws Exception
     */
    private function validateNoPendingTransactions(int $periodId): void
    {
        $pendingTransactions = PayrollTransaction::forPeriod($periodId)->count();

        if ($pendingTransactions > 0) {
            throw new Exception(
                "No se puede cerrar el período {$periodId} porque tiene {$pendingTransactions} transacciones asociadas"
            );
        }
    }

    /**
     * Buscar período o fallar
     *
     * @param int $periodId
     * @return PayrollPeriod
     * @throws InvalidArgumentException
     */
    private function findPeriodOrFail(int $periodId): PayrollPeriod
    {
        $period = PayrollPeriod::find($periodId);

        if (!$period) {
            throw new InvalidArgumentException("Período con ID {$periodId} no encontrado");
        }

        return $period;
    }
}