<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Carbon\Carbon;
use Log;

use App\Library\HelperController;
use App\Library\LogController;
use App\Requests\LoginDto;
use App\Models\User;
use App\Models\PaymentFile;
use App\Models\Payment;

class PaymentFileController extends Controller
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
                'payfile_description' => 'required|max:255',
                'payfile_filename' => 'required|max:255',
                'payfile_template' => 'required|max:255',
                'payfile_total' => 'required',
            ]);

            // create record
            $record = PaymentFile::create([
                'payfile_description' => (isset($data['payfile_description'])) ? $data['payfile_description'] : null,
                'payfile_filename' => (isset($data['payfile_filename'])) ? $data['payfile_filename'] : null,
                'payfile_template' => (isset($data['payfile_template'])) ? $data['payfile_template'] : null,
                'payfile_total' => (isset($data['payfile_total'])) ? $data['payfile_total'] : null,
                (($_SERVER['REQUEST_METHOD'] == 'POST') ? 'created_by' : '') => $uAuth->user_id,
            ]);
            if ($record) {
                $this->log::storeLog($uAuth, 'payments_files', $record->payfile_id, 'INSERT', null, $record, $request->ip);
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
            $record = PaymentFile::with(['createdBy'])
                ->where($data['where'])
                ->orWhere($data['orWhere'])
                ->whereRaw($data['whereRaw'])
                ->whereNull('deleted_at')
                ->orderBy('payfile_id', 'desc');

            if ($this->isTenantRestricted($request)) {
                $record->where(function ($query) use ($request) {
                    $query->where('payments_files.created_by', $request->user()->user_id)
                        ->orWhereHas('payments', function ($payments) use ($request) {
                            $this->applyTenantScope($payments, $request, 'payments.std_id');
                        });
                });
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

            $record = PaymentFile::query()->where('payfile_id', $id);
            if ($this->isTenantRestricted($request)) {
                $record->where(function ($query) use ($request) {
                    $query->where('payments_files.created_by', $request->user()->user_id)
                        ->orWhereHas('payments', function ($payments) use ($request) {
                            $this->applyTenantScope($payments, $request, 'payments.std_id');
                        });
                });
            }
            $record = $record->firstOrFail();
            // validamos los datos
            $this->validate($request, [
                'payfile_description' => 'required|max:255',
                'payfile_filename' => 'required|max:255',
                'payfile_template' => 'required|max:255',
                'payfile_total' => 'required',
            ]);

            $before = clone $record;
            $record->update([
                'payfile_description' => (isset($data['payfile_description'])) ? $data['payfile_description'] : null,
                'payfile_filename' => (isset($data['payfile_filename'])) ? $data['payfile_filename'] : null,
                'payfile_template' => (isset($data['payfile_template'])) ? $data['payfile_template'] : null,
                'payfile_total' => (isset($data['payfile_total'])) ? $data['payfile_total'] : null,
                (($_SERVER['REQUEST_METHOD'] == 'POST') ? 'created_by' : '') => $uAuth->user_id,
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'payments_files', $record->payfile_id, 'UPDATE', $before, $record, $request->ip);

                return response()->json(['status' => 'success', 'data' => $record->payfile_id], 200);
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

            // Validar si el periodo en el que se encuentra el archivo es de un periodo cerrado
            $periodClosed = \DB::table('payments_files as pf')
                ->join('payments as p', 'pf.payfile_id', '=', 'p.payfile_id')
                ->join('periods as per', function($join) {
                    $join->on('p.pay_period_since', '=', 'per.period_start_date')
                         ->on('p.pay_period_until', '=', 'per.period_end_date');
                })
                ->where('pf.payfile_id', $id)
                ->where('per.period_state', '=', 'CERRADO')
                ->exists();

            if ($periodClosed) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'PERIOD_CLOSED',
                    'message' => 'No se puede eliminar el archivo porque el periodo está cerrado.',
                ], 400);

                // return response()->json([
                //     'status' => 'fail',
                //     'code' => 'EXISTING_EXCHANGERATE',
                //     'message' => 'Ya existe un tasa de cambio registrada con la fecha especificada',
                // ], 400);
            }
            
            // validate relations
            $request['id'] = $id;
            $errors = $this->helper->validateWithMessages($request, [
                'id' => [
                    'required' => '',
                    'integer' => '',
                    'exists:payments_files,payfile_id' => '',
                    // 'unique:payments,payfile_id' => 'El registro está asociado a "Pagos".',
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = PaymentFile::query()->where('payfile_id', $id);
            if ($this->isTenantRestricted($request)) {
                $record->where(function ($query) use ($request) {
                    $query->where('payments_files.created_by', $request->user()->user_id)
                        ->orWhereHas('payments', function ($payments) use ($request) {
                            $this->applyTenantScope($payments, $request, 'payments.std_id');
                        });
                });
            }
            $record = $record->firstOrFail();
            $before = clone $record;
            // $record->update([
            //     'deleted_at' => new DateTime()
            // ]);
            Payment::where('payfile_id', $id)->delete();
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'payments_files', $record->payfile_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->payfile_id], 200);
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
        $records = PaymentFile::with(['createdBy'])
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNull('deleted_at')
            ->orderBy('payfile_id', 'desc');

        if ($this->isTenantRestricted($request)) {
            $records->where(function ($query) use ($request) {
                $query->where('payments_files.created_by', $request->user()->user_id)
                    ->orWhereHas('payments', function ($payments) use ($request) {
                        $this->applyTenantScope($payments, $request, 'payments.std_id');
                    });
            });
        }

        $records = $records->get();

        ////////////
        // EXPORT //
        ////////////
        // redirect output to client browser
        $fileName = 'payments_files_export.xlsx';
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
                'DESCRIPCIÓN',
                'NOMBRE DE ARCHIVO',
                'PLANTILLA',
                'TOTAL',
                'CREADO POR',
                'FECHA CREACIÓN',
            )
        ];
        $sheet->fromArray($header, null, 'A1');

        // $dataset is an array containing data content
        $dataset = array();
        foreach ($records as $data) {
            $dataset[] = array(
                $data->payfile_id, // ID
                $data->payfile_description, // DESCRIPCIÓN
                $data->payfile_filename, // NOMBRE DE ARCHIVO
                $data->payfile_template, // PLANTILLA
                $data->payfile_total, // TOTAL
                isset($data->createdBy) ? $data->createdBy->user_name : '', // CREADO POR
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

    /**
     * Download the specified resource from storage.
     *
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
    public function download(Request $request, $id)
    {
        try {
            $request['id'] = $id;
            $this->validate($request, [
                'id' => 'required|exists:payments_files,payfile_id'
            ]);
            $data = $request->all();
            $entry = PaymentFile::query()->where('payfile_id', $id);
            if ($this->isTenantRestricted($request)) {
                $entry->where(function ($query) use ($request) {
                    $query->where('payments_files.created_by', $request->user()->user_id)
                        ->orWhereHas('payments', function ($payments) use ($request) {
                            $this->applyTenantScope($payments, $request, 'payments.std_id');
                        });
                });
            }
            $entry = $entry->firstOrFail();
            return Storage::download('public/payments/' . $entry->payfile_filename);
        } catch (Exception $e) {
            DB::rollBack();
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }
}
