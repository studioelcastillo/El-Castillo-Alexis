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
use App\Models\StudioAccount;

class StudioAccountController extends Controller
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
            $data['std_id'] = $this->resolveTenantStudioInput($request, isset($data['std_id']) ? (int) $data['std_id'] : null);
            $request->merge(['std_id' => $data['std_id']]);
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
                'stdacc_app' => 'required|max:255',
                'stdacc_username' => 'required|max:255',
                'stdacc_password' => 'nullable|max:255',
                'stdacc_apikey' => 'nullable|max:255',
                'stdacc_active' => 'required',
                'stdacc_last_search_at' => 'nullable',
                'stdacc_last_result_at' => 'nullable',
                'stdacc_fail_message' => 'nullable',
                'stdacc_fail_count' => 'nullable',
            ]);

            // create record
            $record = StudioAccount::create([
                'std_id' => (isset($data['std_id'])) ? $data['std_id'] : null,
                'stdacc_app' => (isset($data['stdacc_app'])) ? $data['stdacc_app'] : null,
                'stdacc_username' => (isset($data['stdacc_username'])) ? $data['stdacc_username'] : null,
                'stdacc_password' => (isset($data['stdacc_password'])) ? $data['stdacc_password'] : null,
                'stdacc_apikey' => (isset($data['stdacc_apikey'])) ? $data['stdacc_apikey'] : null,
                'stdacc_active' => (isset($data['stdacc_active'])) ? $data['stdacc_active'] : null,
                'stdacc_last_search_at' => (isset($data['stdacc_last_search_at'])) ? $data['stdacc_last_search_at'] : null,
                'stdacc_last_result_at' => (isset($data['stdacc_last_result_at'])) ? $data['stdacc_last_result_at'] : null,
                'stdacc_fail_message' => (isset($data['stdacc_fail_message'])) ? $data['stdacc_fail_message'] : null,
                'stdacc_fail_count' => (isset($data['stdacc_fail_count'])) ? $data['stdacc_fail_count'] : null,
            ]);
            if ($record) {
                $this->log::storeLog($uAuth, 'studios_accounts', $record->stdacc_id, 'INSERT', null, $record, $request->ip);
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
            $record = StudioAccount::with(['studio'])
                ->where($data['where'])
                ->orWhere($data['orWhere'])
                ->whereRaw($data['whereRaw'])
                ->whereNull('deleted_at')
                ->orderBy('stdacc_id', 'desc');

            $record = $this->applyTenantScope($record, $request, 'studios_accounts.std_id')->get();
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
            $data['std_id'] = $this->resolveTenantStudioInput($request, isset($data['std_id']) ? (int) $data['std_id'] : null);
            $request->merge(['std_id' => $data['std_id']]);
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

            $record = $this->findTenantScopedOrFail(StudioAccount::query()->where('stdacc_id', $id), $request, 'studios_accounts.std_id');
            // validamos los datos
            $this->validate($request, [
                'std_id' => 'required|exists:studios,std_id',
                'stdacc_app' => 'required|max:255',
                'stdacc_username' => 'required|max:255',
                'stdacc_password' => 'nullable|max:255',
                'stdacc_apikey' => 'nullable|max:255',
                'stdacc_active' => 'required',
                'stdacc_last_search_at' => 'nullable',
                'stdacc_last_result_at' => 'nullable',
                'stdacc_fail_message' => 'nullable',
                'stdacc_fail_count' => 'nullable',
            ]);

            $before = clone $record;
            $record->update([
                'std_id' => (isset($data['std_id'])) ? $data['std_id'] : null,
                'stdacc_app' => (isset($data['stdacc_app'])) ? $data['stdacc_app'] : null,
                'stdacc_username' => (isset($data['stdacc_username'])) ? $data['stdacc_username'] : null,
                'stdacc_password' => (isset($data['stdacc_password'])) ? $data['stdacc_password'] : null,
                'stdacc_apikey' => (isset($data['stdacc_apikey'])) ? $data['stdacc_apikey'] : null,
                'stdacc_active' => (isset($data['stdacc_active'])) ? $data['stdacc_active'] : null,
                'stdacc_last_search_at' => (isset($data['stdacc_last_search_at'])) ? $data['stdacc_last_search_at'] : null,
                'stdacc_last_result_at' => (isset($data['stdacc_last_result_at'])) ? $data['stdacc_last_result_at'] : null,
                'stdacc_fail_message' => (isset($data['stdacc_fail_message'])) ? $data['stdacc_fail_message'] : null,
                'stdacc_fail_count' => (isset($data['stdacc_fail_count'])) ? $data['stdacc_fail_count'] : null,
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'studios_accounts', $record->stdacc_id, 'UPDATE', $before, $record, $request->ip);

                return response()->json(['status' => 'success', 'data' => $record->stdacc_id], 200);
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
                    'exists:studios_accounts,stdacc_id' => '',
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = $this->findTenantScopedOrFail(StudioAccount::query()->where('stdacc_id', $id), $request, 'studios_accounts.std_id');
            $before = clone $record;
            // $record->update([
            //     'deleted_at' => new DateTime()
            // ]);
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'studios_accounts', $record->stdacc_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->stdacc_id], 200);
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
                'id' => 'required|integer|exists:studios_accounts,stdacc_id'
            ]);
            $record = $this->findTenantScopedOrFail(StudioAccount::query()->where('stdacc_id', $id), $request, 'studios_accounts.std_id');
            $before = clone $record;
            $record->update([
                'stdacc_active' => true
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'studios_accounts', $record->user_id, 'UPDATE', $before, $record, $request->ip);
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
                'id' => 'required|integer|exists:studios_accounts,stdacc_id'
            ]);
            $record = $this->findTenantScopedOrFail(StudioAccount::query()->where('stdacc_id', $id), $request, 'studios_accounts.std_id');
            $before = clone $record;
            $record->update([
                'stdacc_active' => false
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'studios_accounts', $record->user_id, 'UPDATE', $before, $record, $request->ip);
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
        $records = StudioAccount::with(['studio'])
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNull('deleted_at')
            ->orderBy('stdacc_id', 'desc');

        $records = $this->applyTenantScope($records, $request, 'studios_accounts.std_id')->get();

        ////////////
        // EXPORT //
        ////////////
        // redirect output to client browser
        $fileName = 'studios_accounts_export.xlsx';
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
                'APP',
                'NOMBRE DE USUARIO',
                'CONTRASEÑA',
                'API KEY',
                'ACTIVO',
                'ÚLTIMA CONSULTA',
                'ÚLTIMA RESULTADO',
                'MENSAJE DE FALLO',
                'CONTEO DE FALLOS',
                'FECHA CREACIÓN',
            )
        ];
        $sheet->fromArray($header, null, 'A1');

        // $dataset is an array containing data content
        $dataset = array();
        foreach ($records as $data) {
            $dataset[] = array(
                $data->stdacc_id, // ID
                isset($data->studio) ? $data->studio->std_name : '', // ESTUDIO
                $data->stdacc_app, // APP
                $data->stdacc_username, // NOMBRE DE USUARIO
                $data->stdacc_password, // CONTRASEÑA
                $data->stdacc_apikey, // API KEY
                !empty($data->stdacc_active) ? 'SI' : 'NO', // ACTIVO
                $data->stdacc_last_search_at, // ÚLTIMA CONSULTA
                $data->stdacc_last_result_at, // ÚLTIMA RESULTADO
                $data->stdacc_fail_message, // MENSAJE DE FALLO
                $data->stdacc_fail_count, // CONTEO DE FALLOS
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
}
