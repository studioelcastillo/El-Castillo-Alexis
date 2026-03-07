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
use App\Models\ModelStreamCustomer;

class ModelStreamCustomerController extends Controller
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
                'modstr_id' => 'required|exists:models_streams,modstr_id',
                'modstrcus_name' => 'required|max:255',
                'modstrcus_account' => 'nullable|max:255',
                'modstrcus_website' => 'nullable|max:255',
                'modstrcus_product' => 'nullable|max:255',
                'modstrcus_price' => 'nullable',
                'modstrcus_earnings' => 'required',
                'modstrcus_received_at' => 'required',
                'modstrcus_chat_duration' => 'nullable',
            ]);

            // create record
            $record = ModelStreamCustomer::create([
                'modstr_id' => (isset($data['modstr_id'])) ? $data['modstr_id'] : null,
                'modstrcus_name' => (isset($data['modstrcus_name'])) ? $data['modstrcus_name'] : null,
                'modstrcus_account' => (isset($data['modstrcus_account'])) ? $data['modstrcus_account'] : null,
                'modstrcus_website' => (isset($data['modstrcus_website'])) ? $data['modstrcus_website'] : null,
                'modstrcus_product' => (isset($data['modstrcus_product'])) ? $data['modstrcus_product'] : null,
                'modstrcus_price' => (isset($data['modstrcus_price'])) ? $data['modstrcus_price'] : null,
                'modstrcus_earnings' => (isset($data['modstrcus_earnings'])) ? $data['modstrcus_earnings'] : null,
                'modstrcus_received_at' => (isset($data['modstrcus_received_at'])) ? $data['modstrcus_received_at'] : null,
                'modstrcus_chat_duration' => (isset($data['modstrcus_chat_duration'])) ? $data['modstrcus_chat_duration'] : null,
            ]);
            if ($record) {
                $this->log::storeLog($uAuth, 'models_streams_customers', $record->modstrcus_id, 'INSERT', null, $record, $request->ip);
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
            $record = ModelStreamCustomer::with(['modelStream'])
                ->where($data['where'])
                ->orWhere($data['orWhere'])
                ->whereRaw($data['whereRaw'])
                ->whereNull('models_streams_customers.deleted_at')
                ->orderBy('models_streams_customers.modstrcus_id', 'desc');

            if ($request->user()->prof_id == Profile::ESTUDIO) {
                $record = $record->join('models_streams AS ms', 'ms.modstr_id', 'models_streams_customers.modstr_id')
                ->join('models_accounts AS ma', 'ma.modacc_id', 'ms.modacc_id')
                ->join('studios_models AS sm', 'ma.stdmod_id', 'sm.stdmod_id')
                ->join('studios AS s', 'sm.std_id', 's.std_id')
                ->where('s.user_id_owner', $request->user()->user_id);
            } else if (in_array($request->user()->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                $record = $record->join('models_streams AS ms', 'ms.modstr_id', 'models_streams_customers.modstr_id')
                ->join('models_accounts AS ma', 'ma.modacc_id', 'ms.modacc_id')
                ->join('studios_models AS sm', 'ma.stdmod_id', 'sm.stdmod_id')
                ->where('sm.user_id_model', $request->user()->user_id);
            }
            $record = $record->get();

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

            $record = ModelStreamCustomer::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'modstr_id' => 'required|exists:models_streams,modstr_id',
                'modstrcus_name' => 'required|max:255',
                'modstrcus_account' => 'nullable|max:255',
                'modstrcus_website' => 'nullable|max:255',
                'modstrcus_product' => 'nullable|max:255',
                'modstrcus_price' => 'nullable',
                'modstrcus_earnings' => 'required',
                'modstrcus_received_at' => 'required',
                'modstrcus_chat_duration' => 'nullable',
            ]);

            $before = ModelStreamCustomer::findOrFail($id);
            $record->update([
                'modstr_id' => (isset($data['modstr_id'])) ? $data['modstr_id'] : null,
                'modstrcus_name' => (isset($data['modstrcus_name'])) ? $data['modstrcus_name'] : null,
                'modstrcus_account' => (isset($data['modstrcus_account'])) ? $data['modstrcus_account'] : null,
                'modstrcus_website' => (isset($data['modstrcus_website'])) ? $data['modstrcus_website'] : null,
                'modstrcus_product' => (isset($data['modstrcus_product'])) ? $data['modstrcus_product'] : null,
                'modstrcus_price' => (isset($data['modstrcus_price'])) ? $data['modstrcus_price'] : null,
                'modstrcus_earnings' => (isset($data['modstrcus_earnings'])) ? $data['modstrcus_earnings'] : null,
                'modstrcus_received_at' => (isset($data['modstrcus_received_at'])) ? $data['modstrcus_received_at'] : null,
                'modstrcus_chat_duration' => (isset($data['modstrcus_chat_duration'])) ? $data['modstrcus_chat_duration'] : null,
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'models_streams_customers', $record->modstrcus_id, 'UPDATE', $before, $record, $request->ip);

                return response()->json(['status' => 'success', 'data' => $record->modstrcus_id], 200);
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
                    'exists:models_streams_customers,modstrcus_id' => '',
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = ModelStreamCustomer::findOrFail($id);
            $before = ModelStreamCustomer::findOrFail($id);
            // $record->update([
            //     'deleted_at' => new DateTime()
            // ]);
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'models_streams_customers', $record->modstrcus_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->modstrcus_id], 200);
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
        $uAuth = $request->user();

        //////////
        // DATA //
        //////////
        $data = $this->helper::generateConditions($request);
        $query = ModelStreamCustomer::with(['modelStream'])
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNull('models_streams_customers.deleted_at')
            ->orderBy('models_streams_customers.modstrcus_id', 'desc');

        // Filtrar por estudio/modelo del usuario autenticado (mismo criterio que show())
        if ($uAuth->prof_id == Profile::ESTUDIO) {
            $query = $query->join('models_streams AS ms', 'ms.modstr_id', 'models_streams_customers.modstr_id')
                ->join('models_accounts AS ma', 'ma.modacc_id', 'ms.modacc_id')
                ->join('studios_models AS sm', 'ma.stdmod_id', 'sm.stdmod_id')
                ->join('studios AS s', 'sm.std_id', 's.std_id')
                ->where('s.user_id_owner', $uAuth->user_id);
        } else if (in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
            $query = $query->join('models_streams AS ms', 'ms.modstr_id', 'models_streams_customers.modstr_id')
                ->join('models_accounts AS ma', 'ma.modacc_id', 'ms.modacc_id')
                ->join('studios_models AS sm', 'ma.stdmod_id', 'sm.stdmod_id')
                ->where('sm.user_id_model', $uAuth->user_id);
        }

        $records = $query->get();

        ////////////
        // EXPORT //
        ////////////
        // redirect output to client browser
        $fileName = 'models_streams_customers_export.xlsx';
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
                'STREAM',
                'NOMBRE',
                'CUENTA',
                'SITIO WEB',
                'PRODUCTO',
                'PRECIO',
                'GANANCIA',
                'FECHA DE RECIBIDO',
                'DURACIÓN DEL CHAT (HORAS)',
                'FECHA CREACIÓN',
            )
        ];
        $sheet->fromArray($header, null, 'A1');

        // $dataset is an array containing data content
        $dataset = array();
        foreach ($records as $data) {
            $dataset[] = array(
                $data->modstrcus_id, // ID
                $data->modstrcus_name, // NOMBRE
                $data->modstrcus_account, // CUENTA
                $data->modstrcus_website, // SITIO WEB
                $data->modstrcus_product, // PRODUCTO
                $data->modstrcus_price, // PRECIO
                $data->modstrcus_earnings, // GANANCIA
                $data->modstrcus_received_at, // FECHA DE RECIBIDO
                $data->modstrcus_chat_duration, // DURACIÓN DEL CHAT (HORAS)
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
