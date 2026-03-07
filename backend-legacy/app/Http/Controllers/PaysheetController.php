<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Log;

use App\Library\HelperController;
use App\Library\LogController;
use App\Models\PayrollPeriod;
use App\Models\PayrollTransaction;
use App\Models\StudioModel;
use App\Models\Studio;
use App\Models\User;
use App\Models\Period;
use App\Services\PayrollPeriodService;
use App\Services\PayrollPeriodAutoGenerationService;

class PaysheetController extends Controller
{
    private $helper;
    private $log;
    private $payrollPeriodService;
    private $payrollAutoGenerationService;

    public function __construct(PayrollPeriodService $payrollPeriodService, PayrollPeriodAutoGenerationService $payrollAutoGenerationService)
    {
        $this->helper = new HelperController();
        $this->log = new LogController();
        $this->payrollPeriodService = $payrollPeriodService;
        $this->payrollAutoGenerationService = $payrollAutoGenerationService;
    }

    /**
     * Obtener períodos de nómina por estudio (Sprint 2 - Tarea 2.1)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPayrollPeriods(Request $request)
    {
        try {
            $user = $request->user();
            $user_prof_id = $user->prof_id;
            $user_id_owner = $user->user_id;

            $query = PayrollPeriod::with(['studio'])
                ->select('payroll_periods.*')
                ->join('studios AS s', 'payroll_periods.std_id', 's.std_id');

            // Filtrar por estudio si el usuario es dueño de estudio
            if ($user_prof_id == 2) { // STUDIO profile
                $query->where('s.user_id_owner', $user_id_owner);
            }

            // Filtros adicionales
            if ($request->has('std_id')) {
                $query->where('payroll_periods.std_id', $request->input('std_id'));
            }

            if ($request->has('state')) {
                $query->where('payroll_periods.payroll_period_state', $request->input('state'));
            }

            if ($request->has('interval')) {
                $query->where('payroll_periods.payroll_period_interval', $request->input('interval'));
            }

            $payrollPeriods = $query->orderBy('payroll_period_start_date', 'desc')->get();

            return response()->json(['status' => 'success', 'data' => $payrollPeriods], 200);

        } catch (\Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Crear período individual de nómina (Sprint 2 - Tarea 2.1)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createPayrollPeriod(Request $request)
    {
        try {
            DB::beginTransaction();
            $data = $request->all();
            $uAuth = $request->user();

            // Validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            // Validate data
            $this->validate($request, [
                'std_id' => 'required|exists:studios,std_id',
                'payroll_period_start_date' => 'required|date',
                'payroll_period_end_date' => 'required|date|after:payroll_period_start_date',
                'payroll_period_interval' => 'required|in:SEMANAL,QUINCENAL,MENSUAL',
                'payroll_period_smmlv' => 'required|numeric|min:0'
            ]);

            // Validar permisos de usuario sobre el estudio
            $this->validateStudioPermissions($request, $data['std_id']);

            // Check for overlapping periods
            $overlapping = PayrollPeriod::where('std_id', $data['std_id'])
                ->where(function($query) use ($data) {
                    $query->whereBetween('payroll_period_start_date', [$data['payroll_period_start_date'], $data['payroll_period_end_date']])
                          ->orWhereBetween('payroll_period_end_date', [$data['payroll_period_start_date'], $data['payroll_period_end_date']])
                          ->orWhere(function($q) use ($data) {
                              $q->where('payroll_period_start_date', '<=', $data['payroll_period_start_date'])
                                ->where('payroll_period_end_date', '>=', $data['payroll_period_end_date']);
                          });
                })
                ->exists();

            if ($overlapping) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'OVERLAPPING_PERIOD',
                    'message' => 'Ya existe un período de nómina que se superpone con las fechas seleccionadas',
                ], 400);
            }

            // Create record
            $record = PayrollPeriod::create([
                'std_id' => $data['std_id'],
                'payroll_period_start_date' => $data['payroll_period_start_date'],
                'payroll_period_end_date' => $data['payroll_period_end_date'],
                'payroll_period_state' => 'ABIERTO',
                'payroll_period_interval' => $data['payroll_period_interval'],
                'payroll_period_smmlv' => $data['payroll_period_smmlv']
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'payroll_periods', $record->payroll_period_id, 'INSERT', null, $record, $request->ip);
                DB::commit();
                return response()->json(['status' => 'success', 'data' => $record], 201);
            } else {
                DB::rollBack();
                return response()->json(['status' => 'fail'], 500);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Display the specified payroll period.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();
            $user_prof_id = $user->prof_id;
            $user_id_owner = $user->user_id;

            $query = PayrollPeriod::with(['studio', 'payrollTransactions.user', 'payrollTransactions.studioModel'])
                ->select('payroll_periods.*')
                ->join('studios AS s', 'payroll_periods.std_id', 's.std_id')
                ->where('payroll_periods.payroll_period_id', $id);

            // Filter by studio ownership if user is studio owner
            if ($user_prof_id == 2) { // STUDIO profile
                $query->where('s.user_id_owner', $user_id_owner);
            }

            $payrollPeriod = $query->first();

            if (!$payrollPeriod) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'NOT_FOUND',
                    'message' => 'Período de nómina no encontrado',
                ], 404);
            }

            return response()->json(['status' => 'success', 'data' => $payrollPeriod], 200);

        } catch (\Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Update the specified payroll period.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        try {
            $data = $request->all();
            $uAuth = $request->user();

            // Validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            $record = PayrollPeriod::findOrFail($id);

            // Check if period is already liquidated
            if ($record->payroll_period_state === 'LIQUIDADO') {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'PERIOD_LIQUIDATED',
                    'message' => 'No se puede modificar un período ya liquidado',
                ], 400);
            }

            // Validate data
            $this->validate($request, [
                'payroll_period_start_date' => 'sometimes|required|date',
                'payroll_period_end_date' => 'sometimes|required|date|after:payroll_period_start_date',
                'payroll_period_state' => 'sometimes|required|in:ABIERTO,CERRADO',
                'payroll_period_interval' => 'sometimes|required|in:MENSUAL,QUINCENAL',
                'payroll_period_smmlv' => 'sometimes|required|numeric|min:0'
            ]);

            $before = PayrollPeriod::findOrFail($id);

            $updateData = [];
            if (isset($data['payroll_period_start_date'])) {
                $updateData['payroll_period_start_date'] = $data['payroll_period_start_date'];
            }
            if (isset($data['payroll_period_end_date'])) {
                $updateData['payroll_period_end_date'] = $data['payroll_period_end_date'];
            }
            if (isset($data['payroll_period_state'])) {
                $updateData['payroll_period_state'] = $data['payroll_period_state'];
            }
            if (isset($data['payroll_period_interval'])) {
                $updateData['payroll_period_interval'] = $data['payroll_period_interval'];
            }
            if (isset($data['payroll_period_smmlv'])) {
                $updateData['payroll_period_smmlv'] = $data['payroll_period_smmlv'];
            }

            $record->update($updateData);

            if ($record) {
                $this->log::storeLog($uAuth, 'payroll_periods', $record->payroll_period_id, 'UPDATE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->payroll_period_id], 200);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }

        } catch (\Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Remove the specified payroll period.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $id)
    {
        try {
            $uAuth = $request->user();

            // Validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            $record = PayrollPeriod::findOrFail($id);

            // Check if period has transactions
            $hasTransactions = PayrollTransaction::where('payroll_period_id', $id)->exists();
            if ($hasTransactions) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'HAS_TRANSACTIONS',
                    'message' => 'No se puede eliminar un período que tiene transacciones asociadas',
                ], 400);
            }

            $before = PayrollPeriod::findOrFail($id);
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'payroll_periods', $record->payroll_period_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->payroll_period_id], 200);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }

        } catch (\Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Cerrar período de nómina (Sprint 2 - Tarea 2.1)
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function closePeriod($id)
    {
        try {
            $period = $this->payrollPeriodService->closePeriod($id);

            return response()->json([
                'status' => 'success',
                'message' => 'Período cerrado exitosamente',
                'data' => $period
            ], 200);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'status' => 'fail',
                'code' => 'VALIDATION_ERROR',
                'message' => $e->getMessage()
            ], 400);
        } catch (\Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Liquidate a payroll period.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function liquidate(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $uAuth = $request->user();
            $data = $request->all();

            // Validate data
            $this->validate($request, [
                'commission_periods' => 'required|array',
                'commission_periods.*' => 'exists:periods,period_id'
            ]);

            $payrollPeriod = PayrollPeriod::findOrFail($id);

            if ($payrollPeriod->payroll_period_state === 'LIQUIDADO') {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'ALREADY_LIQUIDATED',
                    'message' => 'Este período ya ha sido liquidado',
                ], 400);
            }

            // Verify all commission periods are closed and not liquidated
            $commissionPeriods = Period::whereIn('period_id', $data['commission_periods'])
                ->where('period_state', 'CERRADO')
                ->whereNull('liquidated_at')
                ->get();

            if ($commissionPeriods->count() !== count($data['commission_periods'])) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_COMMISSION_PERIODS',
                    'message' => 'Todos los períodos de comisión deben estar cerrados y no liquidados',
                ], 400);
            }

            // Get employees for this studio with payroll data
            $employees = StudioModel::withPayrollData()
                ->forStudio($payrollPeriod->std_id)
                ->employees()
                ->active()
                ->with(['userModel'])
                ->get();

            foreach ($employees as $employee) {
                // Calculate payroll for this employee
                $payrollData = $this->calculatePayroll($employee, $payrollPeriod, $commissionPeriods);

                // Create payroll transaction
                PayrollTransaction::create([
                    'payroll_period_id' => $payrollPeriod->payroll_period_id,
                    'user_id' => $employee->user_id_model,
                    'stdmod_id' => $employee->stdmod_id,
                    'base_salary' => $payrollData['base_salary'],
                    'commission_amount' => $payrollData['commission_amount'],
                    'extra_hours_amount' => $payrollData['extra_hours_amount'],
                    'transport_allowance' => $payrollData['transport_allowance'],
                    'food_allowance' => $payrollData['food_allowance'],
                    'cesantias' => $payrollData['cesantias'],
                    'prima' => $payrollData['prima'],
                    'vacaciones' => $payrollData['vacaciones'],
                    'eps_employee' => $payrollData['eps_employee'],
                    'pension_employee' => $payrollData['pension_employee'],
                    'eps_employer' => $payrollData['eps_employer'],
                    'pension_employer' => $payrollData['pension_employer'],
                    'arl' => $payrollData['arl'],
                    'sena' => $payrollData['sena'],
                    'icbf' => $payrollData['icbf'],
                    'caja_compensacion' => $payrollData['caja_compensacion'],
                    'total_devengado' => $payrollData['total_devengado'],
                    'total_deducciones' => $payrollData['total_deducciones'],
                    'total_neto' => $payrollData['total_neto'],
                    'commission_periods' => $data['commission_periods']
                ]);
            }

            // Mark commission periods as liquidated
            Period::whereIn('period_id', $data['commission_periods'])
                ->update(['liquidated_at' => now()]);

            // Mark payroll period as liquidated
            $before = PayrollPeriod::findOrFail($id);
            $payrollPeriod->liquidate();

            $this->log::storeLog($uAuth, 'payroll_periods', $payrollPeriod->payroll_period_id, 'LIQUIDATE', $before, $payrollPeriod, $request->ip);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'payroll_period_id' => $payrollPeriod->payroll_period_id,
                    'employees_processed' => $employees->count()
                ]
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Calculate payroll for an employee.
     *
     * @param  StudioModel  $employee
     * @param  PayrollPeriod  $payrollPeriod
     * @param  Collection  $commissionPeriods
     * @return array
     */
    private function calculatePayroll($employee, $payrollPeriod, $commissionPeriods)
    {
        $smmlv = $payrollPeriod->payroll_period_smmlv;
        $baseSalary = $employee->stdmod_monthly_salary ?? 0;

        // Calculate commissions from the selected periods
        $commissionAmount = 0; // TODO: Calculate from commission periods

        // Calculate extras (these would come from additional input in real implementation)
        $extraHoursAmount = 0;
        $transportAllowance = 0;
        $foodAllowance = 0;

        // Calculate prestaciones sociales (8.33% for cesantias, 8.33% for prima, 4.17% for vacaciones)
        $salaryBase = max($baseSalary, $smmlv);
        $cesantias = $salaryBase * 0.0833;
        $prima = $salaryBase * 0.0833;
        $vacaciones = $salaryBase * 0.0417;

        // Calculate social security (employee contributions)
        $epsEmployee = $salaryBase * 0.04; // 4% EPS employee
        $pensionEmployee = $salaryBase * 0.04; // 4% Pension employee

        // Calculate social security (employer contributions)
        $epsEmployer = $salaryBase * 0.085; // 8.5% EPS employer
        $pensionEmployer = $salaryBase * 0.12; // 12% Pension employer
        $arl = $salaryBase * ($employee->getArlPercentage() / 100); // ARL varies by risk level

        // Calculate parafiscales (only if salary < 2 SMMLV and checkboxes are enabled)
        $sena = 0;
        $icbf = 0;
        $cajaCompensacion = 0;

        if ($employee->requiresParafiscales($smmlv)) {
            if ($employee->stdmod_has_sena) {
                $sena = $salaryBase * 0.02; // 2% SENA
            }
            if ($employee->stdmod_has_icbf) {
                $icbf = $salaryBase * 0.03; // 3% ICBF
            }
            if ($employee->stdmod_has_caja_compensacion) {
                $cajaCompensacion = $salaryBase * 0.04; // 4% Caja de Compensación
            }
        }

        // Calculate totals
        $totalDevengado = $baseSalary + $commissionAmount + $extraHoursAmount +
                         $transportAllowance + $foodAllowance + $cesantias + $prima + $vacaciones;

        $totalDeducciones = $epsEmployee + $pensionEmployee;

        $totalNeto = $totalDevengado - $totalDeducciones;

        return [
            'base_salary' => $baseSalary,
            'commission_amount' => $commissionAmount,
            'extra_hours_amount' => $extraHoursAmount,
            'transport_allowance' => $transportAllowance,
            'food_allowance' => $foodAllowance,
            'cesantias' => $cesantias,
            'prima' => $prima,
            'vacaciones' => $vacaciones,
            'eps_employee' => $epsEmployee,
            'pension_employee' => $pensionEmployee,
            'eps_employer' => $epsEmployer,
            'pension_employer' => $pensionEmployer,
            'arl' => $arl,
            'sena' => $sena,
            'icbf' => $icbf,
            'caja_compensacion' => $cajaCompensacion,
            'total_devengado' => $totalDevengado,
            'total_deducciones' => $totalDeducciones,
            'total_neto' => $totalNeto
        ];
    }

