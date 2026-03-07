<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Carbon\Carbon;
use Validator;
use Log;

use App\Library\HelperController;
use App\Library\LogController;
use App\Requests\LoginDto;
use App\Models\User;
use App\Models\ModelStream;
use App\Models\ModelStreamFile;
use App\Models\ModelStreamCustomer;
use App\Models\ModelAccount;
use App\Models\StudioAccount;
use App\Services\WebcamService;
use App\Imports\ModelsStreamsImport;
use App\Models\Period;
use App\Http\Controllers\ExchangeRateController;
use App\Jobs\PopulateStreamsFromMasterJob;
use App\Jobs\PopulateStreamsFromModelsJob;
use App\Http\Controllers\PeriodController;

class ModelStreamController extends Controller
{
    private $helper;
    private $log;

    /**
     * Create a new instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->helper = new HelperController();
        $this->log = new LogController();
    }

    /**
     * Create a new record.
     *
     * @return response()->json
     */
    public function store(Request $request)
    {
        try {
            DB::beginTransaction();
            $data = $request->all();
            // $uAuth = $request->auth;
            $uAuth = $request->user();

            // validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            // validamos los datos
            $this->validate($request, [
                'modacc_id' => 'required|exists:models_accounts,modacc_id',
                'modstr_date' => 'required',
                'modstr_earnings_tokens' => 'nullable',
                'modstr_earnings_usd' => 'nullable',
                'modstr_earnings_eur' => 'nullable',
                'modstr_addon' => 'nullable',
            ]);

            // modstr_period
            $data['modstr_period'] = date('Ymd_H', strtotime($data['modstr_date']));

            // modstr_source
            $data['modstr_source'] = 'MANUAL';
            $period_id = PeriodController::retrieveOrCreatePeriod($data['modstr_date']);

            $modstr_earnings_value = (isset($data['modstr_earnings_usd']) && $data['modstr_earnings_usd'] !== '') ? $data['modstr_earnings_usd'] : $data['modstr_earnings_eur'];

            // Obtener datos del studio para calcular TRM y COP
            $modelAccount = ModelAccount::with(['studioModel.studio'])
                ->where('modacc_id', $data['modacc_id'])
                ->first();

            // Obtener TRM del día
            $trm_date = $data['modstr_date'];
            if (strtotime($trm_date) > strtotime(date('Y-m-d'))) {
                $trm_date = date('Y-m-d');
            }
            $exchangeRateController = new ExchangeRateController();
            $trmUSD = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'USD', $to = 'COP', $trm_date);
            $trmEUR = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'EUR', $to = 'COP', $trm_date);

            // Inicializar valores en COP
            $modstr_earnings_trm = 0;
            $modstr_earnings_cop = 0;
            $modstr_earnings_trm_studio = 0;
            $modstr_earnings_cop_studio = 0;

            // Calcular valores en COP
            if ($modelAccount && $modelAccount->studioModel && $modelAccount->studioModel->studio) {
                $studio = $modelAccount->studioModel->studio;

                if (!empty($data['modstr_earnings_usd'])) {
                    $modstr_earnings_trm = floatval($trmUSD) - floatval($studio->std_discountmodel_usd);
                    $modstr_earnings_cop = floatval($modstr_earnings_value) * floatval($modstr_earnings_trm);
                    $modstr_earnings_trm_studio = floatval($trmUSD) - floatval($studio->std_discountstudio_usd);
                    $modstr_earnings_cop_studio = floatval($modstr_earnings_value) * floatval($modstr_earnings_trm_studio);
                } else if (!empty($data['modstr_earnings_eur'])) {
                    $modstr_earnings_trm = floatval($trmEUR) - floatval($studio->std_discountmodel_eur);
                    $modstr_earnings_cop = floatval($modstr_earnings_value) * floatval($modstr_earnings_trm);
                    $modstr_earnings_trm_studio = floatval($trmEUR) - floatval($studio->std_discountstudio_eur);
                    $modstr_earnings_cop_studio = floatval($modstr_earnings_value) * floatval($modstr_earnings_trm_studio);
                }
            }

