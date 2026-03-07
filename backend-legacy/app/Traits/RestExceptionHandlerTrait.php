<?php

namespace App\Traits;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Log;

trait RestExceptionHandlerTrait
{
    /**
     * Creates a new JSON response based on exception type.
     *
     * @param Request $request
     * @param Exception $e
     * @return \Illuminate\Http\JsonResponse
     */
    protected function getJsonResponseForException(Request $request, Exception $e)
    {
        // new
        $error = json_decode($e->getMessage());
        // Si posee la estructura del error handler >> generar un mensaje standarizado,
        // esto para que errores como el de Validator::make(), se salte este metodo y muestre el error completo.
        // ej: "The given data was invalid."
        if (isset($error->error)) {
            $response = [
                'data' => (isset($error->data)) ? $error->data : null,
                'message' => (isset($error->message)) ? $error->message : null,
                'code' => (isset($error->code)) ? $error->code : 400,
                'error' => (isset($error->error)) ? $error->error : null,
            ];
            // Log::info('on RestExceptionsHandler');
            // Log::info(json_encode($response));
            // Log::info(json_encode($e->getMessage()));
            return $response;
        } else {
            return false;
        }

        /////////////////////////////////////////////////////////////////////////
        // codigo de la anterior plantilla, se debe validar que es util de aca //
        /////////////////////////////////////////////////////////////////////////

        // log::info($e);
        // $message = '';
        // $error = '';
        // $error_code = '';
        // $position = 0;
        // $code = 500;
        
        // // SQLSTATE
        // if (strlen(stristr($e->getMessage(),'SQLSTATE'))>0) {
        //   $message = $e->getMessage();
        //   $error = array('SQLSTATE' => array('SQLSTATE'));
        // // IMPORT
        // } else if (strlen(stristr($e->getMessage(),'IMPORT'))>0) {
        //   $data = json_decode($e->getMessage());
        //   $message = ($data->message) ? $data->message : 'The given data was invalid.' ;
        //   $error_code = ($data->code) ? $data->code : '' ;
        //   $error = $data->errors;
        //   $position = $data->position;
        //   $code = 422;
        // } else if (strlen(stristr($e->getMessage(),'Host desconocido'))>0 || strlen(stristr($e->getMessage(),'SMTP'))>0 || strlen(stristr($e->getMessage(),'Connection could not be established'))>0) {
        //   $message = $e->getMessage();
        //   $error = array('EMAILDOESNOTWORK' => array('emaildoesnotwork'));  
        // } else {
        //   $message = $e->getMessage();
        //   $error = $e->getMessage();
        //   $code = 422;
        // }

        // $data = array(
        //   'status' => 'fail',
        //   'message' => $message,
        //   'position' => $position,
        //   'code' => $error_code,
        //   'error' => $error
        // );
        // $response = array(
        //   'data' => $data,
        //   'message' => $message,
        //   'code' => $code
        // );
        // return $response;
    }

    /**
     * Determines if the given exception is an Eloquent model not found.
     *
     * @param Exception $e
     * @return bool
     */
    protected function isModelNotFoundException(Exception $e)
    {
        return $e instanceof ModelNotFoundException;
    }
}
