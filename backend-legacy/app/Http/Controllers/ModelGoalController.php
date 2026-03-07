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
use App\Models\ModelGoal;
use App\Models\Period;

class ModelGoalController extends Controller
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
                'modgoal_type' => 'nullable|max:255',
                'modgoal_amount' => 'required',
                'modgoal_percent' => 'nullable',
                'modgoal_date' => 'nullable',
            ]);
            
            // modgoal_auto
            $data['modgoal_auto'] = false;

            // create record
            $record = ModelGoal::create([
                'stdmod_id' => (isset($data['stdmod_id'])) ? $data['stdmod_id'] : null,
                'modgoal_type' => (isset($data['modgoal_type'])) ? $data['modgoal_type'] : null,
                'modgoal_amount' => (isset($data['modgoal_amount'])) ? $data['modgoal_amount'] : null,
                'modgoal_percent' => (isset($data['modgoal_percent'])) ? $data['modgoal_percent'] : null,
                'modgoal_date' => (isset($data['modgoal_date'])) ? $data['modgoal_date'] : null,
            ]);
            if ($record) {
                $this->log::storeLog($uAuth, 'models_goals', $record->modgoal_id, 'INSERT', null, $record, $request->ip);
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
            $record = ModelGoal::with(['studioModel'])
                ->select('models_goals.*', 'pe.period_state')
                ->leftJoin('periods AS pe', function ($join) {
                    $join->on('models_goals.modgoal_date', '>=', 'pe.period_start_date')
                         ->on('models_goals.modgoal_date', '<=', 'pe.period_end_date');
                })
                ->where($data['where'])
                ->orWhere($data['orWhere'])
                ->whereRaw($data['whereRaw'])
                ->whereNull('deleted_at')
                ->orderBy('modgoal_id', 'desc');

            $record = $this->applyTenantRelationScope($record, $request, 'studioModel')->get();
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

            $record = ModelGoal::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'stdmod_id' => 'required|exists:studios_models,stdmod_id',
                'modgoal_amount' => 'required',
                'modgoal_percent' => 'nullable',
            ]);

            // modgoal_auto
            $data['modgoal_auto'] = false;

            $before = ModelGoal::findOrFail($id);
            $record->update([
                'stdmod_id' => (isset($data['stdmod_id'])) ? $data['stdmod_id'] : null,
                'modgoal_amount' => (isset($data['modgoal_amount'])) ? $data['modgoal_amount'] : null,
                'modgoal_percent' => (isset($data['modgoal_percent'])) ? $data['modgoal_percent'] : null,
                'modgoal_auto' => (isset($data['modgoal_auto'])) ? $data['modgoal_auto'] : null,
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'models_goals', $record->modgoal_id, 'UPDATE', $before, $record, $request->ip);

                return response()->json(['status' => 'success', 'data' => $record->modgoal_id], 200);
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
                    'exists:models_goals,modgoal_id' => '',
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = ModelGoal::findOrFail($id);
            $before = ModelGoal::findOrFail($id);

            if (isset($record->modgoal_date)) {
                $period_start_date = (date('l', strtotime($record->modgoal_date)) == 'Monday') ? date('Y-m-d', strtotime($record->modgoal_date)) : date('Y-m-d', strtotime('last monday', strtotime($record->modgoal_date)));
                $period_end_date = date('Y-m-d', strtotime('this sunday', strtotime($record->modgoal_date)));
                $period = Period::where('period_start_date', $period_start_date)->where('period_end_date', $period_end_date)->first();
                if ($period && $period->period_state == 'CERRADO') {
                    return response()->json(['message' => 'El periodo relacionado a esta meta esta cerrado y no puede ser eliminada'], 422);
                }
            }
            // $record->update([
            //     'deleted_at' => new DateTime()
            // ]);
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'models_goals', $record->modgoal_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->modgoal_id], 200);
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
        $records = ModelGoal::with(['studioModel'])
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNull('deleted_at')
            ->orderBy('modgoal_id', 'desc')
            ->get();

        ////////////
        // EXPORT //
        ////////////
        // redirect output to client browser
        $fileName = 'models_goals_export.xlsx';
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
                'TIPO',
                'MONTO',
                'FECHA CREACIÓN',
                'PORCENTAJE DE INGRESO',
                'FECHA',
            )
        ];
        $sheet->fromArray($header, null, 'A1');

        // $dataset is an array containing data content
        $dataset = array();
        foreach ($records as $data) {
            $dataset[] = array(
                $data->modgoal_id, // ID
                $data->modgoal_type, // TIPO
                $data->modgoal_amount, // MONTO
                $data->created_at, // FECHA CREACIÓN
                $data->modgoal_percent, // PORCENTAJE DE INGRESO
                $data->modgoal_date, // FECHA
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
