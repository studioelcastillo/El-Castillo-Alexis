<?php

namespace App\Services;

use App\Models\StudioModel;
use App\Models\Transaction;
use App\Models\TransactionType;
use App\Models\PayrollAdditionalConcept;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PayrollCalculationService
{
    // Configuración Colombian 2025
    const SMMLV_2025 = 1423500;
    const AUXILIO_TRANSPORTE_2025 = 200000; // Para salarios < 2 SMMLV

    // Porcentajes de prestaciones sociales
    const CESANTIAS_PERCENTAGE = 8.33;
    const PRIMA_PERCENTAGE = 8.33;
    const VACACIONES_PERCENTAGE = 4.17;

    // Porcentajes seguridad social
    const EPS_EMPLOYEE_PERCENTAGE = 4.0;
    const EPS_EMPLOYER_PERCENTAGE = 8.5;
    const PENSION_EMPLOYEE_PERCENTAGE = 4.0;
    const PENSION_EMPLOYER_PERCENTAGE = 12.0;

    // Porcentajes parafiscales
    const SENA_PERCENTAGE = 2.0;
    const ICBF_PERCENTAGE = 3.0;
    const CAJA_COMPENSACION_PERCENTAGE = 4.0;

    // Niveles de riesgo ARL
    const ARL_RISK_LEVELS = [
        'I' => 0.522,
        'II' => 1.044,
        'III' => 2.436,
        'IV' => 4.350,
        'V' => 6.960
    ];

    // Tipo de transacción para SNACKS (dispensadora)
    const SNACKS_TRANSTYPE_ID = 79;

    // Tipos de contrato que SÍ generan prestaciones sociales (Tipo A)
    const CONTRACT_TYPES_WITH_BENEFITS = [
        'APRENDIZAJE',
        'TERMINO FIJO',
        'TERMINO INDEFINIDO'
    ];

    // Tipos de contrato que NO generan prestaciones sociales (Tipo B)
    const CONTRACT_TYPES_WITHOUT_BENEFITS = [
        'OCASIONAL DE TRABAJO',
        'OBRA O LABOR',
        'CIVIL POR PRESTACIÓN DE SERVICIOS'
    ];

    /**
     * Determinar si un tipo de contrato genera prestaciones sociales
     */
    private function contractHasBenefits($contractType)
    {
        return in_array($contractType, self::CONTRACT_TYPES_WITH_BENEFITS);
    }

    /**
     * Calcular salario proporcional según días trabajados en el período
     *
     * @param float $monthlySalary Salario mensual completo
     * @param string $startDate Fecha inicio del período
     * @param string $endDate Fecha fin del período
     * @param string $intervalType Tipo de intervalo (MENSUAL, QUINCENAL, SEMANAL)
     * @return float Salario proporcional calculado
     */
    private function calculateProportionalSalary($monthlySalary, $startDate, $endDate, $intervalType)
    {
        // Para MENSUAL, retornar el salario completo
        if ($intervalType === 'MENSUAL') {
            return $monthlySalary;
        }

        // Para QUINCENAL y SEMANAL, calcular proporcional por días
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        // Calcular días en el período (incluyendo ambos días)
        $daysInPeriod = $start->diffInDays($end) + 1;

        // Salario diario = salario mensual / 30 días
        $dailySalary = $monthlySalary / 30;

        // Salario proporcional = salario diario × días del período
        return round($dailySalary * $daysInPeriod, 2);
    }

    /**
     * Calcular comisiones para un empleado en un rango de fechas
     * Calcula desde models_streams + commissions (tiempo real) y suma transacciones registradas
     */
    public function calculateCommissionsForEmployee($userId, $startDate, $endDate, $periodIds = [])
    {
        // 1. Obtener el stdmod_id del usuario
        $studioModel = StudioModel::where('user_id_model', $userId)->first();

        if (!$studioModel) {
            return 0;
        }

        // 2. Calcular comisiones desde models_streams en tiempo real
        $query = DB::table('commissions as parent_comm')
            ->join('commissions as child_comm', 'parent_comm.comm_id', '=', 'child_comm.commparent_id')
            ->join('setups_commissions as sc', 'parent_comm.setcomm_id', '=', 'sc.setcomm_id')
            ->join('setups_commissions_items as sci', 'sc.setcomm_id', '=', 'sci.setcomm_id')
            ->join('models_accounts as ma', 'child_comm.stdmod_id', '=', 'ma.stdmod_id')
            ->join('models_streams as ms', 'ma.modacc_id', '=', 'ms.modacc_id')
            ->where('parent_comm.stdmod_id', $studioModel->stdmod_id);

        // Si se especificaron períodos, filtrar solo por esos períodos CERRADOS
        if (!empty($periodIds)) {
            $query->join('periods as p', function($join) {
                $join->on(DB::raw('ms.modstr_date'), '>=', DB::raw('p.period_start_date'))
                     ->on(DB::raw('ms.modstr_date'), '<=', DB::raw('p.period_end_date'));
            })
            ->whereIn('p.period_id', $periodIds)
            ->where('p.period_state', 'CERRADO');
        } else {
            // Si no hay períodos específicos, usar el rango de fechas completo
            $query->whereBetween('ms.modstr_date', [$startDate, $endDate]);
        }

        // Validar fecha de expiración de comisión
        $query->where(function($q) use ($endDate) {
            $q->whereNull('parent_comm.comm_expire_date')
              ->orWhere('parent_comm.comm_expire_date', '>=', $endDate);
        });

        $commissionsFromStreams = $query->selectRaw('SUM((ms.modstr_earnings_cop * (sci.setcommitem_value / 100))::numeric(10,2)) as total_commission')
            ->value('total_commission');

        // 3. Sumar comisiones ya registradas en transactions (legacy/manual)
        $commissionType = TransactionType::where('transtype_name', 'Comisión')->first();
        $commissionsFromTransactions = 0;

        if ($commissionType) {
            $transQuery = Transaction::where('user_id', $userId)
                ->where('transtype_id', $commissionType->transtype_id);

            // Si se especificaron períodos, filtrar por las fechas de esos períodos
            if (!empty($periodIds)) {
                $transQuery->whereExists(function($query) use ($periodIds) {
                    $query->select(DB::raw(1))
                          ->from('periods')
                          ->whereRaw('transactions.trans_date >= periods.period_start_date')
                          ->whereRaw('transactions.trans_date <= periods.period_end_date')
                          ->whereIn('periods.period_id', $periodIds)
                          ->where('periods.period_state', 'CERRADO');
                });
            } else {
                $transQuery->whereBetween('trans_date', [$startDate, $endDate]);
            }

            $commissionsFromTransactions = $transQuery->sum('trans_amount');
        }

        // 4. Retornar suma de ambas fuentes
        return ($commissionsFromStreams ?? 0) + ($commissionsFromTransactions ?? 0);
    }

    /**
     * Calcular nómina completa para un empleado
     */
    public function calculatePayrollForEmployee(StudioModel $employee, $payrollPeriodId, $startDate, $endDate, $periodIds = [], $intervalType = 'MENSUAL')
    {
        $monthlySalary = $employee->stdmod_monthly_salary ?? 0;
        $userId = $employee->user_id_model;

        // Calcular salario base proporcional según el intervalo
        $baseSalary = $this->calculateProportionalSalary($monthlySalary, $startDate, $endDate, $intervalType);

        // Calcular comisiones desde transacciones
        $commissionsAmount = $this->calculateCommissionsForEmployee($userId, $startDate, $endDate, $periodIds);

        // Calcular horas extras y conceptos adicionales
        $extraHoursAmount = PayrollAdditionalConcept::where('payroll_period_id', $payrollPeriodId)
            ->where('user_id', $userId)
            ->where('concept_type', 'like', 'EXTRA_HOUR_%')
            ->sum('total_amount');

        $otherAdditionsAmount = PayrollAdditionalConcept::where('payroll_period_id', $payrollPeriodId)
            ->where('user_id', $userId)
            ->whereIn('concept_type', ['BONUS', 'ALLOWANCE'])
            ->sum('total_amount');

        // Obtener detalle de horas extras para el frontend
        $extraHoursDetail = PayrollAdditionalConcept::where('payroll_period_id', $payrollPeriodId)
            ->where('user_id', $userId)
            ->where('concept_type', 'like', 'EXTRA_HOUR_%')
            ->get();

        // Obtener detalle de comisiones para el frontend
        $commissionDetails = [];
        if ($commissionsAmount > 0) {
            $detailQuery = DB::table('commissions as parent_comm')
                ->join('commissions as child_comm', 'parent_comm.comm_id', '=', 'child_comm.commparent_id')
                ->join('setups_commissions as sc', 'parent_comm.setcomm_id', '=', 'sc.setcomm_id')
                ->join('setups_commissions_items as sci', 'sc.setcomm_id', '=', 'sci.setcomm_id')
                ->join('models_accounts as ma', 'child_comm.stdmod_id', '=', 'ma.stdmod_id')
                ->join('studios_models as sm', 'ma.stdmod_id', '=', 'sm.stdmod_id')
                ->join('users as u', 'sm.user_id_model', '=', 'u.user_id')
                ->join('models_streams as ms', 'ma.modacc_id', '=', 'ms.modacc_id')
                ->where('parent_comm.stdmod_id', $employee->stdmod_id);

            // Si se especificaron períodos, filtrar solo por esos períodos CERRADOS
            if (!empty($periodIds)) {
                $detailQuery->join('periods as p', function($join) {
                    $join->on(DB::raw('ms.modstr_date'), '>=', DB::raw('p.period_start_date'))
                         ->on(DB::raw('ms.modstr_date'), '<=', DB::raw('p.period_end_date'));
                })
                ->whereIn('p.period_id', $periodIds)
                ->where('p.period_state', 'CERRADO');
            } else {
                // Si no hay períodos específicos, usar el rango de fechas completo
                $detailQuery->whereBetween('ms.modstr_date', [$startDate, $endDate]);
            }

            $detailQuery->where(function($query) use ($endDate) {
                    $query->whereNull('parent_comm.comm_expire_date')
                          ->orWhere('parent_comm.comm_expire_date', '>=', $endDate);
                })
                ->selectRaw('
                    CONCAT(u.user_name, \' \', COALESCE(u.user_surname, \'\')) as model_name,
                    sci.setcommitem_value as commission_percentage,
                    SUM(ms.modstr_earnings_cop) as total_earnings,
                    SUM((ms.modstr_earnings_cop * (sci.setcommitem_value / 100))::numeric(10,2)) as commission_amount
                ')
                ->groupBy('u.user_name', 'u.user_surname', 'sci.setcommitem_value');

            $commissionDetails = $detailQuery->get()->toArray();
        }

        // Determinar si el contrato genera prestaciones sociales
        $hasBenefits = $this->contractHasBenefits($employee->stdmod_contract_type);

        // Calcular dotación (proporcional según intervalo)
        $dotacionAmount = $this->calculateDotacion($employee, $startDate, $endDate, $intervalType);

        // Cálculos base (IMPORTANTE: sobre salario base solamente)
        // Solo se calculan si el tipo de contrato lo requiere (Tipo A)
        if ($hasBenefits) {
            $prestaciones = $this->calculatePrestaciones($baseSalary);
            $auxilios = $this->calculateAuxilios($baseSalary, $startDate, $endDate, $intervalType, $monthlySalary);
            $socialSecurity = $this->calculateSocialSecurity($baseSalary, $employee);
            $parafiscales = $this->calculateParafiscales($baseSalary, $employee);
        } else {
            // Para contratos Tipo B: sin prestaciones, auxilios, seguridad social ni parafiscales
            $prestaciones = [
                'cesantias' => 0,
                'prima' => 0,
                'vacaciones' => 0
            ];
            $auxilios = [
                'transporte' => 0,
                'alimentacion' => 0
            ];
            $socialSecurity = [
                'eps_employee' => 0,
                'eps_employer' => 0,
                'pension_employee' => 0,
                'pension_employer' => 0,
                'arl' => 0
            ];
            $parafiscales = [
                'sena' => 0,
                'icbf' => 0,
                'caja_compensacion' => 0
            ];
        }

        // Calcular deducciones de SNACKS (dispensadora)
        $snacksDeductions = $this->calculateSnacksDeductions($userId, $payrollPeriodId, $startDate, $endDate);

        // IMPORTANTE: Salario Total = Base + Dotación + Auxilios + Horas Extras + Prestaciones + Seg.Social Empleador + Parafiscales
        $totalSalary = $baseSalary +
            $dotacionAmount +
            $auxilios['transporte'] + $auxilios['alimentacion'] +
            $extraHoursAmount + $otherAdditionsAmount +
            $prestaciones['cesantias'] + $prestaciones['prima'] + $prestaciones['vacaciones'] +
            $socialSecurity['eps_employer'] + $socialSecurity['pension_employer'] + $socialSecurity['arl'] +
            $parafiscales['sena'] + $parafiscales['icbf'] + $parafiscales['caja_compensacion'];

        // Total Devengado = Salario Total + Comisiones
        $totalDevengado = $totalSalary + $commissionsAmount;

        // Total Deducciones = EPS + Pensión + SNACKS
        $totalDeducciones = $socialSecurity['eps_employee'] + $socialSecurity['pension_employee'] + $snacksDeductions['total'];

        $totalNeto = $totalDevengado - $totalDeducciones;

        return [
            'employee_id' => $userId,
            'employee_name' => trim(($employee->user->user_name ?? '') . ' ' . ($employee->user->user_surname ?? '')),
            'base_salary' => $baseSalary,
            'dotacion_amount' => $dotacionAmount,
            'commissions' => $commissionsAmount,
            'commission_details' => $commissionDetails,
            'extra_hours_amount' => $extraHoursAmount,
            'extra_hours_detail' => $extraHoursDetail,
            'other_additions' => $otherAdditionsAmount,
            'snacks_deductions' => $snacksDeductions,
            'total_salary' => $totalSalary,
            'prestaciones' => $prestaciones,
            'auxilios' => $auxilios,
            'social_security' => $socialSecurity,
            'parafiscales' => $parafiscales,
            'total_devengado' => $totalDevengado,
            'total_deducciones' => $totalDeducciones,
            'total_neto' => $totalNeto
        ];
    }

    /**
     * Calcular prestaciones sociales
     */
    public function calculatePrestaciones($baseSalary)
    {
        return [
            'cesantias' => round($baseSalary * (self::CESANTIAS_PERCENTAGE / 100), 2),
            'prima' => round($baseSalary * (self::PRIMA_PERCENTAGE / 100), 2),
            'vacaciones' => round($baseSalary * (self::VACACIONES_PERCENTAGE / 100), 2)
        ];
    }

    /**
     * Calcular auxilios (proporcionales según intervalo)
     */
    public function calculateAuxilios($baseSalary, $startDate, $endDate, $intervalType, $monthlySalary)
    {
        $transporteAmount = 0;

        // Auxilio de transporte solo para salarios < 2 SMMLV
        if ($monthlySalary < (2 * self::SMMLV_2025)) {
            // Para MENSUAL, usar el valor completo
            if ($intervalType === 'MENSUAL') {
                $transporteAmount = self::AUXILIO_TRANSPORTE_2025;
            } else {
                // Para QUINCENAL y SEMANAL, calcular proporcional por días
                $start = Carbon::parse($startDate);
                $end = Carbon::parse($endDate);
                $daysInPeriod = $start->diffInDays($end) + 1;

                // Auxilio diario = auxilio mensual / 30 días
                $dailyTransport = self::AUXILIO_TRANSPORTE_2025 / 30;
                $transporteAmount = round($dailyTransport * $daysInPeriod, 2);
            }
        }

        return [
            'transporte' => $transporteAmount,
            'alimentacion' => 0 // Por ahora en 0, configurable después
        ];
    }

    /**
     * Calcular dotación (proporcional según intervalo)
     */
    public function calculateDotacion(StudioModel $employee, $startDate, $endDate, $intervalType)
    {
        $monthlyDotacion = $employee->stdmod_dotacion_amount ?? 0;

        if ($monthlyDotacion <= 0) {
            return 0;
        }

        // Para MENSUAL, usar el valor completo
        if ($intervalType === 'MENSUAL') {
            return $monthlyDotacion;
        }

        // Para QUINCENAL y SEMANAL, calcular proporcional por días
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        $daysInPeriod = $start->diffInDays($end) + 1;

        // Dotación diaria = dotación mensual / 30 días
        $dailyDotacion = $monthlyDotacion / 30;
        return round($dailyDotacion * $daysInPeriod, 2);
    }

    /**
     * Calcular seguridad social
     */
    public function calculateSocialSecurity($baseSalary, StudioModel $employee)
    {
        $epsEmployee = round($baseSalary * (self::EPS_EMPLOYEE_PERCENTAGE / 100), 2);
        $epsEmployer = round($baseSalary * (self::EPS_EMPLOYER_PERCENTAGE / 100), 2);
        $pensionEmployee = round($baseSalary * (self::PENSION_EMPLOYEE_PERCENTAGE / 100), 2);
        $pensionEmployer = round($baseSalary * (self::PENSION_EMPLOYER_PERCENTAGE / 100), 2);

        // ARL según nivel de riesgo
        $arlLevel = $employee->stdmod_arl_risk_level ?? 'I';
        $arlPercentage = self::ARL_RISK_LEVELS[$arlLevel] ?? self::ARL_RISK_LEVELS['I'];
        $arl = round($baseSalary * ($arlPercentage / 100), 2);

        return [
            'eps_employee' => $epsEmployee,
            'eps_employer' => $epsEmployer,
            'pension_employee' => $pensionEmployee,
            'pension_employer' => $pensionEmployer,
            'arl' => $arl
        ];
    }

    /**
     * Calcular parafiscales
     * Los parafiscales son obligatorios para todos los empleados según normativa colombiana
     */
    public function calculateParafiscales($baseSalary, StudioModel $employee)
    {
        // Para efectos de nómina, aplicamos todos los parafiscales obligatorios
        $sena = round($baseSalary * (self::SENA_PERCENTAGE / 100), 2);
        $icbf = round($baseSalary * (self::ICBF_PERCENTAGE / 100), 2);
        $cajaCompensacion = round($baseSalary * (self::CAJA_COMPENSACION_PERCENTAGE / 100), 2);

        return [
            'sena' => $sena,
            'icbf' => $icbf,
            'caja_compensacion' => $cajaCompensacion
        ];
    }

    /**
     * Calcular deducciones de SNACKS (dispensadora) para un empleado en un período de nómina
     *
     * @param int $userId ID del usuario
     * @param int $payrollPeriodId ID del período de nómina
     * @param string|null $startDate Fecha inicio del período (para vista previa)
     * @param string|null $endDate Fecha fin del período (para vista previa)
     * @return array ['total' => float, 'detail' => array, 'count' => int]
     */
    public function calculateSnacksDeductions($userId, $payrollPeriodId, $startDate = null, $endDate = null)
    {
        $query = Transaction::with('product')
            ->where('user_id', $userId)
            ->where('transtype_id', self::SNACKS_TRANSTYPE_ID);

        // Primero intentar buscar por payroll_period_id (para períodos ya liquidados)
        $transactionsByPeriod = (clone $query)
            ->where('payroll_period_id', $payrollPeriodId)
            ->get();

        // Si hay transacciones asociadas al período, usarlas
        if ($transactionsByPeriod->count() > 0) {
            $transactions = $transactionsByPeriod;
        } elseif ($startDate && $endDate) {
            // Si no hay transacciones por período pero sí tenemos fechas,
            // buscar transacciones por rango de fechas que NO estén asociadas a otro período
            $transactions = $query
                ->whereBetween('trans_date', [$startDate, $endDate])
                ->where(function ($q) {
                    $q->whereNull('payroll_period_id');
                })
                ->get();
        } else {
            $transactions = collect();
        }

        $total = $transactions->sum('trans_amount');

        $detail = $transactions->map(function ($trans) {
            return [
                'trans_id' => $trans->trans_id,
                'date' => $trans->trans_date,
                'product' => $trans->product ? $trans->product->prod_name : 'Sin producto',
                'description' => $trans->trans_description,
                'amount' => $trans->trans_amount
            ];
        })->toArray();

        return [
            'total' => round($total, 2),
            'detail' => $detail,
            'count' => $transactions->count()
        ];
    }

    /**
     * Calcular nómina para múltiples empleados de un estudio
     */
    public function calculatePayrollForStudio($studioId, $payrollPeriodId, $startDate, $endDate, $periodIds = [])
    {
        // Obtener el período de nómina para conocer el intervalo
        $payrollPeriod = \App\Models\PayrollPeriod::find($payrollPeriodId);
        $intervalType = $payrollPeriod ? $payrollPeriod->payroll_period_interval : 'MENSUAL';

        // Obtener empleados no-modelo del estudio
        $employees = StudioModel::with(['user', 'studio'])
            ->where('std_id', $studioId)
            ->where('stdmod_contract_type', '!=', 'MANDANTE - MODELO')
            ->where('stdmod_active', true)
            ->whereNotNull('stdmod_monthly_salary')
            ->where('stdmod_monthly_salary', '>', 0)
            ->get();

        $payrollResults = [];
        $totals = [
            'total_base_salary' => 0,
            'total_salary' => 0,
            'total_commissions' => 0,
            'total_snacks_deductions' => 0,
            'total_devengado' => 0,
            'total_deducciones' => 0,
            'total_neto' => 0,
            'employee_count' => $employees->count()
        ];

        foreach ($employees as $employee) {
            $payrollCalc = $this->calculatePayrollForEmployee($employee, $payrollPeriodId, $startDate, $endDate, $periodIds, $intervalType);
            $payrollCalc['stdmod_id'] = $employee->stdmod_id;
            $payrollCalc['payroll_period_id'] = $payrollPeriodId;

            $payrollResults[] = $payrollCalc;

            // Acumular totales
            $totals['total_base_salary'] += $payrollCalc['base_salary'];
            $totals['total_salary'] += $payrollCalc['total_salary'];
            $totals['total_commissions'] += $payrollCalc['commissions'];
            $totals['total_snacks_deductions'] += $payrollCalc['snacks_deductions']['total'];
            $totals['total_devengado'] += $payrollCalc['total_devengado'];
            $totals['total_deducciones'] += $payrollCalc['total_deducciones'];
            $totals['total_neto'] += $payrollCalc['total_neto'];
        }

        return [
            'employees' => $payrollResults,
            'totals' => $totals,
            'period_info' => [
                'studio_id' => $studioId,
                'payroll_period_id' => $payrollPeriodId,
                'calculation_date' => Carbon::now()->toDateTimeString()
            ]
        ];
    }

    /**
     * Validar si un empleado es elegible para nómina
     */
    public function isEmployeeEligibleForPayroll(StudioModel $employee)
    {
        return $employee->stdmod_contract_type !== 'MANDANTE - MODELO' &&
               $employee->stdmod_active &&
               !empty($employee->stdmod_monthly_salary) &&
               $employee->stdmod_monthly_salary > 0;
    }

    /**
     * Asociar transacciones de SNACKS a un período de nómina al liquidar
     *
     * @param array $userIds Array de IDs de usuarios del período
     * @param int $payrollPeriodId ID del período de nómina
     * @param string $startDate Fecha inicio del período
     * @param string $endDate Fecha fin del período
     * @return int Número de transacciones actualizadas
     */
    public function associateSnacksToPayrollPeriod($userIds, $payrollPeriodId, $startDate, $endDate)
    {
        return Transaction::whereIn('user_id', $userIds)
            ->where('transtype_id', self::SNACKS_TRANSTYPE_ID)
            ->whereBetween('trans_date', [$startDate, $endDate])
            ->whereNull('payroll_period_id')
            ->update(['payroll_period_id' => $payrollPeriodId]);
    }

    /**
     * Obtener configuración actual de SMMLV
     */
    public function getCurrentSMMLV()
    {
        return self::SMMLV_2025;
    }

    /**
     * Obtener información de configuración de cálculos
     */
    public function getCalculationConfig()
    {
        return [
            'smmlv' => self::SMMLV_2025,
            'auxilio_transporte' => self::AUXILIO_TRANSPORTE_2025,
            'prestaciones' => [
                'cesantias' => self::CESANTIAS_PERCENTAGE,
                'prima' => self::PRIMA_PERCENTAGE,
                'vacaciones' => self::VACACIONES_PERCENTAGE
            ],
            'seguridad_social' => [
                'eps_employee' => self::EPS_EMPLOYEE_PERCENTAGE,
                'eps_employer' => self::EPS_EMPLOYER_PERCENTAGE,
                'pension_employee' => self::PENSION_EMPLOYEE_PERCENTAGE,
                'pension_employer' => self::PENSION_EMPLOYER_PERCENTAGE
            ],
            'parafiscales' => [
                'sena' => self::SENA_PERCENTAGE,
                'icbf' => self::ICBF_PERCENTAGE,
                'caja_compensacion' => self::CAJA_COMPENSACION_PERCENTAGE
            ],
            'arl_levels' => self::ARL_RISK_LEVELS
        ];
    }
}