    /**
     * Crear múltiples períodos usando PayrollPeriodService (Sprint 2 - Tarea 2.1)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createBulkPeriods(Request $request)
    {
        try {
            $data = $request->all();
            $uAuth = $request->user();

            // Validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            // Validate data
            $this->validate($request, [
                'std_id' => 'required|exists:studios,std_id',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after:start_date',
                'interval' => 'required|in:SEMANAL,QUINCENAL,MENSUAL',
                'smmlv' => 'sometimes|numeric|min:0'
            ]);

            // Validar permisos de usuario sobre el estudio
            $this->validateStudioPermissions($request, $data['std_id']);

            // Crear períodos usando el servicio
            $periods = $this->payrollPeriodService->createPeriodsForInterval(
                $data['std_id'],
                Carbon::parse($data['start_date']),
                Carbon::parse($data['end_date']),
                $data['interval'],
                $data['smmlv'] ?? null
            );

            // Log de la operación
            foreach ($periods as $period) {
                $this->log::storeLog($uAuth, 'payroll_periods', $period->payroll_period_id, 'BULK_INSERT', null, $period, $request->ip);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Períodos creados exitosamente',
                'data' => [
                    'periods_created' => count($periods),
                    'periods' => $periods
                ]
            ], 201);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'status' => 'fail',
                'code' => 'VALIDATION_ERROR',
                'message' => $e->getMessage()
            ], 400);
        } catch (\Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Abrir período de nómina (Sprint 2 - Tarea 2.1)
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function openPeriod($id)
    {
        try {
            $period = $this->payrollPeriodService->openPeriod($id);

            return response()->json([
                'status' => 'success',
                'message' => 'Período abierto exitosamente',
                'data' => $period
            ], 200);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'status' => 'fail',
                'code' => 'VALIDATION_ERROR',
                'message' => $e->getMessage()
            ], 400);
        } catch (\Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Obtener períodos de comisiones disponibles para liquidar
     * Actualizado para mostrar últimos 20 períodos cerrados sin filtro de fechas
     *
     * @param Request $request
     * @param int $payroll_period_id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAvailableCommissionPeriods(Request $request, $payroll_period_id)
    {
        try {
            $std_id = $request->query('std_id');

            if (!$std_id) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Se requiere el parámetro std_id'
                ], 400);
            }

            // Obtener últimos 20 períodos CERRADOS del estudio que NO han sido liquidados
            // Relacionar: periods → users → studios_models → studios
            $commissionPeriods = Period::select('periods.*')
                ->join('users', 'periods.user_id', '=', 'users.user_id')
                ->join('studios_models', 'users.user_id', '=', 'studios_models.user_id_model')
                ->where('studios_models.std_id', $std_id)
                ->where('periods.period_state', 'CERRADO')
                ->whereNull('periods.liquidated_at') // Solo períodos NO liquidados
                ->whereNull('studios_models.deleted_at')
                ->orderBy('periods.period_end_date', 'desc')
                ->distinct()
                ->limit(20)
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $commissionPeriods
            ], 200);

        } catch (\Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Obtener períodos específicos por sus IDs
     * Usado para cargar los períodos que se usaron en una liquidación
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPeriodsByIds(Request $request)
    {
        try {
            $validated = $request->validate([
                'period_ids' => 'required|array',
                'period_ids.*' => 'integer|exists:periods,period_id'
            ]);

            $periods = Period::whereIn('period_id', $validated['period_ids'])
                ->orderBy('period_start_date', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $periods
            ], 200);

        } catch (\Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Obtener empleados del estudio (Sprint 2 - Tarea 2.1)
     *
     * @param int $std_id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStudioEmployees($std_id)
    {
        try {
            // Validar que el estudio existe
            $studio = Studio::findOrFail($std_id);

            // Obtener empleados del estudio (usuarios con contrato tipo empleado)
            $employees = StudioModel::with([
                'userModel:user_id,user_name,user_surname,user_identification,user_email',
                'studio:std_id,std_name'
            ])
            ->where('std_id', $std_id)
            ->where('stdmod_contract_type', 'EMPLEADO')
            ->where('stdmod_active', 1)
            ->whereNotNull('stdmod_monthly_salary')
            ->get();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'studio' => $studio,
                    'employees' => $employees,
                    'total_employees' => $employees->count()
                ]
            ], 200);

        } catch (\Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Obtener modelos del estudio (Sprint 2 - Tarea 2.1)
     *
     * @param int $std_id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStudioModels($std_id)
    {
        try {
            // Validar que el estudio existe
            $studio = Studio::findOrFail($std_id);

            // Obtener modelos del estudio
            $models = StudioModel::with([
                'userModel:user_id,user_name,user_surname,user_identification,user_email',
                'studio:std_id,std_name',
                'studioShift:stdshift_id,stdshift_name',
                'studioRoom:stdroom_id,stdroom_name'
            ])
            ->where('std_id', $std_id)
            ->where('stdmod_active', 1)
            ->get();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'studio' => $studio,
                    'models' => $models,
                    'total_models' => $models->count()
                ]
            ], 200);

        } catch (\Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Validar permisos del usuario sobre el estudio
     *
     * @param Request $request
     * @param int $std_id
     * @throws \Exception
     */
    private function validateStudioPermissions(Request $request, $std_id)
    {
        $user = $request->user();

        // Si es perfil de estudio (prof_id = 2), validar que sea dueño del estudio
        if ($user->prof_id == 2) {
            $studio = Studio::where('std_id', $std_id)
                ->where('user_id_owner', $user->user_id)
                ->first();

            if (!$studio) {
                throw new \Exception('No tiene permisos sobre este estudio');
            }
        }
        // Para otros perfiles (admin, etc.) permitir acceso completo
    }

