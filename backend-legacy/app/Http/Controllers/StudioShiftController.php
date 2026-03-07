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
use App\Models\StudioShift;

class StudioShiftController extends Controller
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
                'std_id' => 'required|exists:studios,std_id',
                'stdshift_name' => 'required|max:255',
                'stdshift_begin_time' => 'required',
                'stdshift_finish_time' => 'required',
                'stdshift_capacity' => 'nullable',
            ]);
            $principal_studio = Studio::where('std_principal', true)
            ->whereNull('deleted_at')
            ->first();

            // create record
            $record = StudioShift::create([
                'std_id' => $principal_studio?->std_id, //(isset($data['std_id'])) ? $data['std_id'] : null,
                'stdshift_name' => (isset($data['stdshift_name'])) ? $data['stdshift_name'] : null,
                'stdshift_begin_time' => (isset($data['stdshift_begin_time'])) ? $data['stdshift_begin_time'] : null,
                'stdshift_finish_time' => (isset($data['stdshift_finish_time'])) ? $data['stdshift_finish_time'] : null,
                'stdshift_capacity' => (isset($data['stdshift_capacity'])) ? $data['stdshift_capacity'] : null,
            ]);
            if ($record) {
                $this->log::storeLog($uAuth, 'studios_shifts', $record->stdshift_id, 'INSERT', null, $record, $request->ip);
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

            $principal_studio = Studio::where('std_principal', true)
            ->whereNull('deleted_at')
            ->first();

            $record = StudioShift::with(['studio'])
            ->where(function ($query) use ($principal_studio) {
                if ($principal_studio?->std_id) {
                    $query->where('studios_shifts.std_id', $principal_studio->std_id);
                }
            })
            // ->where($data['where'])
            // ->orWhere($data['orWhere'])
            // ->whereRaw($data['whereRaw'])
            ->whereNull('deleted_at')
            ->orderBy('stdshift_id', 'desc');
            $record = $this->applyTenantScope($record, $request, 'studios_shifts.std_id')->get();
            return response()->json(['status' => 'success', 'data' => $record], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Se creo esta funcion para que al momento de generar el reporte,
     * no se duplicaran las opciones por cada estudio.
     */
    public function showDistinct(Request $request)
    {
        try {
            $data = $this->helper::generateConditions($request);
            
            $studio_shift = StudioShift::with(['studio'])
            ->select(['stdshift_name'])
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNull('studios_shifts.deleted_at')
            ->distinct();
            if (in_array($request->user()->prof_id, [Profile::JEFE_MONITOR, Profile::MONITOR])) {
                $record = $studio_shift
                ->join('studios AS s', 's.std_id', 'studios_shifts.std_id')
                ->join('studios_models AS sm', 'sm.std_id', 's.std_id')
                ->where('sm.user_id_model', $request->user()->user_id)
                ->where('s.std_active', true)
                ;
            } else {
                $record = $studio_shift;
            }

            $record = $this->applyTenantScope($record, $request, 'studios_shifts.std_id')->get();
            
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

            $record = StudioShift::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'std_id' => 'required|exists:studios,std_id',
                'stdshift_name' => 'required|max:255',
                'stdshift_begin_time' => 'required',
                'stdshift_finish_time' => 'required',
                'stdshift_capacity' => 'nullable',
            ]);

            $before = StudioShift::findOrFail($id);
            $record->update([
                'std_id' => (isset($data['std_id'])) ? $data['std_id'] : null,
                'stdshift_name' => (isset($data['stdshift_name'])) ? $data['stdshift_name'] : null,
                'stdshift_begin_time' => (isset($data['stdshift_begin_time'])) ? $data['stdshift_begin_time'] : null,
                'stdshift_finish_time' => (isset($data['stdshift_finish_time'])) ? $data['stdshift_finish_time'] : null,
                'stdshift_capacity' => (isset($data['stdshift_capacity'])) ? $data['stdshift_capacity'] : null,
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'studios_shifts', $record->stdshift_id, 'UPDATE', $before, $record, $request->ip);

                return response()->json(['status' => 'success', 'data' => $record->stdshift_id], 200);
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
                    'exists:studios_shifts,stdshift_id' => '',
                    'unique:studios_models,stdshift_id' => 'El registro está asociado a "Modelos".',
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = StudioShift::findOrFail($id);
            $before = StudioShift::findOrFail($id);
            // $record->update([
            //     'deleted_at' => new DateTime()
            // ]);
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'studios_shifts', $record->stdshift_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->stdshift_id], 200);
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
        $records = StudioShift::with(['studio'])
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNull('deleted_at')
            ->orderBy('stdshift_id', 'desc')
            ->get();

        ////////////
        // EXPORT //
        ////////////
        // redirect output to client browser
        $fileName = 'studios_shifts_export.xlsx';
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
                'NOMBRE',
                'HORA DE ENTRADA',
                'HORA DE SALIDA',
                'CAPACIDAD',
                'FECHA CREACIÓN',
            )
        ];
        $sheet->fromArray($header, null, 'A1');

        // $dataset is an array containing data content
        $dataset = array();
        foreach ($records as $data) {
            $dataset[] = array(
                $data->stdshift_id, // ID
                isset($data->studio) ? $data->studio->std_name : '', // ESTUDIO
                $data->stdshift_name, // NOMBRE
                $data->stdshift_begin_time, // HORA DE ENTRADA
                $data->stdshift_finish_time, // HORA DE SALIDA
                $data->stdshift_capacity, // CAPACIDAD
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
