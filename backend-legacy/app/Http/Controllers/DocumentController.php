<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Models\Document;
use ZipArchive;

class DocumentController extends Controller
{

    public function uploadImageDocument(Request $request)
    {
        try {
            $data = $request->all();
            // validamos los datos
            $this->validate($request, [
                    'files' => 'mimes:jpeg,bmp,png,gif,svg|max:9000',
                ],
                [ 'files' => 'La imagen no esta dentro de los formatos soportados jpeg, jpg, bmp, png, gif, svg']
            );
            if ($request->has('files')) {
            	if (isset($data['doc_id'])) {
            		$document = Document::findOrFail($data['doc_id']);
            	}
            	else {
            		$data['doc_type'] = 'image';
            		$data['doc_url'] = '';
            		$document = Document::create($data);		
            	}
            	
                $file = $data['files'];
                $original_filename = $file->getClientOriginalName();
                $original_filename_arr = explode('.', $original_filename);
                $file_ext = end($original_filename_arr);
                $uploadedFileName = $document->doc_label . '_' . $document->doc_id . '.' . $file_ext;

                // save file in server
                $file->move(public_path('images/models/documents'), $uploadedFileName);
                // create file record
                $document->doc_url = $uploadedFileName;
                $document->save();
            }

            return response()->json(['status' => 'success', 'data' => $document->doc_id], 200);
        } catch (Exception $e) {
        }
    }

    public function downloadUserImages(Request $request) 
    {
        $documents = Document::with(['user:user_id,user_name,user_surname', 'user_additional:usraddmod_id,usraddmod_name'])
        ->where('user_id', $request['user_id'])
        ->where('doc_type', 'image')
        ->get();
        if (isset($documents) && count($documents) > 0) {
            $file_name = 'Documentos_' . $documents[0]->user->user_name . '_' . $documents[0]->user->user_surname . '.zip';
            $zip = new ZipArchive;
            if ($zip->open($file_name, ZipArchive::CREATE | ZipArchive::OVERWRITE)) {
                $currentTime = time();
                foreach ($documents as $index => $document) {
                    $user_name = ($document->usraddmod_id == null) ? $document->user->user_name . $document->user->user_surname : $document->user_additional->usraddmod_name;
                    // Extraer solo el nombre del archivo (después del último '/')
                    $file_name_only = substr($document->doc_url, strrpos($document->doc_url, '/') + 1);
                    $zip->addFile(public_path('images/models/documents/'.$document->doc_url), $user_name . '_' . $file_name_only);
                    // Establecer la fecha de modificación al momento actual
                    $zip->setMtimeIndex($index, $currentTime);
                }
                $zip->close();
            }
            return response()->download($file_name)->deleteFileAfterSend(true);
        }
        echo "<script>window.close();</script>";
    }
    
    public function uploadVideoDocument(Request $request)
    {
        try {
            $data = $request->all();
            //validamos los datos
            $this->validate($request, ['files' => 'mimes:mp4,mov,ogg,qt,avi,flv,webm|max:9000'],
                [ 'files' => 'El video no esta dentro de los formatos soportados mp4, mov, ogg, qt, avi, flv, webm']
            );

            if ($request->has('files')) {
                $data['doc_type'] = 'video';
                $data['doc_url'] = '';
                
                $file = $data['files'];
                $original_filename = $file->getClientOriginalName();
                $original_filename_arr = explode('.', $original_filename);
                $data['doc_label'] = current($original_filename_arr);
                $file_ext = end($original_filename_arr);

                $document = Document::create($data);
                $uploadedFileName = $document->doc_label . '_' . $document->doc_id . '.' . $file_ext;

                // save file in server
                $file->move(public_path('uploads/videos'), $uploadedFileName);
                // create file record
                $document->doc_url = $uploadedFileName;
                $document->save();
            }

            return response()->json(['status' => 'success', 'data' => $document->doc_id], 200);
        } catch (Exception $e) {
            return response()->json($e);
        }
    }

