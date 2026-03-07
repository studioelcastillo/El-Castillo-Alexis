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
use App\Models\Product;

class ProductController extends Controller
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
                'cate_id' => 'required|exists:categories,cate_id',
                'transtype_id' => 'required|exists:transactions_types,transtype_id',
                'prod_code' => 'required|max:255|unique:products,prod_code',
                'prod_name' => 'required|max:255',
                'prod_purchase_price' => 'required|numeric|min:0',
                'prod_wholesaler_price' => 'required|numeric|min:0',
                'prod_sale_price' => 'required|numeric|min:0',
                'prod_stock' => 'required|numeric|min:0'
            ]);

            // create record
            $record = Product::create([
                'cate_id' => (isset($data['cate_id'])) ? $data['cate_id'] : null,
                'transtype_id' => (isset($data['transtype_id'])) ? $data['transtype_id'] : null,
                'prod_code' => (isset($data['prod_code'])) ? $data['prod_code'] : null,
                'prod_name' => (isset($data['prod_name'])) ? $data['prod_name'] : null,
                'prod_purchase_price' => (isset($data['prod_purchase_price'])) ? $data['prod_purchase_price'] : null,
                'prod_wholesaler_price' => (isset($data['prod_wholesaler_price'])) ? $data['prod_wholesaler_price'] : null,
                'prod_sale_price' => (isset($data['prod_sale_price'])) ? $data['prod_sale_price'] : null,
                'prod_stock' => (isset($data['prod_stock'])) ? $data['prod_stock'] : null
            ]);
            if ($record) {
                $this->log::storeLog($uAuth, 'products', $record->prod_id, 'INSERT', null, $record, $request->ip);
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
            $prod_id = $request->input('prod_id', 0);
            $transtype_id = $request->input('transtype_id', 0);
            $transtype_group = $request->input('transtype_group', 0);
            $record = Product::with(['category', 'transactionType'])
                ->join('transactions_types AS tt', 'products.transtype_id', 'tt.transtype_id')
                ->where('prod_name', 'ilike', '%'.$request->input('prod_name', '').'%')
                ->where(function ($query) use ($prod_id){
                    if ($prod_id !== 0) {
                        $query->where('products.prod_id',  $prod_id);
                    }
                })
                ->where(function ($query) use ($transtype_id){
                    if ($transtype_id !== 0) {
                        $query->where('products.transtype_id',  $transtype_id);
                    }
                })
                ->where(function ($query) use ($transtype_group){
                    if ($transtype_group !== 0) {
                        $query->where('transtype_group',  $transtype_group);
                    }
                })
                ->whereNull('products.deleted_at')
                ->orderBy('prod_id', 'desc')
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

            $record = Product::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'cate_id' => 'required|exists:categories,cate_id',
                'transtype_id' => 'required|exists:transactions_types,transtype_id',
                'prod_code' => 'required|max:255|unique:products,prod_code,'.$id.',prod_id',
                'prod_name' => 'required|max:255',
                'prod_purchase_price' => 'required|numeric|min:0',
                'prod_wholesaler_price' => 'required|numeric|min:0',
                'prod_sale_price' => 'required|numeric|min:0',
                'prod_stock' => 'required|numeric|min:0'
            ]);

            $before = Product::findOrFail($id);
            $record->update([
                'cate_id' => (isset($data['cate_id'])) ? $data['cate_id'] : null,
                'transtype_id' => (isset($data['transtype_id'])) ? $data['transtype_id'] : null,
                'prod_code' => (isset($data['prod_code'])) ? $data['prod_code'] : null,
                'prod_name' => (isset($data['prod_name'])) ? $data['prod_name'] : null,
                'prod_purchase_price' => (isset($data['prod_purchase_price'])) ? $data['prod_purchase_price'] : null,
                'prod_wholesaler_price' => (isset($data['prod_wholesaler_price'])) ? $data['prod_wholesaler_price'] : null,
                'prod_sale_price' => (isset($data['prod_sale_price'])) ? $data['prod_sale_price'] : null,
                'prod_stock' => (isset($data['prod_stock'])) ? $data['prod_stock'] : null
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'products', $record->prod_id, 'UPDATE', $before, $record, $request->ip);

                return response()->json(['status' => 'success', 'data' => $record->prod_id], 200);
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
                    'exists:products,prod_id' => '',
                    'unique:models_transactions,prod_id' => 'El registro está asociado a "Transacciones".',
                    'unique:transactions,prod_id' => 'El registro está asociado a "Transacciones".',
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = Product::findOrFail($id);
            $before = Product::findOrFail($id);
            // $record->update([
            //     'deleted_at' => new DateTime()
            // ]);
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'products', $record->prod_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->prod_id], 200);
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
        $records = Product::with(['category'])
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNull('deleted_at')
            ->orderBy('prod_id', 'desc')
            ->get();

        ////////////
        // EXPORT //
        ////////////
        // redirect output to client browser
        $fileName = 'products_export.xlsx';
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
                'CATEGORÍA',
                'CÓDIGO',
                'NOMBRE',
                'FECHA CREACIÓN',
            )
        ];
        $sheet->fromArray($header, null, 'A1');

        // $dataset is an array containing data content
        $dataset = array();
        foreach ($records as $data) {
            $dataset[] = array(
                $data->prod_id, // ID
                isset($data->category) ? $data->category->cate_name : '', // CATEGORÍA
                $data->prod_code, // CÓDIGO
                $data->prod_name, // NOMBRE
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