            // create record
            $record = ModelStream::create([
                'modacc_id' => (isset($data['modacc_id'])) ? $data['modacc_id'] : null,
                'modstr_date' => (isset($data['modstr_date'])) ? $data['modstr_date'] : null,
                'modstr_period' => (isset($data['modstr_period'])) ? $data['modstr_period'] : null,
                'modstr_earnings_value' => $modstr_earnings_value,
                'modstr_earnings_tokens' => (isset($data['modstr_earnings_tokens'])) ? $data['modstr_earnings_tokens'] : null,
                'modstr_earnings_usd' => (isset($data['modstr_earnings_usd'])) ? $data['modstr_earnings_usd'] : null,
                'modstr_earnings_eur' => (isset($data['modstr_earnings_eur'])) ? $data['modstr_earnings_eur'] : null,
                'modstr_earnings_trm' => $modstr_earnings_trm,
                'modstr_earnings_cop' => $modstr_earnings_cop,
                'modstr_earnings_trm_studio' => $modstr_earnings_trm_studio,
                'modstr_earnings_cop_studio' => $modstr_earnings_cop_studio,
                'period_id' => $period_id->period_id,
                'modstr_source' => (isset($data['modstr_source'])) ? $data['modstr_source'] : null,
                'modstr_addon' => (isset($data['modstr_addon'])) ? $data['modstr_addon'] : null,
            ]);
            if ($record) {
                $this->log::storeLog($uAuth, 'models_streams', $record->modstr_id, 'INSERT', null, $record, $request->ip);
                DB::commit();
                return response()->json(['status' => 'success', 'data' => $record], 201);
            } else {
                DB::rollBack();
                return response()->json(['status' => 'fail']);
            }
        } catch (Exception $e) {
            DB::rollBack();
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
            $data = $this->helper::generateConditions($request);
            $record = ModelStream::with(['modelAccount.studioModel.userModel'])
                ->where($data['where'])
                ->orWhere($data['orWhere'])
                ->whereRaw($data['whereRaw'])
                ->whereNull('deleted_at')
                ->orderBy('modstr_id', 'desc');
            $record = $this->applyTenantRelationScope($record, $request, 'modelAccount.studioModel')->get();
            $totals = ModelStream::select(
                DB::raw('SUM(modstr_earnings_value) AS ganancia'),
                DB::raw('SUM(modstr_earnings_percent) AS comision'),
                DB::raw('SUM(modstr_earnings_tokens) AS tokens'),
                DB::raw('SUM(modstr_earnings_usd) AS usd'),
                DB::raw('SUM(modstr_earnings_eur) AS eur'),
                DB::raw('SUM(modstr_earnings_cop) AS cop')
            )
                ->where($data['where'])
                ->orWhere($data['orWhere'])
                ->whereRaw($data['whereRaw'])
                ->whereNull('deleted_at');
            $totals = $this->applyTenantRelationScope($totals, $request, 'modelAccount.studioModel')->first();
            return response()->json(['status' => 'success', 'data' => $record, 'totals' => $totals], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function showByModel(Request $request)
    {
        try {
            $uAuth = $request->user();
            $user_id = $request->input('user_id');

            // Verificar si se solicita paginación
            $skip = $request->input('start');
            $take = $request->input('length');
            $orderby = $request->input('sortby');
            $dir = $request->input('dir');
            $filter = $request->input('filter');
            $columns = $request->input('columns');

            $user_id_model = $request->input('user_id_model');
            $modacc_id = $request->input('modacc_id');
            $modstrfile_id = $request->input('modstrfile_id');

            // Construir query base
            $query = ModelStream::with(['modelAccount.studioModel.userModel', 'modelAccount.studioModel.studio'])
                ->join('models_accounts AS ma', 'models_streams.modacc_id', 'ma.modacc_id')
                ->join('studios_models AS sm', 'ma.stdmod_id', 'sm.stdmod_id')
                ->join('studios AS s', 'sm.std_id', 's.std_id')
                ->select('models_streams.*');

            // Aplicar filtros
            if (isset($columns) && isset($filter) && $filter !== '') {
                $columnsArray = explode(',', $columns);
                $query->where(function ($q) use ($columnsArray, $filter) {
                    for ($i=0; $i < count($columnsArray); $i++) {
                        if ($i === 0) {
                            $q->where(DB::raw("UPPER(CAST(".$columnsArray[$i]." as VARCHAR))"), 'like', "%".strtoupper($filter)."%");
                        } else {
                            $q->orWhere(DB::raw("UPPER(CAST(".$columnsArray[$i]." as VARCHAR))"), 'like', "%".strtoupper($filter)."%");
                        }
                    }
                });
            }

            // Filtrar por modelo
            if (isset($user_id_model)) {
                $query->where('sm.user_id_model', $user_id_model);
            } elseif (isset($user_id)) {
                $query->where('sm.user_id_model', $user_id);
            }

            // Filtrar por cuenta
            if (isset($modacc_id)) {
                $query->where('models_streams.modacc_id', $modacc_id);
            }

            // Filtrar por archivo de transmisión
            if (isset($modstrfile_id)) {
                $query->where('models_streams.modstrfile_id', $modstrfile_id);
            }

            // Filtro por estudio
            $query->where(function ($q) use ($uAuth) {
                if ($uAuth->prof_id == 2) {
                    $q->where('s.user_id_owner', $uAuth->user_id);
                }
            });

            $query = $this->applyTenantScope($query, $request, 's.std_id');

            $query->whereNull('models_streams.deleted_at');

            // Aplicar ordenamiento
            if (isset($orderby) && isset($dir)) {
                $query->orderBy(DB::raw($orderby), $dir);
            } else {
                $query->orderBy('models_streams.modstr_id', 'desc');
            }

            // Calcular totales
            $totalsQuery = ModelStream::select(
                DB::raw('SUM(modstr_earnings_value) AS ganancia'),
                DB::raw('SUM(modstr_earnings_percent) AS comision'),
                DB::raw('SUM(modstr_earnings_tokens) AS tokens'),
                DB::raw('SUM(modstr_earnings_usd) AS usd'),
                DB::raw('SUM(modstr_earnings_eur) AS eur'),
                DB::raw('SUM(modstr_earnings_cop) AS cop')
            )
                ->join('models_accounts AS ma', 'models_streams.modacc_id', 'ma.modacc_id')
                ->join('studios_models AS sm', 'ma.stdmod_id', 'sm.stdmod_id')
                ->join('studios AS s', 'sm.std_id', 's.std_id');

            // Aplicar los mismos filtros a la consulta de totales
            if (isset($columns) && isset($filter) && $filter !== '') {
                $columnsArray = explode(',', $columns);
                $totalsQuery->where(function ($q) use ($columnsArray, $filter) {
                    for ($i=0; $i < count($columnsArray); $i++) {
                        if ($i === 0) {
                            $q->where(DB::raw("UPPER(CAST(".$columnsArray[$i]." as VARCHAR))"), 'like', "%".strtoupper($filter)."%");
                        } else {
                            $q->orWhere(DB::raw("UPPER(CAST(".$columnsArray[$i]." as VARCHAR))"), 'like', "%".strtoupper($filter)."%");
                        }
                    }
                });
            }

            if (isset($user_id_model)) {
                $totalsQuery->where('sm.user_id_model', $user_id_model);
            } elseif (isset($user_id)) {
                $totalsQuery->where('sm.user_id_model', $user_id);
            }

            if (isset($modacc_id)) {
                $totalsQuery->where('models_streams.modacc_id', $modacc_id);
            }

            if (isset($modstrfile_id)) {
                $totalsQuery->where('models_streams.modstrfile_id', $modstrfile_id);
            }

            $totalsQuery->where(function ($q) use ($uAuth) {
                if ($uAuth->prof_id == 2) {
                    $q->where('s.user_id_owner', $uAuth->user_id);
                }
            });

            $totalsQuery->whereNull('models_streams.deleted_at');
            $totals = $totalsQuery->first();

            // Si se solicita paginación
            if (isset($skip) && isset($take)) {
                // Clonar la consulta antes de paginar para obtener el conteo correcto
                $streamsTotal = clone $query;
                $streamsTotal = $streamsTotal->count();

                $take = ($take == 0) ? $streamsTotal : $take;
                $record = $query
                    ->skip($skip)
                    ->take($take)
                    ->get();

                return response()->json(['status' => 'success', 'data' => $record, 'totals' => $totals, 'recordsTotal' => $streamsTotal], 200);
            } else {
                // Sin paginación (comportamiento original)
                $record = $query->get();
                return response()->json(['status' => 'success', 'data' => $record, 'totals' => $totals], 200);
            }
        } catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
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
    public function update(Request $request, $id)
    {
        try {
            $data = $request->all();
            // $uAuth = $request->auth;
            $uAuth = $request->user();

            // validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            $record = ModelStream::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'modacc_id' => 'required|exists:models_accounts,modacc_id',
                'modstr_date' => 'required',
                'modstr_earnings_tokens' => 'nullable',
                'modstr_earnings_usd' => 'nullable',
                'modstr_earnings_eur' => 'nullable',
                'modstr_addon' => 'nullable',
            ]);
            $data['modstr_period'] = date('Ymd_H', strtotime($data['modstr_date']));
            $period_id = PeriodController::retrieveOrCreatePeriod($data['modstr_date']);
            $modstr_earnings_value = (isset($data['modstr_earnings_usd']) && $data['modstr_earnings_usd'] !== '') ? $data['modstr_earnings_usd'] : $data['modstr_earnings_eur'];

            // Obtener datos del studio para calcular TRM y COP
            $modelAccount = ModelAccount::with(['studioModel.studio'])
                ->where('modacc_id', $data['modacc_id'])
                ->first();

            // Obtener TRM del día
            $trm_date = $data['modstr_date'];
            if (strtotime($trm_date) > strtotime(date('Y-m-d'))) {
                $trm_date = date('Y-m-d');
            }
            $exchangeRateController = new ExchangeRateController();
            $trmUSD = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'USD', $to = 'COP', $trm_date);
            $trmEUR = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'EUR', $to = 'COP', $trm_date);

            // Inicializar valores en COP
            $modstr_earnings_trm = 0;
            $modstr_earnings_cop = 0;
            $modstr_earnings_trm_studio = 0;
            $modstr_earnings_cop_studio = 0;

            // Calcular valores en COP
            if ($modelAccount && $modelAccount->studioModel && $modelAccount->studioModel->studio) {
                $studio = $modelAccount->studioModel->studio;

                if (!empty($data['modstr_earnings_usd'])) {
                    $modstr_earnings_trm = floatval($trmUSD) - floatval($studio->std_discountmodel_usd);
                    $modstr_earnings_cop = floatval($modstr_earnings_value) * floatval($modstr_earnings_trm);
                    $modstr_earnings_trm_studio = floatval($trmUSD) - floatval($studio->std_discountstudio_usd);
                    $modstr_earnings_cop_studio = floatval($modstr_earnings_value) * floatval($modstr_earnings_trm_studio);
                } else if (!empty($data['modstr_earnings_eur'])) {
                    $modstr_earnings_trm = floatval($trmEUR) - floatval($studio->std_discountmodel_eur);
                    $modstr_earnings_cop = floatval($modstr_earnings_value) * floatval($modstr_earnings_trm);
                    $modstr_earnings_trm_studio = floatval($trmEUR) - floatval($studio->std_discountstudio_eur);
                    $modstr_earnings_cop_studio = floatval($modstr_earnings_value) * floatval($modstr_earnings_trm_studio);
                }
            }

            $before = ModelStream::findOrFail($id);
            $record->update([
                'modacc_id' => (isset($data['modacc_id'])) ? $data['modacc_id'] : null,
                'modstr_date' => (isset($data['modstr_date'])) ? $data['modstr_date'] : null,
                'modstr_period' => (isset($data['modstr_period'])) ? $data['modstr_period'] : null,
                'modstr_earnings_value' => $modstr_earnings_value,
                'modstr_earnings_tokens' => (isset($data['modstr_earnings_tokens'])) ? $data['modstr_earnings_tokens'] : null,
                'modstr_earnings_usd' => (isset($data['modstr_earnings_usd']) && $data['modstr_earnings_usd'] !== '') ? $data['modstr_earnings_usd'] : null,
                'modstr_earnings_eur' => (isset($data['modstr_earnings_eur']) && $data['modstr_earnings_eur'] !== '') ? $data['modstr_earnings_eur'] : null,
                'modstr_earnings_trm' => $modstr_earnings_trm,
                'modstr_earnings_cop' => $modstr_earnings_cop,
                'modstr_earnings_trm_studio' => $modstr_earnings_trm_studio,
                'modstr_earnings_cop_studio' => $modstr_earnings_cop_studio,
                'period_id' => $period_id->period_id,
                'modstr_addon' => (isset($data['modstr_addon'])) ? $data['modstr_addon'] : null,
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'models_streams', $record->modstr_id, 'UPDATE', $before, $record, $request->ip);

                return response()->json(['status' => 'success', 'data' => $record->modstr_id], 200);
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
            // $uAuth = $request->auth;
            $uAuth = $request->user();

            // validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            // validate relations
            $request['id'] = $id;
            $errors = $this->helper->validateWithMessages($request, [
                'id' => [
                    'required' => '',
                    'integer' => '',
                    'exists:models_streams,modstr_id' => '',
                    'unique:models_streams_customers,modstr_id' => 'El registro está asociado a "Clientes".',
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = ModelStream::findOrFail($id);
            $before = ModelStream::findOrFail($id);
            // $record->update([
            //     'deleted_at' => new DateTime()
            // ]);
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'models_streams', $record->modstr_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->modstr_id], 200);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * export resources to Excel
     *
     * @param  \Illuminate\Http\Request  $request
     */
    public function export(Request $request)
    {
        //////////
        // DATA //
        //////////
        // $data = $this->helper::generateConditions($request);
        $user_id = $request->input('user_id');
        $records = ModelStream::with(['modelAccount'])
            ->join('models_accounts AS ma', 'ma.modacc_id', 'models_streams.modacc_id')
            ->join('studios_models AS sm', 'sm.stdmod_id', 'ma.stdmod_id')
            ->where('sm.user_id_model', $user_id)
            ->whereNull('models_streams.deleted_at')
            ->orderBy('modstr_id', 'desc')
            ->get();

        ////////////
        // EXPORT //
        ////////////
        // redirect output to client browser
        $fileName = 'models_streams_export.xlsx';
        header("Content-type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        header('Content-Disposition: attachment;filename="' . $fileName . '"');
        header('Cache-Control: max-age=0');
        header("Pragma: no-cache");
        header("Expires: 0");

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // $header is an array containing column headers
        $header = [
            array(
                'ID',
                'CUENTA',
                'FECHA',
                'PERIODO',
                'INICIO',
                'FIN',
                'PRECIO',
                'GANANCIA (ORIGEN)',
                'TASA',
                'COMISIÓN',
                'TOKENS',
                'TOKENS (%)',
                'GANANCIA (USD)',
                'GANANCIA (EUR)',
                'GANANCIA (COP)',
                'TIEMPO (HORAS)',
                'FECHA CREACIÓN',
            )
        ];
        $sheet->fromArray($header, null, 'A1');

        // $dataset is an array containing data content
        $dataset = array();
        foreach ($records as $data) {
            $dataset[] = array(
                $data->modstr_id, // ID
                $data->modstr_date, // FECHA
                $data->modstr_period, // PERIODO
                $data->modstr_start_at, // INICIO
                $data->modstr_finish_at, // FIN
                $data->modstr_price, // PRECIO
                $data->modstr_earnings_value, // GANANCIA (ORIGEN)
                $data->modstr_earnings_trm, // TASA
                $data->modstr_earnings_percent, // COMISIÓN
                $data->modstr_earnings_tokens, // TOKENS
                $data->modstr_earnings_tokens_rate, // TOKENS (%)
                $data->modstr_earnings_usd, // GANANCIA (USD)
                $data->modstr_earnings_eur, // GANANCIA (EUR)
                $data->modstr_earnings_cop, // GANANCIA (COP)
                $data->modstr_time, // TIEMPO (HORAS)
                $data->created_at, // FECHA CREACIÓN
            );
        }
        $sheet->fromArray($dataset, null, 'A2');

        ////////////
        // FORMAT //
        ////////////
        $highestRow = $sheet->getHighestRow();
        $highestColumn = $sheet->getHighestColumn();

        // titles
        $sheet->getStyle('A1:' . $highestColumn . '1')->applyFromArray([
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
            ],
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'ffffff']
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => 'thin',
                    'color' => ['rgb' => '215867']
                ],
            ]
        ]);
        $sheet->getStyle('A1:' . $highestColumn . '1')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('215867');

        // content
        $sheet->getStyle('A2:' . $highestColumn . $highestRow)->applyFromArray([
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
            ],
            'font' => [
                'bold' => false,
                'color' => ['argb' => '000']
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => 'thin',
                    'color' => ['rgb' => '215867']
                ],
            ]
        ]);

        // autofilters
        $spreadsheet->getActiveSheet()->setAutoFilter(
            $spreadsheet->getActiveSheet()->calculateWorksheetDimension()
        );

        // autosize
        foreach ($sheet->getColumnIterator() as $column) {
            $sheet->getColumnDimension($column->getColumnIndex())->setAutoSize(true);
        }

        ////////////
        // WRITER //
        ////////////
        // $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        // $writer->save('php://output');
        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');

        return response('', 200);
    }

    /**
     * Create a new record.
     *
     * @return response()->json
     */
    public function populateStreams(Request $request)
    {
        try {
            $data = $request->all();
            // $uAuth = $request->auth;
            $uAuth = $request->user();

            // validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            $data = $this->helper::generateConditions($request);

            $records = $this->populateStreamsFromApi($data);

            if ($records) {
                $this->log::storeLog($uAuth, 'models_streams', null, 'MASSIVE', null, null, $request->ip);
                return response()->json(['status' => 'success'], 201);
            } else {
                return response()->json(['status' => 'fail']);
            }
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * get model streams
     *
     * @return response()->json
     */
    public function populateStreamsFromApi($args = array())
    {
        // default
        $args['where'] = !empty($args['where']) ? $args['where'] : [];
        $args['orWhere'] = !empty($args['orWhere']) ? $args['orWhere'] : [];
        $args['whereRaw'] = !empty($args['whereRaw']) ? $args['whereRaw'] : '1=1';

        try {
            $modstr_date = date('Y-m-d');
            $modstr_period = date('Ymd_H');

            // Si la fecha de colombia es menor a las 7am, se resta 1 dia
            // Se plantea este tiempo ya que el webscraper demora 4 horas en procesar
            $colombian_date = Carbon::now()->setTimezone('America/Bogota');
            if ($colombian_date->hour < 7) {
                $modstr_date = date('Y-m-d', strtotime($modstr_date . ' -1 day'));
                $modstr_period = date('Ymd_H', strtotime($modstr_date));
            }

            $period = PeriodController::retrieveOrCreatePeriod($modstr_date);

            // fecha del trm es la del fin del periodo +1 dia
            $trm_date = date('Y-m-d', strtotime($period->period_end_date . ' +1 day'));
            // Si la fecha del trm es mayor a hoy
            if (strtotime($trm_date) > strtotime(date('Y-m-d'))) {
                $trm_date = date('Y-m-d');
            }
            // Obtener el trm
            $exchangeRateController = new ExchangeRateController();
            $trmUSD = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'USD', $to = 'COP', $trm_date); // USD
            $trmEUR = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'EUR', $to = 'COP', $trm_date); // EUR

            $records = ModelAccount::with(['studioModel', 'studioModel.userModel', 'studioModel.studio'])
                ->where('modacc_active', true)
                ->where($args['where'])
                ->orWhere($args['orWhere'])
                ->whereRaw($args['whereRaw'])
                ->whereNull('deleted_at')
                ->whereRaw("modacc_id NOT IN (SELECT modacc_id FROM models_streams WHERE modstr_period = '$modstr_period' AND modstr_source = 'WEBSCRAPER_MODELO')") // Genera solo una consulta por cuenta x hora
                ->whereIn('modacc_app', [
                    // 'BONGACAMS', // Tiene bloqueo cloudflare / van por API (master)
                    'CAM4', // ok
                    // 'CAMSODA ALIADOS', // ok (reCaptcha)
                    // 'CHATURBATE', // Tiene bloqueo cloudflare / Integracion API
                    // 'CHATURBATE(2)',
                    'FLIRT4FREE', // ok
                    'IMLIVE', // ok
                    'LIVEJASMIN', // ok (se esta tomando la info de todo un periodo, cambiar a solo una fecha)
                    'LIVEJASMIN(2)',
                    // 'ONLYFANS', // Tiene doble reCaptcha
                    'MYDIRTYHOBBY', // ok
                    'MYFREECAMS', // ok
                    // // 'SKYPRIVATE', // Tiene bloqueo cloudflare
                    'STREAMATE', // ok (se esta tomando la info de todo un periodo, cambiar a solo una fecha + agregar la info de los costumers)
                    'STREAMRAY', // ok
                    // 'STRIPCHAT', // ok (reCaptcha) / van por API (master)
                    'STRIPCHAT(2)', // ok
                    'XHAMSTER', // ok
                    'XLOVECAM', // ok
                ])
                ->orderByRaw("(CASE WHEN modacc_fail_count IS NULL THEN 0 ELSE modacc_fail_count END) asc")
                ->orderBy('modacc_last_search_at', 'asc')
                ->limit(400) // 400 registros para cada hora, estimando 100/h
                // ->limit(50)
                // ->limit(10)
                // ->limit(2)
                ->get();

            $webcamService = new WebcamService();

            // loop models accounts
            foreach ($records as $row) {
                // start search
                $row->modacc_last_search_at = date('Y-m-d H:i:s');
                $row->modacc_fail_message = null;
                $row->save();

                $app = $row->modacc_app;
                $app = preg_replace("/(.*)\(.*\)/", "$1", $app); // STRIPCHAT(2) >> STRIPCHAT
                $username = $row->modacc_username;
                $password = $row->modacc_password;
                // |-----
                // | Se comenta esta funcion ya que genera el siguiente error:
                // | local.ERROR: Could not start chrome. Exit code: 1 (General error). Error output: Acceso denegado.
                // |-----
                // |
                // switch ($app) {
                //     case 'STREAMATE':
                //         $res = $webcamService->streamate($row->modacc_username, $row->modacc_password);
                //         break;
                //     case 'LIVEJASMIN':
                //         $res = $webcamService->livejasmin($row->modacc_username, $row->modacc_password);
                //         break;
                //     default:
                //         break;
                // }

                // C:/AppServ/php83-nts/php.exe C:/AppServ/www/el-castillo-webapp/wscrap/webcamapi.php --app:STREAMATE --username:MATILDA --password:Cal2024*
                // OS_PHP_PATH = C:/AppServ/php83-nts/php.exe
                // OS_WSCRAP_DIR = C:/AppServ/www/el-castillo-webapp/wscrap/
                $command = env('OS_PHP_PATH') . ' ' . env('OS_WSCRAP_DIR') . '/webcamapi.php --app:' . $app . ' --username:' . $username . ' --password:' . $password;
                $command = str_replace('wscrap//', 'wscrap/', $command);
                // Log::info($command);

                // Se agrega el rango de fechas
                if (!empty($period->period_start_date) && !empty($period->period_end_date)) {
                    $startdate = $period->period_start_date;
                    $enddate = (strtotime($period->period_end_date) > strtotime(date('Y-m-d'))) ? date('Y-m-d') : $period->period_end_date;
                    $command .= ' --startdate:' . $startdate . ' --enddate:' . $enddate;
                }

                if ($app == 'XLOVECAM') {
                    $command .= ' --url:' . $row->modacc_url;
                }

                $results = [];
                $usedMsWscrap = false;
                $msWscrapUrl = env('MS_WSCRAP_URL', null);

                // Intento ms-wscrap (API Partner) para LiveJasmin si hay token + screenName
                if (
                    $msWscrapUrl &&
                    ($app === 'LIVEJASMIN' || $app === 'LIVEJASMIN(2)') &&
                    env('LIVEJASMIN_PARTNER_API_TOKEN') &&
                    !empty($row->modacc_screen_name)
                ) {
                    try {
                        $payload = [
                            'platform' => 'LIVEJASMIN',
                            'username' => $row->modacc_username,
                            'email' => $row->modacc_mail,
                            'password' => $row->modacc_password,
                            'accountType' => 'model',
                            'startDate' => $startDate,
                            'endDate' => $endDate,
                            'livejasminSource' => 'api',
                            'screenName' => $row->modacc_screen_name,
                        ];

                        $response = Http::timeout(600)->post($msWscrapUrl . '/scraping/earnings', $payload);
                        if ($response->successful()) {
                            $data = $response->json();
                            if (isset($data['earningValue'])) {
                                $results = [$data];
                                $usedMsWscrap = true;
                            }
                        }
                    } catch (\Exception $e) {
                        Log::error('[MS-WSCRAP] LiveJasmin API mode error: ' . $e->getMessage());
                    }
                }

                if (!$usedMsWscrap) {
                    $output = shell_exec($command);

                    if (json_validate($output)) { // php 8.0+
                        $results = json_decode($output, true);
                        $output = json_encode($results, JSON_PRETTY_PRINT);

                        if (!isset($results[0])) {
                            $results = [$results];
                        }
                    } else {
                        // finish search on error
                        $row->modacc_last_result_at = date('Y-m-d H:i:s');
                        $row->modacc_fail_message = json_encode(['command' => $command, 'output' => $output]);
                        $row->modacc_fail_count = intval($row->modacc_fail_count) + 1;
                        $row->save();
                    }
                }

                foreach ($results as $res) {
                    if (isset($res['earningValue'])) {
                        // finish search on success
                        $row->modacc_last_result_at = date('Y-m-d H:i:s');
                        $row->modacc_fail_count = 0;
                        $row->save();

                        // modstr_source
                        $res['modstr_source'] = 'WEBSCRAPER_MODELO';

                        // trm discount
                        $res['std_discountmodel_usd'] = 0;
                        $res['std_discountstudio_usd'] = 0;
                        $res['std_discountmodel_eur'] = 0;
                        $res['std_discountstudio_eur'] = 0;

                        // modstr_earnings_value
                        if (empty($res['earningsCop'])) {
                            if (!empty($res['earningsUsd'])) {
                                $res['modstr_earnings_trm'] = floatval($trmUSD) - floatval($row->studioModel->studio->std_discountmodel_usd);
                                $res['earningsCop'] = floatval($res['earningsUsd']) * floatval($res['modstr_earnings_trm']);
                                $res['modstr_earnings_trm_studio'] = floatval($trmUSD) - floatval($row->studioModel->studio->std_discountstudio_usd);
                                $res['modstr_earnings_cop_studio'] = floatval($res['earningsUsd']) * floatval($res['modstr_earnings_trm_studio']);
                            } else if (!empty($res['earningsEur'])) {
                                $res['modstr_earnings_trm'] = floatval($trmEUR) - floatval($row->studioModel->studio->std_discountmodel_eur);
                                $res['earningsCop'] = floatval($res['earningsEur']) * floatval($res['modstr_earnings_trm']);
                                $res['modstr_earnings_trm_studio'] = floatval($trmEUR) - floatval($row->studioModel->studio->std_discountstudio_eur);
                                $res['modstr_earnings_cop_studio'] = floatval($res['earningsEur']) * floatval($res['modstr_earnings_trm_studio']);
                            }
                        }

                        // modstr_date
                        $this_modstr_date = !empty($res['date']) ? date('Y-m-d', strtotime($res['date'])) : date('Y-m-d', strtotime($modstr_date));
                        $this_modstr_period = date('Ymd_H', strtotime($modstr_period));

                        // create record
                        $record = ModelStream::create([
                            'modacc_id' => $row->modacc_id,
                            'modstr_date' => $this_modstr_date,
                            'modstr_period' => $this_modstr_period,
                            'modstr_start_at' => (isset($res['startAt'])) ? $res['startAt'] : null,
                            'modstr_finish_at' => (isset($res['finishAt'])) ? $res['finishAt'] : null,
                            'modstr_price' => (isset($res['price'])) ? (float) $res['price'] : null,
                            'modstr_earnings_value' => (isset($res['earningValue'])) ? (float) $res['earningValue'] : null,
                            'modstr_earnings_tokens' => (isset($res['earningsTokens'])) ? (float) $res['earningsTokens'] : null,
                            'modstr_earnings_tokens_rate' => (isset($res['earningsTokensRate'])) ? (float) $res['earningsTokensRate'] : null,
                            'modstr_earnings_usd' => (isset($res['earningsUsd'])) ? (float) $res['earningsUsd'] : null,
                            'modstr_earnings_eur' => (isset($res['earningsEur'])) ? (float) $res['earningsEur'] : null,
                            'modstr_earnings_trm' => (isset($res['modstr_earnings_trm'])) ? (float) $res['modstr_earnings_trm'] : null,
                            'modstr_earnings_cop' => (isset($res['earningsCop'])) ? (float) $res['earningsCop'] : null,
                            'modstr_earnings_trm_studio' => (isset($res['modstr_earnings_trm_studio'])) ? (float) $res['modstr_earnings_trm_studio'] : null,
                            'modstr_earnings_cop_studio' => (isset($res['modstr_earnings_cop_studio'])) ? (float) $res['modstr_earnings_cop_studio'] : null,
                            'modstr_time' => (isset($res['totalTime'])) ? (float) $res['totalTime'] : null,
                            'modstr_source' => (isset($res['modstr_source'])) ? $res['modstr_source'] : null,
                            'period_id' => $period->period_id
                        ]);

                        // loop customers
                        if (isset($res['customers']) && count($res['customers']) > 0) {
                            foreach ($res['customers'] as $customer) {
                                // create record
                                ModelStreamCustomer::create([
                                    'modstr_id' => $record->modstr_id,
                                    'modstrcus_name' => isset($customer['name']) ? $customer['name'] : null,
                                    'modstrcus_account' => isset($customer['account']) ? $customer['account'] : null,
                                    'modstrcus_website' => isset($customer['website']) ? $customer['website'] : null,
                                    'modstrcus_product' => isset($customer['product']) ? $customer['product'] : null,
                                    'modstrcus_price' => isset($customer['price']) ? $customer['price'] : null,
                                    'modstrcus_earnings' => isset($customer['earnings']) ? $customer['earnings'] : null,
                                    'modstrcus_received_at' => isset($customer['received_at']) ? $customer['received_at'] : null,
                                    'modstrcus_chat_duration' => isset($customer['chat_duration']) ? $customer['chat_duration'] : null,
                                ]);
                            }
                        }
                    }
                }
            }

            // Disable model accounts on many consecutive errors
            // $errorsLimit = 5; // Cantidad de errores para desactivar la cuenta
            // DB::select("UPDATE models_accounts SET modacc_active=false WHERE modacc_active=true AND modacc_fail_count>='$errorsLimit'");
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * get models streams from master account
     *
     * Se hacen 2 consultas, la primera es para las apis que se pueden sacar de forma global con un solo inicio de sesion
     * La otra consulta es individual por modelo para las apps q no permiten el masivo
     *
     * @return response()->json
     */
    public function populateStreamsFromStudiosApi($args = array())
    {
        // default
        $args['where'] = !empty($args['where']) ? $args['where'] : [];
        $args['orWhere'] = !empty($args['orWhere']) ? $args['orWhere'] : [];
        $args['whereRaw'] = !empty($args['whereRaw']) ? $args['whereRaw'] : '1=1';

        try {
            $modstr_date = date('Y-m-d');
            $modstr_period = date('Ymd_H');
            $period = PeriodController::retrieveOrCreatePeriod($modstr_date);

            // fecha del trm es la del fin del periodo +1 dia
            $trm_date = date('Y-m-d', strtotime($period->period_end_date . ' +1 day'));
            // Si la fecha del trm es mayor a hoy
            if (strtotime($trm_date) > strtotime(date('Y-m-d'))) {
                $trm_date = date('Y-m-d');
            }
            // Obtener el trm
            $exchangeRateController = new ExchangeRateController();
            $trmUSD = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'USD', $to = 'COP', $trm_date); // USD
            $trmEUR = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'EUR', $to = 'COP', $trm_date); // EUR

            $records = StudioAccount::with(['studio'])
                ->where('stdacc_active', true)
                ->where($args['where'])
                ->orWhere($args['orWhere'])
                ->whereRaw($args['whereRaw'])
                ->whereNull('deleted_at')
                ->whereRaw("stdacc_id NOT IN (SELECT stdacc_id FROM models_streams WHERE modstr_period = '$modstr_period' AND modstr_source = 'WEBSCRAPER_MASTER')") // Genera solo una consulta por cuenta x hora
                ->whereIn('stdacc_app', [
                    // 'BONGACAMS', // Tiene bloqueo cloudflare / van por API (master) -- noooooooooo
                    'CAM4', // ok
                    // 'CAMSODA ALIADOS', // ok (reCaptcha)
                    'CHATURBATE', // Tiene bloqueo cloudflare / Integracion API
                    'CHATURBATE(2)',
                    'FLIRT4FREE', // ok
                    'IMLIVE', // ok
                    'LIVEJASMIN', // ok (se esta tomando la info de todo un periodo, cambiar a solo una fecha)
                    'LIVEJASMIN(2)',
                    // 'ONLYFANS', // Tiene doble reCaptcha
                    // 'MYDIRTYHOBBY', // ok
                    // 'MYFREECAMS', // ok
                    // // 'SKYPRIVATE', // Tiene bloqueo cloudflare
                    'STREAMATE', // ok (se esta tomando la info de todo un periodo, cambiar a solo una fecha + agregar la info de los costumers)
                    'STREAMRAY', // ok
                    // 'STRIPCHAT', // ok (reCaptcha) / van por API (master) -- noooooooooo
                    // 'STRIPCHAT(2)', // ok -- noooooooooo
                    // 'XHAMSTER', // ok
                    // 'XLOVECAM', // ok
                ])
                ->orderByRaw("(CASE WHEN stdacc_fail_count IS NULL THEN 0 ELSE stdacc_fail_count END) asc")
                ->orderBy('stdacc_last_search_at', 'asc')
                // ->limit(1) // 400 registros para cada hora, estimando 100/h
                // ->limit(50)
                // ->limit(10)
                // ->limit(2)
                ->get();

            // loop models accounts
            foreach ($records as $studioacc) {
                // start search
                $studioacc->stdacc_last_search_at = date('Y-m-d H:i:s');
                $studioacc->stdacc_fail_message = null;
                $studioacc->save();

                $app = $studioacc->stdacc_app;
                $app = preg_replace("/(.*)\(.*\)/", "$1", $app); // STRIPCHAT(2) >> STRIPCHAT
                $username = $studioacc->stdacc_username;
                $password = $studioacc->stdacc_password;
                $apikey = $studioacc->stdacc_apikey;
                $searches = [];

                /////////////////////
                // CONSULTA GLOBAL //
                /////////////////////
                $globalApps = [
                    'FLIRT4FREE' => ['password' => true, 'apikey' => false],
                    'CAM4'       => ['password' => true, 'apikey' => false],
                    'STREAMATE'  => ['password' => true, 'apikey' => false],
                    'LIVEJASMIN' => ['password' => true, 'apikey' => false],
                    'IMLIVE'     => ['password' => true, 'apikey' => false],
                    'STREAMRAY'  => ['password' => true, 'apikey' => false],
                    'CHATURBATE' => ['password' => false, 'apikey' => true],
                ];
                if (isset($globalApps[$app])) {
                    // integracion por user/password
                    if (isset($globalApps[$app]['password']) && $globalApps[$app]['password'] == true) {
                        // C:/AppServ/php83-nts/php.exe C:/AppServ/www/el-castillo-webapp/wscrap/masterapi.php --app:STREAMATE --username:MATILDA --password:Cal2024*
                        // OS_PHP_PATH = C:/AppServ/php83-nts/php.exe
                        // OS_WSCRAP_DIR = C:/AppServ/www/el-castillo-webapp/wscrap/
                        $command = env('OS_PHP_PATH') . ' ' . env('OS_WSCRAP_DIR') . '/masterapi.php --app:' . $app . ' --username:' . $username . ' --password:' . $password;
                        $command = str_replace('wscrap//', 'wscrap/', $command);

                    // integracion por api
                    } else if (isset($globalApps[$app]['apikey']) && $globalApps[$app]['apikey'] == true) {
                        // C:/AppServ/php83-nts/php.exe C:/AppServ/www/el-castillo-webapp/wscrap/masterapi.php --app:STREAMATE --username:MATILDA --password:Cal2024*
                        // OS_PHP_PATH = C:/AppServ/php83-nts/php.exe
                        // OS_WSCRAP_DIR = C:/AppServ/www/el-castillo-webapp/wscrap/
                        $command = env('OS_PHP_PATH') . ' ' . env('OS_WSCRAP_DIR') . '/masterapi.php --app:' . $app . ' --username:' . $username . ' --apikey:' . $apikey;
                        $command = str_replace('wscrap//', 'wscrap/', $command);
                    }

                    // Log::info($command);
                    $searches[] = $command;
                }

                /////////////////////////
                // CONSULTA INDIVIDUAL //
                /////////////////////////
                $individualApps = [
                    'BONGACAMS'  => ['password' => false, 'apikey' => true],
                    'STRIPCHAT'  => ['password' => false, 'apikey' => true],
                ];
                if (isset($individualApps[$app])) {
                    // get models
                    $models = ModelAccount::with(['studioModel', 'studioModel.userModel'])
                        ->where('modacc_active', true)
                        ->where($args['where'])
                        ->orWhere($args['orWhere'])
                        ->whereRaw($args['whereRaw'])
                        ->whereNull('deleted_at')
                        ->whereRaw("modacc_id NOT IN (SELECT modacc_id FROM models_streams WHERE modstr_period = '$modstr_period' AND modstr_source = 'WEBSCRAPER_MASTER')") // Genera solo una consulta por cuenta x hora
                        ->where('modacc_app', $app)
                        ->orderByRaw("(CASE WHEN modacc_fail_count IS NULL THEN 0 ELSE modacc_fail_count END) asc")
                        ->orderBy('modacc_last_search_at', 'asc')
                        ->limit(10) // 400 registros para cada hora, estimando 100/h
                        ->get();

                    foreach ($models as $model) {
                        // C:/AppServ/php83-nts/php.exe C:/AppServ/www/el-castillo-webapp/wscrap/masterapi.php --app:STRIPCHAT --username:studioelcastillo --apikey:cf4d0dd6799afde5605bce61be65e5e3 --model:ValeryPine
                        // OS_PHP_PATH = C:/AppServ/php83-nts/php.exe
                        // OS_WSCRAP_DIR = C:/AppServ/www/el-castillo-webapp/wscrap/
                        $command = env('OS_PHP_PATH') . ' ' . env('OS_WSCRAP_DIR') . '/masterapi.php --app:' . $app . ' --username:' . $username . ' --apikey:' . $apikey . ' --model:' . $model->modacc_username;
                        $command = str_replace('wscrap//', 'wscrap/', $command);
                        // Log::info($command);
                        $searches[] = $command;
                    }
                }

                ////////////////
                // WEBSCRAPER //
                ////////////////
                foreach ($searches as $command) {
                    // periods
                    $reportController = new ReportController();
                    $periods = $reportController->getStudioPeriodsArray();
                    if (!empty($periods) && isset($periods[0])) {
                        $command .= ' --startdate:' . $periods[0]['since'];
                        $command .= ' --enddate:' . $periods[0]['until'];
                    }

                    // echo $command.PHP_EOL;
                    $result = [];
                    $output = shell_exec($command);

                    // on success
                    // if (substr($output, 0, 1) == '{') { // php <8.0
                    if (json_validate($output)) { // php 8.0+
                        $result = json_decode($output, true);
                        // print_r($result);
                        $output = json_encode($result, JSON_PRETTY_PRINT);

                        // on error
                    } else {
                        // finish search on error
                        $studioacc->stdacc_last_result_at = date('Y-m-d H:i:s');
                        $studioacc->stdacc_fail_message = json_encode(['command' => $command, 'output' => $output]);
                        $studioacc->stdacc_fail_count = intval($studioacc->stdacc_fail_count) + 1;
                        $studioacc->save();

                        // echo "<pre>";
                        // echo $output;
                        // echo "</pre>";
                        // Log::error('command: '. $command);
                        // Log::error('output: '. $output);
                    }

                    foreach ($result as $res) {
                        if (isset($res['account']) && isset($res['earningValue'])) {
                            // finish search on success
                            $studioacc->stdacc_last_result_at = date('Y-m-d H:i:s');
                            $studioacc->stdacc_fail_count = 0;
                            $studioacc->save();

                            // modstr_source
                            $res['modstr_source'] = 'WEBSCRAPER_MASTER';

                            // trm discount
                            $res['std_discountmodel_usd'] = 0;
                            $res['std_discountstudio_usd'] = 0;
                            $res['std_discountmodel_eur'] = 0;
                            $res['std_discountstudio_eur'] = 0;

                            // modstr_earnings_value
                            if (empty($res['earningsCop'])) {
                                if (!empty($res['earningsUsd'])) {
                                    $res['modstr_earnings_trm'] = floatval($trmUSD) - floatval($studioacc->studio->std_discountmodel_usd);
                                    $res['earningsCop'] = floatval($res['earningsUsd']) * floatval($res['modstr_earnings_trm']);
                                    $res['modstr_earnings_trm_studio'] = floatval($trmUSD) - floatval($studioacc->studio->std_discountstudio_usd);
                                    $res['modstr_earnings_cop_studio'] = floatval($res['earningsUsd']) * floatval($res['modstr_earnings_trm_studio']);
                                } else if (!empty($res['earningsEur'])) {
                                    $res['modstr_earnings_trm'] = floatval($trmEUR) - floatval($studioacc->studio->std_discountmodel_eur);
                                    $res['earningsCop'] = floatval($res['earningsEur']) * floatval($res['modstr_earnings_trm']);
                                    $res['modstr_earnings_trm_studio'] = floatval($trmEUR) - floatval($studioacc->studio->std_discountstudio_eur);
                                    $res['modstr_earnings_cop_studio'] = floatval($res['earningsEur']) * floatval($res['modstr_earnings_trm_studio']);
                                }
                            }

                            // get model account data by username
                            $modelAccount = ModelAccount::whereRaw("modacc_username ILIKE '" . $res['account'] . "'")
                                ->whereRaw("modacc_app LIKE '" . $app . "%'")
                                ->first();

                            // get model account data by payment_username
                            if (empty($modelAccount)) {
                                $modelAccount = ModelAccount::whereRaw("modacc_payment_username ILIKE '" . $res['account'] . "'")
                                    ->whereRaw("modacc_app LIKE '" . $app . "%'")
                                    ->first();
                            }

                            if (!empty($modelAccount)) {
                                // Si la modelo está inactiva >> la reactiva
                                if ($modelAccount->modacc_active == false) {
                                    $modelAccount->update(['modacc_active' => true]);
                                }

                                // create record
                                $record = ModelStream::create([
                                    'modacc_id' => $modelAccount->modacc_id,
                                    'modstr_date' => $modstr_date,
                                    'modstr_period' => $modstr_period,
                                    'modstr_start_at' => (isset($res['startAt'])) ? $res['startAt'] : null,
                                    'modstr_finish_at' => (isset($res['finishAt'])) ? $res['finishAt'] : null,
                                    'modstr_price' => (isset($res['price'])) ? (float) $res['price'] : null,
                                    'modstr_earnings_value' => (isset($res['earningValue'])) ? (float) $res['earningValue'] : null,
                                    'modstr_earnings_tokens' => (isset($res['earningsTokens'])) ? (float) $res['earningsTokens'] : null,
                                    'modstr_earnings_tokens_rate' => (isset($res['earningsTokensRate'])) ? (float) $res['earningsTokensRate'] : null,
                                    'modstr_earnings_usd' => (isset($res['earningsUsd'])) ? (float) $res['earningsUsd'] : null,
                                    'modstr_earnings_eur' => (isset($res['earningsEur'])) ? (float) $res['earningsEur'] : null,
                                    'modstr_earnings_trm' => (isset($res['modstr_earnings_trm'])) ? (float) $res['modstr_earnings_trm'] : null,
                                    'modstr_earnings_cop' => (isset($res['earningsCop'])) ? (float) $res['earningsCop'] : null,
                                    'modstr_earnings_trm_studio' => (isset($res['modstr_earnings_trm_studio'])) ? (float) $res['modstr_earnings_trm_studio'] : null,
                                    'modstr_earnings_cop_studio' => (isset($res['modstr_earnings_cop_studio'])) ? (float) $res['modstr_earnings_cop_studio'] : null,
                                    'modstr_time' => (isset($res['totalTime'])) ? (float) $res['totalTime'] : null,
                                    'modstr_source' => (isset($res['modstr_source'])) ? $res['modstr_source'] : null,
                                    'period_id' => $period->period_id,
                                    'stdacc_id' => $studioacc->stdacc_id,
                                ]);

                                // loop customers
                                if (isset($res['customers']) && count($res['customers']) > 0) {
                                    foreach ($res['customers'] as $customer) {
                                        // create record
                                        ModelStreamCustomer::create([
                                            'modstr_id' => $record->modstr_id,
                                            'modstrcus_name' => isset($customer['name']) ? $customer['name'] : null,
                                            'modstrcus_account' => isset($customer['account']) ? $customer['account'] : null,
                                            'modstrcus_website' => isset($customer['website']) ? $customer['website'] : null,
                                            'modstrcus_product' => isset($customer['product']) ? $customer['product'] : null,
                                            'modstrcus_price' => isset($customer['price']) ? $customer['price'] : null,
                                            'modstrcus_earnings' => isset($customer['earnings']) ? $customer['earnings'] : null,
                                            'modstrcus_received_at' => isset($customer['received_at']) ? $customer['received_at'] : null,
                                            'modstrcus_chat_duration' => isset($customer['chat_duration']) ? $customer['chat_duration'] : null,
                                        ]);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Disable model accounts on many consecutive errors
            // $errorsLimit = 5; // Cantidad de errores para desactivar la cuenta
            // DB::select("UPDATE models_accounts SET modacc_active=false WHERE modacc_active=true AND modacc_fail_count>='$errorsLimit'");
        } catch (Exception $e) {
            // throw $e;
            return null;
        }
    }

    /**
     * import resources to Excel
     *
     * @param  \Illuminate\Http\Request  $request
     */
    public function import(Request $request)
    {
        try {
            $data = $request->all();
            // $uAuth = $request->auth;
            $uAuth = $request->user();

            DB::beginTransaction();
            $this->validate($request, [
                // 'files' => 'required|mimes:xlsx,xls,csv',
                'period_until' => 'required',
                'files' => 'required',
                'file_template' => 'required',
            ]);

            // for excel template:
            // BONGACAMS;CAM4;CAMSODA ALIADOS;CHATURBATE;CHERRY;DREAMCAM;FLIRT4FREE;IMLIVE;LIVEJASMIN;MYDIRTYHOBBY;MYFREECAMS;ONLYFANS;SKYPRIVATE;STREAMATE;STREAMATE PREMIOS;STREAMRAY;STRIPCHAT;XHAMSTER;XLOVECAM;DESIRECAST

            //////////////
            // IMPORTAR //
            //////////////
            $file = $data['files'];
            $original_filename = $file->getClientOriginalName();
            $uploadedFileName = 'MSTREAM-' . time() . '_' . str_replace(' ', '_', $original_filename);

            // save file in server
            $file->move(storage_path('app/public/streams'), $uploadedFileName);

            // create file record
            $modelStreamFile = ModelStreamFile::create([
                'modstrfile_description' => 'Cargue de streams ' . date('Y-m-d'),
                'modstrfile_filename' => $uploadedFileName,
                'modstrfile_template' => $data['file_template'],
                'created_by' => $uAuth->user_id,
            ]);

            // max execution time
            set_time_limit(0);
            ini_set('memory_limit', '-1');

            $csvTemplates = [
                'STREAMATE',
                'SKYPRIVATE',
                'STRIPCHAT',
            ];
            $xlsTemplates = [
                'BONGACAMS',
                'CAM4',
                'CHATURBATE',
                'FLIRT4FREE',
                'LIVEJASMIN',
                'IMLIVE',
            ];
            /////////
            // CSV //
            /////////
            if (in_array($data['file_template'], $csvTemplates)) {
                $records = $this->importCSV(storage_path('app/public/streams/') . $uploadedFileName, $modelStreamFile, $data['file_template'], $data['period_until']);
                $this->log::storeLog($uAuth, 'models_streams', null, 'MASSIVELOAD', null, json_encode(['uploaded_records' => (count($records['success']) + count($records['inactives']))]), $request->ip());

                /////////
                // XLS //
                /////////
            } else if (in_array($data['file_template'], $xlsTemplates)) {
                $records = $this->importXLS(storage_path('app/public/streams/') . $uploadedFileName, $modelStreamFile, $data['file_template'], $data['period_until']);
                $this->log::storeLog($uAuth, 'models_streams', null, 'MASSIVELOAD', null, json_encode(['uploaded_records' => (count($records['success']) + count($records['inactives']))]), $request->ip());

                /////////////
                // CAMSODA //
                /////////////
            } else if ($data['file_template'] == 'CAMSODA') {
                $records = $this->importCamsoda(storage_path('app/public/streams/') . $uploadedFileName, $modelStreamFile, $data['period_until']);
                $this->log::storeLog($uAuth, 'models_streams', null, 'MASSIVELOAD', null, json_encode(['uploaded_records' => (count($records['success']) + count($records['inactives']))]), $request->ip());

                //////////
                // XLSX //
                //////////
            } else {
                // create file record
                $import = new ModelsStreamsImport($request, $modelStreamFile, $data['file_template'], $data['period_until']);
                Excel::import($import, storage_path('app/public/streams/') . $uploadedFileName);
                $import->searchInactives();
                $records = $import->getRecords();
                $this->log::storeLog($uAuth, 'models_streams', null, 'MASSIVELOAD', null, json_encode(['uploaded_records' => (count($records['success']) + count($records['inactives']))]), $request->ip());
            }

            // unlink(storage_path('app/public/streams/').$uploadedFileName);
            DB::commit();
            return response()->json(['status' => 'success', 'data' => $records], 200);

            // on import error
        } catch (\Exception $e) {
            // } catch (Exception $e) {
            DB::rollBack();
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * import resources to Excel
     *
     * @param  \Illuminate\Http\Request  $request
     */
    public function importCSV($filename, $parentFile, $fileTemplate, $periodUntil)
    {
        $fcontent = file_get_contents($filename);
        $dataset = [];
        $response = [
            'success' => [
                'data' => [],
                'totalEarningsTokens' => 0,
                'totalEarningsUsd' => 0,
                'totalEarningsEur' => 0,
                'totalEarningsCop' => 0,
                'totalTime' => 0,
            ],
            'inactives' => [
                'data' => [],
                'totalEarningsTokens' => 0,
                'totalEarningsUsd' => 0,
                'totalEarningsEur' => 0,
                'totalEarningsCop' => 0,
                'totalTime' => 0,
            ],
            'errors' => [
                'data' => [],
                'totalEarningsTokens' => 0,
                'totalEarningsUsd' => 0,
                'totalEarningsEur' => 0,
                'totalEarningsCop' => 0,
                'totalTime' => 0,
            ],
        ];

        // get models accounts list
        $modelsAccountsList = [];
        $records = DB::select(
            "SELECT modacc_id, modacc_app, modacc_payment_username,
                    us.user_name || ' ' || us.user_surname as name,
                    std_discountmodel_usd, std_discountmodel_eur,
                    std_discountstudio_usd, std_discountstudio_eur,
                    st.std_id
            FROM models_accounts ma
            LEFT JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
            LEFT JOIN studios st ON st.std_id = sm.std_id
            LEFT JOIN users us ON us.user_id = sm.user_id_model
            WHERE modacc_active=true"
        );
        foreach ($records as $r => $row) {
            $row->modacc_app = preg_replace("/(.*)\(.*\)/", "$1", $row->modacc_app); // STRIPCHAT(2) >> STRIPCHAT
            $row->modacc_app = trim($row->modacc_app);
            $row->modacc_payment_username = trim($row->modacc_payment_username);
            $row->modacc_payment_username = strtoupper($row->modacc_payment_username);
            $modelsAccountsList[$row->modacc_app][$row->modacc_payment_username] = $row;
        }

        // echo "<pre>";
        // print_r($modelsAccountsList['STRIPCHAT']);
        // echo "</pre>";
        // die();
        $period = PeriodController::retrieveOrCreatePeriod(date('Y-m-d', strtotime($periodUntil)));

        // fecha del trm es la del fin del periodo +1 dia
        $trm_date = date('Y-m-d', strtotime($periodUntil . ' +1 day'));
        // Si la fecha del trm es mayor a hoy
        if (strtotime($trm_date) > strtotime(date('Y-m-d'))) {
            $trm_date = date('Y-m-d');
        }
        // Obtener el trm
        $exchangeRateController = new ExchangeRateController();
        $trmUSD = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'USD', $to = 'COP', $trm_date); // USD
        $trmEUR = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'EUR', $to = 'COP', $trm_date); // EUR

        // CAMSODA
        if ($fileTemplate == 'CAMSODA') {

            // SKYPRIVATE
        } else if ($fileTemplate == 'SKYPRIVATE') {
            $lines = explode("\n", $fcontent);
            foreach ($lines as $l => $line) {
                // Corregir formato de fechas, ya que al tener comas se lleva a otra columna
                // i.e. May 5, 2024, 13:32 >> 2024-May-5 13:32
                $line = preg_replace("/([a-zA-Z]*) ([0-9]{1,2}), ([0-9]{4}), ([0-9]{2}:[0-9]{2}) /", "$1 $2 $3 $4", $line);

                if ($l >= 1) { // skip content
                    $row = explode(",", $line);
                    $nickname = (isset($row[1])) ? $row[1] : null; // User ID
                    $nickname = strtoupper($nickname);
                    if (!empty($nickname) && isset($row[4])) {
                        $data = [];
                        $data['row'] = $l + 1;
                        $data['nickname'] = $nickname;
                        $data['modacc_app'] = $fileTemplate;

                        // modstr_date
                        $row[4] = str_replace('"', '', $row[4]);
                        // $data['modstr_date'] = date('Y-m-d H:i:s', strtotime($row[4])); // Transfer Date & Time
                        $data['modstr_date'] = date('Y-m-d H:i:s', strtotime($periodUntil)); // Transfer Date & Time
                        $data['period_id'] = $period->period_id;

                        // modstr_period
                        // $data['modstr_period'] = date('Ymd_H', strtotime($row[4])); // Transfer Date & Time
                        $data['modstr_period'] = date('Ymd_H', strtotime($periodUntil)); // Transfer Date & Time

                        // modstr_earnings_value
                        $row[3] = str_replace('$', '', $row[3]); // Performer Revenue
                        $value = $row[3];
                        $data['modstr_earnings_usd'] = $value;

                        // group by nickname
                        if (!isset($dataset[$nickname])) {
                            $dataset[$nickname] = $data;
                        } else {
                            $dataset[$nickname]['modstr_date'] = $data['modstr_date'];
                            $dataset[$nickname]['period_id'] = $period->period_id;
                            $dataset[$nickname]['modstr_period'] = $data['modstr_period'];
                            $dataset[$nickname]['modstr_earnings_usd'] += $data['modstr_earnings_usd'];
                        }
                    }
                }
            }
            $dataset = array_values($dataset);

            // STREAMATE
        } else if ($fileTemplate == 'STREAMATE') {
            $lines = explode("\n", $fcontent);
            foreach ($lines as $l => $line) {
                if ($l >= 1) { // skip content
                    $row = explode(",", $line);

                    $nickname = (isset($row[1])) ? $row[1] : null; // Performer Nickname
                    $nickname = strtoupper($nickname);

                    if (!empty($nickname) && !empty($row[1]) && isset($row[7])) {
                        $data = [];
                        $data['row'] = $l + 1;
                        $data['nickname'] = $nickname;
                        $data['modacc_app'] = $fileTemplate;

                        // modstr_date
                        $data['modstr_date'] = date('Y-m-d H:i:s', strtotime($periodUntil));
                        $data['period_id'] = $period->period_id;

                        // modstr_period
                        $data['modstr_period'] = date('Ymd_H', strtotime($periodUntil));

                        // modstr_earnings_value
                        $row[6] = str_replace('$', '', $row[6]); // Performer Revenue
                        $value = $row[6];
                        $data['modstr_earnings_usd'] = $value;

                        // modstr_time
                        $data['modstr_time'] = ($row[5] / 60 / 60); // Total Time Online (Seconds)

                        // dataset
                        $dataset[] = $data;
                    }
                }
            }

            // STRIPCHAT
        } else if ($fileTemplate == 'STRIPCHAT') {
            $lines = explode("\n", $fcontent);
            foreach ($lines as $l => $line) {
                if ($l >= 0) { // skip content
                    $row = explode(";", $line);

                    $nickname = (isset($row[0])) ? $row[0] : null; // Host Name
                    $nickname = trim($nickname);
                    $nickname = strtoupper($nickname);

                    if (!empty($nickname) && isset($row[0])) {
                        $data = [];
                        $data['row'] = $l + 1;
                        $data['nickname'] = $nickname;
                        $data['modacc_app'] = $fileTemplate;

                        // modstr_date
                        $data['modstr_date'] = date('Y-m-d H:i:s', strtotime($periodUntil));
                        $data['period_id'] = $period->period_id;

                        // modstr_period
                        $data['modstr_period'] = date('Ymd_H', strtotime($periodUntil));

                        // tokens
                        $row[1] = str_replace('$', '', $row[1]); // Earnings
                        $row[1] = str_replace('.', '', $row[1]);
                        $value = $row[1];
                        $data['modstr_earnings_tokens'] = $value;

                        // modstr_earnings_value
                        $data['modstr_earnings_usd'] = $data['modstr_earnings_tokens'] * 0.05;

                        // dataset
                        $dataset[] = $data;
                    }
                }
            }

            // MYFREECAMS
        } else if ($fileTemplate == 'MYFREECAMS') {

            // STREAMRAY
        } else if ($fileTemplate == 'STREAMRAY') {

            // XHAMSTER
        } else if ($fileTemplate == 'XHAMSTER') {

            // XLOVECAM
        } else if ($fileTemplate == 'XLOVECAM') {

            // MYDIRTYHOBBY
        } else if ($fileTemplate == 'MYDIRTYHOBBY') {

            // ONLYFANS
        } else if ($fileTemplate == 'ONLYFANS') {
        }

        $where = "1=2";
        foreach ($dataset as $d => $data) {
            // Log::info(json_encode($data));
            // parent
            $data['modstrfile_id'] = $parentFile->modstrfile_id;
            // nickname
            $nickname = $data['nickname'];
            // modstr_earnings
            $data['modstr_earnings_tokens'] = !empty($data['modstr_earnings_tokens']) ? $data['modstr_earnings_tokens'] : null;
            $data['modstr_earnings_usd'] = !empty($data['modstr_earnings_usd']) ? $data['modstr_earnings_usd'] : null;
            $data['modstr_earnings_eur'] = !empty($data['modstr_earnings_eur']) ? $data['modstr_earnings_eur'] : null;
            $data['modstr_time'] = !empty($data['modstr_time']) ? $data['modstr_time'] : null;
            // modstr_earnings_value
            $data['modstr_earnings_value'] = 0;
            $data['modstr_earnings_trm'] = 0;
            $data['modstr_earnings_cop'] = 0;
            $data['modstr_earnings_trm_studio'] = 0;
            $data['modstr_earnings_cop_studio'] = 0;
            if (!empty($data['modstr_earnings_usd'])) {
                $data['modstr_earnings_value'] = (float) $data['modstr_earnings_usd'];
            } else if (!empty($data['modstr_earnings_eur'])) {
                $data['modstr_earnings_value'] = (float) $data['modstr_earnings_eur'];
            } else if (!empty($data['modstr_earnings_tokens'])) {
                $data['modstr_earnings_value'] = (float) $data['modstr_earnings_tokens'];
            }

            // trm discount
            $data['std_discountmodel_usd'] = 0;
            $data['std_discountstudio_usd'] = 0;
            $data['std_discountmodel_eur'] = 0;
            $data['std_discountstudio_eur'] = 0;

            // exclude totals and trash data
            $trashData = [
                'TOTAL:',
                'TOTAL',
                'INCOME SUMMARY:',
                'RESUMEN GLOBAL:',
                'STAGE NAME',
                'RESUMEN DE OTRAS GANANCIAS:',
            ];
            if (!in_array($nickname, $trashData)) {
                // match model inactives
                // Se filtral las modelos inactivas
                if (isset($modelsAccountsList[$fileTemplate][$nickname])) {
                    $data['modacc_id'] = $modelsAccountsList[$fileTemplate][$nickname]->modacc_id;
                    $data['name'] = $modelsAccountsList[$fileTemplate][$nickname]->name;
                    $data['std_discountmodel_usd'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountmodel_usd;
                    $data['std_discountstudio_usd'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountstudio_usd;
                    $data['std_discountmodel_eur'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountmodel_eur;
                    $data['std_discountstudio_eur'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountstudio_eur;
                    // response
                    $response['success']['data'][] = $data;
                    $response['success']['totalEarningsTokens'] += (float) (isset($data['modstr_earnings_tokens']) ? $data['modstr_earnings_tokens'] : 0);
                    $response['success']['totalEarningsUsd'] += (float) (isset($data['modstr_earnings_usd']) ? $data['modstr_earnings_usd'] : 0);
                    $response['success']['totalEarningsEur'] += (float) (isset($data['modstr_earnings_eur']) ? $data['modstr_earnings_eur'] : 0);
                    $response['success']['totalTime'] += (float) (isset($data['modstr_time']) ? $data['modstr_time'] : 0);

                    // Se filtral las modelos que no estan en la base de datos
                } else {
                    // data default values
                    $data['error'] = [
                        'type' => 'NOT_MATCH',
                        'message' => 'No se encuentra la modelo "' . $nickname . '" en la base de datos',
                    ];
                    $response['errors']['data'][] = $data;

                    // build where for inactives search
                    $where .= " OR (modacc_app LIKE '%" . $fileTemplate . "%' AND modacc_payment_username LIKE '%" . $nickname . "%')";
                }
            }
        }

        // echo "<pre>";
        // print_r($dataset);
        // echo "</pre>";
        // die();

        //////////////////////
        // SEARCH INACTIVES //
        //////////////////////
        // get inactive models accounts list
        $modelsAccountsList = [];
        $records = DB::select(
            "SELECT modacc_id, modacc_app, modacc_payment_username,
                    us.user_name || ' ' || us.user_surname as name,
                    std_discountmodel_usd, std_discountmodel_eur,
                    std_discountstudio_usd, std_discountstudio_eur,
                    st.std_id
            FROM models_accounts ma
            LEFT JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
            LEFT JOIN studios st ON st.std_id = sm.std_id
            LEFT JOIN users us ON us.user_id = sm.user_id_model
            WHERE $where"
        );
        foreach ($records as $r => $row) {
            $row->modacc_app = preg_replace("/(.*)\(.*\)/", "$1", $row->modacc_app); // STRIPCHAT(2) >> STRIPCHAT
            $row->modacc_app = trim($row->modacc_app);
            $row->modacc_payment_username = trim($row->modacc_payment_username);
            $row->modacc_payment_username = strtoupper($row->modacc_payment_username);
            $modelsAccountsList[$row->modacc_app][$row->modacc_payment_username] = $row;
        }

        foreach ($response['errors']['data'] as $d => $data) {
            $nickname = $data['nickname'];
            // valida si el marcado error esta dentro de los inactivos
            if (isset($modelsAccountsList[$fileTemplate][$nickname])) {
                $data['modacc_id'] = $modelsAccountsList[$fileTemplate][$nickname]->modacc_id;
                $data['name'] = $modelsAccountsList[$fileTemplate][$nickname]->name;
                $data['std_discountmodel_usd'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountmodel_usd;
                $data['std_discountstudio_usd'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountstudio_usd;
                $data['std_discountmodel_eur'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountmodel_eur;
                $data['std_discountstudio_eur'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountstudio_eur;
                // lo agrega a los inactives
                unset($data['errors']);
                $response['inactives']['data'][] = $data;
                $response['inactives']['totalEarningsTokens'] += $data['modstr_earnings_tokens'];
                $response['inactives']['totalEarningsUsd'] += $data['modstr_earnings_usd'];
                $response['inactives']['totalEarningsEur'] += $data['modstr_earnings_eur'];
                $response['inactives']['totalTime'] += $data['modstr_time'];
                // lo quita de los errors
                unset($response['errors']['data'][$d]);

                // En caso contrario se suma al total de errores
            } else {
                $response['errors']['totalEarningsTokens'] += $data['modstr_earnings_tokens'];
                $response['errors']['totalEarningsUsd'] += $data['modstr_earnings_usd'];
                $response['errors']['totalEarningsEur'] += $data['modstr_earnings_eur'];
                $response['errors']['totalTime'] += $data['modstr_time'];
            }
        }
        $response['errors']['data'] = array_values($response['errors']['data']);

        // echo "<pre>";
        // print_r($response);
        // print_r($dataset);
        // echo "</pre>";
        // die();


        // INSERT
        foreach ($response as $rtype => $typedata) {
            if (in_array($rtype, ['success', 'inactives'])) {
                foreach ($typedata['data'] as $d => $data) {
                    // modstr_source
                    $data['modstr_source'] = 'CARGUE_ARCHIVO';

                    // modstr_earnings_value
                    if (!empty($data['modstr_earnings_usd'])) {
                        $data['modstr_earnings_trm'] = floatval($trmUSD) - floatval($data['std_discountmodel_usd']);
                        $data['modstr_earnings_cop'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm']);
                        $data['modstr_earnings_trm_studio'] = floatval($trmUSD) - floatval($data['std_discountstudio_usd']);
                        $data['modstr_earnings_cop_studio'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm_studio']);
                    } else if (!empty($data['modstr_earnings_eur'])) {
                        $data['modstr_earnings_trm'] = floatval($trmEUR) - floatval($data['std_discountmodel_eur']);
                        $data['modstr_earnings_cop'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm']);
                        $data['modstr_earnings_trm_studio'] = floatval($trmEUR) - floatval($data['std_discountstudio_eur']);
                        $data['modstr_earnings_cop_studio'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm_studio']);
                    }

                    // guarda el ultimo valor en COP para mostrarlo en la vista
                    $response[$rtype]['data'][$d]['modstr_earnings_cop'] = $data['modstr_earnings_cop'];
                    $response[$rtype]['totalEarningsCop'] += $data['modstr_earnings_cop'];

                    // validamos los datos
                    $validator = Validator::make($data, [
                        'modacc_id' => 'required|exists:models_accounts,modacc_id',
                        'modstr_date' => 'required',
                        'modstr_period' => 'required|max:255',
                        'modstr_start_at' => 'nullable',
                        'modstr_finish_at' => 'nullable',
                        'modstr_price' => 'nullable',
                        'modstr_earnings_value' => 'required|min:0',
                        'modstr_earnings_trm' => 'nullable',
                        'modstr_earnings_percent' => 'nullable',
                        'modstr_earnings_tokens' => 'nullable|min:0',
                        'modstr_earnings_tokens_rate' => 'nullable|min:0',
                        'modstr_earnings_usd' => 'nullable|min:0',
                        'modstr_earnings_eur' => 'nullable|min:0',
                        'modstr_earnings_cop' => 'nullable|min:0',
                        'modstr_time' => 'nullable|min:0',
                        'modstr_source' => 'required|max:255',
                    ]);

                    if ($validator->fails()) {
                        Log::error(json_encode($data)); // throw row error
                        $response = array(
                            'code' => 'IMPORT_ERROR',
                            'position' => $data['row'],
                            'errors' => $validator->errors()
                        );
                        throw new \Exception(json_encode($response));
                    }

                    // create record
                    $record = ModelStream::create($data);
                }
            }
        }

        return $response;
    }

    /**
     * import resources to Excel
     *
     * @param  \Illuminate\Http\Request  $request
     */
    public function importXLS($filename, $parentFile, $fileTemplate, $periodUntil)
    {
        // init
        $dataset = [];
        $response = [
            'success' => [
                'data' => [],
                'totalEarningsTokens' => 0,
                'totalEarningsUsd' => 0,
                'totalEarningsEur' => 0,
                'totalEarningsCop' => 0,
                'totalTime' => 0,
            ],
            'inactives' => [
                'data' => [],
                'totalEarningsTokens' => 0,
                'totalEarningsUsd' => 0,
                'totalEarningsEur' => 0,
                'totalEarningsCop' => 0,
                'totalTime' => 0,
            ],
            'errors' => [
                'data' => [],
                'totalEarningsTokens' => 0,
                'totalEarningsUsd' => 0,
                'totalEarningsEur' => 0,
                'totalEarningsCop' => 0,
                'totalTime' => 0,
            ],
        ];

        //////////////
        // ONLY XLS //
        //////////////
        // $reader = new \PhpOffice\PhpSpreadsheet\Reader\Xls();
        // $spreadsheet = $reader->load($filename);
        // $sheetData = $spreadsheet->getActiveSheet()->toArray();

        /////////////////////////
        // XLS WITH BAD FORMAT //
        /////////////////////////
        // Tell PHPExcel to load this file and make its best guess as to its type.
        $objPHPExcel = IOFactory::load($filename);
        $sheetData = $objPHPExcel->getActiveSheet()->toArray();

        // echo "<pre>";
        // print_r($sheetData);
        // echo "</pre>";
        // die();

        // get models accounts list
        $modelsAccountsList = [];
        $records = DB::select(
            "SELECT modacc_id, modacc_app, modacc_payment_username,
                    us.user_name || ' ' || us.user_surname as name,
                    std_discountmodel_usd, std_discountmodel_eur,
                    std_discountstudio_usd, std_discountstudio_eur,
                    st.std_id
            FROM models_accounts ma
            LEFT JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
            LEFT JOIN studios st ON st.std_id = sm.std_id
            LEFT JOIN users us ON us.user_id = sm.user_id_model
            WHERE modacc_active=true"
        );
        foreach ($records as $r => $row) {
            $row->modacc_app = preg_replace("/(.*)\(.*\)/", "$1", $row->modacc_app); // STRIPCHAT(2) >> STRIPCHAT
            $row->modacc_app = trim($row->modacc_app);
            $row->modacc_payment_username = trim($row->modacc_payment_username);
            $row->modacc_payment_username = strtoupper($row->modacc_payment_username);
            $modelsAccountsList[$row->modacc_app][$row->modacc_payment_username] = $row;
        }

        // echo "<pre>";
        // print_r($modelsAccountsList['STREAMATE']);
        // echo "</pre>";
        // die();
        $period = PeriodController::retrieveOrCreatePeriod(date('Y-m-d', strtotime($periodUntil)));

        // fecha del trm es la del fin del periodo +1 dia
        $trm_date = date('Y-m-d', strtotime($periodUntil . ' +1 day'));
        // Si la fecha del trm es mayor a hoy
        if (strtotime($trm_date) > strtotime(date('Y-m-d'))) {
            $trm_date = date('Y-m-d');
        }
        // Obtener el trm
        $exchangeRateController = new ExchangeRateController();
        $trmUSD = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'USD', $to = 'COP', $trm_date); // USD
        $trmEUR = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'EUR', $to = 'COP', $trm_date); // EUR

        // BONGACAMS
        if ($fileTemplate == 'BONGACAMS') {
            foreach ($sheetData as $l => $row) {
                if ($l >= 4) { // skip content
                    $nickname = (isset($row[0])) ? $row[0] : null; // NICk
                    // ElizabethMart (ElizabethMart) >> ElizabethMart
                    $nickname = preg_replace("/.*\((.*)\)/", "$1", $nickname);
                    $nickname = strtoupper($nickname);

                    if (!empty($nickname) && isset($row[17])) {
                        $data = [];
                        $data['row'] = $l + 1;
                        $data['nickname'] = $nickname;
                        $data['modacc_app'] = $fileTemplate;

                        // modstr_date
                        $data['modstr_date'] = date('Y-m-d H:i:s', strtotime($periodUntil));
                        $data['period_id'] = $period->period_id;

                        // modstr_period
                        $data['modstr_period'] = date('Ymd_H', strtotime($periodUntil));

                        // modstr_earnings_tokens
                        $tok_bonga = 0;
                        if (preg_match('/^\d+([.,]\d+)?/', $row[16], $coincidencias)) {
                            $tok_bonga = $coincidencias[0];
                            $tok_bonga = str_replace(',', '', $tok_bonga);
                        }

                        $data['modstr_earnings_tokens'] = $tok_bonga; // TOKENS

                        // modstr_earnings_value
                        $row[17] = str_replace('$', '', $row[17]); // Performer Revenue
                        $value = $row[17];
                        $data['modstr_earnings_usd'] = $value;

                        // dataset
                        $dataset[] = $data;
                    }
                }
            }

            // CAM4
        } else if ($fileTemplate == 'CAM4') {
            foreach ($sheetData as $l => $row) {
                if ($l >= 1) { // skip content
                    // nickname
                    $nickname = (isset($row[0])) ? $row[0] : null; // NICk
                    $nickname = strtoupper($nickname);

                    if (!empty($nickname) && isset($row[2])) {
                        $data = [];
                        $data['row'] = $l + 1;
                        $data['nickname'] = $nickname;
                        $data['modacc_app'] = $fileTemplate;

                        // modstr_date
                        $data['modstr_date'] = date('Y-m-d H:i:s', strtotime($periodUntil));
                        $data['period_id'] = $period->period_id;

                        // modstr_period
                        $data['modstr_period'] = date('Ymd_H', strtotime($periodUntil));

                        // modstr_earnings_tokens
                        $data['modstr_earnings_tokens'] = $row[1]; // TOKENS

                        // modstr_earnings_value
                        $row[2] = str_replace('$', '', $row[2]); // Performer Revenue
                        $value = $row[2];
                        $data['modstr_earnings_usd'] = $value;

                        // dataset
                        $dataset[] = $data;
                    }
                }
            }

            // CAMSODA
        } else if ($fileTemplate == 'CAMSODA') {

            // FLIRT4FREE
        } else if ($fileTemplate == 'FLIRT4FREE') {
            $initContent = 1000;
            foreach ($sheetData as $l => $row) {
                // 1. Se debe obtener la fila que contiene las columnas
                if ($row[1] == 'Stage Name') {
                    $initContent = $l;

                    // 2. Como las columnas son dinamicas se deben obtener recorriendo la fila
                    $colNetCred = 0;
                    $colNetComm = 0;
                    $colHoursOnline = 0;
                    foreach ($row as $c => $column) {
                        $column = trim($column);
                        if ($column == 'Net Credits') {
                            $colNetCred = $c;
                        // } else if ($column == 'Net Commission') { // Se cambia la columna por cambios en la plataforma
                        } else if ($column == 'Progressive Total Payout') {
                            $colNetComm = $c;
                        } else if ($column == 'Hours online') {
                            $colHoursOnline = $c;
                        }
                    }
                }

                if ($l > $initContent) { // skip content
                    // nickname
                    $nickname = (isset($row[1])) ? $row[1] : null; // Stage Name
                    $nickname = strtoupper($nickname);

                    if (!empty($nickname) && isset($row[$colNetComm])) {
                        $data = [];
                        $data['row'] = $l + 1;
                        $data['nickname'] = $nickname;
                        $data['modacc_app'] = $fileTemplate;

                        // modstr_date
                        $data['modstr_date'] = date('Y-m-d H:i:s', strtotime($periodUntil));
                        $data['period_id'] = $period->period_id;

                        // modstr_period
                        $data['modstr_period'] = date('Ymd_H', strtotime($periodUntil));

                        // modstr_earnings_tokens
                        $row[$colNetCred] = str_replace('$', '', $row[$colNetCred]); // Net Credits
                        $value = $row[$colNetCred];
                        $data['modstr_earnings_tokens'] = $value;

                        // modstr_earnings_value
                        $row[$colNetComm] = str_replace('$', '', $row[$colNetComm]); // Net Commission
                        $value = $row[$colNetComm];
                        $data['modstr_earnings_usd'] = $value;

                        // modstr_time
                        $data['modstr_time'] = $row[$colHoursOnline]; // Hours online

                        // dataset
                        $dataset[] = $data;
                    }
                }
            }

            // LIVEJASMIN
        } else if ($fileTemplate == 'LIVEJASMIN') {
            foreach ($sheetData as $l => $row) {
                if ($l >= 1) { // skip content
                    // nickname
                    $nickname = (isset($row[0])) ? $row[0] : null; // NICk
                    $nickname = strtoupper($nickname);

                    if (!empty($nickname) && isset($row[1])) {
                        $data = [];
                        $data['row'] = $l + 1;
                        $data['nickname'] = $nickname;
                        $data['modacc_app'] = $fileTemplate;

                        // modstr_date
                        $data['modstr_date'] = date('Y-m-d H:i:s', strtotime($periodUntil));
                        $data['period_id'] = $period->period_id;

                        // modstr_period
                        $data['modstr_period'] = date('Ymd_H', strtotime($periodUntil));

                        // modstr_earnings_value
                        $row[1] = str_replace('$', '', $row[1]); // Ventas
                        $row[1] = str_replace(',', '', $row[1]); // Ventas
                        $value = (float) $row[1];
                        $data['modstr_earnings_usd'] = $value;

                        // dataset
                        $dataset[] = $data;
                    }
                }
            }

            // IMLIVE
        } else if ($fileTemplate == 'IMLIVE') {
            foreach ($sheetData as $l => $row) {
                if ($l >= 1) { // skip content
                    $nickname = (isset($row[10])) ? $row[10] : null; // Host Name
                    $nickname = trim($nickname);
                    $nickname = strtoupper($nickname);

                    if (!empty($nickname) && isset($row[10])) {
                        $data = [];
                        $data['row'] = $l + 1;
                        $data['nickname'] = $nickname;
                        $data['modacc_app'] = $fileTemplate;

                        // modstr_date
                        $data['modstr_date'] = date('Y-m-d H:i:s', strtotime($periodUntil));
                        $data['period_id'] = $period->period_id;

                        // modstr_period
                        $data['modstr_period'] = date('Ymd_H', strtotime($periodUntil));

                        // modstr_earnings_value
                        $row[7] = str_replace('$', '', $row[7]); // Earnings
                        $value = $row[7];
                        $data['modstr_earnings_usd'] = $value;

                        // modstr_time
                        $data['modstr_time'] = $this->helper->timeToNumber($row[3]); // Performing hours
                        $data['modstr_time'] = round($data['modstr_time'], 2); // Performing hours

                        // dataset
                        $dataset[] = $data;
                    }
                }
            }

            // MYFREECAMS
        } else if ($fileTemplate == 'MYFREECAMS') {

            // STREAMRAY
        } else if ($fileTemplate == 'STREAMRAY') {

            // XHAMSTER
        } else if ($fileTemplate == 'XHAMSTER') {

            // XLOVECAM
        } else if ($fileTemplate == 'XLOVECAM') {

            // CHATURBATE
        } else if ($fileTemplate == 'CHATURBATE') {
            foreach ($sheetData as $l => $row) {
                if ($l >= 1) { // skip content
                    // nickname
                    $nickname = (isset($row[0])) ? $row[0] : null; // NICk
                    $nickname = strtoupper($nickname);

                    if (!empty($nickname) && isset($row[2])) {
                        $data = [];
                        $data['row'] = $l + 1;
                        $data['nickname'] = $nickname;
                        $data['modacc_app'] = $fileTemplate;

                        // modstr_date
                        $data['modstr_date'] = date('Y-m-d H:i:s', strtotime($periodUntil));
                        $data['period_id'] = $period->period_id;

                        // modstr_period
                        $data['modstr_period'] = date('Ymd_H', strtotime($periodUntil));

                        // modstr_earnings_tokens
                        $data['modstr_earnings_tokens'] = $row[1]; // TOKENS

                        // modstr_earnings_value
                        $row[2] = str_replace('$', '', $row[2]); // Performer Revenue
                        $value = $row[2];
                        $data['modstr_earnings_usd'] = $value;

                        // dataset
                        $dataset[] = $data;
                    }
                }
            }

            // MYDIRTYHOBBY
        } else if ($fileTemplate == 'MYDIRTYHOBBY') {

            // ONLYFANS
        } else if ($fileTemplate == 'ONLYFANS') {
        }

        $where = "1=2";
        foreach ($dataset as $d => $data) {
            // Log::info(json_encode($data));
            // parent
            $data['modstrfile_id'] = $parentFile->modstrfile_id;
            // nickname
            $nickname = $data['nickname'];
            // modstr_earnings
            $data['modstr_earnings_tokens'] = !empty($data['modstr_earnings_tokens']) ? $data['modstr_earnings_tokens'] : null;
            $data['modstr_earnings_usd'] = !empty($data['modstr_earnings_usd']) ? $data['modstr_earnings_usd'] : null;
            $data['modstr_earnings_eur'] = !empty($data['modstr_earnings_eur']) ? $data['modstr_earnings_eur'] : null;
            $data['modstr_time'] = !empty($data['modstr_time']) ? $data['modstr_time'] : null;
            // modstr_earnings_value
            $data['modstr_earnings_value'] = 0;
            $data['modstr_earnings_trm'] = 0;
            $data['modstr_earnings_cop'] = 0;
            $data['modstr_earnings_trm_studio'] = 0;
            $data['modstr_earnings_cop_studio'] = 0;
            if (!empty($data['modstr_earnings_usd'])) {
                $data['modstr_earnings_value'] = (float) $data['modstr_earnings_usd'];
            } else if (!empty($data['modstr_earnings_eur'])) {
                $data['modstr_earnings_value'] = (float) $data['modstr_earnings_eur'];
            } else if (!empty($data['modstr_earnings_tokens'])) {
                $data['modstr_earnings_value'] = (float) $data['modstr_earnings_tokens'];
            }

            // trm discount
            $data['std_discountmodel_usd'] = 0;
            $data['std_discountstudio_usd'] = 0;
            $data['std_discountmodel_eur'] = 0;
            $data['std_discountstudio_eur'] = 0;

            // exclude totals and trash data
            $trashData = [
                'TOTAL:',
                'TOTAL',
                'INCOME SUMMARY:',
                'RESUMEN GLOBAL:',
                'STAGE NAME',
                'RESUMEN DE OTRAS GANANCIAS:',
            ];
            if (!in_array($nickname, $trashData)) {
                // match model inactives
                // Se filtral las modelos inactivas
                if (isset($modelsAccountsList[$fileTemplate][$nickname])) {
                    $data['modacc_id'] = $modelsAccountsList[$fileTemplate][$nickname]->modacc_id;
                    $data['name'] = $modelsAccountsList[$fileTemplate][$nickname]->name;
                    $data['std_discountmodel_usd'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountmodel_usd;
                    $data['std_discountstudio_usd'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountstudio_usd;
                    $data['std_discountmodel_eur'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountmodel_eur;
                    $data['std_discountstudio_eur'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountstudio_eur;
                    // response
                    $response['success']['data'][] = $data;
                    $response['success']['totalEarningsTokens'] += (float) (isset($data['modstr_earnings_tokens']) ? $data['modstr_earnings_tokens'] : 0);
                    $response['success']['totalEarningsUsd'] += (float) (isset($data['modstr_earnings_usd']) ? $data['modstr_earnings_usd'] : 0);
                    $response['success']['totalEarningsEur'] += (float) (isset($data['modstr_earnings_eur']) ? $data['modstr_earnings_eur'] : 0);
                    $response['success']['totalTime'] += (float) (isset($data['modstr_time']) ? $data['modstr_time'] : 0);

                    // Se filtral las modelos que no estan en la base de datos
                } else {
                    // data default values
                    $data['error'] = [
                        'type' => 'NOT_MATCH',
                        'message' => 'No se encuentra la modelo "' . $nickname . '" en la base de datos',
                    ];
                    $response['errors']['data'][] = $data;

                    // build where for inactives search
                    $where .= " OR (modacc_app LIKE '%" . $fileTemplate . "%' AND modacc_payment_username LIKE '%" . $nickname . "%')";
                }
            }
        }

        // echo "<pre>";
        // print_r($dataset);
        // echo "</pre>";
        // die();

        //////////////////////
        // SEARCH INACTIVES //
        //////////////////////
        // get inactive models accounts list
        $modelsAccountsList = [];
        $records = DB::select(
            "SELECT modacc_id, modacc_app, modacc_payment_username,
                    us.user_name || ' ' || us.user_surname as name,
                    std_discountmodel_usd, std_discountmodel_eur,
                    std_discountstudio_usd, std_discountstudio_eur,
                    st.std_id
            FROM models_accounts ma
            LEFT JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
            LEFT JOIN studios st ON st.std_id = sm.std_id
            LEFT JOIN users us ON us.user_id = sm.user_id_model
            WHERE $where"
        );
        foreach ($records as $r => $row) {
            $row->modacc_app = preg_replace("/(.*)\(.*\)/", "$1", $row->modacc_app); // STRIPCHAT(2) >> STRIPCHAT
            $row->modacc_app = trim($row->modacc_app);
            $row->modacc_payment_username = trim($row->modacc_payment_username);
            $row->modacc_payment_username = strtoupper($row->modacc_payment_username);
            $modelsAccountsList[$row->modacc_app][$row->modacc_payment_username] = $row;
        }

        foreach ($response['errors']['data'] as $d => $data) {
            $nickname = $data['nickname'];
            // valida si el marcado error esta dentro de los inactivos
            if (isset($modelsAccountsList[$fileTemplate][$nickname])) {
                $data['modacc_id'] = $modelsAccountsList[$fileTemplate][$nickname]->modacc_id;
                $data['name'] = $modelsAccountsList[$fileTemplate][$nickname]->name;
                $data['std_discountmodel_usd'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountmodel_usd;
                $data['std_discountstudio_usd'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountstudio_usd;
                $data['std_discountmodel_eur'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountmodel_eur;
                $data['std_discountstudio_eur'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountstudio_eur;
                // lo agrega a los inactives
                unset($data['errors']);
                $response['inactives']['data'][] = $data;
                $response['inactives']['totalEarningsTokens'] += $data['modstr_earnings_tokens'];
                $response['inactives']['totalEarningsUsd'] += $data['modstr_earnings_usd'];
                $response['inactives']['totalEarningsEur'] += $data['modstr_earnings_eur'];
                $response['inactives']['totalTime'] += $data['modstr_time'];
                // lo quita de los errors
                unset($response['errors']['data'][$d]);

                // En caso contrario se suma al total de errores
            } else {
                $response['errors']['totalEarningsTokens'] += $data['modstr_earnings_tokens'];
                $response['errors']['totalEarningsUsd'] += $data['modstr_earnings_usd'];
                $response['errors']['totalEarningsEur'] += $data['modstr_earnings_eur'];
                $response['errors']['totalTime'] += $data['modstr_time'];
            }
        }
        $response['errors']['data'] = array_values($response['errors']['data']);

        // echo "<pre>";
        // print_r($response);
        // print_r($dataset);
        // echo "</pre>";
        // die();


        // INSERT
        foreach ($response as $rtype => $typedata) {
            if (in_array($rtype, ['success', 'inactives'])) {
                foreach ($typedata['data'] as $d => $data) {
                    // modstr_source
                    $data['modstr_source'] = 'CARGUE_ARCHIVO';

                    // modstr_earnings_value
                    if (!empty($data['modstr_earnings_usd'])) {
                        $data['modstr_earnings_trm'] = floatval($trmUSD) - floatval($data['std_discountmodel_usd']);
                        $data['modstr_earnings_cop'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm']);
                        $data['modstr_earnings_trm_studio'] = floatval($trmUSD) - floatval($data['std_discountstudio_usd']);
                        $data['modstr_earnings_cop_studio'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm_studio']);
                    } else if (!empty($data['modstr_earnings_eur'])) {
                        $data['modstr_earnings_trm'] = floatval($trmEUR) - floatval($data['std_discountmodel_eur']);
                        $data['modstr_earnings_cop'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm']);
                        $data['modstr_earnings_trm_studio'] = floatval($trmEUR) - floatval($data['std_discountstudio_eur']);
                        $data['modstr_earnings_cop_studio'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm_studio']);
                    }

                    // guarda el ultimo valor en COP para mostrarlo en la vista
                    $response[$rtype]['data'][$d]['modstr_earnings_cop'] = $data['modstr_earnings_cop'];
                    $response[$rtype]['totalEarningsCop'] += $data['modstr_earnings_cop'];

                    // validamos los datos
                    $validator = Validator::make($data, [
                        'modacc_id' => 'required|exists:models_accounts,modacc_id',
                        'modstr_date' => 'required',
                        'modstr_period' => 'required|max:255',
                        'modstr_start_at' => 'nullable',
                        'modstr_finish_at' => 'nullable',
                        'modstr_price' => 'nullable',
                        'modstr_earnings_value' => 'required|min:0',
                        'modstr_earnings_trm' => 'nullable',
                        'modstr_earnings_percent' => 'nullable',
                        'modstr_earnings_tokens' => 'nullable|min:0',
                        'modstr_earnings_tokens_rate' => 'nullable|min:0',
                        'modstr_earnings_usd' => 'nullable|min:0',
                        'modstr_earnings_eur' => 'nullable|min:0',
                        'modstr_earnings_cop' => 'nullable|min:0',
                        'modstr_time' => 'nullable|min:0',
                        'modstr_source' => 'required|max:255',
                    ]);

                    if ($validator->fails()) {
                        Log::error(json_encode($data)); // throw row error
                        $response = array(
                            'code' => 'IMPORT_ERROR',
                            'position' => $data['row'],
                            'errors' => $validator->errors()
                        );
                        throw new \Exception(json_encode($response));
                    }

                    // create record
                    $record = ModelStream::create($data);
                }
            }
        }

        return $response;
    }

    /**
     * import resources to Excel
     *
     * @param  \Illuminate\Http\Request  $request
     */
    public function importCamsoda($filename, $parentFile, $periodUntil)
    {
        // init
        $fileTemplate = 'CAMSODA';
        $dataset = [];
        $response = [
            'success' => [
                'data' => [],
                'totalEarningsTokens' => 0,
                'totalEarningsUsd' => 0,
                'totalEarningsEur' => 0,
                'totalEarningsCop' => 0,
                'totalTime' => 0,
            ],
            'inactives' => [
                'data' => [],
                'totalEarningsTokens' => 0,
                'totalEarningsUsd' => 0,
                'totalEarningsEur' => 0,
                'totalEarningsCop' => 0,
                'totalTime' => 0,
            ],
            'errors' => [
                'data' => [],
                'totalEarningsTokens' => 0,
                'totalEarningsUsd' => 0,
                'totalEarningsEur' => 0,
                'totalEarningsCop' => 0,
                'totalTime' => 0,
            ],
        ];

        //////////////
        // ONLY XLS //
        //////////////
        // $reader = new \PhpOffice\PhpSpreadsheet\Reader\Xls();
        // $spreadsheet = $reader->load($filename);
        // $sheetData = $spreadsheet->getActiveSheet()->toArray();

        /////////////////////////
        // XLS WITH BAD FORMAT //
        /////////////////////////
        // Tell PHPExcel to load this file and make its best guess as to its type.
        $objPHPExcel = IOFactory::load($filename);
        $sheetData = $objPHPExcel->getActiveSheet()->toArray();

        // echo "<pre>";
        // print_r($sheetData);
        // echo "</pre>";
        // die();

        // get models accounts list
        $modelsAccountsList = [];
        $records = DB::select(
            "SELECT modacc_id, modacc_app, modacc_payment_username,
                    us.user_name || ' ' || us.user_surname as name,
                    std_discountmodel_usd, std_discountmodel_eur,
                    std_discountstudio_usd, std_discountstudio_eur,
                    st.std_id
            FROM models_accounts ma
            INNER JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
            INNER JOIN studios st ON st.std_id = sm.std_id
            LEFT JOIN users us ON us.user_id = sm.user_id_model
            WHERE modacc_active=true
        "
        );
        foreach ($records as $r => $row) {
            $row->modacc_app = preg_replace("/(.*)\(.*\)/", "$1", $row->modacc_app); // STRIPCHAT(2) >> STRIPCHAT
            $row->modacc_app = str_replace('CAMSODA ALIADOS', 'CAMSODA', $row->modacc_app);
            $row->modacc_app = trim($row->modacc_app);
            $row->modacc_payment_username = trim($row->modacc_payment_username);
            $row->modacc_payment_username = strtoupper($row->modacc_payment_username);
            $modelsAccountsList[$row->modacc_app][$row->modacc_payment_username] = $row;
        }

        // echo "<pre>";
        // print_r($modelsAccountsList['STREAMATE']);
        // echo "</pre>";
        // die();
        $period = PeriodController::retrieveOrCreatePeriod(date('Y-m-d', strtotime($periodUntil)));

        // fecha del trm es la del fin del periodo +1 dia
        $trm_date = date('Y-m-d', strtotime($periodUntil . ' +1 day'));
        // Si la fecha del trm es mayor a hoy
        if (strtotime($trm_date) > strtotime(date('Y-m-d'))) {
            $trm_date = date('Y-m-d');
        }
        // Obtener el trm
        $exchangeRateController = new ExchangeRateController();
        $trmUSD = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'USD', $to = 'COP', $trm_date); // USD
        $trmEUR = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'EUR', $to = 'COP', $trm_date); // EUR

        foreach ($sheetData as $l => $row) {
            if ($l >= 0) { // skip content
                $nickname = null;
                if (
                    !empty($row[0]) // PLATAFORMA
                    && !in_array($row[0], ['PLATAFORMA', 'SALDO A PAGAR', 'REINTEGRO', 'TOTAL']) // APP (excluir titulos)
                    && !empty($row[4]) // MONEDA [USD,EUR]
                    && !empty($row[5]) // PRODUCIDO
                ) {
                    $nickname = (isset($sheetData[($l + 1)][0])) ? $sheetData[($l + 1)][0] : null; // NICk
                    // ElizabethMart (ElizabethMart) >> ElizabethMart
                    $nickname = preg_replace("/.*\((.*)\)/", "$1", $nickname);
                    $nickname = strtoupper($nickname);
                }


                if (!empty($nickname)) {
                    $data = [];
                    $data['row'] = $l + 1;
                    $data['nickname'] = $nickname;

                    // modacc_app
                    $row[0] = preg_replace("/\(.*\)/", '', $row[0]); // CamSoda (92) >> CamSoda
                    $row[0] = trim(strtoupper($row[0])); // CamSoda >> CAMSODA
                    $row[0] = str_replace('CAMSODA ALIADOS', 'CAMSODA', $row[0]);
                    $data['modacc_app'] = $row[0];

                    // modstr_date
                    $data['modstr_date'] = date('Y-m-d H:i:s', strtotime($periodUntil));
                    $data['period_id'] = $period->period_id;

                    // modstr_period
                    $data['modstr_period'] = date('Ymd_H', strtotime($periodUntil));

                    // modstr_earnings_tokens
                    $row[2] = str_replace('$', '', $row[2]); // FICHAS
                    $data['modstr_earnings_tokens'] = $row[2];

                    // modstr_earnings_value
                    $row[5] = str_replace('$', '', $row[5]); // PRODUCIDO
                    $value = $row[5];

                    // USD
                    if ($row[4] == 'USD') {
                        $data['modstr_earnings_usd'] = $value;

                        // EUR
                    } else if ($row[4] == 'EUR') {
                        $data['modstr_earnings_eur'] = $value;
                    }

                    // dataset
                    $dataset[] = $data;
                }
            }
        }

        // echo "<pre>";
        // print_r($dataset);
        // echo "</pre>";
        // die();

        $where = "1=2";
        foreach ($dataset as $d => $data) {
            // Log::info(json_encode($data));
            // parent
            $data['modstrfile_id'] = $parentFile->modstrfile_id;
            // nickname
            $nickname = $data['nickname'];
            // app
            $app = $data['modacc_app'];
            // modstr_earnings
            $data['modstr_earnings_tokens'] = !empty($data['modstr_earnings_tokens']) ? $data['modstr_earnings_tokens'] : null;
            $data['modstr_earnings_usd'] = !empty($data['modstr_earnings_usd']) ? $data['modstr_earnings_usd'] : null;
            $data['modstr_earnings_eur'] = !empty($data['modstr_earnings_eur']) ? $data['modstr_earnings_eur'] : null;
            $data['modstr_time'] = !empty($data['modstr_time']) ? $data['modstr_time'] : null;
            // modstr_earnings_value
            $data['modstr_earnings_value'] = 0;
            $data['modstr_earnings_trm'] = 0;
            $data['modstr_earnings_cop'] = 0;
            $data['modstr_earnings_trm_studio'] = 0;
            $data['modstr_earnings_cop_studio'] = 0;
            if (!empty($data['modstr_earnings_usd'])) {
                $data['modstr_earnings_value'] = (float) $data['modstr_earnings_usd'];
            } else if (!empty($data['modstr_earnings_eur'])) {
                $data['modstr_earnings_value'] = (float) $data['modstr_earnings_eur'];
            } else if (!empty($data['modstr_earnings_tokens'])) {
                $data['modstr_earnings_value'] = (float) $data['modstr_earnings_tokens'];
            }

            // trm discount
            $data['std_discountmodel_usd'] = 0;
            $data['std_discountstudio_usd'] = 0;
            $data['std_discountmodel_eur'] = 0;
            $data['std_discountstudio_eur'] = 0;

            // exclude totals and trash data
            $trashData = [
                'TOTAL:',
                'TOTAL',
                'INCOME SUMMARY:',
                'RESUMEN GLOBAL:',
                'STAGE NAME',
                'RESUMEN DE OTRAS GANANCIAS:',
            ];
            if (!in_array($nickname, $trashData)) {
                // match model
                if (isset($modelsAccountsList[$app][$nickname])) {
                    $data['modacc_id'] = $modelsAccountsList[$app][$nickname]->modacc_id;
                    $data['name'] = $modelsAccountsList[$app][$nickname]->name;
                    $data['std_discountmodel_usd'] = $modelsAccountsList[$app][$nickname]->std_discountmodel_usd;
                    $data['std_discountstudio_usd'] = $modelsAccountsList[$app][$nickname]->std_discountstudio_usd;
                    $data['std_discountmodel_eur'] = $modelsAccountsList[$app][$nickname]->std_discountmodel_eur;
                    $data['std_discountstudio_eur'] = $modelsAccountsList[$app][$nickname]->std_discountstudio_eur;

                    // Se define que la ganancia sigue la siguiente logica:
                    // Si el estudio es PENTHOUSE (id=1) y la plataforma es CAMSODA, debe calcularse sobre el 0.045
                    // de lo contrario debe ser 0.05 (tal como viene en el archivo)
                    if ($modelsAccountsList[$app][$nickname]->std_id == 1 && $app == 'CAMSODA') {
                        $data['modstr_earnings_usd'] = $data['modstr_earnings_tokens'] * 0.045;
                    }

                    // response
                    $response['success']['data'][] = $data;
                    $response['success']['totalEarningsTokens'] += (float) (isset($data['modstr_earnings_tokens']) ? $data['modstr_earnings_tokens'] : 0);
                    $response['success']['totalEarningsUsd'] += (float) (isset($data['modstr_earnings_usd']) ? $data['modstr_earnings_usd'] : 0);
                    $response['success']['totalEarningsEur'] += (float) (isset($data['modstr_earnings_eur']) ? $data['modstr_earnings_eur'] : 0);
                    $response['success']['totalTime'] += (float) (isset($data['modstr_time']) ? $data['modstr_time'] : 0);
                } else {
                    // data default values
                    $data['error'] = [
                        'type' => 'NOT_MATCH',
                        'message' => 'No se encuentra la modelo "' . $nickname . '" en la base de datos',
                    ];
                    $response['errors']['data'][] = $data;

                    // build where for inactives search
                    $where .= " OR (modacc_app LIKE '%" . $app . "%' AND modacc_payment_username LIKE '%" . $nickname . "%')";
                }
            }
        }

        // echo "<pre>";
        // print_r($dataset);
        // echo "</pre>";
        // die();

        //////////////////////
        // SEARCH INACTIVES //
        //////////////////////
        // get inactive models accounts list
        $modelsAccountsList = [];
        $records = DB::select(
            "SELECT modacc_id, modacc_app, modacc_payment_username,
                    us.user_name || ' ' || us.user_surname as name,
                    std_discountmodel_usd, std_discountmodel_eur,
                    std_discountstudio_usd, std_discountstudio_eur,
                    st.std_id
            FROM models_accounts ma
            LEFT JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
            LEFT JOIN studios st ON st.std_id = sm.std_id
            LEFT JOIN users us ON us.user_id = sm.user_id_model
            WHERE $where"
        );
        //Log::info("SELECT modacc_id, modacc_app, modacc_payment_username FROM models_accounts WHERE $where");
        foreach ($records as $r => $row) {
            $row->modacc_app = preg_replace("/(.*)\(.*\)/", "$1", $row->modacc_app); // STRIPCHAT(2) >> STRIPCHAT
            $row->modacc_app = str_replace('CAMSODA ALIADOS', 'CAMSODA', $row->modacc_app);
            $row->modacc_app = trim($row->modacc_app);
            $row->modacc_payment_username = trim($row->modacc_payment_username);
            $row->modacc_payment_username = strtoupper($row->modacc_payment_username);
            $modelsAccountsList[$row->modacc_app][$row->modacc_payment_username] = $row;
        }

        foreach ($response['errors']['data'] as $d => $data) {
            $nickname = $data['nickname'];
            // valida si el marcado error esta dentro de los inactivos
            if (isset($modelsAccountsList[$fileTemplate][$nickname])) {
                $data['modacc_id'] = $modelsAccountsList[$fileTemplate][$nickname]->modacc_id;
                $data['name'] = $modelsAccountsList[$fileTemplate][$nickname]->name;
                $data['std_discountmodel_usd'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountmodel_usd;
                $data['std_discountstudio_usd'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountstudio_usd;
                $data['std_discountmodel_eur'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountmodel_eur;
                $data['std_discountstudio_eur'] = (float) $modelsAccountsList[$fileTemplate][$nickname]->std_discountstudio_eur;
                // lo agrega a los inactives
                unset($data['errors']);
                $response['inactives']['data'][] = $data;
                $response['inactives']['totalEarningsTokens'] += $data['modstr_earnings_tokens'];
                $response['inactives']['totalEarningsUsd'] += $data['modstr_earnings_usd'];
                $response['inactives']['totalEarningsEur'] += $data['modstr_earnings_eur'];
                $response['inactives']['totalTime'] += $data['modstr_time'];
                // lo quita de los errors
                unset($response['errors']['data'][$d]);

                // En caso contrario se suma al total de errores
            } else {
                $response['errors']['totalEarningsTokens'] += $data['modstr_earnings_tokens'];
                $response['errors']['totalEarningsUsd'] += $data['modstr_earnings_usd'];
                $response['errors']['totalEarningsEur'] += $data['modstr_earnings_eur'];
                $response['errors']['totalTime'] += $data['modstr_time'];
            }
        }
        $response['errors']['data'] = array_values($response['errors']['data']);

        // echo "<pre>";
        // print_r($response);
        // print_r($dataset);
        // echo "</pre>";
        // die();


        // INSERT
        foreach ($response as $rtype => $typedata) {
            if (in_array($rtype, ['success', 'inactives'])) {
                foreach ($typedata['data'] as $d => $data) {
                    // modstr_source
                    $data['modstr_source'] = 'CARGUE_ARCHIVO';

                    // modstr_earnings_value
                    if (!empty($data['modstr_earnings_usd'])) {
                        $data['modstr_earnings_trm'] = floatval($trmUSD) - floatval($data['std_discountmodel_usd']);
                        $data['modstr_earnings_cop'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm']);
                        $data['modstr_earnings_trm_studio'] = floatval($trmUSD) - floatval($data['std_discountstudio_usd']);
                        $data['modstr_earnings_cop_studio'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm_studio']);
                    } else if (!empty($data['modstr_earnings_eur'])) {
                        $data['modstr_earnings_trm'] = floatval($trmEUR) - floatval($data['std_discountmodel_eur']);
                        $data['modstr_earnings_cop'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm']);
                        $data['modstr_earnings_trm_studio'] = floatval($trmEUR) - floatval($data['std_discountstudio_eur']);
                        $data['modstr_earnings_cop_studio'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm_studio']);
                    }

                    // guarda el ultimo valor en COP para mostrarlo en la vista
                    $response[$rtype]['data'][$d]['modstr_earnings_cop'] = $data['modstr_earnings_cop'];
                    $response[$rtype]['totalEarningsCop'] += $data['modstr_earnings_cop'];

                    // validamos los datos
                    $validator = Validator::make($data, [
                        'modacc_id' => 'required|exists:models_accounts,modacc_id',
                        'modstr_date' => 'required',
                        'modstr_period' => 'required|max:255',
                        'modstr_start_at' => 'nullable',
                        'modstr_finish_at' => 'nullable',
                        'modstr_price' => 'nullable',
                        'modstr_earnings_value' => 'required|min:0',
                        'modstr_earnings_trm' => 'nullable',
                        'modstr_earnings_percent' => 'nullable',
                        'modstr_earnings_tokens' => 'nullable|min:0',
                        'modstr_earnings_tokens_rate' => 'nullable|min:0',
                        'modstr_earnings_usd' => 'nullable|min:0',
                        'modstr_earnings_eur' => 'nullable|min:0',
                        'modstr_earnings_cop' => 'nullable|min:0',
                        'modstr_time' => 'nullable|min:0',
                        'modstr_source' => 'required|max:255',
                    ]);

                    if ($validator->fails()) {
                        Log::error(json_encode($data)); // throw row error
                        $response = array(
                            'code' => 'IMPORT_ERROR',
                            'position' => $data['row'],
                            'errors' => $validator->errors()
                        );
                        throw new \Exception(json_encode($response));
                    }

                    // create record
                    $record = ModelStream::create($data);
                }
            }
        }

        return $response;
    }

    /**
     * Populate models_streams from LiveJasmin API data
     * Called after successful sync from LiveJasmin microservice
     *
     * @param string $fromDate fecha inicio en formato Y-m-d
     * @param string $toDate fecha fin en formato Y-m-d
     * @return bool|null
     */
    public function populateStreamsFromLivejasminApi($fromDate, $toDate)
    {
        try {

            // Obtener el período actual de LiveJasmin usando las fechas específicas
            $period = PeriodController::retrieveOrCreatePeriodFromLivejasmin($fromDate, $toDate);

            if (!$period) {
                return null;
            }

            // Generar modstr_period basado en la fecha de inicio
            $modstr_period = date('Ymd_H', strtotime($fromDate));

            // Obtener TRM para conversión de USD a COP
            $trm_date = date('Y-m-d', strtotime($period->period_end_date . ' +1 day'));
            if (strtotime($trm_date) > strtotime(date('Y-m-d'))) {
                $trm_date = date('Y-m-d');
            }

            $exchangeRateController = new ExchangeRateController();
            $trmUSD = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'USD', $to = 'COP', $trm_date);

            // Obtener información sobre registros existentes para logging
            $existingStreams = DB::table('models_streams')
                ->where('modstr_period', $modstr_period)
                ->where('modstr_source', 'WEBSCRAPER_MODELO')
                ->where('period_id', $period->period_id)
                ->count();

            // Primero verificar cuántos registros hay en models_livejasmin_scores para este período
            $totalScoresCount = DB::table('models_livejasmin_scores')
                ->where('modlj_period_start', $fromDate)
                ->where('modlj_period_end', $toDate)
                ->count();

            // Buscar modelos LiveJasmin que tengan datos actualizados en el período
            // Cambiar lógica: obtener TODOS los modelos y luego decidir si crear o actualizar
            $livejasminScores = DB::select("
                SELECT
                    mls.modacc_id,
                    mls.modlj_earnings_usd,
                    mls.modlj_hours_connection,
                    mls.modlj_period_start,
                    mls.modlj_period_end,
                    ma.modacc_app,
                    sm.stdmod_id,
                    sm.std_id,
                    s.std_discountmodel_usd,
                    s.std_discountstudio_usd
                FROM models_livejasmin_scores mls
                INNER JOIN models_accounts ma ON ma.modacc_id = mls.modacc_id
                INNER JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
                INNER JOIN studios s ON s.std_id = sm.std_id
                WHERE mls.modlj_period_start = ?
                AND mls.modlj_period_end = ?
                AND ma.modacc_active = true
                AND ma.modacc_app LIKE 'LIVEJASMIN%'
            ", [$fromDate, $toDate]);

            Log::info('📋 LiveJasmin scores query completed', [
                'fromDate' => $fromDate,
                'toDate' => $toDate,
                'eligible_models_found' => count($livejasminScores),
                'total_scores_in_db' => $totalScoresCount
            ]);

            $createdCount = 0;
            $updatedCount = 0;

            if (empty($livejasminScores)) {
                Log::warning('⚠️ No eligible LiveJasmin models found for models_streams processing', [
                    'fromDate' => $fromDate,
                    'toDate' => $toDate,
                    'total_scores_in_db' => $totalScoresCount,
                    'period_id' => $period->period_id,
                    'possible_reasons' => [
                        'no_scores_in_db' => $totalScoresCount === 0 ? 'TRUE' : 'FALSE',
                        'inactive_accounts' => 'Check if model accounts are active',
                        'wrong_app_name' => 'Check if modacc_app contains LIVEJASMIN',
                        'join_issues' => 'Check if studios_models relationships exist'
                    ]
                ]);

                return true; // Return true even if no records to process (not an error)
            }

            Log::info('🎯 Processing LiveJasmin models for models_streams upsert (create/update)', [
                'models_to_process' => count($livejasminScores),
                'fromDate' => $fromDate,
                'toDate' => $toDate,
                'sample_model_data' => count($livejasminScores) > 0 ? [
                    'modacc_id' => $livejasminScores[0]->modacc_id,
                    'stdmod_id' => $livejasminScores[0]->stdmod_id,
                    'std_id' => $livejasminScores[0]->std_id,
                    'earnings_usd' => $livejasminScores[0]->modlj_earnings_usd
                ] : null
            ]);

            foreach ($livejasminScores as $score) {
                // Calcular valores de earnings y TRM
                $modstr_earnings_value = (float) $score->modlj_earnings_usd;
                $modstr_earnings_usd = (float) $score->modlj_earnings_usd;
                $modstr_time = (float) $score->modlj_hours_connection; // Ya viene en horas

                // Calcular TRM con descuentos del estudio
                $modstr_earnings_trm = floatval($trmUSD) - floatval($score->std_discountmodel_usd);
                $modstr_earnings_cop = $modstr_earnings_value * $modstr_earnings_trm;
                $modstr_earnings_trm_studio = floatval($trmUSD) - floatval($score->std_discountstudio_usd);
                $modstr_earnings_cop_studio = $modstr_earnings_value * $modstr_earnings_trm_studio;

                // Verificar si ya existe el registro
                $existingStream = ModelStream::where('modacc_id', $score->modacc_id)
                    ->where('modstr_period', $modstr_period)
                    ->where('modstr_source', 'WEBSCRAPER_MODELO')
                    ->where('period_id', $period->period_id)
                    ->first();

                $streamData = [
                    'modacc_id' => $score->modacc_id,
                    'modstr_date' => $fromDate,
                    'modstr_period' => $modstr_period,
                    'modstr_start_at' => null,
                    'modstr_finish_at' => null,
                    'modstr_price' => null,
                    'modstr_earnings_value' => $modstr_earnings_value,
                    'modstr_earnings_tokens' => null,
                    'modstr_earnings_tokens_rate' => null,
                    'modstr_earnings_usd' => $modstr_earnings_usd,
                    'modstr_earnings_eur' => null,
                    'modstr_earnings_trm' => $modstr_earnings_trm,
                    'modstr_earnings_cop' => $modstr_earnings_cop,
                    'modstr_earnings_trm_studio' => $modstr_earnings_trm_studio,
                    'modstr_earnings_cop_studio' => $modstr_earnings_cop_studio,
                    'modstr_time' => $modstr_time,
                    'modstr_source' => 'WEBSCRAPER_MODELO',
                    'period_id' => $period->period_id,
                    'stdmod_id' => $score->stdmod_id, // Relación con studios_models
                    'std_id' => $score->std_id        // Relación con studios
                ];

                if ($existingStream) {
                    // Actualizar registro existente
                    $existingStream->update($streamData);
                    $updatedCount++;
                    Log::debug('🔄 Updated existing models_streams record', [
                        'modacc_id' => $score->modacc_id,
                        'modstr_id' => $existingStream->modstr_id,
                        'added_stdmod_id' => $score->stdmod_id,
                        'added_std_id' => $score->std_id
                    ]);
                } else {
                    // Crear nuevo registro
                    $record = ModelStream::create($streamData);
                    if ($record) {
                        $createdCount++;
                        Log::debug('✅ Created new models_streams record', [
                            'modacc_id' => $score->modacc_id,
                            'modstr_id' => $record->modstr_id,
                            'stdmod_id' => $score->stdmod_id,
                            'std_id' => $score->std_id
                        ]);
                    }
                }
            }

            Log::info('✅ LiveJasmin streams processed successfully (upsert completed)', [
                'period' => "{$fromDate} to {$toDate}",
                'models_processed' => count($livejasminScores),
                'created_records' => $createdCount,
                'updated_records' => $updatedCount,
                'total_affected' => $createdCount + $updatedCount,
                'period_id' => $period->period_id,
                'success_rate' => count($livejasminScores) > 0 ? (($createdCount + $updatedCount) / count($livejasminScores) * 100) . '%' : '100%',
                'operation_summary' => [
                    'new_records' => $createdCount,
                    'updated_existing' => $updatedCount,
                    'added_stdmod_std_relations' => $updatedCount > 0 ? 'YES' : 'NO'
                ]
            ]);

            return true;
        } catch (Exception $e) {
            Log::error('Error populating streams from LiveJasmin API: ' . $e->getMessage(), [
                'fromDate' => $fromDate,
                'toDate' => $toDate,
                'exception' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    /**
     * Endpoint llamado por el scheduler de NestJS (ms-wscrap) para scraping de MASTER (Studios)
     */
    public function populateFromStudiosScheduled(Request $request) {
        try {
            \Log::info('[SCHEDULER] Encolando scraping de MASTER desde ms-wscrap');

            PopulateStreamsFromMasterJob::dispatch([
                'where' => [],
                'orWhere' => [],
                'whereRaw' => '1=1',
            ]);

            return response()->json([
                'status' => 'queued',
                'message' => 'Master scraping job dispatched',
                'queue' => 'scraping',
                'timestamp' => now()->toIso8601String(),
            ], 202);

        } catch (\Exception $e) {
            \Log::error('[SCHEDULER] Error en scraping de MASTER: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());

            return response()->json([
                'status' => 'error',
                'message' => 'Error dispatching master scraping job',
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 500);
        }
    }

    /**
     * Endpoint llamado por el scheduler de NestJS (ms-wscrap) para scraping de MODEL (Individual)
     */
    public function populateFromModelsScheduled(Request $request) {
        try {
            \Log::info('[SCHEDULER] Encolando scraping de MODEL desde ms-wscrap');

            PopulateStreamsFromModelsJob::dispatch([
                'where' => [],
                'orWhere' => [],
                'whereRaw' => '1=1',
            ]);

            return response()->json([
                'status' => 'queued',
                'message' => 'Model scraping job dispatched',
                'queue' => 'scraping',
                'timestamp' => now()->toIso8601String(),
            ], 202);

        } catch (\Exception $e) {
            \Log::error('[SCHEDULER] Error en scraping de MODEL: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());

            return response()->json([
                'status' => 'error',
                'message' => 'Error dispatching model scraping job',
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ], 500);
        }
    }

    /**
     * Populate streams from MASTER accounts using ms-wscrap microservice (HTTP)
     *
     * Este método reemplaza el uso de shell_exec con llamadas HTTP al microservicio ms-wscrap
     * siguiendo la arquitectura moderna de microservicios.
     *
     * @param array $args Filtros para query de cuentas
     * @return void
     */
    //este metodo si se ejecuta?
    public function populateStreamsFromMasterWithMS($args = array()) {
        // default
        $args['where'] = !empty($args['where']) ? $args['where'] : [];
        $args['orWhere'] = !empty($args['orWhere']) ? $args['orWhere'] : [];
        $args['whereRaw'] = !empty($args['whereRaw']) ? $args['whereRaw'] : '1=1';

        try {
            $modstr_date = date('Y-m-d');
            $modstr_period = date('Ymd_H');
            $period = $this->retrieveOrCreatePeriod($modstr_date);

            // Obtener periods para las fechas de scraping
            $reportController = new ReportController();
            $periods = $reportController->getStudioPeriodsArray();
            $startDate = (!empty($periods) && isset($periods[0])) ? $periods[0]['since'] : date('Y-m-d');
            $endDate = (!empty($periods) && isset($periods[0])) ? $periods[0]['until'] : date('Y-m-d');

            // fecha del trm es la del fin del periodo +1 dia
            $trm_date = date('Y-m-d', strtotime($period->period_end_date . ' +1 day'));
            if (strtotime($trm_date) > strtotime(date('Y-m-d'))) {
                $trm_date = date('Y-m-d');
            }

            // Obtener el trm
            $exchangeRateController = new ExchangeRateController();
            $trmUSD = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'USD', $to = 'COP', $trm_date);
            $trmEUR = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'EUR', $to = 'COP', $trm_date);

            // Obtener URL del microservicio desde .env
            $msWscrapUrl = env('MS_WSCRAP_URL', 'http://localhost:3002');

            // Query studio accounts (MASTER)
            $records = StudioAccount::with(['studio'])
                ->where('stdacc_active', true)
                ->where($args['where'])
                ->orWhere($args['orWhere'])
                ->whereRaw($args['whereRaw'])
                ->whereNull('deleted_at')
                ->whereRaw("stdacc_id NOT IN (SELECT stdacc_id FROM models_streams WHERE modstr_period = '$modstr_period' AND modstr_source = 'WEBSCRAPER_MS')")
                ->whereIn('stdacc_app', [
                    // 'LIVEJASMIN',
                    // 'LIVEJASMIN(2)',
                    // 'FLIRT4FREE',
                    // 'STREAMATE',
                    // 'MYFREECAMS',
                    // 'CAM4',
                    // 'IMLIVE',
                    // 'STREAMRAY',
                    // 'XHAMSTER',
                    // 'XLOVECAM',
                    'STRIPCHAT',
                    'CAMSODA',
                    'ONLYFANS',
                    'BONGACAMS'
                    // Agregar más plataformas conforme se implementen en ms-wscrap
                ])
                ->orderByRaw("(CASE WHEN stdacc_fail_count IS NULL THEN 0 ELSE stdacc_fail_count END) asc")
                ->orderBy('stdacc_last_search_at', 'asc')
                ->get();

            \Log::info("[MS-WSCRAP] Procesando " . count($records) . " cuentas MASTER");

            // Process each studio account
            foreach ($records as $studioacc) {
                $studioacc->stdacc_last_search_at = date('Y-m-d H:i:s');
                $studioacc->stdacc_fail_message = null;
                $studioacc->save();

                $app = $studioacc->stdacc_app;
                $app = preg_replace("/(.*)\(.*\)/", "$1", $app); // LIVEJASMIN(2) >> LIVEJASMIN

                try {
                    // Stripchat MASTER: llamar ms-wscrap por modelo usando API-Key
                    if ($app === 'STRIPCHAT') {
                        if (empty($studioacc->stdacc_apikey)) {
                            \Log::warning("[MS-WSCRAP] Stripchat MASTER sin API-Key para {$studioacc->stdacc_username}");
                            $studioacc->stdacc_last_result_at = date('Y-m-d H:i:s');
                            $studioacc->stdacc_fail_message = json_encode([
                                'error' => 'Missing API key',
                                'status' => 400,
                            ]);
                            $studioacc->stdacc_fail_count = intval($studioacc->stdacc_fail_count) + 1;
                            $studioacc->save();
                            continue;
                        }

                        $modelAccounts = ModelAccount::where('modacc_active', true)
                            ->whereRaw("modacc_app LIKE 'STRIPCHAT%'")
                            ->whereHas('studioModel', function ($query) use ($studioacc) {
                                $query->where('std_id', $studioacc->std_id)
                                    ->whereNull('deleted_at');
                            })
                            ->whereNull('models_accounts.deleted_at')
                            ->get();

                        foreach ($modelAccounts as $modelAccount) {
                            $payload = [
                                'platform' => $app,
                                'username' => $studioacc->stdacc_username,
                                'apiKey' => $studioacc->stdacc_apikey,
                                'modelUsername' => $modelAccount->modacc_username,
                                'accountType' => 'master',
                                'startDate' => $startDate,
                                'endDate' => $endDate,
                            ];

                            $response = \Http::timeout(600)->post($msWscrapUrl . '/scraping/earnings', $payload);

                            if ($response->successful()) {
                                $responseData = $response->json();

                                if (isset($responseData['models']) && is_array($responseData['models'])) {
                                    \Log::info("[MS-WSCRAP] Stripchat API ok para {$studioacc->stdacc_username} / modelo {$modelAccount->modacc_username}");

                                    $studioacc->stdacc_last_result_at = date('Y-m-d H:i:s');
                                    $studioacc->stdacc_fail_count = 0;
                                    $studioacc->save();

                                    foreach ($responseData['models'] as $modelData) {
                                        if (isset($modelData['account']) && isset($modelData['earningValue'])) {
                                            // Buscar ModelAccount (username o payment_username)
                                            $targetModel = ModelAccount::whereRaw("modacc_username ILIKE '" . $modelData['account'] . "'")
                                                ->whereRaw("modacc_app LIKE '" . $app . "%'")
                                                ->first();

                                            if (empty($targetModel)) {
                                                $targetModel = ModelAccount::whereRaw("modacc_payment_username ILIKE '" . $modelData['account'] . "'")
                                                    ->whereRaw("modacc_app LIKE '" . $app . "%'")
                                                    ->first();
                                            }

                                            if (!empty($targetModel)) {
                                                if ($targetModel->modacc_active == false) {
                                                    $targetModel->update(['modacc_active' => true]);
                                                }

                                                $modstr_earnings_trm = null;
                                                $earningsCop = null;
                                                $modstr_earnings_trm_studio = null;
                                                $modstr_earnings_cop_studio = null;

                                                if (!empty($modelData['earningsUsd'])) {
                                                    $modstr_earnings_trm = floatval($trmUSD) - floatval($studioacc->studio->std_discountmodel_usd);
                                                    $earningsCop = floatval($modelData['earningsUsd']) * floatval($modstr_earnings_trm);
                                                    $modstr_earnings_trm_studio = floatval($trmUSD) - floatval($studioacc->studio->std_discountstudio_usd);
                                                    $modstr_earnings_cop_studio = floatval($modelData['earningsUsd']) * floatval($modstr_earnings_trm_studio);
                                                }

                                                ModelStream::create([
                                                    'modacc_id' => $targetModel->modacc_id,
                                                    'modstr_date' => $modstr_date,
                                                    'modstr_period' => $modstr_period,
                                                    'modstr_earnings_value' => (float) $modelData['earningValue'],
                                                    'modstr_earnings_usd' => isset($modelData['earningsUsd']) ? (float) $modelData['earningsUsd'] : null,
                                                    'modstr_earnings_trm' => $modstr_earnings_trm,
                                                    'modstr_earnings_cop' => $earningsCop,
                                                    'modstr_earnings_trm_studio' => $modstr_earnings_trm_studio,
                                                    'modstr_earnings_cop_studio' => $modstr_earnings_cop_studio,
                                                    'modstr_time' => isset($modelData['totalTime']) ? $modelData['totalTime'] : null,
                                                    'modstr_source' => 'WEBSCRAPER_MS',
                                                    'period_id' => $period->period_id,
                                                    'stdacc_id' => $studioacc->stdacc_id,
                                                ]);
                                            }
                                        }
                                    }
                                }
                            } else {
                                $studioacc->stdacc_last_result_at = date('Y-m-d H:i:s');
                                $studioacc->stdacc_fail_message = json_encode([
                                    'error' => 'HTTP error',
                                    'status' => $response->status(),
                                    'body' => $response->body()
                                ]);
                                $studioacc->stdacc_fail_count = intval($studioacc->stdacc_fail_count) + 1;
                                $studioacc->save();

                                \Log::error("[MS-WSCRAP] Error HTTP Stripchat para {$studioacc->stdacc_username}: " . $response->status());
                            }
                        }

                        continue;
                    }

                    // Preparar payload para el microservicio
                    $payload = [
                        'platform' => $app,
                        'username' => $studioacc->stdacc_username,
                        'email' => $studioacc->stdacc_mail, // Email para plataformas que lo requieren (ej: LiveJasmin)
                        'password' => $studioacc->stdacc_password,
                        'accountType' => 'master',
                        'startDate' => $startDate,
                        'endDate' => $endDate,
                    ];

                    // Llamada HTTP al microservicio ms-wscrap
                    $response = \Http::timeout(600)->post($msWscrapUrl . '/scraping/earnings', $payload);

                    if ($response->successful()) {
                        $responseData = $response->json();

                        // Verificar si es respuesta de MASTER (tiene 'models')
                        if (isset($responseData['models']) && is_array($responseData['models'])) {
                            \Log::info("[MS-WSCRAP] Scraping exitoso para {$studioacc->stdacc_username}: " . count($responseData['models']) . " modelos");

                            $studioacc->stdacc_last_result_at = date('Y-m-d H:i:s');
                            $studioacc->stdacc_fail_count = 0;
                            $studioacc->save();

                            // Procesar cada modelo del response
                            foreach ($responseData['models'] as $modelData) {
                                if (isset($modelData['account']) && isset($modelData['earningValue'])) {
                                    // Buscar ModelAccount
                                    $modelAccount = ModelAccount::whereRaw("modacc_username ILIKE '" . $modelData['account'] . "'")
                                        ->whereRaw("modacc_app LIKE '" . $app . "%'")
                                        ->first();

                                    if (empty($modelAccount)) {
                                        $modelAccount = ModelAccount::whereRaw("modacc_payment_username ILIKE '" . $modelData['account'] . "'")
                                            ->whereRaw("modacc_app LIKE '" . $app . "%'")
                                            ->first();
                                    }

                                    if (!empty($modelAccount)) {
                                        // Reactivar si está inactiva
                                        if ($modelAccount->modacc_active == false) {
                                            $modelAccount->update(['modacc_active' => true]);
                                        }

                                        // Calcular TRM y conversiones
                                        $modstr_earnings_trm = null;
                                        $earningsCop = null;
                                        $modstr_earnings_trm_studio = null;
                                        $modstr_earnings_cop_studio = null;

                                        if (!empty($modelData['earningsUsd'])) {
                                            $modstr_earnings_trm = floatval($trmUSD) - floatval($studioacc->studio->std_discountmodel_usd);
                                            $earningsCop = floatval($modelData['earningsUsd']) * floatval($modstr_earnings_trm);
                                            $modstr_earnings_trm_studio = floatval($trmUSD) - floatval($studioacc->studio->std_discountstudio_usd);
                                            $modstr_earnings_cop_studio = floatval($modelData['earningsUsd']) * floatval($modstr_earnings_trm_studio);
                                        }

                                        // Crear registro en models_streams
                                        ModelStream::create([
                                            'modacc_id' => $modelAccount->modacc_id,
                                            'modstr_date' => $modstr_date,
                                            'modstr_period' => $modstr_period,
                                            'modstr_earnings_value' => (float) $modelData['earningValue'],
                                            'modstr_earnings_usd' => isset($modelData['earningsUsd']) ? (float) $modelData['earningsUsd'] : null,
                                            'modstr_earnings_trm' => $modstr_earnings_trm,
                                            'modstr_earnings_cop' => $earningsCop,
                                            'modstr_earnings_trm_studio' => $modstr_earnings_trm_studio,
                                            'modstr_earnings_cop_studio' => $modstr_earnings_cop_studio,
                                            'modstr_time' => isset($modelData['totalTime']) ? $modelData['totalTime'] : null,
                                            'modstr_source' => 'WEBSCRAPER_MS',
                                            'period_id' => $period->period_id,
                                            'stdacc_id' => $studioacc->stdacc_id,
                                        ]);
                                    }
                                }
                            }
                        }
                    } else {
                        // Error en el response del microservicio
                        $studioacc->stdacc_last_result_at = date('Y-m-d H:i:s');
                        $studioacc->stdacc_fail_message = json_encode([
                            'error' => 'HTTP error',
                            'status' => $response->status(),
                            'body' => $response->body()
                        ]);
                        $studioacc->stdacc_fail_count = intval($studioacc->stdacc_fail_count) + 1;
                        $studioacc->save();

                        \Log::error("[MS-WSCRAP] Error HTTP para {$studioacc->stdacc_username}: " . $response->status());
                    }

                } catch (\Exception $e) {
                    // Error en la llamada al microservicio
                    $studioacc->stdacc_last_result_at = date('Y-m-d H:i:s');
                    $studioacc->stdacc_fail_message = json_encode([
                        'error' => 'Exception',
                        'message' => $e->getMessage()
                    ]);
                    $studioacc->stdacc_fail_count = intval($studioacc->stdacc_fail_count) + 1;
                    $studioacc->save();

                    \Log::error("[MS-WSCRAP] Exception para {$studioacc->stdacc_username}: " . $e->getMessage());
                }
            }

        } catch (\Exception $e) {
            \Log::error('[MS-WSCRAP] Error general en populateStreamsFromMasterWithMS: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Populate streams from MODEL accounts using ms-wscrap microservice (HTTP)
     *
     * Este método reemplaza el uso de shell_exec con llamadas HTTP al microservicio ms-wscrap
     * para cuentas MODEL (modelos individuales).
     *
     * @param array $args Filtros para query de cuentas
     * @return void
     */
    //este metodo si se ejecuta?
    public function populateStreamsFromModelsWithMS($args = array()) {
        // default
        $args['where'] = !empty($args['where']) ? $args['where'] : [];
        $args['orWhere'] = !empty($args['orWhere']) ? $args['orWhere'] : [];
        $args['whereRaw'] = !empty($args['whereRaw']) ? $args['whereRaw'] : '1=1';

        try {
            $modstr_date = date('Y-m-d');
            $modstr_period = date('Ymd_H');
            $period = $this->retrieveOrCreatePeriod($modstr_date);

            // Obtener periods para las fechas de scraping
            $reportController = new ReportController();
            $periods = $reportController->getStudioPeriodsArray();
            $startDate = (!empty($periods) && isset($periods[0])) ? $periods[0]['since'] : date('Y-m-d');
            $endDate = (!empty($periods) && isset($periods[0])) ? $periods[0]['until'] : date('Y-m-d');

            // fecha del trm es la del fin del periodo +1 dia
            $trm_date = date('Y-m-d', strtotime($period->period_end_date . ' +1 day'));
            if (strtotime($trm_date) > strtotime(date('Y-m-d'))) {
                $trm_date = date('Y-m-d');
            }

            // Obtener el trm
            $exchangeRateController = new ExchangeRateController();
            $trmUSD = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'USD', $to = 'COP', $trm_date);
            $trmEUR = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'EUR', $to = 'COP', $trm_date);

            // Obtener URL del microservicio desde .env
            $msWscrapUrl = env('MS_WSCRAP_URL', 'http://localhost:3002');

            // Query model accounts (MODEL - individual)
            $records = ModelAccount::with(['studioModel', 'studioModel.studio'])
                ->where('modacc_active', true)
                ->where($args['where'])
                ->orWhere($args['orWhere'])
                ->whereRaw($args['whereRaw'])
                ->whereNull('deleted_at')
                ->whereRaw("modacc_id NOT IN (SELECT modacc_id FROM models_streams WHERE modstr_period = '$modstr_period' AND modstr_source = 'WEBSCRAPER_MS')")
                ->whereIn('modacc_app', [
                    // 'LIVEJASMIN',
                    // 'LIVEJASMIN(2)',
                    // 'FLIRT4FREE',
                    // 'STREAMATE',
                    // 'MYFREECAMS',
                    // 'CAM4',
                    // 'IMLIVE',
                    // 'STREAMRAY',
                    // 'XHAMSTER',
                    // 'XLOVECAM',
                    'STRIPCHAT',
                    'CAMSODA',
                    'ONLYFANS',
                    'BONGACAMS'
                    // Agregar más plataformas conforme se implementen en ms-wscrap
                ])
                ->orderByRaw("(CASE WHEN modacc_fail_count IS NULL THEN 0 ELSE modacc_fail_count END) asc")
                ->orderBy('modacc_last_search_at', 'asc')
                ->limit(50) // Limitar cantidad de modelos por batch
                ->get();

            \Log::info("[MS-WSCRAP] Procesando " . count($records) . " cuentas MODEL");

            // Process each model account
            foreach ($records as $modelAccount) {
                $modelAccount->modacc_last_search_at = date('Y-m-d H:i:s');
                $modelAccount->modacc_fail_message = null;
                $modelAccount->save();

                $app = $modelAccount->modacc_app;
                $app = preg_replace("/(.*)\(.*\)/", "$1", $app); // LIVEJASMIN(2) >> LIVEJASMIN

                try {
                    // Preparar payload para el microservicio
                    $payload = [
                        'platform' => $app,
                        'username' => $modelAccount->modacc_username,
                        'email' => $modelAccount->modacc_mail, // Email para plataformas que lo requieren (ej: LiveJasmin)
                        'password' => $modelAccount->modacc_password,
                        'accountType' => 'model',
                        'startDate' => $startDate,
                        'endDate' => $endDate,
                    ];

                    // Llamada HTTP al microservicio ms-wscrap
                    $response = \Http::timeout(600)->post($msWscrapUrl . '/scraping/earnings', $payload);

                    if ($response->successful()) {
                        $responseData = $response->json();

                        // Verificar si es respuesta de MODEL (tiene 'earningValue' directamente)
                        if (isset($responseData['earningValue'])) {
                            \Log::info("[MS-WSCRAP] Scraping exitoso para {$modelAccount->modacc_username}: \${$responseData['earningValue']}");

                            $modelAccount->modacc_last_result_at = date('Y-m-d H:i:s');
                            $modelAccount->modacc_fail_count = 0;
                            $modelAccount->save();

                            // Reactivar si está inactiva
                            if ($modelAccount->modacc_active == false) {
                                $modelAccount->update(['modacc_active' => true]);
                            }

                            // Calcular TRM y conversiones
                            $modstr_earnings_trm = null;
                            $earningsCop = null;
                            $modstr_earnings_trm_studio = null;
                            $modstr_earnings_cop_studio = null;

                            // Buscar studio asociado para descuentos
                            $studio = $modelAccount->studioModel && $modelAccount->studioModel->studio
                                ? $modelAccount->studioModel->studio
                                : null;

                            if (!empty($responseData['earningsUsd'])) {
                                if ($studio) {
                                    $modstr_earnings_trm = floatval($trmUSD) - floatval($studio->std_discountmodel_usd);
                                    $modstr_earnings_trm_studio = floatval($trmUSD) - floatval($studio->std_discountstudio_usd);
                                } else {
                                    $modstr_earnings_trm = floatval($trmUSD);
                                    $modstr_earnings_trm_studio = floatval($trmUSD);
                                }
                                $earningsCop = floatval($responseData['earningsUsd']) * floatval($modstr_earnings_trm);
                                $modstr_earnings_cop_studio = floatval($responseData['earningsUsd']) * floatval($modstr_earnings_trm_studio);
                            }

                            // Crear registro en models_streams
                            ModelStream::create([
                                'modacc_id' => $modelAccount->modacc_id,
                                'modstr_date' => $modstr_date,
                                'modstr_period' => $modstr_period,
                                'modstr_earnings_value' => (float) $responseData['earningValue'],
                                'modstr_earnings_usd' => isset($responseData['earningsUsd']) ? (float) $responseData['earningsUsd'] : null,
                                'modstr_earnings_trm' => $modstr_earnings_trm,
                                'modstr_earnings_cop' => $earningsCop,
                                'modstr_earnings_trm_studio' => $modstr_earnings_trm_studio,
                                'modstr_earnings_cop_studio' => $modstr_earnings_cop_studio,
                                'modstr_time' => isset($responseData['totalTime']) ? $responseData['totalTime'] : null,
                                'modstr_source' => 'WEBSCRAPER_MS',
                                'period_id' => $period->period_id,
                            ]);
                        }
                    } else {
                        // Error en el response del microservicio
                        $modelAccount->modacc_last_result_at = date('Y-m-d H:i:s');
                        $modelAccount->modacc_fail_message = json_encode([
                            'error' => 'HTTP error',
                            'status' => $response->status(),
                            'body' => $response->body()
                        ]);
                        $modelAccount->modacc_fail_count = intval($modelAccount->modacc_fail_count) + 1;
                        $modelAccount->save();

                        \Log::error("[MS-WSCRAP] Error HTTP para {$modelAccount->modacc_username}: " . $response->status());
                    }

                } catch (\Exception $e) {
                    // Error en la llamada al microservicio
                    $modelAccount->modacc_last_result_at = date('Y-m-d H:i:s');
                    $modelAccount->modacc_fail_message = json_encode([
                        'error' => 'Exception',
                        'message' => $e->getMessage()
                    ]);
                    $modelAccount->modacc_fail_count = intval($modelAccount->modacc_fail_count) + 1;
                    $modelAccount->save();

                    \Log::error("[MS-WSCRAP] Exception para {$modelAccount->modacc_username}: " . $e->getMessage());
                }
            }

        } catch (\Exception $e) {
            \Log::error('[MS-WSCRAP] Error general en populateStreamsFromModelsWithMS: ' . $e->getMessage());
            throw $e;
        }
    }
}
