<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Exception;

use App\Library\HelperController;
use App\Library\LogController;
use App\Requests\LoginDto;
use App\Models\User;
use App\Models\Profile;
use App\Models\ModelAccount;
use App\Models\StudioModel;
use App\Models\ModelLivejasminScore;
use App\Services\LivejasminService;

class ModelAccountController extends Controller
{
    private $helper;
    private $log;
    private $livejasminService;

    /**
     * Create a new instance.
     *
     * @return void
     */
    public function __construct(?LivejasminService $livejasminService = null)
    {
        $this->helper = new HelperController();
        $this->log = new LogController();
        $this->livejasminService = $livejasminService ?? new LivejasminService();
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
                'stdmod_id' => 'required|exists:studios_models,stdmod_id',
                'modacc_app' => 'required|max:255',
                'modacc_username' => 'required|max:255',
                'modacc_password' => 'required|max:255',
                'modacc_state' => 'nullable|max:255',
                'modacc_active' => 'required',
                'modacc_last_search_at' => 'nullable',
                'modacc_last_result_at' => 'nullable',
                'modacc_fail_message' => 'nullable',
                'modacc_fail_count' => 'nullable',
                'modacc_payment_username' => 'nullable|max:255',
                'modacc_mail' => 'required|max:150',
                'modacc_screen_name' => 'nullable|max:255'
            ]);
            $repeated_account = ModelAccount::whereNull('deleted_at')
            ->where('modacc_app', $data['modacc_app'])
            ->whereRaw("modacc_username ILIKE '".$data['modacc_username']."'")
            ->count();
            if ($repeated_account != 0) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'EXISTING_ACCOUNT',
                    'message' => 'Ya existe una cuenta para la aplicación seleccionada que tiene el mismo nombre de usuario digitado',
                ], 400);
            }
            // create record
            $record = ModelAccount::create([
                'stdmod_id' => (isset($data['stdmod_id'])) ? $data['stdmod_id'] : null,
                'modacc_app' => (isset($data['modacc_app'])) ? $data['modacc_app'] : null,
                'modacc_username' => (isset($data['modacc_username'])) ? $data['modacc_username'] : null,
                'modacc_password' => (isset($data['modacc_password'])) ? $data['modacc_password'] : null,
                'modacc_state' => (isset($data['modacc_state'])) ? $data['modacc_state'] : '',
                'modacc_active' => (isset($data['modacc_active'])) ? $data['modacc_active'] : null,
                'modacc_last_search_at' => (isset($data['modacc_last_search_at'])) ? $data['modacc_last_search_at'] : null,
                'modacc_last_result_at' => (isset($data['modacc_last_result_at'])) ? $data['modacc_last_result_at'] : null,
                'modacc_fail_message' => (isset($data['modacc_fail_message'])) ? $data['modacc_fail_message'] : null,
                'modacc_fail_count' => (isset($data['modacc_fail_count'])) ? $data['modacc_fail_count'] : null,
                'modacc_payment_username' => (isset($data['modacc_payment_username'])) ? $data['modacc_payment_username'] : null,
                'modacc_mail' => (isset($data['modacc_mail'])) ? $data['modacc_mail'] : null,
                'modacc_linkacc' => (isset($data['modacc_linkacc'])) ? $data['modacc_linkacc'] : null,
            ]);

            // Si es una cuenta de LiveJasmin y tiene screen_name, crear un registro en models_livejasmin_scores
            if ($record && isset($data['modacc_app']) && $data['modacc_app'] == 'LIVEJASMIN' && isset($data['modacc_screen_name']) && !empty($data['modacc_screen_name'])) {
                // Obtener el período actual de LiveJasmin mediante la API
                $period = $this->livejasminService->getCurrentPeriod();

                // Si no se pudo obtener el período de la API, usar fechas por defecto
                if (!$period) {
                    $now = Carbon::now();
                    $period = [
                        'start_date' => $now->copy()->startOfMonth()->format('Y-m-d'),
                        'end_date' => $now->copy()->endOfMonth()->format('Y-m-d')
                    ];
                }

                // Crear registro en models_livejasmin_scores
                ModelLivejasminScore::create([
                    'modacc_id' => $record->modacc_id,
                    'modlj_screen_name' => $data['modacc_screen_name'],
                    'modlj_period_start' => $period['start_date'],
                    'modlj_period_end' => $period['end_date'],
                    'modlj_hours_connection' => 0,
                    'modlj_hours_preview' => 0,
                    'modlj_score_traffic' => 0,
                    'modlj_score_conversion' => 0,
                    'modlj_score_engagement' => 0,
                    'modlj_offers_initiated' => 0,
                    'modlj_new_members' => 0,
                    'modlj_average_hour' => 0,
                    'modlj_earnings_usd' => 0,
                    'modlj_bonus_5_percent' => 0,
                    'modlj_bonus_10_percent' => 0,
                ]);
            }

            if ($record) {
                $this->log::storeLog($uAuth, 'models_accounts', $record->modacc_id, 'INSERT', null, $record, $request->ip);
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
            $record = ModelAccount::with(['studioModel'])
                ->where($data['where'])
                ->orWhere($data['orWhere'])
                ->whereRaw($data['whereRaw'])
                ->whereNull('deleted_at')
                ->orderBy('modacc_id', 'desc');

            $record = $this->applyTenantRelationScope($record, $request, 'studioModel')->get();

            // Si hay registros y alguno es de LiveJasmin, agregar el screen_name de models_livejasmin_scores
            foreach ($record as $modelAccount) {
                if ($modelAccount->modacc_app == 'LIVEJASMIN') {
                    $ljScore = ModelLivejasminScore::where('modacc_id', $modelAccount->modacc_id)
                        ->orderBy('created_at', 'desc')
                        ->first();

                    $modelAccount->modacc_screen_name = $ljScore ? $ljScore->modlj_screen_name : null;
                }
            }

            return response()->json(['status' => 'success', 'data' => $record], 200);
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

            $record = ModelAccount::select('modacc_app', 'modacc_username', 'modacc_id')
            ->join('studios_models AS sm', 'sm.stdmod_id', 'models_accounts.stdmod_id')
            ->join('studios AS s', 's.std_id', 'sm.std_id')
            ->where('sm.user_id_model', $user_id)
            ->where(function ($query) use ($uAuth) {
                if ($uAuth->prof_id == 2) {
                    $query->where('s.user_id_owner', $uAuth->user_id);
                }
            })
            ->whereNull('models_accounts.deleted_at')
            ->orderBy('modacc_id', 'desc');

            $record = $this->applyTenantScope($record, $request, 's.std_id')->get();
            return response()->json(['status' => 'success', 'data' => $record], 200);
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
            $uAuth = $request->user();

            // validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            $record = ModelAccount::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'stdmod_id' => 'required|exists:studios_models,stdmod_id',
                'modacc_username' => 'required|max:255',
                'modacc_password' => 'required|max:255',
                'modacc_state' => 'nullable|max:255',
                'modacc_active' => 'required',
                'modacc_last_search_at' => 'nullable',
                'modacc_last_result_at' => 'nullable',
                'modacc_fail_message' => 'nullable',
                'modacc_fail_count' => 'nullable',
                'modacc_payment_username' => 'nullable|max:255',
                'modacc_mail' => 'required|max:150',
                'modacc_screen_name' => 'nullable|max:255'
            ]);
            $repeated_account = ModelAccount::whereNull('deleted_at')
            ->where('modacc_app', $record->modacc_app)
            ->whereRaw("modacc_username ILIKE '".$data['modacc_username']."'")
            ->where('modacc_id', '!=', $record->modacc_id)
            ->count();
            if ($repeated_account != 0) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'EXISTING_ACCOUNT',
                    'message' => 'Ya existe una cuenta para la aplicación seleccionada que tiene el mismo nombre de usuario digitado',
                ], 400);
            }
            $before = ModelAccount::findOrFail($id);
            $record->update([
                'stdmod_id' => (isset($data['stdmod_id'])) ? $data['stdmod_id'] : null,
                'modacc_username' => (isset($data['modacc_username'])) ? $data['modacc_username'] : null,
                'modacc_password' => (isset($data['modacc_password'])) ? $data['modacc_password'] : null,
                'modacc_state' => (isset($data['modacc_state'])) ? $data['modacc_state'] : '',
                'modacc_active' => (isset($data['modacc_active'])) ? $data['modacc_active'] : null,
                'modacc_last_search_at' => (isset($data['modacc_last_search_at'])) ? $data['modacc_last_search_at'] : null,
                'modacc_last_result_at' => (isset($data['modacc_last_result_at'])) ? $data['modacc_last_result_at'] : null,
                'modacc_fail_message' => (isset($data['modacc_fail_message'])) ? $data['modacc_fail_message'] : null,
                'modacc_fail_count' => (isset($data['modacc_fail_count'])) ? $data['modacc_fail_count'] : null,
                'modacc_linkacc' => (isset($data['modacc_linkacc'])) ? $data['modacc_linkacc'] : null,
                'modacc_payment_username' => (isset($data['modacc_payment_username'])) ? $data['modacc_payment_username'] : null,
                'modacc_mail' => (isset($data['modacc_mail'])) ? $data['modacc_mail'] : null
            ]);

            // Si es una cuenta de LiveJasmin y tiene screen_name, actualizar o crear registro en models_livejasmin_scores
            if ($record && $record->modacc_app == 'LIVEJASMIN' && isset($data['modacc_screen_name']) && !empty($data['modacc_screen_name'])) {
                // Obtener el período actual mediante la API
                $period = $this->livejasminService->getCurrentPeriod();

                // Si no se pudo obtener el período de la API, usar fechas por defecto
                if (!$period) {
                    $now = Carbon::now();
                    $period = [
                        'start_date' => $now->copy()->startOfMonth()->format('Y-m-d'),
                        'end_date' => $now->copy()->endOfMonth()->format('Y-m-d')
                    ];
                }

                // Buscar registro existente o crear uno nuevo
                $ljScore = ModelLivejasminScore::where('modacc_id', $record->modacc_id)
                    ->orderBy('created_at', 'desc')
                    ->first();

                if ($ljScore) {
                    // Actualizar registro existente
                    $ljScore->update([
                        'modlj_screen_name' => $data['modacc_screen_name']
                    ]);
                } else {
                    // Crear nuevo registro
                    ModelLivejasminScore::create([
                        'modacc_id' => $record->modacc_id,
                        'modlj_screen_name' => $data['modacc_screen_name'],
                        'modlj_period_start' => $period['start_date'],
                        'modlj_period_end' => $period['end_date'],
                        'modlj_hours_connection' => 0,
                        'modlj_hours_preview' => 0,
                        'modlj_score_traffic' => 0,
                        'modlj_score_conversion' => 0,
                        'modlj_score_engagement' => 0,
                        'modlj_offers_initiated' => 0,
                        'modlj_new_members' => 0,
                        'modlj_average_hour' => 0,
                        'modlj_earnings_usd' => 0,
                        'modlj_bonus_5_percent' => 0,
                        'modlj_bonus_10_percent' => 0,
                    ]);
                }
            }

            if ($record) {
                $this->log::storeLog($uAuth, 'models_accounts', $record->modacc_id, 'UPDATE', $before, $record, $request->ip);

                return response()->json(['status' => 'success', 'data' => $record->modacc_id], 200);
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
                    'exists:models_accounts,modacc_id' => '',
                    'unique:models_streams,modacc_id' => 'El registro está asociado a "Streams".',
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = ModelAccount::findOrFail($id);
            $before = ModelAccount::findOrFail($id);
            // $record->update([
            //     'deleted_at' => new DateTime()
            // ]);
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'models_accounts', $record->modacc_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->modacc_id], 200);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Active the specified resource from storage.
     *
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
    public function active(Request $request, $id)
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

            $request['id'] = $id;

            $this->validate($request, [
                'id' => 'required|integer|exists:models_accounts,modacc_id'
            ]);
            $record = ModelAccount::findOrFail($id);
            $before = ModelAccount::findOrFail($id);
            $record->update([
                'modacc_active' => true,
                'last_activation_at' => now()
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'models_accounts', $record->user_id, 'UPDATE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->user_id], 200);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Inactive the specified resource from storage.
     *
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
    public function inactive(Request $request, $id)
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

            $request['id'] = $id;

            $this->validate($request, [
                'id' => 'required|integer|exists:models_accounts,modacc_id'
            ]);
            $record = ModelAccount::findOrFail($id);
            $before = ModelAccount::findOrFail($id);
            $record->update([
                'modacc_active' => false
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'models_accounts', $record->user_id, 'UPDATE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->user_id], 200);
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
        try {
            //////////
            // DATA //
            //////////
            $uAuth = $request->user();
            $data = $this->helper::generateConditions($request);

            // profile = studio
            if (in_array($uAuth->prof_id, [Profile::ESTUDIO])) {
                $records = DB::select("SELECT std_id FROM studios WHERE user_id_owner = '".$uAuth->user_id."'");
                $std_ids = array();
                foreach ($records as $row) {
                    $std_ids[] = $row->std_id;
                }
                if (!empty($std_ids)) {
                    $std_ids = implode(',', $std_ids);
                    $data['whereRaw'].= " AND stdmod_id IN (SELECT stdmod_id FROM studios_models WHERE std_id IN ('$std_ids'))";
                }
            }

            $records = ModelAccount::with(['studioModel', 'studioModel.studio', 'studioModel.userModel'])
                ->where($data['where'])
                ->orWhere($data['orWhere'])
                ->whereRaw($data['whereRaw'])
                ->whereNull('deleted_at')
                ->orderBy('modacc_id', 'desc')
                ->get();

            ////////////
            // EXPORT //
            ////////////
            // redirect output to client browser
            $fileName = 'models_accounts_export.xlsx';
            header("Content-type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            header('Content-Disposition: attachment;filename="'.$fileName.'"');
            header('Cache-Control: max-age=0');
            header("Pragma: no-cache");
            header("Expires: 0");

            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // $header is an array containing column headers
            $header = [
                array(
                    'ID',
                    'ESTUDIO',
                    'CC MODELO',
                    'NOMBRE MODELO',
                    'APLICACIÓN',
                    'NOMBRE DE USUARIO',
                    'PSEUDÓNIMO DE PAGO',
                    //'CONTRASEÑA',
                    'ACTIVO',
                    'FECHA CREACIÓN',
                )
            ];

            // Si es admin >> muestra el detalle de la ejecucion de los webscraper
            if ($uAuth->prof_id == Profile::ADMIN) {
                array_push(
                    $header[count($header) - 1],
                    'FECHA ÚLTIMA CONSULTA',
                    'FECHA DE ÚLTIMOS RESULTADOS',
                    'MENSAJE DE ERROR',
                    'INTENTOS FALLIDOS',
                );
            }

            $sheet->fromArray($header, null, 'A1');

            // $dataset is an array containing data content
            $dataset = array();
            foreach ($records as $data) {
                $studio_cc = '';
                $model_cc = '';
                $model_name = '';
                if (isset($data->studioModel) && isset($data->studioModel->studio)) {
                    $studio_cc = $data->studioModel->studio->std_name;
                }
                if (isset($data->studioModel) && isset($data->studioModel->userModel)) {
                    $model_cc = $data->studioModel->userModel->user_identification;
                    $model_name = trim($data->studioModel->userModel->user_name . ' ' . $data->studioModel->userModel->user_surname);
                }

                $dataset[] = array(
                    $data->modacc_id, // ID
                    $studio_cc, // STUDIO
                    $model_cc, // CC MODELO
                    $model_name, // NOMBRE MODELO
                    $data->modacc_app, // APLICACIÓN
                    $data->modacc_username, // NOMBRE DE USUARIO
                    $data->modacc_payment_username, // PSEUDÓNIMO DE PAGO
                    //$data->modacc_password, // CONTRASEÑA
                    !empty($data->modacc_active) ? 'SI' : 'NO', // ACTIVO
                    $data->created_at, // FECHA CREACIÓN
                );

                // Si es admin >> muestra el detalle de la ejecucion de los webscraper
                if ($uAuth->prof_id == Profile::ADMIN) {
                    array_push(
                        $dataset[count($dataset) - 1],
                        $data->modacc_last_search_at, // FECHA ÚLTIMA CONSULTA
                        $data->modacc_last_result_at, // FECHA DE ÚLTIMOS RESULTADOS
                        $data->modacc_fail_message, // MENSAJE DE ERROR
                        $data->modacc_fail_count, // INTENTOS FALLIDOS
                    );
                }
            }
            ini_set('memory_limit', '256M');
            $sheet->fromArray($dataset, null, 'A2');

            ////////////
            // FORMAT //
            ////////////
            $highestRow = $sheet->getHighestRow();
            $highestColumn = $sheet->getHighestColumn();

            // titles
            $sheet->getStyle('A1:'.$highestColumn.'1')->applyFromArray([
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
            $sheet->getStyle('A1:'.$highestColumn.'1')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('215867');

            // content
            $sheet->getStyle('A2:'.$highestColumn.$highestRow)->applyFromArray([
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

            // column width
            foreach ($sheet->getColumnIterator() as $column) {
                if (in_array($column->getColumnIndex(), ['A','B','C','D','E','F','G','H','I','J','K','L','N'])) { // excluir la M (mensaje de error)
                    // autosize
                    $sheet->getColumnDimension($column->getColumnIndex())->setAutoSize(true);
                } else {
                    // fixed size
                    $sheet->getColumnDimension($column->getColumnIndex())->setWidth(100);
                }
            }

            ////////////
            // WRITER //
            ////////////
            // $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            // $writer->save('php://output');
            $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
            $writer->save('php://output');
            return response('', 200);
        } catch (Exception $e) {
            echo $e;
        }
    }

    /**
     * Inactivacion masiva de cuentas de modelos que posean mas de 3 meses sin ingresos.
     * Tambien, inactiva las modelos que no posean cuentas activas.
     *
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
    public function inactiveMassiveRequest(Request $request)
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

            $this->inactiveMassive();

            $this->log::storeLog($uAuth, 'models_accounts', null, 'INACTIVE', null, null, $request->ip);
            return response()->json(['status' => 'success', 'data' => null], 200);
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Inactivacion masiva de cuentas de modelos que posean mas de 3 meses sin ingresos.
     * Tambien, inactiva las modelos que no posean cuentas activas.
     *
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
    public function inactiveMassive($args = array())
    {
        // default
        $dateSince = !empty($args['dateSince']) ? $args['dateSince'] : $dateSince = date('Y-m-d', strtotime(date('Y-m-d').' -3 months'));

        try {
            // Inactiva las cuentas que poseen X (defecto 3) meses sin ingresos
            // $sql = "UPDATE models_accounts ma
            //         SET modacc_active = (CASE WHEN modstr_earnings_value = 0 THEN false ELSE modacc_active END)
            //         FROM (
            //             SELECT ma2.modacc_id, COALESCE(SUM(modstr_earnings_value), 0) as modstr_earnings_value
            //             FROM models_accounts ma2
            //             LEFT JOIN models_streams ms ON ms.modacc_id = ma2.modacc_id
            //             WHERE modstr_date IS NULL OR modstr_date >= '$dateSince'
            //             GROUP BY ma2.modacc_id
            //         ) AS ms
            //         WHERE ms.modacc_id = ma.modacc_id
            //         AND modacc_active = true
            //         AND ma.created_at < '$dateSince' -- Valida que la cuenta de la modelo tambien posea X (defecto 3) meses de creado
            // ";
            $sql = "UPDATE models_accounts ma
                SET modacc_active = FALSE
                WHERE ma.modacc_id NOT IN (
                    SELECT ma2.modacc_id
                    FROM models_accounts ma2
                    LEFT JOIN models_streams ms ON ms.modacc_id = ma2.modacc_id
                    WHERE modstr_date >= '$dateSince'
                    GROUP BY ma2.modacc_id
                    HAVING SUM(modstr_earnings_value) > 0
                )
                AND modacc_active = true
                AND ma.last_activation_at < '$dateSince' -- Valida que la cuenta de la modelo tambien posea X (defecto 3) meses de creado
                AND ma.modacc_app NOT IN (
                    'MYLINKDROP',
                    'INSTAGRAM',
                    'X',
                    'TIKTOK',
                    'TELEGRAM',
                    'REDDIT',
                    'LOVENSE',
                    'AMAZON',
                    'TWITCH',
                    'DISCORD'
                )
            ";//cambiar create_at por otro campo de fecha nuevo, 
            // el cual cuando se crea va tener la misma fecha del de created_at pero cuando se habilita una modelo se va a actualizar
            //Log::info($sql);
            DB::select($sql);

            // Inactiva los usuarios (modelos) que no posean cuentas activas
            $sql = "UPDATE users
                    SET user_active = false
                    WHERE prof_id IN (4, 5) -- 4:MODELO, 5:MODELO SATELITE
                    AND user_id NOT IN (
                        -- Query de las modelos con cuentas activas
                        SELECT user_id_model
                        FROM studios_models sm
                        INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                        WHERE modacc_active = true
                        GROUP BY user_id_model
                        HAVING COUNT(modacc_active) > 0
                    )
                    AND created_at < '$dateSince' -- Valida que el usuario tambien posea X (defecto 3) meses de creado
            ";
            // Log::info($sql);
            DB::select($sql);

            //Inactivar los estudios que no posean modelos con ganancias superiores a 0 despues de 12 semanas
            $sql = "UPDATE studios
                    SET std_active = false
                    WHERE std_id NOT IN (
                        SELECT DISTINCT ms.std_id
                        FROM models_streams ms
                        WHERE ms.modstr_date >= '$dateSince'
                        AND ms.modstr_earnings_value > 0
                        AND ms.std_id IS NOT NULL
                    )
                    AND std_id NOT IN (
                        SELECT DISTINCT sm.std_id
                        FROM studios_models sm
                        INNER JOIN transactions t ON t.stdmod_id = sm.stdmod_id
                        WHERE t.trans_date >= '$dateSince'
                        AND sm.std_id IS NOT NULL
                        GROUP BY sm.std_id
                        HAVING SUM(trans_amount * trans_quantity) > 0
                    )
                    AND created_at < '$dateSince' -- Valida que el estudio tambien posea 3 meses de creado
            ";
            //Log::info($sql);
            DB::select($sql);
        } catch (Exception $e) {
            return null;
        }
    }

    public function changeContract(Request $request)
    {
        try {
            $data = $request->all();
            $uAuth = $request->user();

            // validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            $record = ModelAccount::whereIn('modacc_id', $request->input('modacc_ids'))->update(['stdmod_id' => $request->input('stdmod_id')]);

            if ($record) {
                //$this->log::storeLog($uAuth, 'models_accounts', $record->modacc_id, 'UPDATE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record], 200);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    public function getPlatforms(Request $request) {
        try {
            $data = $request->all();
            $uAuth = $request->user();
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }
            $sql = "SELECT  ma.modacc_app FROM users u
                INNER JOIN studios_models sm ON sm.user_id_model = u.user_id
                INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                WHERE u.user_active = true AND ma.modacc_active = true AND u.deleted_at IS NULL
                AND u.user_id = :user_id GROUP BY ma.modacc_app";
            $result = DB::select($sql, ['user_id' => $uAuth->user_id]);
            return response()->json($result);
        } catch (Exception $e) {
            Log::error('Error in ModelAccountController: ' . $e->getMessage());
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }

    public function getAfiliateUsernameByUserID(Request $request, $userId) {
        try {
            $uAuth = $request->user();

            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            $studioModel = StudioModel::where('user_id_model', $userId)->first();

            if (!$studioModel) {
                return response()->json(['status' => 'fail', 'message' => 'Studio model not found'], 404);
            }

            $resultsKwiky = ModelAccount::select('modacc_username')
                ->where('stdmod_id', $studioModel->stdmod_id)
                ->where('modacc_active', true)
                ->where('modacc_app', 'KWIKY')
                ->first();

            $resultsSex = ModelAccount::select('modacc_username')
                ->where('stdmod_id', $studioModel->stdmod_id)
                ->where('modacc_active', true)
                ->where('modacc_app', 'SEXCOM')
                ->first();

            $allKwikyUsernames = null;
            if (!$resultsKwiky) {
                $allKwikyUsernames = ModelAccount::select('modacc_username')
                    ->where('modacc_active', true)
                    ->where('modacc_app', 'KWIKY')
                    ->pluck('modacc_username')
                    ->toArray();
            }

            $allSexUsernames = null;
            if (!$resultsSex) {
                $allSexUsernames = ModelAccount::select('modacc_username')
                    ->where('modacc_active', true)
                    ->where('modacc_app', 'SEXCOM')
                    ->pluck('modacc_username')
                    ->toArray();
            }

            // $response = [
            //     'sex_username' => $resultsSex ? $resultsSex->modacc_username : $allSexUsernames,
            //     'kwiky_username' => $resultsKwiky ? $resultsKwiky->modacc_username : $allKwikyUsernames,
            // ];

            $response = [
                'sex_username' => [
                    'brenda_williams',
                    'celeste_mason',
                    'adelegray',
                    'mayabranson',
                    'isabella_lopez'
                ],
                'kwiky_username' => $resultsKwiky ? $resultsKwiky->modacc_username : $allKwikyUsernames,
            ];

            return response()->json($response);
        } catch (Exception $e) {
            Log::error('Error in ModelAccountController: ' . $e->getMessage());
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }

}
