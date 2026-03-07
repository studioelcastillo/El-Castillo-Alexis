<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PayrollPeriod;
use App\Models\PayrollTransaction;
use App\Models\StudioModel;
use App\Models\Studio;
use App\Services\PayrollCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PDF;
use Exception;

class PayrollLiquidationController extends Controller
{
    protected $payrollCalculationService;

    public function __construct(PayrollCalculationService $payrollCalculationService)
    {
        $this->payrollCalculationService = $payrollCalculationService;
    }

    /**
     * Generar vista previa de liquidación de nómina
     */
    public function generatePayrollPreview(Request $request)
    {
        try {
            $validated = $request->validate([
                'studio_id' => 'required|exists:studios,std_id',
                'payroll_period_id' => 'required|exists:payroll_periods,payroll_period_id',
                'commission_periods' => 'nullable|array',
                'commission_periods.*' => 'exists:periods,period_id'
            ]);

            $studioId = $validated['studio_id'];
            $payrollPeriodId = $validated['payroll_period_id'];
            $commissionPeriods = $validated['commission_periods'] ?? [];

            // Verificar que el periodo pertenezca al estudio
            $payrollPeriod = PayrollPeriod::where('payroll_period_id', $payrollPeriodId)
                ->where('std_id', $studioId)
                ->first();

            if (!$payrollPeriod) {
                return response()->json([
                    'success' => false,
                    'message' => 'El período de nómina no pertenece al estudio seleccionado'
                ], 400);
            }

            // Si el período está ABIERTO, validar que haya períodos de comisión seleccionados
            if ($payrollPeriod->payroll_period_state === 'ABIERTO') {
                if (empty($commissionPeriods)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Debe seleccionar al menos un período de comisión para generar la vista previa'
                    ], 400);
                }

                // Validar que todos los períodos estén CERRADOS y NO liquidados
                $validPeriodsCount = \App\Models\Period::whereIn('period_id', $commissionPeriods)
                    ->where('period_state', 'CERRADO')
                    ->whereNull('liquidated_at') // ⭐ NUEVO: Solo períodos NO liquidados
                    ->count();

                if ($validPeriodsCount !== count($commissionPeriods)) {
                    // Verificar cuáles períodos ya están liquidados
                    $liquidatedPeriods = \App\Models\Period::whereIn('period_id', $commissionPeriods)
                        ->whereNotNull('liquidated_at')
                        ->get(['period_id', 'period_start_date', 'period_end_date', 'liquidated_at']);

                    if ($liquidatedPeriods->count() > 0) {
                        $periodList = $liquidatedPeriods->map(function($p) {
                            return "{$p->period_start_date} al {$p->period_end_date}";
                        })->join(', ');

                        return response()->json([
                            'success' => false,
                            'message' => "Los siguientes períodos ya fueron liquidados: {$periodList}"
                        ], 400);
                    }

                    return response()->json([
                        'success' => false,
                        'message' => 'Todos los períodos de comisión deben estar CERRADOS y no liquidados previamente'
                    ], 400);
                }
            }

            // Nota: La vista previa funciona para cualquier estado (ABIERTO, CERRADO, LIQUIDADO)
            // Solo el procesamiento de liquidación requiere estado ABIERTO

            // Calcular nómina para todos los empleados del estudio
            $startDate = $payrollPeriod->payroll_period_start_date;
            $endDate = $payrollPeriod->payroll_period_end_date;

            // Pasar los períodos de comisión seleccionados al servicio de cálculo
            $payrollData = $this->payrollCalculationService->calculatePayrollForStudio(
                $studioId,
                $payrollPeriodId,
                $startDate,
                $endDate,
                $commissionPeriods
            );

