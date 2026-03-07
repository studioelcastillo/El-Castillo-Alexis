<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Exception;

use App\Library\HelperController;
use App\Library\LogController;
use App\Models\User;
use App\Models\Profile;
use App\Models\StudioModel;
use App\Models\Studio;
use App\Models\UserSignature;
use App\Models\DocumentSignature;

class SignatureController extends Controller
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
     * Store or update user signature (imagen o canvas).
     *
     * @return response()->json
     */
    public function storeUserSignature(Request $request)
    {
        try {
            DB::beginTransaction();
            $uAuth = $request->user();

            // Validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            // Validate data
            $this->validate($request, [
                'signature_data' => 'required|string',
                'signature_type' => 'required|string|in:image_upload,canvas,biometric,text_generated',
            ]);

            $signatureData = $request->input('signature_data');
            $signatureType = $request->input('signature_type');

            // Detect image format from base64 data
            $imageExtension = 'png'; // default
            if (strpos($signatureData, 'data:image') === 0) {
                // Extract format from data URL (e.g., data:image/jpeg;base64,...)
                preg_match('/^data:image\/(\w+);base64,/', $signatureData, $matches);
                if (isset($matches[1])) {
                    $detectedFormat = strtolower($matches[1]);
                    if (in_array($detectedFormat, ['png', 'jpg', 'jpeg'])) {
                        $imageExtension = ($detectedFormat === 'jpg') ? 'jpeg' : $detectedFormat;
                    }
                }
                $signatureData = preg_replace('/^data:image\/\w+;base64,/', '', $signatureData);
            }

            $imageData = base64_decode($signatureData);

            if ($imageData === false) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Datos de firma inválidos',
                ], 400);
            }

            // Validate image format
            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->buffer($imageData);
            $allowedMimes = ['image/png', 'image/jpeg', 'image/jpg'];

            if (!in_array($mimeType, $allowedMimes)) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Formato de imagen no permitido. Solo PNG y JPG son aceptados.',
                ], 400);
            }

            // Generate unique filename with detected extension
            $filename = 'signature_' . $uAuth->user_id . '_' . time() . '.' . $imageExtension;

            // Create directory if it doesn't exist
            $uploadPath = public_path('uploads/signatures');
            if (!file_exists($uploadPath)) {
                mkdir($uploadPath, 0755, true);
            }

            // Save image to public/uploads/signatures
            $fullPath = $uploadPath . '/' . $filename;
            file_put_contents($fullPath, $imageData);

            // Deactivate previous signatures
            UserSignature::where('user_id', $uAuth->user_id)
                ->update(['usrsig_active' => false]);

            // Create new signature record
            $signature = UserSignature::create([
                'user_id' => $uAuth->user_id,
                'usrsig_image_path' => $filename,
                'usrsig_type' => $signatureType,
                'usrsig_active' => true,
            ]);

            if ($signature) {
                $this->log::storeLog($uAuth, 'user_signatures', $signature->usrsig_id, 'INSERT', null, $signature, $request->ip());
                DB::commit();
                return response()->json([
                    'status' => 'success',
                    'data' => $signature,
                    'message' => 'Firma guardada exitosamente',
                ], 201);
            } else {
                DB::rollBack();
                return response()->json(['status' => 'fail', 'message' => 'Error al guardar la firma'], 500);
            }
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error in storeUserSignature: ' . $e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Get current active signature for authenticated user.
     *
     * @return response()->json
     */
    public function getCurrentUserSignature(Request $request)
    {
        try {
            $uAuth = $request->user();

            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            $signature = UserSignature::where('user_id', $uAuth->user_id)
                ->where('usrsig_active', true)
                ->first();

            if ($signature) {
                return response()->json([
                    'status' => 'success',
                    'data' => $signature,
                ], 200);
            } else {
                return response()->json([
                    'status' => 'success',
                    'data' => null,
                    'message' => 'No se encontró firma activa',
                ], 200);
            }
        } catch (Exception $e) {
            Log::error('Error in getCurrentUserSignature: ' . $e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Get available documents for model to sign.
     *
     * @return response()->json
     */
    public function getAvailableDocuments(Request $request)
    {
        try {
            $uAuth = $request->user();

            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            // Verify user is a model
            if (!in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Acceso no autorizado',
                ], 403);
            }

            // Get pagination params
            $perPage = $request->input('per_page', 10);
            $page = $request->input('page', 1);
            $search = $request->input('search', '');

            // Get all studio models for this user
            $studioModels = StudioModel::with(['studio', 'studioShift'])
                ->where('user_id_model', $uAuth->user_id)
                ->whereNull('deleted_at')
                ->get();

            $documents = [];
            $documentTypes = ['contract', 'code_conduct', 'habeas_data'];
            $documentTypeNames = [
                'contract' => 'contrato',
                'code_conduct' => 'código de conducta',
                'habeas_data' => 'habeas data'
            ];

            foreach ($studioModels as $studioModel) {
                foreach ($documentTypes as $docType) {
                    // Check if already signed by model
                    $alreadySigned = DocumentSignature::where('stdmod_id', $studioModel->stdmod_id)
                        ->where('docsig_document_type', $docType)
                        ->where('docsig_role', 'model')
                        ->exists();

                    if (!$alreadySigned) {
                        $document = [
                            'stdmod_id' => $studioModel->stdmod_id,
                            'document_type' => $docType,
                            'studio_name' => $studioModel->studio->std_name ?? 'N/A',
                            'contract_type' => $studioModel->stdmod_contract_type,
                            'start_date' => $studioModel->stdmod_start_at,
                            'requires_owner' => DocumentSignature::requiresOwnerSignature($docType),
                        ];

                        // Apply search filter
                        if ($search) {
                            $searchLower = strtolower($search);
                            $matches =
                                strpos(strtolower($documentTypeNames[$docType]), $searchLower) !== false ||
                                strpos(strtolower($document['studio_name']), $searchLower) !== false ||
                                strpos(strtolower($document['contract_type']), $searchLower) !== false;

                            if ($matches) {
                                $documents[] = $document;
                            }
                        } else {
                            $documents[] = $document;
                        }
                    }
                }
            }

            // Manual pagination
            $total = count($documents);
            $offset = ($page - 1) * $perPage;
            $paginatedDocuments = array_slice($documents, $offset, $perPage);

            return response()->json([
                'status' => 'success',
                'data' => $paginatedDocuments,
                'pagination' => [
                    'current_page' => (int)$page,
                    'per_page' => (int)$perPage,
                    'total' => $total,
                    'last_page' => ceil($total / $perPage),
                    'from' => $offset + 1,
                    'to' => min($offset + $perPage, $total),
                ],
            ], 200);
        } catch (Exception $e) {
            Log::error('Error in getAvailableDocuments: ' . $e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Get signed documents for model.
     *
     * @return response()->json
     */
    public function getSignedDocuments(Request $request)
    {
        try {
            $uAuth = $request->user();

            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            // Verify user is a model
            if (!in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Acceso no autorizado',
                ], 403);
            }

            // Get pagination params
            $perPage = $request->input('per_page', 10);
            $search = $request->input('search', '');

            // Build query for signed documents
            $query = DocumentSignature::with([
                    'studioModel' => function($query) {
                        $query->whereNull('deleted_at')
                              ->with(['studio' => function($q) {
                                  $q->whereNull('deleted_at');
                              }]);
                    },
                    'userSignature'
                ])
                ->where('docsig_signed_by_user_id', $uAuth->user_id)
                ->where('docsig_role', 'model')
                ->whereNull('deleted_at');

            // Apply search filter
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('docsig_document_type', 'like', '%' . $search . '%')
                      ->orWhereHas('studioModel.studio', function($sq) use ($search) {
                          $sq->where('std_name', 'like', '%' . $search . '%');
                      })
                      ->orWhereHas('studioModel', function($sq) use ($search) {
                          $sq->where('stdmod_contract_type', 'like', '%' . $search . '%');
                      });
                });
            }

            $signedDocuments = $query->orderBy('docsig_signed_at', 'desc')
                                    ->paginate($perPage);

            // Add studio name at root level for easier access
            $signedDocuments->getCollection()->transform(function($doc) {
                $doc->studio_name = $doc->studioModel && $doc->studioModel->studio
                    ? $doc->studioModel->studio->std_name
                    : 'N/A';
                $doc->contract_type = $doc->studioModel
                    ? $doc->studioModel->stdmod_contract_type
                    : 'N/A';
                return $doc;
            });

            return response()->json([
                'status' => 'success',
                'data' => $signedDocuments->items(),
                'pagination' => [
                    'current_page' => $signedDocuments->currentPage(),
                    'per_page' => $signedDocuments->perPage(),
                    'total' => $signedDocuments->total(),
                    'last_page' => $signedDocuments->lastPage(),
                    'from' => $signedDocuments->firstItem(),
                    'to' => $signedDocuments->lastItem(),
                ],
            ], 200);
        } catch (Exception $e) {
            Log::error('Error in getSignedDocuments: ' . $e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Sign a document as model.
     *
     * @return response()->json
     */
    public function signDocument(Request $request)
    {
        try {
            DB::beginTransaction();
            $uAuth = $request->user();

            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            // Verify user is a model
            if (!in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Acceso no autorizado',
                ], 403);
            }

            // Validate data
            $this->validate($request, [
                'stdmod_id' => 'required|exists:studios_models,stdmod_id',
                'document_type' => 'required|string|in:contract,certification,bank_letter,code_conduct,habeas_data',
            ]);

            $stdmodId = $request->input('stdmod_id');
            $documentType = $request->input('document_type');

            // Verify this studio model belongs to the user
            $studioModel = StudioModel::where('stdmod_id', $stdmodId)
                ->where('user_id_model', $uAuth->user_id)
                ->first();

            if (!$studioModel) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'No tienes permiso para firmar este documento',
                ], 403);
            }

            // Verify document type requires model signature
            if (!DocumentSignature::requiresModelSignature($documentType)) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Este tipo de documento no requiere firma de modelo',
                ], 400);
            }

            // Check if already signed
            $existingSignature = DocumentSignature::where('stdmod_id', $stdmodId)
                ->where('docsig_document_type', $documentType)
                ->where('docsig_role', 'model')
                ->exists();

            if ($existingSignature) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Este documento ya ha sido firmado',
                ], 400);
            }

            // Get active signature
            $userSignature = UserSignature::where('user_id', $uAuth->user_id)
                ->where('usrsig_active', true)
                ->first();

            if (!$userSignature) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'No tienes una firma activa. Por favor crea una firma primero.',
                ], 400);
            }

            // Create signature record
            $documentSignature = DocumentSignature::create([
                'stdmod_id' => $stdmodId,
                'docsig_document_type' => $documentType,
                'docsig_signed_by_user_id' => $uAuth->user_id,
                'docsig_role' => 'model',
                'usrsig_id' => $userSignature->usrsig_id,
                'docsig_ip_address' => $request->ip(),
                'docsig_user_agent' => $request->header('User-Agent'),
                'docsig_signed_at' => Carbon::now(),
            ]);

            if ($documentSignature) {
                $this->log::storeLog($uAuth, 'document_signatures', $documentSignature->docsig_id, 'INSERT', null, $documentSignature, $request->ip());

                // Auto-sign for owner if they have an active signature and document requires owner signature
                if (DocumentSignature::requiresOwnerSignature($documentType)) {
                    // Get studio and owner info
                    $studio = Studio::where('std_id', $studioModel->std_id)->first();
                    if ($studio && $studio->user_id_owner) {
                        // Check if owner has active signature
                        $ownerSignature = UserSignature::where('user_id', $studio->user_id_owner)
                            ->where('usrsig_active', true)
                            ->first();

                        // Check if owner hasn't signed yet
                        $ownerAlreadySigned = DocumentSignature::where('stdmod_id', $stdmodId)
                            ->where('docsig_document_type', $documentType)
                            ->where('docsig_role', 'owner')
                            ->exists();

                        if ($ownerSignature && !$ownerAlreadySigned) {
                            // Auto-sign for owner
                            $ownerDocSignature = DocumentSignature::create([
                                'stdmod_id' => $stdmodId,
                                'docsig_document_type' => $documentType,
                                'docsig_signed_by_user_id' => $studio->user_id_owner,
                                'docsig_role' => 'owner',
                                'usrsig_id' => $ownerSignature->usrsig_id,
                                'docsig_ip_address' => $request->ip(),
                                'docsig_user_agent' => 'Auto-signed when model signed',
                                'docsig_signed_at' => Carbon::now(),
                            ]);

                            if ($ownerDocSignature) {
                                $this->log::storeLog($uAuth, 'document_signatures', $ownerDocSignature->docsig_id, 'INSERT', null, $ownerDocSignature, $request->ip());
                            }
                        }
                    }
                }

                DB::commit();
                return response()->json([
                    'status' => 'success',
                    'data' => $documentSignature,
                    'message' => 'Documento firmado exitosamente',
                ], 201);
            } else {
                DB::rollBack();
                return response()->json(['status' => 'fail', 'message' => 'Error al firmar el documento'], 500);
            }
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error in signDocument: ' . $e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Get signature status for a specific document.
     *
     * @return response()->json
     */
    public function getDocumentSignatureStatus(Request $request, $stdmodId, $type)
    {
        try {
            $uAuth = $request->user();

            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            $studioModel = StudioModel::findOrFail($stdmodId);

            // Verify access (user is model or owner of studio)
            $isModel = $studioModel->user_id_model == $uAuth->user_id;
            $isOwner = false;

            if (!$isModel && $uAuth->prof_id == Profile::ESTUDIO) {
                $studio = Studio::where('std_id', $studioModel->std_id)
                    ->where('user_id_owner', $uAuth->user_id)
                    ->first();
                $isOwner = $studio !== null;
            }

            if (!$isModel && !$isOwner) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Acceso no autorizado',
                ], 403);
            }

            $status = $studioModel->getSignatureStatus($type);

            // Get actual signatures
            $signatures = DocumentSignature::with(['signedByUser', 'userSignature'])
                ->where('stdmod_id', $stdmodId)
                ->where('docsig_document_type', $type)
                ->get();

            $status['signatures'] = $signatures;

            return response()->json([
                'status' => 'success',
                'data' => $status,
            ], 200);
        } catch (Exception $e) {
            Log::error('Error in getDocumentSignatureStatus: ' . $e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Sign a document as owner.
     *
     * @return response()->json
     */
    public function signAsOwner(Request $request)
    {
        try {
            DB::beginTransaction();
            $uAuth = $request->user();

            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            // Verify user is studio owner
            if ($uAuth->prof_id != Profile::ESTUDIO) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Acceso no autorizado. Solo propietarios de estudio pueden firmar.',
                ], 403);
            }

            // Validate data
            $this->validate($request, [
                'stdmod_id' => 'required|exists:studios_models,stdmod_id',
                'document_type' => 'required|string|in:contract,certification,bank_letter,code_conduct,habeas_data',
            ]);

            $stdmodId = $request->input('stdmod_id');
            $documentType = $request->input('document_type');

            // Verify this studio model belongs to owner's studio
            $studioModel = StudioModel::with('studio')->findOrFail($stdmodId);

            if ($studioModel->studio->user_id_owner != $uAuth->user_id) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'No tienes permiso para firmar este documento',
                ], 403);
            }

            // Verify document type requires owner signature
            if (!DocumentSignature::requiresOwnerSignature($documentType)) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Este tipo de documento no requiere firma de propietario',
                ], 400);
            }

            // Check if already signed
            $existingSignature = DocumentSignature::where('stdmod_id', $stdmodId)
                ->where('docsig_document_type', $documentType)
                ->where('docsig_role', 'owner')
                ->exists();

            if ($existingSignature) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Este documento ya ha sido firmado',
                ], 400);
            }

            // Get active signature
            $userSignature = UserSignature::where('user_id', $uAuth->user_id)
                ->where('usrsig_active', true)
                ->first();

            if (!$userSignature) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'No tienes una firma activa. Por favor crea una firma primero.',
                ], 400);
            }

            // Create signature record
            $documentSignature = DocumentSignature::create([
                'stdmod_id' => $stdmodId,
                'docsig_document_type' => $documentType,
                'docsig_signed_by_user_id' => $uAuth->user_id,
                'docsig_role' => 'owner',
                'usrsig_id' => $userSignature->usrsig_id,
                'docsig_ip_address' => $request->ip(),
                'docsig_user_agent' => $request->header('User-Agent'),
                'docsig_signed_at' => Carbon::now(),
            ]);

            if ($documentSignature) {
                $this->log::storeLog($uAuth, 'document_signatures', $documentSignature->docsig_id, 'INSERT', null, $documentSignature, $request->ip());
                DB::commit();
                return response()->json([
                    'status' => 'success',
                    'data' => $documentSignature,
                    'message' => 'Documento firmado exitosamente',
                ], 201);
            } else {
                DB::rollBack();
                return response()->json(['status' => 'fail', 'message' => 'Error al firmar el documento'], 500);
            }
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error in signAsOwner: ' . $e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Get pending documents for owner to sign.
     *
     * @return response()->json
     */
    public function getOwnerPendingDocuments(Request $request)
    {
        try {
            $uAuth = $request->user();

            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            // Verify user is studio owner
            if ($uAuth->prof_id != Profile::ESTUDIO) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Acceso no autorizado',
                ], 403);
            }

            // Get pagination params
            $perPage = $request->input('per_page', 10);
            $page = $request->input('page', 1);
            $search = $request->input('search', '');

            // Get all studios owned by this user
            $studios = Studio::where('user_id_owner', $uAuth->user_id)->pluck('std_id');

            // Get all studio models for these studios
            $studioModels = StudioModel::with(['studio', 'userModel'])
                ->whereIn('std_id', $studios)
                ->whereNull('deleted_at')
                ->get();

            $documents = [];
            $documentTypes = ['contract', 'certification', 'bank_letter', 'code_conduct', 'habeas_data'];
            $documentTypeNames = [
                'contract' => 'contrato',
                'certification' => 'certificación',
                'bank_letter' => 'carta bancaria',
                'code_conduct' => 'código de conducta',
                'habeas_data' => 'habeas data'
            ];

            foreach ($studioModels as $studioModel) {
                foreach ($documentTypes as $docType) {
                    // Only include documents that require owner signature
                    if (DocumentSignature::requiresOwnerSignature($docType)) {
                        // Check if already signed by owner
                        $alreadySigned = DocumentSignature::where('stdmod_id', $studioModel->stdmod_id)
                            ->where('docsig_document_type', $docType)
                            ->where('docsig_role', 'owner')
                            ->exists();

                        if (!$alreadySigned) {
                            // Check if model has signed (for documents that require both)
                            $modelSigned = !DocumentSignature::requiresModelSignature($docType) ||
                                DocumentSignature::where('stdmod_id', $studioModel->stdmod_id)
                                    ->where('docsig_document_type', $docType)
                                    ->where('docsig_role', 'model')
                                    ->exists();

                            $document = [
                                'stdmod_id' => $studioModel->stdmod_id,
                                'document_type' => $docType,
                                'studio_name' => $studioModel->studio->std_name ?? 'N/A',
                                'model_name' => $studioModel->userModel->user_name ?? 'N/A',
                                'model_surname' => $studioModel->userModel->user_surname ?? '',
                                'contract_type' => $studioModel->stdmod_contract_type,
                                'start_date' => $studioModel->stdmod_start_at,
                                'model_signed' => $modelSigned,
                                'requires_model' => DocumentSignature::requiresModelSignature($docType),
                            ];

                            // Apply search filter
                            if ($search) {
                                $searchLower = strtolower($search);
                                $matches =
                                    strpos(strtolower($documentTypeNames[$docType]), $searchLower) !== false ||
                                    strpos(strtolower($document['studio_name']), $searchLower) !== false ||
                                    strpos(strtolower($document['model_name'] . ' ' . $document['model_surname']), $searchLower) !== false ||
                                    strpos(strtolower($document['contract_type']), $searchLower) !== false;

                                if ($matches) {
                                    $documents[] = $document;
                                }
                            } else {
                                $documents[] = $document;
                            }
                        }
                    }
                }
            }

            // Manual pagination
            $total = count($documents);
            $offset = ($page - 1) * $perPage;
            $paginatedDocuments = array_slice($documents, $offset, $perPage);

            return response()->json([
                'status' => 'success',
                'data' => $paginatedDocuments,
                'pagination' => [
                    'current_page' => (int)$page,
                    'per_page' => (int)$perPage,
                    'total' => $total,
                    'last_page' => ceil($total / $perPage),
                    'from' => $offset + 1,
                    'to' => min($offset + $perPage, $total),
                ],
            ], 200);
        } catch (Exception $e) {
            Log::error('Error in getOwnerPendingDocuments: ' . $e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Sign multiple documents as owner.
     *
     * @return response()->json
     */
    public function signMultipleAsOwner(Request $request)
    {
        try {
            DB::beginTransaction();
            $uAuth = $request->user();

            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            // Verify user is studio owner
            if ($uAuth->prof_id != Profile::ESTUDIO) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'Acceso no autorizado. Solo propietarios de estudio pueden firmar.',
                ], 403);
            }

            // Validate data
            $this->validate($request, [
                'documents' => 'required|array|min:1',
                'documents.*.stdmod_id' => 'required|exists:studios_models,stdmod_id',
                'documents.*.document_type' => 'required|string|in:contract,certification,bank_letter,code_conduct,habeas_data',
            ]);

            $documents = $request->input('documents');

            // Get active signature
            $userSignature = UserSignature::where('user_id', $uAuth->user_id)
                ->where('usrsig_active', true)
                ->first();

            if (!$userSignature) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'No tienes una firma activa. Por favor crea una firma primero.',
                ], 400);
            }

            $signedCount = 0;
            $errors = [];

            foreach ($documents as $doc) {
                $stdmodId = $doc['stdmod_id'];
                $documentType = $doc['document_type'];

                try {
                    // Verify this studio model belongs to owner's studio
                    $studioModel = StudioModel::with('studio')->findOrFail($stdmodId);

                    if ($studioModel->studio->user_id_owner != $uAuth->user_id) {
                        $errors[] = "No tienes permiso para firmar el documento {$documentType} del stdmod_id {$stdmodId}";
                        continue;
                    }

                    // Verify document type requires owner signature
                    if (!DocumentSignature::requiresOwnerSignature($documentType)) {
                        $errors[] = "El documento {$documentType} no requiere firma de propietario";
                        continue;
                    }

                    // Check if already signed
                    $existingSignature = DocumentSignature::where('stdmod_id', $stdmodId)
                        ->where('docsig_document_type', $documentType)
                        ->where('docsig_role', 'owner')
                        ->exists();

                    if ($existingSignature) {
                        $errors[] = "El documento {$documentType} del stdmod_id {$stdmodId} ya está firmado";
                        continue;
                    }

                    // Create signature record
                    $documentSignature = DocumentSignature::create([
                        'stdmod_id' => $stdmodId,
                        'docsig_document_type' => $documentType,
                        'docsig_signed_by_user_id' => $uAuth->user_id,
                        'docsig_role' => 'owner',
                        'usrsig_id' => $userSignature->usrsig_id,
                        'docsig_ip_address' => $request->ip(),
                        'docsig_user_agent' => $request->header('User-Agent'),
                        'docsig_signed_at' => Carbon::now(),
                    ]);

                    if ($documentSignature) {
                        $this->log::storeLog($uAuth, 'document_signatures', $documentSignature->docsig_id, 'INSERT', null, $documentSignature, $request->ip());
                        $signedCount++;
                    }
                } catch (Exception $e) {
                    $errors[] = "Error al firmar documento {$documentType} del stdmod_id {$stdmodId}: " . $e->getMessage();
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'signed_count' => $signedCount,
                    'errors' => $errors,
                ],
                'message' => "{$signedCount} documento(s) firmado(s) exitosamente",
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error in signMultipleAsOwner: ' . $e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }
}

