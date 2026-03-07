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
use App\Models\Studio;

class StudioController extends Controller
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
                'std_nit' => 'required|max:255',
                'std_name' => 'required|max:255',
                'std_address' => 'nullable|max:255',
                //'std_shifts' => 'required|max:255',
                'std_percent' => 'nullable',
                'std_liquidation_interval' => 'nullable|max:255',
                'std_bank_entity' => 'nullable|max:255',
                'std_bank_account' => 'nullable|max:255',
                'std_bank_account_type' => 'nullable|max:255',
                //'std_ally' => 'nullable',
                'std_discount_eur' => 'nullable|numeric|gte:0',
                'std_discount_usd' => 'nullable|numeric|gte:0',
            ]);

            // create record
            $record = Studio::create([
                'std_nit' => (isset($data['std_nit'])) ? $data['std_nit'] : null,
                'std_name' => (isset($data['std_name'])) ? $data['std_name'] : null,
                'std_address' => (isset($data['std_address'])) ? $data['std_address'] : null,
                'std_shifts' => (isset($data['std_shifts'])) ? $data['std_shifts'] : '',
                'std_percent' => (isset($data['std_percent'])) ? $data['std_percent'] : null,
                'std_liquidation_interval' => (isset($data['std_liquidation_interval'])) ? $data['std_liquidation_interval'] : null,
                'payroll_liquidation_interval' => (isset($data['payroll_liquidation_interval'])) ? $data['payroll_liquidation_interval'] : 'MENSUAL',
                'payroll_auto_generate' => (isset($data['payroll_auto_generate'])) ? $data['payroll_auto_generate'] : true,
                'std_bank_entity' => (isset($data['std_bank_entity'])) ? $data['std_bank_entity'] : null,
                'std_bank_account' => (isset($data['std_bank_account'])) ? $data['std_bank_account'] : null,
                'std_bank_account_type' => (isset($data['std_bank_account_type'])) ? $data['std_bank_account_type'] : null,
                //'std_ally' => (isset($data['std_ally'])) ? $data['std_ally'] : null,
                'std_ally_master_pays' => (isset($data['std_ally_master_pays'])) ? $data['std_ally_master_pays'] : false,
                'std_active' => (isset($data['std_active'])) ? $data['std_active'] : true,
                'std_discountstudio_eur' => (isset($data['std_discountstudio_eur'])) ? $data['std_discountstudio_eur'] : 0,
                'std_discountstudio_usd' => (isset($data['std_discountstudio_usd'])) ? $data['std_discountstudio_usd'] : 0,
                'std_discountmodel_eur' => (isset($data['std_discountmodel_eur'])) ? $data['std_discountmodel_eur'] : 0,
                'std_discountmodel_usd' => (isset($data['std_discountmodel_usd'])) ? $data['std_discountmodel_usd'] : 0,
                'user_id_owner' => (isset($data['user_id_owner'])) ? $data['user_id_owner'] : null,
                'std_rtefte' => (isset($data['std_rtefte'])) ? $data['std_rtefte'] : false,
                'city_id' => (isset($data['city_id'])) ? $data['city_id'] : null,
                'std_stdacc' => (isset($data['std_stdacc'])) ? $data['std_stdacc'] : false,
                'std_dispenser' => (isset($data['std_dispenser'])) ? $data['std_dispenser'] : false,
                'std_verification_digit' => (isset($data['std_verification_digit'])) ? $data['std_verification_digit'] : null,
                'std_manager_name' => (isset($data['std_manager_name'])) ? $data['std_manager_name'] : null,
                'std_manager_id' => (isset($data['std_manager_id'])) ? $data['std_manager_id'] : null,
                'std_manager_phone' => (isset($data['std_manager_phone'])) ? $data['std_manager_phone'] : null,
                'std_company_name' => (isset($data['std_company_name'])) ? $data['std_company_name'] : null
            ]);
            if ($record) {
                $this->log::storeLog($uAuth, 'studios', $record->std_id, 'INSERT', null, $record, $request->ip);
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
            $profile_id = $request->user()->prof_id;
            $user_id = $request->user()->user_id;
            if ($request->filled('user_id') && $request->input('user_id') != 'undefined') {
                $user = User::find($request->input('user_id'));
                $profile_id = $user->prof_id;
                $user_id = $user->user_id;
            }
            unset($request['user_id']);
            $bool_active_studios = isset($request['active']) ? $request['active'] : null;
            unset($request['active']);
            $data = $this->helper::generateConditions($request);
            $record = Studio::with(['userOwner', 'city.department.country'])
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNull('studios.deleted_at')
            ->where(function ($query) use ($bool_active_studios) {
                if ($bool_active_studios != null) {
                    $query->where('std_active', $bool_active_studios);
                }
            });
            // ->orderBy('std_id', 'desc')
            
            // perfil estudio
            if ($profile_id == Profile::ESTUDIO) { //prof_id = 2 = studio
                $record = $record->where('user_id_owner', $user_id)->orderBy('std_id', 'DESC');
            // perfil modelo o monitor
            } else if (in_array($profile_id, [Profile::MODELO, Profile::MODELO_SATELITE, Profile::JEFE_MONITOR, Profile::MONITOR])) {
                $record = $record->join('studios_models AS sm', 'sm.std_id', 'studios.std_id')->where('user_id_model', $user_id)->orderBy('std_name', 'asc');
            // otros
            } else {
                $record = $record->orderBy('std_name', 'asc');
            }

            $record = $this->applyTenantScope($record, $request, 'studios.std_id')->get();
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

            $record = Studio::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'std_nit' => 'required|max:255',
                'std_name' => 'required|max:255',
                'std_address' => 'nullable|max:255',
                //'std_shifts' => 'required|max:255',
                'std_percent' => 'nullable',
                'std_liquidation_interval' => 'nullable|max:255',
                'std_bank_entity' => 'nullable|max:255',
                'std_bank_account' => 'nullable|max:255',
                'std_bank_account_type' => 'nullable|max:255',
                //'std_ally' => 'nullable',
                'std_discount_eur' => 'nullable|numeric|gte:0',
                'std_discount_usd' => 'nullable|numeric|gte:0'
            ]);

            $before = Studio::findOrFail($id);
            $record->update([
                'std_nit' => (isset($data['std_nit'])) ? $data['std_nit'] : null,
                'std_name' => (isset($data['std_name'])) ? $data['std_name'] : null,
                'std_address' => (isset($data['std_address'])) ? $data['std_address'] : null,
                'std_shifts' => (isset($data['std_shifts'])) ? $data['std_shifts'] : '',
                'std_percent' => (isset($data['std_percent'])) ? $data['std_percent'] : null,
                'std_liquidation_interval' => (isset($data['std_liquidation_interval'])) ? $data['std_liquidation_interval'] : null,
                'payroll_liquidation_interval' => (isset($data['payroll_liquidation_interval'])) ? $data['payroll_liquidation_interval'] : 'MENSUAL',
                'payroll_auto_generate' => (isset($data['payroll_auto_generate'])) ? $data['payroll_auto_generate'] : true,
                'std_bank_entity' => (isset($data['std_bank_entity'])) ? $data['std_bank_entity'] : null,
                'std_bank_account' => (isset($data['std_bank_account'])) ? $data['std_bank_account'] : null,
                'std_bank_account_type' => (isset($data['std_bank_account_type'])) ? $data['std_bank_account_type'] : null,
                //'std_ally' => (isset($data['std_ally'])) ? $data['std_ally'] : null,
                'std_ally_master_pays' => (isset($data['std_ally_master_pays'])) ? $data['std_ally_master_pays'] : false,
                'std_active' => (isset($data['std_active'])) ? $data['std_active'] : true,
                'std_discountstudio_eur' => (isset($data['std_discountstudio_eur'])) ? $data['std_discountstudio_eur'] : 0,
                'std_discountstudio_usd' => (isset($data['std_discountstudio_usd'])) ? $data['std_discountstudio_usd'] : 0,
                'std_discountmodel_eur' => (isset($data['std_discountmodel_eur'])) ? $data['std_discountmodel_eur'] : 0,
                'std_discountmodel_usd' => (isset($data['std_discountmodel_usd'])) ? $data['std_discountmodel_usd'] : 0,
                'user_id_owner' => (isset($data['user_id_owner'])) ? $data['user_id_owner'] : null,
                'std_rtefte' => (isset($data['std_rtefte'])) ? $data['std_rtefte'] : false,
                'city_id' => (isset($data['city_id'])) ? $data['city_id'] : null,
                'std_stdacc' => (isset($data['std_stdacc'])) ? $data['std_stdacc'] : false,
                'std_dispenser' => (isset($data['std_dispenser'])) ? $data['std_dispenser'] : false,
                'std_verification_digit' => (isset($data['std_verification_digit'])) ? $data['std_verification_digit'] : null,
                'std_manager_name' => (isset($data['std_manager_name'])) ? $data['std_manager_name'] : null,
                'std_manager_id' => (isset($data['std_manager_id'])) ? $data['std_manager_id'] : null,
                'std_manager_phone' => (isset($data['std_manager_phone'])) ? $data['std_manager_phone'] : null,
                'std_company_name' => (isset($data['std_company_name'])) ? $data['std_company_name'] : null
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'studios', $record->std_id, 'UPDATE', $before, $record, $request->ip);

                return response()->json(['status' => 'success', 'data' => $record->std_id], 200);
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
                    'exists:studios,std_id' => '',
                    'unique:banks_accounts,std_id' => 'El registro está asociado a "Cuentas bancarias".',
                    'unique:studios_rooms,std_id' => 'El registro está asociado a "Cuartos".',
                    'unique:studios_shifts,std_id' => 'El registro está asociado a "Turnos".',
                    'unique:studios_models,std_id' => 'El registro está asociado a "Modelos".',
                    'unique:payments,std_id' => 'El registro está asociado a "Pagos".',
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = Studio::findOrFail($id);
            $before = Studio::findOrFail($id);
            // $record->update([
            //     'deleted_at' => new DateTime()
            // ]);
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'studios', $record->std_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->std_id], 200);
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
        $records = Studio::with([])
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNull('deleted_at')
            ->orderBy('std_id', 'desc')
            ->get();

        ////////////
        // EXPORT //
        ////////////
        // redirect output to client browser
        $fileName = 'studios_export.xlsx';
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
                'NIT',
                'NOMBRE',
                'TURNOS',
                'PORCENTAJE DE INGRESO',
                'INTERVALO DE LIQ.',
                'FECHA CREACIÓN',
                'ENTIDAD',
                'CUENTA BANCARIA',
                'TIPO DE CUENTA',
                '¿ESTUDIO ALIADO?',
            )
        ];
        $sheet->fromArray($header, null, 'A1');

        // $dataset is an array containing data content
        $dataset = array();
        foreach ($records as $data) {
            $dataset[] = array(
                $data->std_id, // ID
                $data->std_nit, // NIT
                $data->std_name, // NOMBRE
                $data->std_shifts, // TURNOS
                $data->std_percent, // PORCENTAJE DE INGRESO
                $data->std_liquidation_interval, // INTERVALO DE LIQ.
                $data->created_at, // FECHA CREACIÓN
                $data->std_bank_entity, // ENTIDAD
                $data->std_bank_account, // CUENTA BANCARIA
                $data->std_bank_account_type, // TIPO DE CUENTA
                //!empty($data->std_ally) ? 'SI' : 'NO', // ¿ESTUDIO ALIADO?
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

    public function uploadImage(Request $request, $id)
    {
        try {
            $data = $request->all();
            // $uAuth = $request->auth;
            $uAuth = $request->user();

            $record = Studio::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'files' => 'mimes:jpeg,bmp,png,gif,svg'
            ]);

            $before = Studio::findOrFail($id);

            if ($request->has('files')) {
                $file = $data['files'];
                $original_filename = $file->getClientOriginalName();
                $original_filename_arr = explode('.', $original_filename);
                $file_ext = end($original_filename_arr);
                $uploadedFileName = 'STUDIO-' . $record->std_id . '.' . $file_ext;

                // save file in server
                $file->move(public_path('images/studios'), $uploadedFileName);

                // create file record
                $record->std_image = $uploadedFileName;
                $record->save();
            }

            $this->log::storeLog($uAuth, 'studios', $record->std_id, 'UPDATE', $before, $record, $request->ip);

            return response()->json(['status' => 'success', 'data' => $record->std_id], 200);
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
            $uAuth = $request->user();

            $request['id'] = $id;
            $this->validate($request, [
                'id' => 'required|integer|exists:studios,std_id'
            ]);
            $studio = Studio::findOrFail($id);
            $before = Studio::findOrFail($id);
            $studio->update([
                'std_active' => true
            ]);

            if ($studio) {
                $this->log::storeLog($uAuth, 'studios', $studio->std_id, 'UPDATE', $before, $studio, $request->ip);
                return response()->json(['status' => 'success', 'data' => $studio->std_id], 200);
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
    public function inactive(Request $request, $id)
    {
        try {
            $data = $request->all();
            $uAuth = $request->user();

            $request['id'] = $id;
            $this->validate($request, [
                'id' => 'required|integer|exists:studios,std_id'
            ]);
            $studio = Studio::findOrFail($id);
            $before = Studio::findOrFail($id);
            $studio->update([
                'std_active' => false
            ]);

            if ($studio) {
                $this->log::storeLog($uAuth, 'studios', $studio->std_id, 'UPDATE', $before, $studio, $request->ip);
                return response()->json(['status' => 'success', 'data' => $studio->std_id], 200);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }
}
