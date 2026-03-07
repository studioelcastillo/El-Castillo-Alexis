<?php

namespace App\Traits;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Validator;
use Illuminate\Pagination\LengthAwarePaginator;

trait ApiResponser
{
    /**
     * @OA\Schema(
     *   schema="SuccessResponse",
     *   type="object",
     *   @OA\Property(property="status", type="string", default="Success"),
     *   @OA\Property(property="message", type="string", default=""),
     *   @OA\Property(property="data", type="object")
     * )
     */
    protected function successResponse($data, $message = null, $code = 200)
    {
        return response()->json([
            'status'=> 'Success',
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    /**
     * @OA\Schema(
     *   schema="QueryResponse",
     *   type="object",
     *   @OA\Property(property="status", type="string", default="Success"),
     *   @OA\Property(
     *          property="data",
     *          type="array",
     *          @OA\Items(
     *              type="object"
     *          )
     *   )
     * )
     */
    protected function queryResponse($data, $code = 200)
    {
        $response = array();
        
        $response = array_merge(['status'=> 'Success'], $data);
        return response()->json($response, $code);
        // return response()->json([
        //     'status'=> 'Success',
        //     'message' => $message,
        //     'data' => $data,
        // ], $code);
    }

    /**
     * @OA\Schema(
     *   schema="ErrorResponse",
     *   type="object",
     *   @OA\Property(property="status", type="string", default="Error"),
     *   @OA\Property(property="message", type="string", default=""),
     *   @OA\Property(property="data", type="object")
     * )
     */
    protected function errorResponse($data = null, $message = null, $code = 400, $error = null)
    {
        return response()->json([
            'status'=>'Error',
            'message' => $message,
            'data' => $data,
            'error' => $error,
        ], $code);
    }
}
