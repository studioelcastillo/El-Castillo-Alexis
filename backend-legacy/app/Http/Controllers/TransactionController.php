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
use App\Models\Transaction;
use App\Models\Product;
use App\Models\Period;
use App\Http\Controllers\PeriodController;

class TransactionController extends Controller
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
                'user_id' => 'required|exists:users,user_id',
                'transtype_id' => 'required|exists:transactions_types,transtype_id',
                'trans_date' => 'required',
                'trans_description' => 'nullable|max:255',
                'trans_amount' => 'required',
                'prod_id' => 'nullable|exists:products,prod_id',
                'trans_quantity' => 'nullable|numeric'
            ]);
            if (isset($data['trans_date'])) {
                $period = PeriodController::retrieveOrCreatePeriod($data['trans_date']);
                if ($period->period_state === "CERRADO") {
                    DB::rollBack();
                    return response()->json([
                        'status' => 'fail',
                        'code' => 'Period already closed',
                        'message' => 'Este periodo esta cerrado y no permite inserciones',
                    ], 400);
                }
            }

            // create record
            $record = Transaction::create([
                'user_id' => (isset($data['user_id'])) ? $data['user_id'] : null,
                'transtype_id' => (isset($data['transtype_id'])) ? $data['transtype_id'] : null,
                'trans_date' => (isset($data['trans_date'])) ? $data['trans_date'] : null,
                'trans_description' => (isset($data['trans_description'])) ? $data['trans_description'] : null,
                'trans_amount' => (isset($data['trans_amount'])) ? $data['trans_amount'] : null,
                'prod_id' => (isset($data['prod_id'])) ? $data['prod_id'] : null,
                'trans_quantity' => (isset($data['trans_quantity'])) ? $data['trans_quantity'] : null,
                'trans_rtefte' => (isset($data['trans_rtefte'])) ? $data['trans_rtefte'] : null,
                'stdmod_id' => (isset($data['stdmod_id'])) ? $data['stdmod_id'] : null,
            ]);
            if (isset($data['prod_id'])) {
            	$product = Product::findOrFail($data['prod_id']);
            	$product->prod_stock = $product->prod_stock - $data['trans_quantity'];
            	$product->save();
            }
            if ($record) {
                $this->log::storeLog($uAuth, 'transactions', $record->trans_id, 'INSERT', null, $record, $request->ip);
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
            $transtype_group = $request->input('transtype_group', 0);
            $field = $request->input('parentfield', 0);
            $value = $request->input('parentid', 0);

            $transaction = Transaction::with(['product', 'user', 'transactionType'])
        	->distinct()
            ->leftJoin('products AS p', 'p.prod_id', 'transactions.prod_id')
            ->join('transactions_types AS tt', 'tt.transtype_id', 'transactions.transtype_id')
            ->leftJoin('periods AS pe', function ($join) {
                $join->on('transactions.trans_date', '>=', 'pe.period_start_date')
                     ->on('transactions.trans_date', '<=', 'pe.period_end_date');
            })
            ->leftJoin('studios_models AS sm', 'sm.stdmod_id', 'transactions.stdmod_id')
            ->leftJoin('studios AS s', 's.std_id', 'sm.std_id')
            ->where(function ($query) use ($field, $value) {
                if ($value !== 0 && $field !== 0) {
                    $query->where('transactions.'.$field, $value);
                }
            })
            ->where(function ($query) use ($transtype_group) {
                if ($transtype_group !== 0) {
                    $query->where('tt.transtype_group',  $transtype_group);
                }
            })
            ->whereNull('transactions.deleted_at')
            ->orderBy('trans_id', 'desc');

            if ($request->user()->prof_id == 2) {
                $transaction = $transaction->where('s.user_id_owner', $request->user()->user_id);
            }
            $transaction = $this->applyTenantScope($transaction, $request, 's.std_id');
            $transaction = $transaction->select('s.std_name', 'transactions.*', 'pe.period_state')->get();

            return response()->json(['status' => 'success', 'data' => $transaction], 200);
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

            $record = Transaction::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'user_id' => 'required|exists:users,user_id',
                'transtype_id' => 'required|exists:transactions_types,transtype_id',
                'trans_date' => 'required',
                'trans_description' => 'nullable|max:255',
                'trans_amount' => 'required',
                'prod_id' => 'nullable|exists:products,prod_id',
                'trans_quantity' => 'nullable|numeric'
            ]);

            $period = PeriodController::retrieveOrCreatePeriod($record->trans_date);
            if ($period->period_state === "CERRADO") {
                DB::rollBack();
                return response()->json([
                    'status' => 'fail',
                    'code' => 'Period already closed',
                    'message' => 'Este periodo esta cerrado y no permite modificaciones',
                ], 400);
            }

            $before = Transaction::findOrFail($id);
            $record->update([
                'user_id' => (isset($data['user_id'])) ? $data['user_id'] : null,
                'transtype_id' => (isset($data['transtype_id'])) ? $data['transtype_id'] : null,
                'trans_date' => (isset($data['trans_date'])) ? $data['trans_date'] : null,
                'trans_description' => (isset($data['trans_description'])) ? $data['trans_description'] : null,
                'trans_amount' => (isset($data['trans_amount'])) ? $data['trans_amount'] : null,
                'prod_id' => (isset($data['prod_id'])) ? $data['prod_id'] : null,
                'trans_quantity' => (isset($data['trans_quantity'])) ? $data['trans_quantity'] : null,
                'trans_rtefte' => (isset($data['trans_rtefte'])) ? $data['trans_rtefte'] : null
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'transactions', $record->trans_id, 'UPDATE', $before, $record, $request->ip);

                return response()->json(['status' => 'success', 'data' => $record->trans_id], 200);
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
                    'exists:transactions,trans_id' => '',
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = Transaction::findOrFail($id);
            $before = Transaction::findOrFail($id);
            // $record->update([
            //     'deleted_at' => new DateTime()
            // ]);
            $period = PeriodController::retrieveOrCreatePeriod($record->trans_date);
            if ($period->period_state === "CERRADO") {
                DB::rollBack();
                return response()->json([
                    'status' => 'fail',
                    'code' => 'Period already closed',
                    'message' => 'Este periodo esta cerrado y no permite eliminaciones',
                ], 400);
            }
            if(isset($record->prod_id)) {
            	$product = Product::findOrFail($record->prod_id);
            	$product->prod_stock = $product->prod_stock + $record->trans_quantity;
            	$product->save();
            }
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'transactions', $record->trans_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->trans_id], 200);
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
        $records = Transaction::with(['product', 'user', 'transactionType'])
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNull('deleted_at')
            ->orderBy('trans_id', 'desc')
            ->get();


        ////////////
        // EXPORT //
        ////////////
        // redirect output to client browser
        $fileName = 'transactions_export.xlsx';
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
                'USUARIO',
                'GRUPO TRANSFERENCIA',
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
                $data->trans_id, // ID
                isset($data->user) ? $data->user->user_name . $data->user->user_surname : '', // USUARIO
                isset($data->transactionType) ? $data->transactionType->transtype_group : '', // GRUPO TRANSFERENCIA
                isset($data->transactionType) ? $data->transactionType->transtype_name : '', // TIPO DE TRANSFERENCIA
                isset($data->trans_date) ? $data->trans_date : '', // FECHA
                isset($data->trans_description) ? $data->trans_description : '', // DESCRIPCIÓN
                isset($data->trans_amount) ? $data->trans_amount : '', // MONTO
                isset($data->product) ? $data->product->prod_name : '', // PRODUCTO
                $data->created_at // FECHA CREACIÓN
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