            if (empty($payrollData['employees'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron empleados elegibles para nómina en este estudio'
                ], 400);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'employees' => $payrollData['employees'],
                    'totals' => $payrollData['totals'],
                    'commission_periods_used' => $commissionPeriods, // Períodos de comisión usados
                    'period' => [
                        'payroll_period_id' => $payrollPeriod->payroll_period_id,
                        'start_date' => $payrollPeriod->payroll_period_start_date,
                        'end_date' => $payrollPeriod->payroll_period_end_date,
                        'state' => $payrollPeriod->payroll_period_state,
                        'interval' => $payrollPeriod->payroll_period_interval,
                        'smmlv' => $payrollPeriod->payroll_period_smmlv
                    ],
                    'studio' => [
                        'std_id' => $studioId,
                        'std_name' => $payrollPeriod->studio->std_name ?? 'N/A'
                    ]
                ]
            ]);

        } catch (Exception $e) {
            Log::error('Error generando vista previa de nómina: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Procesar liquidación de nómina (guardar en base de datos)
     */
    public function processPayrollLiquidation(Request $request)
    {
        try {
            $validated = $request->validate([
                'studio_id' => 'required|exists:studios,std_id',
                'payroll_period_id' => 'required|exists:payroll_periods,payroll_period_id',
                'commission_periods' => 'nullable|array',
                'commission_periods.*' => 'exists:periods,period_id'
            ]);

            $studioId = $validated['studio_id'];
            $payrollPeriodId = $validated['payroll_period_id'];
            $commissionPeriods = $validated['commission_periods'] ?? [];

            // Verificar que el periodo esté abierto
            $payrollPeriod = PayrollPeriod::where('payroll_period_id', $payrollPeriodId)
                ->where('std_id', $studioId)
                ->where('payroll_period_state', 'ABIERTO')
                ->first();

            if (!$payrollPeriod) {
                return response()->json([
                    'success' => false,
                    'message' => 'El período debe estar en estado ABIERTO para ser liquidado'
                ], 400);
            }

            // Validar que haya períodos de comisión seleccionados
            if (empty($commissionPeriods)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Debe seleccionar al menos un período de comisión para procesar la liquidación'
                ], 400);
            }

            // Validar que todos los períodos estén CERRADOS y NO liquidados
            $validPeriodsCount = \App\Models\Period::whereIn('period_id', $commissionPeriods)
                ->where('period_state', 'CERRADO')
                ->whereNull('liquidated_at') // ⭐ NUEVO: Solo períodos NO liquidados
                ->count();

            if ($validPeriodsCount !== count($commissionPeriods)) {
                // Verificar cuáles períodos ya están liquidados
                $liquidatedPeriods = \App\Models\Period::whereIn('period_id', $commissionPeriods)
                    ->whereNotNull('liquidated_at')
                    ->get(['period_id', 'period_start_date', 'period_end_date', 'liquidated_at']);

                if ($liquidatedPeriods->count() > 0) {
                    $periodList = $liquidatedPeriods->map(function($p) {
                        return "{$p->period_start_date} al {$p->period_end_date} (liquidado el {$p->liquidated_at})";
                    })->join(', ');

                    return response()->json([
                        'success' => false,
                        'message' => "Los siguientes períodos ya fueron liquidados y no pueden volver a usarse: {$periodList}"
                    ], 400);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Todos los períodos de comisión deben estar CERRADOS y no liquidados previamente'
                ], 400);
            }

            // Verificar que no existan transacciones previas para este período
            $existingTransactions = PayrollTransaction::where('payroll_period_id', $payrollPeriodId)->count();

            if ($existingTransactions > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Este período ya ha sido liquidado. Existen ' . $existingTransactions . ' transacciones.'
                ], 400);
            }

            DB::beginTransaction();

            // Calcular nómina
            $startDate = $payrollPeriod->payroll_period_start_date;
            $endDate = $payrollPeriod->payroll_period_end_date;
            $payrollData = $this->payrollCalculationService->calculatePayrollForStudio(
                $studioId,
                $payrollPeriodId,
                $startDate,
                $endDate,
                $commissionPeriods
            );

            if (empty($payrollData['employees'])) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'No hay empleados elegibles para liquidar'
                ], 400);
            }

            $transactionsCreated = [];

            // Crear transacciones de nómina
            foreach ($payrollData['employees'] as $employeePayroll) {
                $transaction = PayrollTransaction::create([
                    'payroll_period_id' => $payrollPeriodId,
                    'user_id' => $employeePayroll['employee_id'],
                    'stdmod_id' => $employeePayroll['stdmod_id'],
                    'base_salary' => $employeePayroll['base_salary'],
                    'dotacion_amount' => $employeePayroll['dotacion_amount'] ?? 0,
                    'commission_amount' => $employeePayroll['commissions'] ?? 0,
                    'extra_hours_amount' => $employeePayroll['extra_hours_amount'] ?? 0,
                    'transport_allowance' => $employeePayroll['auxilios']['transporte'],
                    'food_allowance' => $employeePayroll['auxilios']['alimentacion'],
                    'cesantias' => $employeePayroll['prestaciones']['cesantias'],
                    'prima' => $employeePayroll['prestaciones']['prima'],
                    'vacaciones' => $employeePayroll['prestaciones']['vacaciones'],
                    'eps_employee' => $employeePayroll['social_security']['eps_employee'],
                    'pension_employee' => $employeePayroll['social_security']['pension_employee'],
                    'eps_employer' => $employeePayroll['social_security']['eps_employer'],
                    'pension_employer' => $employeePayroll['social_security']['pension_employer'],
                    'arl' => $employeePayroll['social_security']['arl'],
                    'sena' => $employeePayroll['parafiscales']['sena'],
                    'icbf' => $employeePayroll['parafiscales']['icbf'],
                    'caja_compensacion' => $employeePayroll['parafiscales']['caja_compensacion'],
                    'total_devengado' => $employeePayroll['total_devengado'],
                    'total_deducciones' => $employeePayroll['total_deducciones'],
                    'total_neto' => $employeePayroll['total_neto'],
                    'commission_periods' => json_encode($commissionPeriods) // Guardar períodos seleccionados
                ]);

                $transactionsCreated[] = $transaction;
            }

            // Asociar transacciones de SNACKS al período de nómina
            $userIds = array_column($payrollData['employees'], 'employee_id');
            $snacksAssociated = $this->payrollCalculationService->associateSnacksToPayrollPeriod(
                $userIds,
                $payrollPeriodId,
                $startDate,
                $endDate
            );

            // Marcar períodos de comisión como liquidados
            if (!empty($commissionPeriods)) {
                \App\Models\Period::whereIn('period_id', $commissionPeriods)
                    ->update(['liquidated_at' => now()]);
            }

            // Cerrar el período de nómina
            $payrollPeriod->update(['payroll_period_state' => 'LIQUIDADO']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Liquidación procesada exitosamente',
                'data' => [
                    'transactions_created' => count($transactionsCreated),
                    'total_amount' => $payrollData['totals']['total_neto'],
                    'period_id' => $payrollPeriodId,
                    'period_state' => 'LIQUIDADO'
                ]
            ]);

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error procesando liquidación de nómina: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error procesando liquidación: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener empleados elegibles para nómina de un estudio
     */
    public function getStudioEmployeesForPayroll($studioId)
    {
        try {
            $employees = StudioModel::with(['user', 'studio'])
                ->where('std_id', $studioId)
                ->where('stdmod_contract_type', '!=', 'MANDANTE - MODELO')
                ->where('stdmod_active', true)
                ->get();

            $eligibleEmployees = [];
            $ineligibleEmployees = [];

            foreach ($employees as $employee) {
                $employeeData = [
                    'stdmod_id' => $employee->stdmod_id,
                    'user_id' => $employee->user_id_model,
                    'user_name' => $employee->user->user_name ?? 'N/A',
                    'user_identification' => $employee->user->user_identification ?? 'N/A',
                    'contract_type' => $employee->stdmod_contract_type,
                    'monthly_salary' => $employee->stdmod_monthly_salary,
                    'active' => $employee->stdmod_active
                ];

                if ($this->payrollCalculationService->isEmployeeEligibleForPayroll($employee)) {
                    $eligibleEmployees[] = $employeeData;
                } else {
                    $employeeData['ineligible_reason'] = $this->getIneligibilityReason($employee);
                    $ineligibleEmployees[] = $employeeData;
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'eligible' => $eligibleEmployees,
                    'ineligible' => $ineligibleEmployees,
                    'counts' => [
                        'total' => count($eligibleEmployees) + count($ineligibleEmployees),
                        'eligible' => count($eligibleEmployees),
                        'ineligible' => count($ineligibleEmployees)
                    ]
                ]
            ]);

        } catch (Exception $e) {
            Log::error('Error obteniendo empleados para nómina: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error obteniendo empleados: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener transacciones de nómina por período
     */
    public function getPayrollTransactionsByPeriod($payrollPeriodId)
    {
        try {
            $transactions = PayrollTransaction::with(['user.profile', 'studioModel.studio', 'period'])
                ->where('payroll_period_id', $payrollPeriodId)
                ->get();

            // Agregar detalle de comisiones a cada transacción
            $period = PayrollPeriod::find($payrollPeriodId);

            foreach ($transactions as $transaction) {
                // Cargar detalles de horas extras
                $extraHoursDetail = \App\Models\PayrollAdditionalConcept::where('payroll_period_id', $transaction->payroll_period_id)
                    ->where('user_id', $transaction->user_id)
                    ->where('concept_type', 'like', 'EXTRA_HOUR_%')
                    ->get();
                $transaction->extra_hours_detail = $extraHoursDetail;

                // Cargar detalles de comisiones
                $commissionDetails = [];
                $studioModel = \App\Models\StudioModel::where('user_id_model', $transaction->user_id)->first();

                if ($studioModel && $transaction->commission_amount > 0) {
                    // Decodificar los períodos de comisión guardados
                    $commissionPeriodIds = json_decode($transaction->commission_periods ?? '[]', true);

                    $detailQuery = DB::table('commissions as parent_comm')
                        ->join('commissions as child_comm', 'parent_comm.comm_id', '=', 'child_comm.commparent_id')
                        ->join('setups_commissions as sc', 'parent_comm.setcomm_id', '=', 'sc.setcomm_id')
                        ->join('setups_commissions_items as sci', 'sc.setcomm_id', '=', 'sci.setcomm_id')
                        ->join('models_accounts as ma', 'child_comm.stdmod_id', '=', 'ma.stdmod_id')
                        ->join('studios_models as sm', 'ma.stdmod_id', '=', 'sm.stdmod_id')
                        ->join('users as u', 'sm.user_id_model', '=', 'u.user_id')
                        ->join('liquidations as lq', 'ma.modacc_id', '=', 'lq.modacc_id')
                        ->where('parent_comm.stdmod_id', $studioModel->stdmod_id);

                    // Si hay períodos específicos guardados, filtrar por ellos
                    if (!empty($commissionPeriodIds)) {
                        $detailQuery->join('periods as p', function($join) {
                            $join->on(DB::raw('lq.liq_date'), '>=', DB::raw('p.period_start_date'))
                                 ->on(DB::raw('lq.liq_date'), '<=', DB::raw('p.period_end_date'));
                        })
                        ->whereIn('p.period_id', $commissionPeriodIds)
                        ->where('p.period_state', 'CERRADO');
                    } else {
                        // Fallback: usar rango de fechas del período de nómina
                        $detailQuery->whereBetween('lq.liq_date', [$period->payroll_period_start_date, $period->payroll_period_end_date]);
                    }

                    $detailQuery->where(function($query) use ($period) {
                            $query->whereNull('parent_comm.comm_expire_date')
                                  ->orWhere('parent_comm.comm_expire_date', '>=', $period->payroll_period_end_date);
                        })
                        ->selectRaw('
                            CONCAT(u.user_name, \' \', COALESCE(u.user_surname, \'\')) as model_name,
                            sci.setcommitem_value as commission_percentage,
                            SUM(lq.liq_earnings_cop) as total_earnings,
                            SUM((lq.liq_earnings_cop * (sci.setcommitem_value / 100))::numeric(10,2)) as commission_amount
                        ')
                        ->groupBy('u.user_name', 'u.user_surname', 'sci.setcommitem_value');

                    $commissionDetails = $detailQuery->get()->toArray();
                }

                $transaction->commission_details = $commissionDetails;

                // Cargar detalles de SNACKS
                $snacksDeductions = $this->payrollCalculationService->calculateSnacksDeductions(
                    $transaction->user_id,
                    $payrollPeriodId,
                    $period->payroll_period_start_date,
                    $period->payroll_period_end_date
                );
                $transaction->snacks_deductions = $snacksDeductions;
            }

            return response()->json([
                'success' => true,
                'data' => $transactions
            ]);

        } catch (Exception $e) {
            Log::error('Error obteniendo transacciones de nómina: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error obteniendo transacciones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener configuración de cálculos de nómina
     */
    public function getPayrollConfiguration()
    {
        return response()->json([
            'success' => true,
            'data' => $this->payrollCalculationService->getCalculationConfig()
        ]);
    }

    /**
     * Determinar razón de inelegibilidad
     */
    private function getIneligibilityReason(StudioModel $employee)
    {
        if ($employee->stdmod_contract_type === 'MANDANTE - MODELO') {
            return 'Es modelo (no empleado)';
        }

        if (!$employee->stdmod_active) {
            return 'Inactivo';
        }

        if (empty($employee->stdmod_monthly_salary) || $employee->stdmod_monthly_salary <= 0) {
            return 'Sin salario configurado';
        }

        return 'Razón desconocida';
    }

    /**
     * Generar PDF de recibo de pago
     */
    public function getPayrollTransactionPdf($transactionId)
    {
        try {
            // Obtener la transacción con relaciones
            $transaction = PayrollTransaction::with(['user', 'studioModel.studio', 'period'])
                ->findOrFail($transactionId);

            // Obtener información completa del usuario
            $user = $transaction->user;
            $studioModel = $transaction->studioModel;
            $studio = $studioModel->studio;
            $period = $transaction->period;

            // Calcular días del mes
            $startDate = \Carbon\Carbon::parse($period->payroll_period_start_date);
            $endDate = \Carbon\Carbon::parse($period->payroll_period_end_date);
            $daysInPeriod = $endDate->diffInDays($startDate) + 1;

            // Calcular salario diario (basado en salario mensual)
            $monthlySalary = $studioModel->stdmod_monthly_salary ?? 0;
            $dailySalary = $monthlySalary / 30;

            // Preparar datos para el PDF
            $fullName = trim(
                ($user->user_name ?? '') . ' ' .
                ($user->user_name2 ?? '') . ' ' .
                ($user->user_surname ?? '') . ' ' .
                ($user->user_surname2 ?? '')
            );

            $userData = (object) [
                'std_name' => $studio->std_name ?? '',
                'std_nit' => $studio->std_nit ?? '',
                'std_image' => $studio->std_image ?? 'default.png',
                'user_name' => $fullName,
                'user_identification' => $user->user_identification ?? '',
                'prof_name' => $user->profile->prof_name ?? 'N/A',
            ];

            // Obtener transacciones LIQUIDADAS de todo el año para este empleado
            // Filtrar por mes del PERÍODO, no por fecha de creación
            $currentYear = \Carbon\Carbon::parse($period->payroll_period_start_date)->year;
            $yearlyTransactions = PayrollTransaction::where('user_id', $user->user_id)
                ->join('payroll_periods as pp', 'payroll_transactions.payroll_period_id', '=', 'pp.payroll_period_id')
                ->whereYear('pp.payroll_period_start_date', $currentYear)
                ->where('pp.payroll_period_state', 'LIQUIDADO') // Solo períodos LIQUIDADOS
                ->select('payroll_transactions.*', 'pp.payroll_period_start_date')
                ->orderBy('pp.payroll_period_start_date', 'asc')
                ->get();

            // Organizar transacciones por mes del PERÍODO (no por fecha de creación)
            $monthlyData = [];
            $monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

            foreach ($yearlyTransactions as $trans) {
                // Usar el mes del PERÍODO de nómina, no la fecha de creación
                $periodDate = \Carbon\Carbon::parse($trans->payroll_period_start_date);
                $monthKey = $periodDate->month; // 1-12

                if (!isset($monthlyData[$monthKey])) {
                    $monthlyData[$monthKey] = [
                        'month_name' => $monthNames[$monthKey - 1],
                        'salary_plus_commission' => 0,
                        'total_with_benefits' => 0,
                    ];
                }

                // Salario + Comisiones + Horas extras
                $salaryPlusCommission = $trans->base_salary +
                                       $trans->commission_amount +
                                       $trans->extra_hours_amount;

                // Total con TODAS las prestaciones, auxilios, seguridad social y parafiscales
                $totalWithBenefits = $salaryPlusCommission +
                                    $trans->transport_allowance +
                                    $trans->food_allowance +
                                    $trans->cesantias +
                                    $trans->prima +
                                    $trans->vacaciones +
                                    $trans->eps_employer +
                                    $trans->pension_employer +
                                    $trans->arl +
                                    $trans->sena +
                                    $trans->icbf +
                                    $trans->caja_compensacion;

                // SUMAR (no reemplazar) si ya existe el mes
                $monthlyData[$monthKey]['salary_plus_commission'] += $salaryPlusCommission;
                $monthlyData[$monthKey]['total_with_benefits'] += $totalWithBenefits;
            }

            // Asegurar que existan los 12 meses (llenar con $0 los vacíos)
            for ($i = 1; $i <= 12; $i++) {
                if (!isset($monthlyData[$i])) {
                    $monthlyData[$i] = [
                        'month_name' => $monthNames[$i - 1],
                        'salary_plus_commission' => 0,
                        'total_with_benefits' => 0,
                    ];
                }
            }

            // Ordenar por clave de mes
            ksort($monthlyData);

            // Convertir a array indexado (para facilitar acceso secuencial en la vista)
            $monthlyData = array_values($monthlyData);

            // Obtener detalle de comisiones (qué modelos generaron comisiones)
            $commissionDetails = [];
            $studioModel = \App\Models\StudioModel::where('user_id_model', $user->user_id)->first();

            if ($studioModel && $transaction->commission_amount > 0) {
                // Decodificar los períodos de comisión guardados
                $commissionPeriodIds = json_decode($transaction->commission_periods ?? '[]', true);

                $detailQuery = DB::table('commissions as parent_comm')
                    ->join('commissions as child_comm', 'parent_comm.comm_id', '=', 'child_comm.commparent_id')
                    ->join('setups_commissions as sc', 'parent_comm.setcomm_id', '=', 'sc.setcomm_id')
                    ->join('setups_commissions_items as sci', 'sc.setcomm_id', '=', 'sci.setcomm_id')
                    ->join('models_accounts as ma', 'child_comm.stdmod_id', '=', 'ma.stdmod_id')
                    ->join('studios_models as sm', 'ma.stdmod_id', '=', 'sm.stdmod_id')
                    ->join('users as u', 'sm.user_id_model', '=', 'u.user_id')
                    ->join('liquidations as lq', 'ma.modacc_id', '=', 'lq.modacc_id')
                    ->where('parent_comm.stdmod_id', $studioModel->stdmod_id);

                // Si hay períodos específicos guardados, filtrar por ellos
                if (!empty($commissionPeriodIds)) {
                    $detailQuery->join('periods as p', function($join) {
                        $join->on(DB::raw('lq.liq_date'), '>=', DB::raw('p.period_start_date'))
                             ->on(DB::raw('lq.liq_date'), '<=', DB::raw('p.period_end_date'));
                    })
                    ->whereIn('p.period_id', $commissionPeriodIds)
                    ->where('p.period_state', 'CERRADO');
                } else {
                    // Fallback: usar rango de fechas del período de nómina
                    $detailQuery->whereBetween('lq.liq_date', [$period->payroll_period_start_date, $period->payroll_period_end_date]);
                }

                $detailQuery->where(function($query) use ($period) {
                        $query->whereNull('parent_comm.comm_expire_date')
                              ->orWhere('parent_comm.comm_expire_date', '>=', $period->payroll_period_end_date);
                    })
                    ->selectRaw('
                        CONCAT(u.user_name, \' \', COALESCE(u.user_surname, \'\')) as model_name,
                        sci.setcommitem_value as commission_percentage,
                        SUM(lq.liq_earnings_cop) as total_earnings,
                        SUM((lq.liq_earnings_cop * (sci.setcommitem_value / 100))::numeric(10,2)) as commission_amount
                    ')
                    ->groupBy('u.user_name', 'u.user_surname', 'sci.setcommitem_value');

                $commissionDetails = $detailQuery->get()->toArray();
            }

            // Calcular deducciones de SNACKS
            $snacksDeductions = $this->payrollCalculationService->calculateSnacksDeductions(
                $user->user_id,
                $transaction->payroll_period_id,
                $period->payroll_period_start_date,
                $period->payroll_period_end_date
            );

            $data = [
                'user' => $userData,
                'studio' => $studio,
                'period' => $period,
                'transaction' => $transaction,
                'formatted_period_start' => $startDate->format('d/m/Y'),
                'formatted_period_end' => $endDate->format('d/m/Y'),
                'formatted_today' => \Carbon\Carbon::now()->format('d/m/Y'),
                'days_in_period' => $daysInPeriod,
                'monthly_salary' => $monthlySalary,
                'daily_salary' => $dailySalary,
                // Devengado
                'base_salary' => $transaction->base_salary,
                'dotacion_amount' => $transaction->dotacion_amount ?? 0,
                'commission_amount' => $transaction->commission_amount,
                'extra_hours_amount' => $transaction->extra_hours_amount,
                'transport_allowance' => $transaction->transport_allowance,
                'food_allowance' => $transaction->food_allowance,
                // Prestaciones
                'cesantias' => $transaction->cesantias,
                'prima' => $transaction->prima,
                'vacaciones' => $transaction->vacaciones,
                // Seguridad Social
                'eps_employee' => $transaction->eps_employee,
                'pension_employee' => $transaction->pension_employee,
                'eps_employer' => $transaction->eps_employer,
                'pension_employer' => $transaction->pension_employer,
                'arl' => $transaction->arl,
                // Parafiscales
                'sena' => $transaction->sena,
                'icbf' => $transaction->icbf,
                'caja_compensacion' => $transaction->caja_compensacion,
                // Totales
                'total_devengado' => $transaction->total_devengado,
                'total_deducciones' => $transaction->total_deducciones,
                'total_neto' => $transaction->total_neto,
                // Datos mensuales del año
                'monthly_data' => $monthlyData,
                'current_year' => $currentYear,
                // Detalle de comisiones
                'commission_details' => $commissionDetails,
                // Deducciones de SNACKS (dispensadora)
                'snacks_total' => $snacksDeductions['total'] ?? 0,
                'snacks_detail' => $snacksDeductions['detail'] ?? [],
                'snacks_count' => $snacksDeductions['count'] ?? 0,
            ];

            $pdf = PDF::loadView('pdfs.paysheet', $data);

            $fileName = 'Recibo de Pago ' . $userData->user_name . ' ' .
                        $period->payroll_period_start_date . ' al ' .
                        $period->payroll_period_end_date . '.pdf';

            return $pdf->stream($fileName);

        } catch (Exception $e) {
            Log::error('Error generando PDF de nómina: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error generando PDF: ' . $e->getMessage()
            ], 500);
        }
    }
}
