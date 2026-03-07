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
use App\Models\ModelTransaction;

class ModelTransactionController extends Controller
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
                'stdmod_id' => 'required|exists:studios_models,stdmod_id',
                'transtype_id' => 'required|exists:transactions_types,transtype_id',
                'modtrans_date' => 'required',
                'modtrans_description' => 'nullable|max:255',
                'modtrans_amount' => 'required',
                'prod_id' => 'nullable|exists:products,prod_id',
                'modtrans_quantity' => 'nullable|numeric'
            ]);

            // create record
            $record = ModelTransaction::create([
                'stdmod_id' => (isset($data['stdmod_id'])) ? $data['stdmod_id'] : null,
                'transtype_id' => (isset($data['transtype_id'])) ? $data['transtype_id'] : null,
                'modtrans_date' => (isset($data['modtrans_date'])) ? $data['modtrans_date'] : null,
                'modtrans_description' => (isset($data['modtrans_description'])) ? $data['modtrans_description'] : null,
                'modtrans_amount' => (isset($data['modtrans_amount'])) ? $data['modtrans_amount'] : null,
                'prod_id' => (isset($data['prod_id'])) ? $data['prod_id'] : null,
                'modtrans_quantity' => (isset($data['modtrans_quantity'])) ? $data['modtrans_quantity'] : null,
                'modtrans_rtefte' => (isset($data['modtrans_rtefte'])) ? $data['modtrans_rtefte'] : null
            ]);
            if ($record) {
                $this->log::storeLog($uAuth, 'models_transactions', $record->modtrans_id, 'INSERT', null, $record, $request->ip);
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
            $transtype_group = $request->input('transtype_group', 0);
            $field = $request->input('parentfield', 0);
            $value = $request->input('parentid', 0);
            $record = ModelTransaction::with(['product.category', 'studioModel', 'transactionType'])
                ->join('transactions_types AS tt', 'tt.transtype_id', 'models_transactions.transtype_id')
                // ->where($data['where'])
                // ->orWhere($data['orWhere'])
                // ->whereRaw($data['whereRaw'])
                ->where(function ($query) use ($field, $value){
                    if ($value !== 0 && $field !== 0) {
                        $query->where($field, $value);
                    }
                })
                ->where(function ($query) use ($transtype_group){
                    if ($transtype_group !== 0) {
                        $query->where('tt.transtype_group',  $transtype_group);
                    }
                })
                ->whereNull('models_transactions.deleted_at')
                ->orderBy('modtrans_id', 'desc')
                ->get();
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

            $record = ModelTransaction::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'stdmod_id' => 'required|exists:studios_models,stdmod_id',
                'transtype_id' => 'required|exists:transactions_types,transtype_id',
                'modtrans_date' => 'required',
                'modtrans_description' => 'nullable|max:255',
                'modtrans_amount' => 'required',
                'prod_id' => 'nullable|exists:products,prod_id',
                'modtrans_quantity' => 'nullable|numeric'
            ]);

            $before = ModelTransaction::findOrFail($id);
            $record->update([
                'stdmod_id' => (isset($data['stdmod_id'])) ? $data['stdmod_id'] : null,
                'transtype_id' => (isset($data['transtype_id'])) ? $data['transtype_id'] : null,
                'modtrans_date' => (isset($data['modtrans_date'])) ? $data['modtrans_date'] : null,
                'modtrans_description' => (isset($data['modtrans_description'])) ? $data['modtrans_description'] : null,
                'modtrans_amount' => (isset($data['modtrans_amount'])) ? $data['modtrans_amount'] : null,
                'prod_id' => (isset($data['prod_id'])) ? $data['prod_id'] : null,
                'modtrans_quantity' => (isset($data['modtrans_quantity'])) ? $data['modtrans_quantity'] : null,
                'modtrans_rtefte' => (isset($data['modtrans_rtefte'])) ? $data['modtrans_rtefte'] : null
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'models_transactions', $record->modtrans_id, 'UPDATE', $before, $record, $request->ip);

                return response()->json(['status' => 'success', 'data' => $record->modtrans_id], 200);
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
                    'exists:models_transactions,modtrans_id' => '',
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = ModelTransaction::findOrFail($id);
            $before = ModelTransaction::findOrFail($id);
            // $record->update([
            //     'deleted_at' => new DateTime()
            // ]);
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'models_transactions', $record->modtrans_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->modtrans_id], 200);
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
        $records = ModelTransaction::with(['product', 'studioModel', 'transactionType'])
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNull('deleted_at')
            ->orderBy('modtrans_id', 'desc')
            ->get();

        ////////////
        // EXPORT //
        ////////////
        // redirect output to client browser
        $fileName = 'models_transactions_export.xlsx';
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
                'MODELO',
                'TIPO DE TRANSFERENCIA',
                'FECHA',
                'DESCRIPCIÓN',
                'MONTO',
                'PRODUCTO',
                'FECHA CREACIÓN',
            )
        ];
        $sheet->fromArray($header, null, 'A1');

        // $dataset is an array containing data content
        $dataset = array();
        foreach ($records as $data) {
            $dataset[] = array(
                $data->modtrans_id, // ID
                isset($data->transactionType) ? $data->transactionType->transtype_name : '', // TIPO DE TRANSFERENCIA
                $data->modtrans_date, // FECHA
                $data->modtrans_description, // DESCRIPCIÓN
                $data->modtrans_amount, // MONTO
                isset($data->product) ? $data->product->prod_name : '', // PRODUCTO
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
