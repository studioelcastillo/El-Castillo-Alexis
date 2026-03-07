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
use App\Models\BankAccount;

class BankAccountController extends Controller
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
                'bankacc_entity' => 'required|max:255',
                'bankacc_number' => 'required|max:255',
                'bankacc_type' => 'required|max:255',
                'bankacc_main' => 'required',
                'bankacc_beneficiary_name' => 'nullable|max:255',
                'bankacc_beneficiary_document' => 'nullable|max:255',
                'bankacc_beneficiary_document_type' => 'nullable|max:255',
            ]);

            // create record
            $record = BankAccount::create([
                'std_id' => (isset($data['std_id'])) ? $data['std_id'] : null,
                'bankacc_entity' => (isset($data['bankacc_entity'])) ? $data['bankacc_entity'] : null,
                'bankacc_number' => (isset($data['bankacc_number'])) ? $data['bankacc_number'] : null,
                'bankacc_type' => (isset($data['bankacc_type'])) ? $data['bankacc_type'] : null,
                'bankacc_main' => (isset($data['bankacc_main'])) ? $data['bankacc_main'] : null,
                'bankacc_beneficiary_name' => (isset($data['bankacc_beneficiary_name'])) ? $data['bankacc_beneficiary_name'] : null,
                'bankacc_beneficiary_document' => (isset($data['bankacc_beneficiary_document'])) ? $data['bankacc_beneficiary_document'] : null,
                'bankacc_beneficiary_document_type' => (isset($data['bankacc_beneficiary_document_type'])) ? $data['bankacc_beneficiary_document_type'] : null,
            ]);
            if ($record) {
                // only one main account
                if ($record->bankacc_main == true) {
                    BankAccount::where('std_id', $data['std_id'])->where('bankacc_id', '<>', $record->bankacc_id)->update(['bankacc_main' => false]);
                }

                $this->log::storeLog($uAuth, 'banks_accounts', $record->bankacc_id, 'INSERT', null, $record, $request->ip);
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
            $record = BankAccount::with(['studio'])
                ->where($data['where'])
                ->orWhere($data['orWhere'])
                ->whereRaw($data['whereRaw'])
                ->whereNull('deleted_at')
                ->orderBy('bankacc_id', 'desc');

            $record = $this->applyTenantScope($record, $request, 'banks_accounts.std_id')->get();
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

            $record = $this->findTenantScopedOrFail(BankAccount::query()->where('bankacc_id', $id), $request, 'banks_accounts.std_id');
            // validamos los datos
            $this->validate($request, [
                'std_id' => 'required|exists:studios,std_id',
                'bankacc_entity' => 'required|max:255',
                'bankacc_number' => 'required|max:255',
                'bankacc_type' => 'required|max:255',
                'bankacc_main' => 'required',
                'bankacc_beneficiary_name' => 'nullable|max:255',
                'bankacc_beneficiary_document' => 'nullable|max:255',
                'bankacc_beneficiary_document_type' => 'nullable|max:255',
            ]);

            $before = clone $record;
            $record->update([
                'std_id' => (isset($data['std_id'])) ? $data['std_id'] : null,
                'bankacc_entity' => (isset($data['bankacc_entity'])) ? $data['bankacc_entity'] : null,
                'bankacc_number' => (isset($data['bankacc_number'])) ? $data['bankacc_number'] : null,
                'bankacc_type' => (isset($data['bankacc_type'])) ? $data['bankacc_type'] : null,
                'bankacc_main' => (isset($data['bankacc_main'])) ? $data['bankacc_main'] : null,
                'bankacc_beneficiary_name' => (isset($data['bankacc_beneficiary_name'])) ? $data['bankacc_beneficiary_name'] : null,
                'bankacc_beneficiary_document' => (isset($data['bankacc_beneficiary_document'])) ? $data['bankacc_beneficiary_document'] : null,
                'bankacc_beneficiary_document_type' => (isset($data['bankacc_beneficiary_document_type'])) ? $data['bankacc_beneficiary_document_type'] : null,
            ]);

            // only one main account
            if ($record->bankacc_main == true) {
                BankAccount::where('std_id', $data['std_id'])->where('bankacc_id', '<>', $record->bankacc_id)->update(['bankacc_main' => false]);
            }

            if ($record) {
                $this->log::storeLog($uAuth, 'banks_accounts', $record->bankacc_id, 'UPDATE', $before, $record, $request->ip);

                return response()->json(['status' => 'success', 'data' => $record->bankacc_id], 200);
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
                    'exists:banks_accounts,bankacc_id' => '',
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = $this->findTenantScopedOrFail(BankAccount::query()->where('bankacc_id', $id), $request, 'banks_accounts.std_id');
            $before = clone $record;
            // $record->update([
            //     'deleted_at' => new DateTime()
            // ]);
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'banks_accounts', $record->bankacc_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->bankacc_id], 200);
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
        $records = BankAccount::with(['studio'])
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNull('deleted_at')
            ->orderBy('bankacc_id', 'desc');

        $records = $this->applyTenantScope($records, $request, 'banks_accounts.std_id')->get();

        ////////////
        // EXPORT //
        ////////////
        // redirect output to client browser
        $fileName = 'banks_accounts_export.xlsx';
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
                'ENTIDAD',
                'NRO. DE CUENTA',
                'TIPO DE CUENTA',
                'CUENTA PRINCIPAL',
                'FECHA CREACIÓN',
                'NOMBRE DEL BENEFICIARIO',
                'NRO. DE IDENTIFICACION DEL BENEFICIARIO',
                'TIPO DE DOCUMENTO DEL BENEFICIARIO',
            )
        ];
        $sheet->fromArray($header, null, 'A1');

        // $dataset is an array containing data content
        $dataset = array();
        foreach ($records as $data) {
            $dataset[] = array(
                $data->bankacc_id, // ID
                isset($data->studio) ? $data->studio->std_name : '', // ESTUDIO
                $data->bankacc_entity, // ENTIDAD
                $data->bankacc_number, // NRO. DE CUENTA
                $data->bankacc_type, // TIPO DE CUENTA
                !empty($data->bankacc_main) ? 'SI' : 'NO', // CUENTA PRINCIPAL
                $data->created_at, // FECHA CREACIÓN
                $data->bankacc_beneficiary_name, // NOMBRE DEL BENEFICIARIO
                $data->bankacc_beneficiary_document, // NRO. DE IDENTIFICACION DEL BENEFICIARIO
                $data->bankacc_beneficiary_document_type, // TIPO DE DOCUMENTO DEL BENEFICIARIO
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
