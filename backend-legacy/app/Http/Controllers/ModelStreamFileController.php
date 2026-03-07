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
use App\Models\ModelStreamFile;
use App\Models\ModelStream;
use App\Models\Liquidation;

class ModelStreamFileController extends Controller
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
                'modstrfile_description' => 'required|max:255',
                'modstrfile_filename' => 'required|max:255',
                'modstrfile_template' => 'required|max:255',
            ]);

            // create record
            $record = ModelStreamFile::create([
                'modstrfile_description' => (isset($data['modstrfile_description'])) ? $data['modstrfile_description'] : null,
                'modstrfile_filename' => (isset($data['modstrfile_filename'])) ? $data['modstrfile_filename'] : null,
                'modstrfile_template' => (isset($data['modstrfile_template'])) ? $data['modstrfile_template'] : null,
                (($_SERVER['REQUEST_METHOD'] == 'POST') ? 'created_by' : '') => $uAuth->user_id,
            ]);
            if ($record) {
                $this->log::storeLog($uAuth, 'models_streams_files', $record->modstrfile_id, 'INSERT', null, $record, $request->ip);
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
            $period_since = $request->input('period_since');
            $period_until = $request->input('period_until');
            if ($period_since && $period_until) {
                $request->query->remove('period_since');
                $request->query->remove('period_until');    
            }
            $data = $this->helper::generateConditions($request);
            $record = ModelStreamFile::with(['createdBy'])
            ->when(($period_since && $period_until), function ($query) use ($period_since, $period_until) {
                $query->join('models_streams AS ms', 'models_streams_files.modstrfile_id', 'ms.modstrfile_id')
                ->whereBetween('ms.modstr_date', [$period_since, $period_until])
                ->select('models_streams_files.*')
                ->distinct();
            })
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNull('models_streams_files.deleted_at')
            ->orderBy('models_streams_files.modstrfile_id', 'desc')
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

            $record = ModelStreamFile::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'modstrfile_description' => 'required|max:255',
                'modstrfile_filename' => 'required|max:255',
                'modstrfile_template' => 'required|max:255',
            ]);

            $before = ModelStreamFile::findOrFail($id);
            $record->update([
                'modstrfile_description' => (isset($data['modstrfile_description'])) ? $data['modstrfile_description'] : null,
                'modstrfile_filename' => (isset($data['modstrfile_filename'])) ? $data['modstrfile_filename'] : null,
                'modstrfile_template' => (isset($data['modstrfile_template'])) ? $data['modstrfile_template'] : null,
                (($_SERVER['REQUEST_METHOD'] == 'POST') ? 'created_by' : '') => $uAuth->user_id,
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'models_streams_files', $record->modstrfile_id, 'UPDATE', $before, $record, $request->ip);

                return response()->json(['status' => 'success', 'data' => $record->modstrfile_id], 200);
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
                    'exists:models_streams_files,modstrfile_id' => '',
                    // 'unique:models_streams,modstrfile_id' => 'El registro está asociado a "Streams".',
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = ModelStreamFile::findOrFail($id);
            $before = ModelStreamFile::findOrFail($id);
            // $record->update([
            //     'deleted_at' => new DateTime()
            // ]);
            Liquidation::where('modstrfile_id', $id)->delete();
            ModelStream::where('modstrfile_id', $id)->delete();
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'models_streams_files', $record->modstrfile_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->modstrfile_id], 200);
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
        $records = ModelStreamFile::with(['createdBy'])
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNull('deleted_at')
            ->orderBy('modstrfile_id', 'desc')
            ->get();

        ////////////
        // EXPORT //
        ////////////
        // redirect output to client browser
        $fileName = 'models_streams_files_export.xlsx';
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
                'CREADO POR',
                'FECHA CREACIÓN',
            )
        ];
        $sheet->fromArray($header, null, 'A1');

        // $dataset is an array containing data content
        $dataset = array();
        foreach ($records as $data) {
            $dataset[] = array(
                $data->modstrfile_id, // ID
                $data->modstrfile_description, // DESCRIPCIÓN
                $data->modstrfile_filename, // NOMBRE DE ARCHIVO
                $data->modstrfile_template, // PLANTILLA
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
                'id' => 'required|exists:models_streams_files,modstrfile_id'
            ]);
            $data = $request->all();
            $entry = ModelStreamFile::findOrFail($id);
            return Storage::download('public/streams/' . $entry->modstrfile_filename);
        } catch (Exception $e) {
            DB::rollBack();
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }
}
