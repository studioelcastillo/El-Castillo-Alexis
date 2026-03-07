<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use Exception;
use DateTime;

use App\Library\HelperController;
use App\Library\LogController;
use App\Models\Period;
use App\Services\LivejasminService;
use Illuminate\Support\Facades\Log;

class PeriodController extends Controller
{
    private $helper;
    private $log;
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->helper = new HelperController();
        $this->log = new LogController();
    }

    /**
     * Create a new period.
     *
     * @return response()->json
     */
    public function store(Request $request)
    {
        try {
            $data = $request->all();
            $uAuth = $request->user();

            // validamos los datos
            $this->validate($request, [
                'period_start_date' => 'required|date',
                'period_end_date' => 'required|date|after:period_start_date',
                'user_id' => 'exists:users,user_id'
            ]);
            
            // Verificar que no exista un periodo con las mismas fechas
            $existing_period = Period::where('period_start_date', $data['period_start_date'])
                ->where('period_end_date', $data['period_end_date'])
                ->first();
            
            if ($existing_period) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Ya existe un periodo con estas fechas de inicio y fin',
                    'data' => ['period_id' => $existing_period->period_id]
                ], 409);
            }
            
            $data['period_state'] = 'ABIERTO';
            unset($data['user_id']);
            $period = Period::create($data);
            if ($period) {
                $this->log::storeLog($uAuth, 'periods', $period->period_id, 'INSERT', null, $period, $request->ip);
                return response()->json(['status' => 'success', 'data' => $period], 201);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request)
    {
        try {
            //$data = $this->helper::generateConditions($request);
            $period = Period::with('user')->orderBy('period_end_date', 'desc');

            if ($request->input('limit') === 'true') {
            	$period = $period->limit(20);
            }
            $period = $period->get();
            return response()->json(['status' => 'success', 'data' => $period], 200);
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function getClosedPeriods(Request $request)
    {
        try {
            $period = Period::selectRaw("TO_CHAR(period_start_date, 'YYYY/MM/DD') AS period_start_date, TO_CHAR(period_end_date, 'YYYY/MM/DD') AS period_end_date")
                ->where('period_state', 'CERRADO')
                ->orderBy('period_end_date', 'desc')
                ->get();
            return response()->json(['status' => 'success', 'data' => $period], 200);
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }
    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function closePeriod(Request $request, $id)
    {
        try {
            $data = $request->all();
            $uAuth = $request->user();

            $this->validate($request, ['id' => 'exists:periods,period_id']);
            $period = Period::findOrFail($id);
            $before = Period::findOrFail($id);
            $actual_date = date("Y-m-d H:i:s");
            $period->update(['period_closed_date' => $actual_date, 'period_state' => 'CERRADO', 'period_observation' => $data['period_observation'], 'user_id' => $uAuth->user_id]);

            if ($period) {
                $this->log::storeLog($uAuth, 'periods', $period->period_id, 'CLOSED', $before, $period, $request->ip);
                return response()->json(['status' => 'success', 'data' => $period->period_id], 200);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function openPeriod(Request $request, $id)
    {
        try {
            $data = $request->all();
            $uAuth = $request->user();

            $this->validate($request, ['id' => 'exists:periods,period_id']);
            $period = Period::findOrFail($id);
            $before = Period::findOrFail($id);

            $period->update(['period_state' => 'ABIERTO']);

            if ($period) {
                $this->log::storeLog($uAuth, 'periods', $period->period_id, 'OPEN', $before, $period, $request->ip);
                return response()->json(['status' => 'success', 'data' => $period->period_id], 200);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $id)
    {
        try {
            $data = $request->all();
            $uAuth = $request->user();
            $request['id'] = $id;

            $this->validate($request, [
                'id' => 'required|integer|noExists:models_streams,period_id'
            ]);

            $period = Period::findOrFail($id);
            $before = Period::findOrFail($id);
            $period->delete();

            if ($period) {
                $this->log::storeLog($uAuth, 'periods', $before->period_id, 'DELETE', $before, null, $request->ip);
                return response()->json(['status' => 'success', 'data' => $period->period_id], 200);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * recibe una fecha tipo date('Y-m-d') a partir de esa fecha determina un periodo que empieza en el lunes mas anterior y el proximo domingo
     * con ambas fechas busca el periodo correspondiente en base de datos y si no lo encuentra crea un periodo de dichas fechas y retorna el periodo encontrado o creado.
     * @param  date $modstr_date
     */
    public static function retrieveOrCreatePeriod($modstr_date)
    {
        $period_start_date = (\date('l', strtotime($modstr_date)) == 'Monday') ? \date('Y-m-d', strtotime($modstr_date)) : \date('Y-m-d', strtotime('last monday', strtotime($modstr_date)));
        $period_end_date = \date('Y-m-d', strtotime('this sunday', strtotime($modstr_date)));

        // Crear periodo si no existe en la base de datos (se hace directamente en SQL para evitar duplicidad)
        $sql = "INSERT INTO periods (period_start_date, period_end_date, period_state, created_at, updated_at)
                SELECT '$period_start_date', '$period_end_date', 'ABIERTO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                WHERE NOT EXISTS (
                    SELECT 1 FROM periods WHERE period_start_date = '$period_start_date' AND period_end_date = '$period_end_date'
                );
        ";
        // Log::info($sql);
        try {
            DB::select($sql);
        } catch (\Exception $e) {
            \Log::warning('Periodo ya existe: ' . $e->getMessage());
            // Continúa la ejecución sin detener
        }

        // Consultar el periodo
        $period = Period::where('period_start_date', $period_start_date)
            ->where('period_end_date', $period_end_date)
            ->orderBy('period_id', 'desc')
            ->first();
        return $period;
    }

    /**
     * Crea o busca un período con fechas específicas de LiveJasmin (no calcula lunes-domingo)
     * Usado para sincronizar datos del microservicio de LiveJasmin con fechas exactas del API
     * @param  string $fromDate fecha inicio en formato Y-m-d
     * @param  string $toDate fecha fin en formato Y-m-d
     * @return Period
     */
    public static function retrieveOrCreatePeriodFromLivejasmin($fromDate, $toDate)
    {
        $period_start_date = \date('Y-m-d', strtotime($fromDate));
        $period_end_date = \date('Y-m-d', strtotime($toDate));

        // Crear periodo si no existe en la base de datos (se hace directamente en SQL para evitar duplicidad)
        $sql = "INSERT INTO periods (period_start_date, period_end_date, period_state, created_at, updated_at)
                SELECT '$period_start_date', '$period_end_date', 'ABIERTO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                WHERE NOT EXISTS (
                    SELECT 1 FROM periods WHERE period_start_date = '$period_start_date' AND period_end_date = '$period_end_date'
                );
        ";
        DB::select($sql);

        // Consultar el periodo
        $period = Period::where('period_start_date', $period_start_date)
            ->where('period_end_date', $period_end_date)
            ->orderBy('period_id', 'desc')
            ->first();
        return $period;
    }

    /**
     * Sync LiveJasmin periods from microservice
     *
     * @return response()->json
     */
    public function syncLivejasminPeriods(Request $request)
    {
        try {
            $uAuth = $request->user();
            $livejasminService = new LivejasminService();

            // Get periods from LiveJasmin microservice
            $periods = $livejasminService->getPeriods();

            Log::info('Periods received from LiveJasmin service', [
                'periods_count' => count($periods),
                'periods_structure' => $periods
            ]);

            if (empty($periods)) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'No se pudieron obtener los períodos de LiveJasmin'
                ], 400);
            }

            $createdCount = 0;
            $existingCount = 0;

            foreach ($periods as $index => $periodData) {
                Log::info("Processing period at index {$index}", [
                    'period_data' => $periodData,
                    'period_type' => gettype($periodData)
                ]);

                // Convert the microservice format to our expected format
                // Use period for start_date (correct period) and endDate for end_date
                // period is the actual period identifier, not the startDate timestamp
                $startDate = $periodData['period']; // Use period directly (2025-05-21)
                $endDate = \date('Y-m-d', strtotime($periodData['endDate'])); // Convert endDate timestamp

                Log::info("Converted period dates", [
                    'original_start' => $periodData['startDate'],
                    'converted_start' => $startDate,
                    'original_end' => $periodData['endDate'],
                    'converted_end' => $endDate
                ]);

                // Check if period already exists
                $existingPeriod = Period::where('period_start_date', $startDate)
                    ->where('period_end_date', $endDate)
                    ->first();

                if (!$existingPeriod) {
                    // Create new LiveJasmin period
                    $period = Period::create([
                        'period_start_date' => $startDate,
                        'period_end_date' => $endDate,
                        'period_state' => 'ABIERTO'
                    ]);

                    if ($period) {
                        $this->log::storeLog($uAuth, 'periods', $period->period_id, 'INSERT', null, $period, $request->ip());
                        $createdCount++;
                    }
                } else {
                    $existingCount++;
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => "Sincronización completada: {$createdCount} períodos creados, {$existingCount} ya existían",
                'data' => [
                    'created' => $createdCount,
                    'existing' => $existingCount,
                    'total' => count($periods)
                ]
            ], 200);
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Get periods with intelligent auto-sync
     * This method implements cache control to avoid excessive sync operations
     *
     * @return response()->json
     */
    public function getPeriodsWithAutoSync(Request $request)
    {
        try {
            // $forceSync = $request->query('force', false);
            $forceSync = true;
            $cacheKey = 'livejasmin_periods_last_sync';
            $cacheTimeout = 120; // 2 hours in minutes

            $syncResult = null;
            $shouldSync = $forceSync || !Cache::has($cacheKey);

            Log::info('Auto-sync check', [
                'force_sync' => $forceSync,
                'cache_exists' => Cache::has($cacheKey),
                'should_sync' => $shouldSync
            ]);

            // Perform sync if needed
            if ($shouldSync) {
                Log::info('Performing auto-sync of LiveJasmin periods...');

                try {
                    $syncResponse = $this->syncLivejasminPeriods($request);
                    $syncData = json_decode($syncResponse->getContent(), true);

                    if ($syncData['status'] === 'success') {
                        // Cache the sync for 2 hours
                        Cache::put($cacheKey, now(), $cacheTimeout);
                        $syncResult = $syncData;
                    }
                } catch (Exception $syncError) {
                    Log::warning('Auto-sync failed, continuing with existing periods: ' . $syncError->getMessage());
                    // Don't fail the entire request if sync fails
                }
            }

            // Always return the periods (regardless of sync success/failure)
            $periodsQuery = Period::with('user')->orderBy('period_end_date', 'desc');

            if ($request->input('limit') === 'true') {
                $periodsQuery = $periodsQuery->limit(10);
            }

            $periods = $periodsQuery->get();

            return response()->json([
                'status' => 'success',
                'data' => $periods,
                'sync_result' => $syncResult,
                'auto_sync_performed' => $shouldSync && $syncResult !== null
            ], 200);
        } catch (Exception $e) {
            Log::error('Error in getPeriodsWithAutoSync: ' . $e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }
}
