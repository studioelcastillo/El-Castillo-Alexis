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
use Log;

use App\Library\HelperController;
use App\Library\LogController;
use App\Requests\LoginDto;
use App\Models\User;
use App\Models\Profile;
use App\Models\StudioModel;
use App\Models\Studio;
use App\Models\ModelAccount;
use App\Models\Petition;

class StudioModelController extends Controller
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
            Log::info('Received Request Data:', $request->all());
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
                'std_id' => 'required|exists:studios,std_id',
                'stdroom_id' => 'nullable|exists:studios_rooms,stdroom_id',
                'user_id_model' => 'required|exists:users,user_id',
                'stdmod_start_at' => 'required',
                'stdmod_finish_at' => 'nullable',
                'stdmod_active' => 'required',
                'stdmod_percent' => 'nullable',
                'stdmod_rtefte' => 'nullable',
                'stdshift_id' => 'nullable|exists:studios_shifts,stdshift_id',
                'stdmod_commission_type' => 'nullable|max:255',
                'stdmod_goal' => 'nullable',
                'stdmod_contract_type' => 'nullable|max:255',
                'stdmod_position' => 'nullable|max:255',
                'stdmod_area' => 'nullable|max:255',
                // Campos de nómina
                'stdmod_monthly_salary' => 'nullable|numeric|min:0',
                'stdmod_biweekly_salary' => 'nullable|numeric|min:0',
                'stdmod_daily_salary' => 'nullable|numeric|min:0',
                'stdmod_dotacion_amount' => 'nullable|numeric|min:0',
                'stdmod_has_sena' => 'nullable|boolean',
                'stdmod_has_caja_compensacion' => 'nullable|boolean',
                'stdmod_has_icbf' => 'nullable|boolean',
                'stdmod_arl_risk_level' => 'nullable|in:I,II,III,IV,V'
            ]);

            $stdmod_contract_number = StudioModel::where('std_id', $data['std_id'])->max('stdmod_contract_number');

            // si el porcentaje no está seteado y el tipo de comisión es PRESENCIAL, SATELITE o FIJO, se setea el porcentaje a 50
            if (empty($data['stdmod_percent']) && in_array($data['stdmod_commission_type'], ['PRESENCIAL', 'SATELITE', 'FIJO'])) {
                $data['stdmod_percent'] = 50;
            }

            // create record
            $record = StudioModel::create([
                'std_id' => (isset($data['std_id'])) ? $data['std_id'] : null,
                'stdroom_id' => (isset($data['stdroom_id'])) ? $data['stdroom_id'] : null,
                'user_id_model' => (isset($data['user_id_model'])) ? $data['user_id_model'] : null,
                'stdmod_start_at' => (isset($data['stdmod_start_at'])) ? $data['stdmod_start_at'] : null,
                'stdmod_finish_at' => (isset($data['stdmod_finish_at'])) ? $data['stdmod_finish_at'] : null,
                'stdmod_active' => (isset($data['stdmod_active'])) ? $data['stdmod_active'] : null,
                'stdmod_percent' => (isset($data['stdmod_percent'])) ? $data['stdmod_percent'] : null,
                'stdmod_rtefte' => (isset($data['stdmod_rtefte'])) ? $data['stdmod_rtefte'] : null,
                'stdshift_id' => (isset($data['stdshift_id'])) ? $data['stdshift_id'] : null,
                'stdmod_commission_type' => (isset($data['stdmod_commission_type'])) ? $data['stdmod_commission_type'] : null,
                'stdmod_goal' => (isset($data['stdmod_goal'])) ? $data['stdmod_goal'] : null,
                'stdmod_contract_type' => (isset($data['stdmod_contract_type'])) ? $data['stdmod_contract_type'] : null,
                'stdmod_contract_number' => (intval($stdmod_contract_number) + 1),
                'stdmod_position' => (isset($data['stdmod_position'])) ? $data['stdmod_position'] : null,
                'stdmod_area' => (isset($data['stdmod_area'])) ? $data['stdmod_area'] : null,
                'city_id' => (isset($data['city_id'])) ? $data['city_id'] : null,
                // Campos de nómina
                'stdmod_monthly_salary' => (isset($data['stdmod_monthly_salary'])) ? $data['stdmod_monthly_salary'] : null,
                'stdmod_biweekly_salary' => (isset($data['stdmod_biweekly_salary'])) ? $data['stdmod_biweekly_salary'] : null,
                'stdmod_daily_salary' => (isset($data['stdmod_daily_salary'])) ? $data['stdmod_daily_salary'] : null,
                'stdmod_dotacion_amount' => (isset($data['stdmod_dotacion_amount'])) ? $data['stdmod_dotacion_amount'] : 100000,
                'stdmod_has_sena' => (isset($data['stdmod_has_sena'])) ? $data['stdmod_has_sena'] : false,
                'stdmod_has_caja_compensacion' => (isset($data['stdmod_has_caja_compensacion'])) ? $data['stdmod_has_caja_compensacion'] : false,
                'stdmod_has_icbf' => (isset($data['stdmod_has_icbf'])) ? $data['stdmod_has_icbf'] : false,
                'stdmod_arl_risk_level' => (isset($data['stdmod_arl_risk_level'])) ? $data['stdmod_arl_risk_level'] : 'I',
            ]);
            if ($record) {
                $this->log::storeLog($uAuth, 'studios_models', $record->stdmod_id, 'INSERT', null, $record, $request->ip);
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
            //$data = $this->helper::generateConditions($request);
            $user_prof_id = $request->user()->prof_id;
            $user_id_owner = $request->user()->user_id;
            $field = $request->input('parentfield', 0);
            $value = $request->input('parentid', 0);
            $stdmod_id = $request->input('stdmod_id', 0);
            $record = StudioModel::with(['studio', 'studioRoom', 'userModel', 'studioShift', 'city.department.country'])
            ->select('studios_models.*')
            ->join('studios AS s', 'studios_models.std_id', 's.std_id')
            ->where(function ($query) use ($field, $value){
                if ($value !== 0 && $field !== 0) {
                    $query->where('studios_models.' . $field, $value);
                }
            })
            ->where(function ($query) use ($user_id_owner, $user_prof_id){
                if ($user_id_owner !== 0 && $user_prof_id == Profile::ESTUDIO) {
                    $query->where('s.user_id_owner',  $user_id_owner);
                }
            })
            ->where(function ($query) use ($stdmod_id){
                if ($stdmod_id !== 0) {
                    $query->where('studios_models.stdmod_id', $stdmod_id);
                }
            })
            //->where($data['where'])
            //->orWhere($data['orWhere'])
            //->whereRaw($data['whereRaw'])
            ->whereNull('studios_models.deleted_at')
            ->orderBy('stdmod_id', 'desc');

            $record = $this->applyTenantScope($record, $request, 'studios_models.std_id')->get();
            return response()->json(['status' => 'success', 'data' => $record], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }
    public function showStudioModelFromModelByStudioModel(Request $request)
    {
        try {
            $stdmod_id = $request->input('stdmod_id', 0);
            $record = StudioModel::join('studios_models AS sm2', 'studios_models.user_id_model', 'sm2.user_id_model')
            ->join('studios AS s2', 'sm2.std_id', 's2.std_id')
            ->select('sm2.stdmod_id AS value', DB::raw("sm2.stdmod_id || ' ' || s2.std_name AS label"))
            ->where('studios_models.stdmod_id', $stdmod_id)
            ->where('sm2.stdmod_id', '!=', $stdmod_id)
            ->whereNull('sm2.deleted_at')
            ->orderBy('sm2.stdmod_id', 'desc')
            ->get();
            return response()->json(['status' => 'success', 'data' => $record], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    public function showStudiosModelByUserId($user_id)
    {
        try {
            $array = StudioModel::where('user_id_model', $user_id)->whereNull('deleted_at')->pluck('stdmod_id');
            return $array;
        } catch (Exception $e) {
            return null;
        }
    }

    public function getStudioIdsByUserId($user_id)
    {
        try {
            return StudioModel::where('user_id_model', $user_id)
                ->whereNull('deleted_at')
                ->pluck('std_id')
                ->unique()
                ->values()
                ->toArray();
        } catch (Exception $e) {
            return [];
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

            $record = StudioModel::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'std_id' => 'required|exists:studios,std_id',
                'stdroom_id' => 'nullable|exists:studios_rooms,stdroom_id',
                'user_id_model' => 'required|exists:users,user_id',
                'stdmod_start_at' => 'required',
                'stdmod_finish_at' => 'nullable',
                'stdmod_active' => 'required',
                'stdmod_percent' => 'nullable',
                'stdmod_rtefte' => 'nullable',
                'stdshift_id' => 'nullable|exists:studios_shifts,stdshift_id',
                'stdmod_commission_type' => 'nullable|max:255',
                'stdmod_goal' => 'nullable',
                'stdmod_contract_type' => 'nullable|max:255',
                'stdmod_position' => 'nullable|max:255',
                'stdmod_area' => 'nullable|max:255',
                // Campos de nómina
                'stdmod_monthly_salary' => 'nullable|numeric|min:0',
                'stdmod_biweekly_salary' => 'nullable|numeric|min:0',
                'stdmod_daily_salary' => 'nullable|numeric|min:0',
                'stdmod_dotacion_amount' => 'nullable|numeric|min:0',
                'stdmod_has_sena' => 'nullable|boolean',
                'stdmod_has_caja_compensacion' => 'nullable|boolean',
                'stdmod_has_icbf' => 'nullable|boolean',
                'stdmod_arl_risk_level' => 'nullable|in:I,II,III,IV,V'
            ]);

            // si el porcentaje no está seteado y el tipo de comisión es PRESENCIAL, SATELITE o FIJO, se setea el porcentaje a 50
            if (empty($data['stdmod_percent']) && in_array($data['stdmod_commission_type'], ['PRESENCIAL', 'SATELITE', 'FIJO'])) {
                $data['stdmod_percent'] = 50;
            }

            $before = StudioModel::findOrFail($id);
            $record->update([
                'std_id' => (isset($data['std_id'])) ? $data['std_id'] : null,
                'stdroom_id' => (isset($data['stdroom_id'])) ? $data['stdroom_id'] : null,
                'user_id_model' => (isset($data['user_id_model'])) ? $data['user_id_model'] : null,
                'stdmod_start_at' => (isset($data['stdmod_start_at'])) ? $data['stdmod_start_at'] : null,
                'stdmod_finish_at' => (isset($data['stdmod_finish_at'])) ? $data['stdmod_finish_at'] : null,
                'stdmod_active' => (isset($data['stdmod_active'])) ? $data['stdmod_active'] : null,
                'stdmod_percent' => (isset($data['stdmod_percent'])) ? $data['stdmod_percent'] : null,
                'stdmod_rtefte' => (isset($data['stdmod_rtefte'])) ? $data['stdmod_rtefte'] : null,
                'stdshift_id' => (isset($data['stdshift_id'])) ? $data['stdshift_id'] : null,
                'stdmod_commission_type' => (isset($data['stdmod_commission_type'])) ? $data['stdmod_commission_type'] : null,
                'stdmod_goal' => (isset($data['stdmod_goal'])) ? $data['stdmod_goal'] : null,
                'stdmod_contract_type' => (isset($data['stdmod_contract_type'])) ? $data['stdmod_contract_type'] : null,
                'stdmod_position' => (isset($data['stdmod_position'])) ? $data['stdmod_position'] : null,
                'stdmod_area' => (isset($data['stdmod_area'])) ? $data['stdmod_area'] : null,
                'city_id' => (isset($data['city_id'])) ? $data['city_id'] : null,
                // Campos de nómina
                'stdmod_monthly_salary' => (isset($data['stdmod_monthly_salary'])) ? $data['stdmod_monthly_salary'] : null,
                'stdmod_biweekly_salary' => (isset($data['stdmod_biweekly_salary'])) ? $data['stdmod_biweekly_salary'] : null,
                'stdmod_daily_salary' => (isset($data['stdmod_daily_salary'])) ? $data['stdmod_daily_salary'] : null,
                'stdmod_dotacion_amount' => (isset($data['stdmod_dotacion_amount'])) ? $data['stdmod_dotacion_amount'] : null,
                'stdmod_has_sena' => (isset($data['stdmod_has_sena'])) ? $data['stdmod_has_sena'] : null,
                'stdmod_has_caja_compensacion' => (isset($data['stdmod_has_caja_compensacion'])) ? $data['stdmod_has_caja_compensacion'] : null,
                'stdmod_has_icbf' => (isset($data['stdmod_has_icbf'])) ? $data['stdmod_has_icbf'] : null,
                'stdmod_arl_risk_level' => (isset($data['stdmod_arl_risk_level'])) ? $data['stdmod_arl_risk_level'] : null,
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'studios_models', $record->stdmod_id, 'UPDATE', $before, $record, $request->ip);

                return response()->json(['status' => 'success', 'data' => $record->stdmod_id], 200);
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

            $count_model = ModelAccount::whereNull('deleted_at')->where('stdmod_id', $id)->count();
            if ($count_model > 0) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'ACCOUNTS_FOUND',
                    'message' => 'El registro está asociado a "Cuentas".',
                ], 400);
            }
            $count_petitions = Petition::where('stdmod_id', $id)->count();
            if ($count_petitions > 0) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'PETITION_FOUND',
                    'message' => 'El registro está asociado a "Solicitudes".',
                ], 400);
            }
            // validate relations
            $request['id'] = $id;
            $errors = $this->helper->validateWithMessages($request, [
                'id' => [
                    'required' => '',
                    'integer' => '',
                    'exists:studios_models,stdmod_id' => '',
                    //'unique:models_accounts,stdmod_id' => 'El registro está asociado a "Cuentas".',
                    'unique:models_goals,stdmod_id' => 'El registro está asociado a "Metas".',
                    'unique:models_transactions,stdmod_id' => 'El registro está asociado a "Transacciones".',
                    'unique:transactions,stdmod_id' => 'El registro está asociado a "Transacciones".',
                    'unique:payments,stdmod_id' => 'El registro está asociado a "Pagos".',
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = StudioModel::findOrFail($id);
            $before = StudioModel::findOrFail($id);
            // $record->update([
            //     'deleted_at' => new DateTime()
            // ]);
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'studios_models', $record->stdmod_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->stdmod_id], 200);
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
                'id' => 'required|integer|exists:studios_models,stdmod_id'
            ]);
            $record = StudioModel::findOrFail($id);
            $before = StudioModel::findOrFail($id);
            $record->update([
                'stdmod_active' => true
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'studios_models', $record->user_id, 'UPDATE', $before, $record, $request->ip);
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
                'id' => 'required|integer|exists:studios_models,stdmod_id'
            ]);
            $record = StudioModel::findOrFail($id);
            $before = StudioModel::findOrFail($id);
            $record->update([
                'stdmod_active' => false
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'studios_models', $record->user_id, 'UPDATE', $before, $record, $request->ip);
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
        //////////
        // DATA //
        //////////
        $data = $this->helper::generateConditions($request);
        $records = StudioModel::with(['studio', 'studioRoom', 'userModel', 'studioShift'])
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNull('deleted_at')
            ->orderBy('stdmod_id', 'desc')
            ->get();

        ////////////
        // EXPORT //
        ////////////
        // redirect output to client browser
        $fileName = 'studios_models_export.xlsx';
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
                'CUARTO',
                'USUARIO',
                'INICIO',
                'FIN',
                'ACTIVO',
                'PORCENTAJE DE INGRESO',
                '¿APLLICA RTE. FTE?',
                'FECHA CREACIÓN',
                'TURNO',
                'TIPO DE COMISIÓN',
                'META',
            )
        ];
        $sheet->fromArray($header, null, 'A1');

        // $dataset is an array containing data content
        $dataset = array();
        foreach ($records as $data) {
            $dataset[] = array(
                $data->stdmod_id, // ID
                isset($data->studio) ? $data->studio->std_name : '', // ESTUDIO
                isset($data->studioRoom) ? $data->studioRoom->stdroom_name : '', // CUARTO
                isset($data->userModel) ? $data->userModel->user_name : '', // USUARIO
                $data->stdmod_start_at, // INICIO
                $data->stdmod_finish_at, // FIN
                !empty($data->stdmod_active) ? 'SI' : 'NO', // ACTIVO
                $data->stdmod_percent, // PORCENTAJE DE INGRESO
                !empty($data->stdmod_rtefte) ? 'SI' : 'NO', // ¿APLLICA RTE. FTE?
                $data->created_at, // FECHA CREACIÓN
                isset($data->studioShift) ? $data->studioShift->stdshift_name : '', // TURNO
                $data->stdmod_commission_type, // TIPO DE COMISIÓN
                $data->stdmod_goal, // META
            );
        }
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
     * Print contract.
     *
     * @return response()->json
     */
    public function printDocumentPdf(Request $request, $type, $id)
    {
        try {
            // Handle authentication from query parameter if needed
            // This allows opening PDFs in new tabs
            if ($request->has('access_token') && !$request->bearerToken()) {
                $request->headers->set('Authorization', 'Bearer ' . $request->query('access_token'));
            }

            // query data
            $query = $request->query();
            $today = date('Y-m-d');

            // data
            $studioModel = StudioModel::with('userModel')->where('stdmod_id', $id)->first();
            $model = $studioModel->userModel;
            $studio = Studio::with('userOwner')->findOrFail($studioModel->std_id);

            // Map type to document_type
            $documentTypeMap = [
                'contract' => 'contract',
                'certification' => 'certification',
                'bank_letter' => 'bank_letter',
                'code_conduct' => 'code_conduct',
                'habeas_data' => 'habeas_data',
            ];
            $documentType = $documentTypeMap[$type] ?? null;

            // Get signatures for this document if applicable
            $signatures = [
                'model' => null,
                'owner' => null,
            ];

            if ($documentType) {
                $docSignatures = \App\Models\DocumentSignature::with(['userSignature', 'signedByUser'])
                    ->where('stdmod_id', $id)
                    ->where('docsig_document_type', $documentType)
                    ->whereNull('deleted_at')
                    ->get();

                foreach ($docSignatures as $sig) {
                    if ($sig->docsig_role == 'model') {
                        $signatures['model'] = $sig;
                    } elseif ($sig->docsig_role == 'owner') {
                        $signatures['owner'] = $sig;
                    }
                }
            }

            /////////
            // PDF //
            /////////

            // Calcular ingresos del mes anterior para certificaciones
            $monthlyIncome = 0;
            $weeklyIncome = 0;

            if ($type == 'certification') {
                // Obtener el primer y último día del mes anterior
                $lastMonthStart = date('Y-m-01', strtotime('first day of last month'));
                $lastMonthEnd = date('Y-m-t', strtotime('last day of last month'));

                // Obtener todas las liquidaciones del mes anterior para este modelo
                $liquidations = \App\Models\Liquidation::where('stdmod_id', $id)
                    ->whereBetween('liq_date', [$lastMonthStart, $lastMonthEnd])
                    ->whereNull('deleted_at')
                    ->get();

                // Sumar todos los ingresos del mes anterior
                $monthlyIncome = $liquidations->sum('liq_earnings_cop');

                // Calcular ingreso semanal (mensual / 4)
                $weeklyIncome = $monthlyIncome > 0 ? $monthlyIncome / 4 : 0;
            }

            $data = [
                'studio' => $studio,
                'model' => $model,
                'studioModel' => $studioModel,
                'signatures' => $signatures,
                'monthlyIncome' => $monthlyIncome,
                'weeklyIncome' => $weeklyIncome,
            ];

            // Determinar el tipo de contrato según stdmod_contract_type
            $contractType = $studioModel->stdmod_contract_type;
            $pdfView = null;
            if ($type == 'contract') {
                switch ($contractType) {
                    case 'APRENDIZAJE':
                    case 'TERMINO FIJO':
                        // Contrato de Prestación de Servicios Personales Independientes
                        $pdfView = 'pdfs.fixedContract';
                        break;

                    case 'TERMINO INDEFINIDO':
                        // Contrato Individual de Trabajo a Término Indefinido
                        $pdfView = 'pdfs.unfixedContract';
                        break;

                    case 'MANDANTE - MODELO':
                        // Contrato de Mandato Comercial con Representación
                        $pdfView = 'pdfs.modelContract';
                        break;

                    case 'OCASIONAL DE TRABAJO':
                    case 'OBRA O LABOR':
                    case 'CIVIL POR PRESTACIÓN DE SERVICIOS':
                        // Por defecto usar contrato de prestación de servicios
                        $pdfView = 'pdfs.serviceContract';
                        break;
                }
            }
            else if ($type == 'certification') {
                switch ($contractType) {
                    case 'APRENDIZAJE':
                    case 'TERMINO FIJO':
                        // Certificacion de Prestación de Servicios Personales Independientes
                        $pdfView = 'pdfs.fixedCertification';
                        break;

                    case 'TERMINO INDEFINIDO':
                        // Certificacion Individual de Trabajo a Término Indefinido
                        $pdfView = 'pdfs.unfixedCertification';
                        break;

                    case 'MANDANTE - MODELO':
                        // Certificacion de Mandato Comercial con Representación
                        $pdfView = 'pdfs.modelCertification';
                        break;

                    case 'OCASIONAL DE TRABAJO':
                    case 'OBRA O LABOR':
                    case 'CIVIL POR PRESTACIÓN DE SERVICIOS':
                        // Por defecto usar certificacion de prestación de servicios
                        $pdfView = 'pdfs.serviceCertification';
                        break;
                }
            }
            else if ($type == 'bank_letter') {
                $pdfView = 'pdfs.fixedBankLetter';
            }
            else if ($type == 'code_conduct') {
                $pdfView = 'pdfs.codeConduct';
            }
            else if ($type == 'habeas_data') {
                $pdfView = 'pdfs.habeasData';
            }

            if ($pdfView) {
                $pdf = \PDF::loadView($pdfView, $data);
                return $pdf->stream('Contrato '.$model->user_name.'.pdf');
            } else {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Tipo de contrato no válido',
                ], 400);
            }

            // return $pdf->download('CERTIFICADO.pdf');
        } catch (Exception $e) {
            Log::info($e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }
}