    public function getUserVideos(Request $request)
    {
        try {
            $videoss = Document::select('doc_id', 'doc_label', 'doc_url', DB::raw("TO_CHAR(created_at, 'YYYY-MM-DD') AS created_date"))
            ->where('user_id', $request->input('user_id'))
            ->where('doc_type', 'video')
            ->orderBy('created_at', 'desc')
            ->get();
            $videos = array();
            foreach ($videoss as $video) {
                $videos[$video->created_date][] = $video;
            }
            return response()->json(['status' => 'success', 'data' => $videos], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            return response()->json($e);
        }
    }

    public function destroy(Request $request, $id, $type)
    {
        try {
            $request['id'] = $id;

            $this->validate($request, [
                'id' => 'required|integer|exists:documents,doc_id'
            ]);
            $document = Document::findOrFail($id);
            if ($type === 'document') {
                $path_folder = 'images/models/documents';
                $document_path = public_path($path_folder) . '/' . $document->doc_url;
            }
            else {
                $path_folder = ($type == 'image_multimedia') ? 'images' : 'videos';
                $document_path = public_path('uploads/' . $path_folder) . '/' . $document->doc_url;
            }
            if (file_exists($document_path)) {
                if (unlink($document_path)) {
                    $document->delete();
                } else {
                    return response()->json(['status' => 'fail'], 500);
                }
            } else {
                return response()->json(['status' => 'fail'], 500);
            }
            
            if ($document) {
                return response()->json(['status' => 'success', 'data' => $document->doc_id], 200);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }
        } catch (Exception $e) {
            dd($e->getMessage());
            return response()->json($e);
        }
    }

    public function uploadImageMultimediaDocument(Request $request)
    {
        try {
            $data = $request->all();
            //validamos los datos
            $this->validate($request, ['files' => 'mimes:jpeg,bmp,png,gif,svg|max:9000'],
                [ 'files' => 'La imagen no esta dentro de los formatos soportados jpeg, jpg, bmp, png, gif, svg']
            );

            if ($request->has('files')) {
                $data['doc_type'] = 'image_multimedia';
                $data['doc_url'] = '';
                
                $file = $data['files'];
                $original_filename = $file->getClientOriginalName();
                $original_filename_arr = explode('.', $original_filename);
                $data['doc_label'] = current($original_filename_arr);
                $file_ext = end($original_filename_arr);

                $document = Document::create($data);
                $uploadedFileName = $document->doc_label . '_' . $document->doc_id . '.' . $file_ext;

                // save file in server
                $file->move(public_path('uploads/images'), $uploadedFileName);
                // create file record
                $document->doc_url = $uploadedFileName;
                $document->save();
            }

            return response()->json(['status' => 'success', 'data' => $document->doc_id], 200);
        } catch (Exception $e) {
            return response()->json($e);
        }
    }

    public function getUserImagesMultimedia(Request $request)
    {
        try {
            $imagess = Document::select('doc_id', 'doc_label', 'doc_url', DB::raw("TO_CHAR(created_at, 'YYYY-MM-DD') AS created_date"))
            ->where('user_id', $request->input('user_id'))
            ->where('doc_type', 'image_multimedia')
            ->orderBy('created_at', 'desc')
            ->get();
            $images = array();
            foreach ($imagess as $image) {
                $images[$image->created_date][] = $image;
            }
            return response()->json(['status' => 'success', 'data' => $images], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            return response()->json($e);
        }
    }

    public function getProfilePictureOfUser(Request $request)
    {
        try {
            $profile_picture = Document::select('doc_url')
            ->where('user_id', $request->input('user_id'))
            ->where('doc_type', 'image')
            ->where('doc_label', 'IMG_PROFILE')
            ->orderBy('created_at', 'desc')
            ->first();
            return response()->json(['status' => 'success', 'data' => $profile_picture], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            return response()->json($e);
        }

    }
}