    /**
     * Display a listing of payroll periods (mantener compatibilidad)
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        return $this->getPayrollPeriods($request);
    }

    /**
     * Store a newly created payroll period (mantener compatibilidad)
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        return $this->createPayrollPeriod($request);
    }

    /**
     * Close a payroll period (mantener compatibilidad)
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function close(Request $request, $id)
    {
        return $this->closePeriod($id);
    }

    /**
     * Generar período automáticamente basado en configuración del estudio
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function autoGeneratePeriod(Request $request)
    {
        try {
            $data = $request->all();
            $uAuth = $request->user();

            // Validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            // Validate data
            $this->validate($request, [
                'std_id' => 'required|exists:studios,std_id',
                'target_date' => 'sometimes|date'
            ]);

            // Validar permisos de usuario sobre el estudio
            $this->validateStudioPermissions($request, $data['std_id']);

            $targetDate = isset($data['target_date']) ? Carbon::parse($data['target_date']) : null;

            $period = $this->payrollAutoGenerationService->generatePeriodsForStudio(
                $data['std_id'],
                $targetDate
            );

            if ($period) {
                $this->log::storeLog($uAuth, 'payroll_periods', $period->payroll_period_id, 'AUTO_INSERT', null, $period, $request->ip);

                return response()->json([
                    'status' => 'success',
                    'message' => 'Período generado exitosamente',
                    'data' => $period
                ], 201);
            } else {
                return response()->json([
                    'status' => 'success',
                    'message' => 'El período requerido ya existe',
                    'data' => null
                ], 200);
            }

        } catch (\Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Generar múltiples períodos futuros automáticamente
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function autoGenerateNextPeriods(Request $request)
    {
        try {
            $data = $request->all();
            $uAuth = $request->user();

            // Validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            // Validate data
            $this->validate($request, [
                'std_id' => 'required|exists:studios,std_id',
                'count' => 'sometimes|integer|min:1|max:12'
            ]);

            // Validar permisos de usuario sobre el estudio
            $this->validateStudioPermissions($request, $data['std_id']);

            $count = $data['count'] ?? 3;

            $periods = $this->payrollAutoGenerationService->generateNextPeriods(
                $data['std_id'],
                $count
            );

            // Log de la operación
            foreach ($periods as $period) {
                $this->log::storeLog($uAuth, 'payroll_periods', $period->payroll_period_id, 'AUTO_BULK_INSERT', null, $period, $request->ip);
            }

            return response()->json([
                'status' => 'success',
                'message' => sprintf('Se generaron %d períodos futuros', count($periods)),
                'data' => [
                    'periods_created' => count($periods),
                    'periods' => $periods
                ]
            ], 201);

        } catch (\Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Abrir período de nómina (manteniendo compatibilidad con rutas existentes)
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function open(Request $request, $id)
    {
        return $this->openPeriod($id);
    }

    /**
     * Generar PDF de certificado de nómina para transacción específica
     *
     * @param int $transactionId
     * @return \Illuminate\Http\Response
     */
    public function getPayrollTransactionPdf($transactionId)
    {
        try {
            $transaction = PayrollTransaction::with([
                'user',
                'studioModel.studio',
                'period'
            ])->findOrFail($transactionId);

            $data = [
                'transaction' => $transaction,
                'employee' => $transaction->user,
                'period' => $transaction->period,
                'studio' => $transaction->studioModel->studio,
                'generated_at' => Carbon::now()
            ];

            $pdf = \PDF::loadView('pdfs.payroll_certificate', $data);

            $fileName = "Certificado_Nomina_{$transaction->user->user_name}_{$transaction->period->payroll_period_start_date}.pdf";

            return $pdf->stream($fileName);

        } catch (\Exception $e) {
            Log::error('Error generando PDF de certificado de nómina: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error generando certificado: ' . $e->getMessage()
            ], 500);
        }
    }
}
