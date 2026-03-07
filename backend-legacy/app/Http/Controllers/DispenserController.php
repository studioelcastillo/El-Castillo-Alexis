<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;
use Maatwebsite\Excel\Facades\Excel;

use App\Http\Requests\UploadDispenserDataRequest;
use App\Imports\DispenserTransactionsImport;
use App\Models\DispenserFile;
use App\Models\Period;
use App\Models\PayrollPeriod;
use App\Library\HelperController;
use App\Library\LogController;

class DispenserController extends Controller
{
    private $helper;
    private $log;

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->helper = new HelperController();
        $this->log = new LogController();
    }

    /**
     * Preview dispenser Excel file (validates without saving)
     *
     * @param UploadDispenserDataRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function preview(UploadDispenserDataRequest $request)
    {
        try {
            $file = $request->file('file');
            $originalFilename = $file->getClientOriginalName();

            // Obtener tipo de cargue y período seleccionado
            $importType = $request->input('import_type', 'models'); // 'models' o 'payroll'
            $periodId = $request->input('period_id');

            // Validar que se seleccionó un período
            if (empty($periodId)) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Debe seleccionar un período'
                ], 400);
            }

            // Generar nombre único para el archivo
            $uploadedFileName = 'DISPENSER-' . time() . '_' . str_replace(' ', '_', $originalFilename);

            // Crear directorio si no existe
            $storagePath = storage_path('app/public/dispenser');
            if (!file_exists($storagePath)) {
                mkdir($storagePath, 0755, true);
            }

            // Mover archivo a storage (temporal hasta confirmar)
            $file->move($storagePath, $uploadedFileName);
            $fullPath = $storagePath . '/' . $uploadedFileName;

            // Procesar el archivo Excel en modo PREVIEW (no guarda nada)
            $import = new DispenserTransactionsImport(true, $importType, (int)$periodId); // true = preview mode
            Excel::import($import, $fullPath);
            $results = $import->getResults();

            return response()->json([
                'status' => 'success',
                'message' => 'Vista previa generada correctamente',
                'data' => [
                    'filename' => $originalFilename,
                    'stored_filename' => $uploadedFileName,
                    'import_type' => $importType,
                    'period_id' => $periodId,
                    'success' => $results['success'],
                    'errors' => $results['errors'],
                    'summary' => [
                        'total_success' => $import->getSuccessCount(),
                        'total_errors' => $import->getErrorCount(),
                    ]
                ]
            ], 200);

        } catch (Exception $e) {
            Log::error('Error en preview de dispensadora: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            $response = $this->helper::errorArray($e);
            return response()->json([
                'status' => 'fail',
                'message' => 'Error al procesar el archivo: ' . $e->getMessage(),
                'data' => $response['data']
            ], $response['code']);
        }
    }

    /**
     * Confirm and import dispenser Excel file
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function confirm(Request $request)
    {
        try {
            $uAuth = $request->user();
            $storedFilename = $request->input('stored_filename');
            $originalFilename = $request->input('original_filename');
            $importType = $request->input('import_type', 'models');
            $periodId = $request->input('period_id');

            if (empty($storedFilename)) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'No se especificó el archivo a procesar'
                ], 400);
            }

            if (empty($periodId)) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'No se especificó el período'
                ], 400);
            }

            $storagePath = storage_path('app/public/dispenser');
            $fullPath = $storagePath . '/' . $storedFilename;

            if (!file_exists($fullPath)) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'El archivo ya no existe. Por favor, vuelva a cargar el archivo.'
                ], 404);
            }

            // Crear registro de archivo
            $dispenserFile = DispenserFile::create([
                'dispfile_filename' => $storedFilename,
                'dispfile_original_filename' => $originalFilename,
                'dispfile_records_success' => 0,
                'dispfile_records_error' => 0,
                'dispfile_import_type' => $importType,
                'dispfile_period_id' => $periodId,
                'created_by' => $uAuth->user_id,
            ]);

            // Procesar el archivo Excel (modo normal, SÍ guarda)
            $import = new DispenserTransactionsImport(false, $importType, (int)$periodId); // false = save mode
            Excel::import($import, $fullPath);
            $results = $import->getResults();

            // Actualizar contadores en el registro del archivo
            $dispenserFile->update([
                'dispfile_records_success' => $import->getSuccessCount(),
                'dispfile_records_error' => $import->getErrorCount(),
            ]);

            // Refrescar el modelo para tener los datos actualizados
            $dispenserFile->refresh();

            // Log de la operación
            $this->log::storeLog(
                $uAuth,
                'dispenser_files',
                $dispenserFile->dispfile_id,
                'IMPORT',
                null,
                $dispenserFile,
                $request->ip()
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Transacciones guardadas correctamente',
                'data' => [
                    'file_id' => $dispenserFile->dispfile_id,
                    'filename' => $originalFilename,
                    'import_type' => $importType,
                    'period_id' => $periodId,
                    'success' => $results['success'],
                    'errors' => $results['errors'],
                    'summary' => [
                        'total_success' => $import->getSuccessCount(),
                        'total_errors' => $import->getErrorCount(),
                    ]
                ]
            ], 200);

        } catch (Exception $e) {
            Log::error('Error en confirmación de dispensadora: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            $response = $this->helper::errorArray($e);
            return response()->json([
                'status' => 'fail',
                'message' => 'Error al guardar transacciones: ' . $e->getMessage(),
                'data' => $response['data']
            ], $response['code']);
        }
    }

    /**
     * Import dispenser Excel file (legacy - redirects to preview)
     *
     * @param UploadDispenserDataRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function import(UploadDispenserDataRequest $request)
    {
        // Redirigir al nuevo flujo de preview
        return $this->preview($request);
    }

    /**
     * Get list of dispenser files
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $files = DispenserFile::with('createdBy')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $files
            ], 200);

        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Delete a dispenser file record
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, $id)
    {
        try {
            $uAuth = $request->user();
            $dispenserFile = DispenserFile::findOrFail($id);
            $before = clone $dispenserFile;

            // Soft delete
            $dispenserFile->deleted_at = now();
            $dispenserFile->save();

            $this->log::storeLog($uAuth, 'dispenser_files', $id, 'DELETE', $before, null, $request->ip());

            return response()->json([
                'status' => 'success',
                'message' => 'Registro eliminado correctamente'
            ], 200);

        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Get available periods for models (1-week periods)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getModelPeriods(Request $request)
    {
        try {
            $periods = Period::select([
                    'period_id',
                    'period_start_date',
                    'period_end_date',
                    'period_state'
                ])
                ->orderBy('period_start_date', 'desc')
                ->limit(52) // Últimas 52 semanas (1 año)
                ->get()
                ->map(function ($period) {
                    return [
                        'period_id' => $period->period_id,
                        'label' => $period->period_start_date . ' al ' . $period->period_end_date . ' (' . $period->period_state . ')',
                        'start_date' => $period->period_start_date,
                        'end_date' => $period->period_end_date,
                        'state' => $period->period_state
                    ];
                });

            return response()->json([
                'status' => 'success',
                'data' => $periods
            ], 200);

        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Get available periods for payroll (15-day periods)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPayrollPeriods(Request $request)
    {
        try {
            $uAuth = $request->user();

            // Obtener el estudio del usuario autenticado
            // El usuario tiene std_id directamente en su registro
            $studioId = $uAuth->std_id;

            $query = PayrollPeriod::select([
                    'payroll_period_id',
                    'payroll_period_start_date',
                    'payroll_period_end_date',
                    'payroll_period_state'
                ])
                ->orderBy('payroll_period_start_date', 'desc')
                ->limit(24); // Últimos 24 períodos (1 año aprox)

            // Si hay estudio, filtrar por estudio
            if ($studioId) {
                $query->where('std_id', $studioId);
            }

            $periods = $query->get()->map(function ($period) {
                return [
                    'payroll_period_id' => $period->payroll_period_id,
                    'label' => $period->payroll_period_start_date->format('Y-m-d') . ' al ' .
                               $period->payroll_period_end_date->format('Y-m-d') . ' (' .
                               $period->payroll_period_state . ')',
                    'start_date' => $period->payroll_period_start_date->format('Y-m-d'),
                    'end_date' => $period->payroll_period_end_date->format('Y-m-d'),
                    'state' => $period->payroll_period_state
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => $periods
            ], 200);

        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }
}
