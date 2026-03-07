<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Log;
use App\Library\HelperController;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\LogsExport;
use Exception;
use DateTime;

class LogController extends Controller
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
            $log = Log::with('user')
                    ->where($data['where'])
                    ->orWhere($data['orWhere'])
                    ->whereRaw($data['whereRaw'])
                    ->whereNull('deleted_at')
                    ->orderby('created_at', 'Desc')
                    ->get();
            return response()->json(['status' => 'success', 'data' => $log], 200);
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function showToDatatable(Request $request)
    {
        try {
            $columns = $request['columns'];
            $columns = explode(',', $columns);
            $skip = $request['start'];
            $take = $request['length'];
            $orderby = $request['sortby'];
            $dir = $request['dir'];
            $filter = $request['filter'];
            unset($request['columns'], $request['start'], $request['length'], $request['sortby'], $request['dir'], $request['filter']);
            $data = $this->helper::generateConditions($request);

            $recordsTotal = Log::select('logs.*')
                ->leftJoin('users', 'logs.user_id', '=', 'users.user_id')
                ->where($data['where'])
                ->orWhere($data['orWhere'])
                ->whereRaw($data['whereRaw'])
                ->whereNull('logs.deleted_at')
                ->where(function ($query) use ($columns, $filter) {
                    for ($i=0; $i < count($columns); $i++) {
                        if ($i === 0) {
                            $query->where(DB::raw("UPPER(CAST(".$columns[$i]." as VARCHAR))"), 'like', '%'.strtoupper($filter).'%');
                        } else {
                            $query->orWhere(DB::raw("UPPER(CAST(".$columns[$i]." as VARCHAR))"), 'like', '%'.strtoupper($filter).'%');
                        }
                    }
                })
                ->count();

            $take = ($take == 0) ? $recordsTotal : $take;

            $log = Log::select('logs.*')
                    ->with('user')
                    ->leftJoin('users', 'logs.user_id', '=', 'users.user_id')
                    ->where($data['where'])
                    ->orWhere($data['orWhere'])
                    ->whereRaw($data['whereRaw'])
                    ->whereNull('logs.deleted_at')
                    ->where(function ($query) use ($columns, $filter) {
                        for ($i=0; $i < count($columns); $i++) {
                            if ($i === 0) {
                                $query->where(DB::raw("UPPER(CAST(".$columns[$i]." as VARCHAR))"), 'like', '%'.strtoupper($filter).'%');
                            } else {
                                $query->orWhere(DB::raw("UPPER(CAST(".$columns[$i]." as VARCHAR))"), 'like', '%'.strtoupper($filter).'%');
                            }
                        }
                    })
                    ->skip($skip)
                    ->take($take)
                    ->orderBy($orderby, $dir)
                    ->get();
            
            $recordsFiltered = count($log);
            return response()->json([
                'status' => 'success',
                'recordsTotal' => $recordsTotal,
                'recordsFiltered' => $recordsFiltered,
                'data' => $log
            ], 200);
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }


    /**
     * Export
     *
     * @return excel
     */
    public function export(Request $request)
    {
        $tz = $request['tz'];
        unset($request['tz']);
        unset($request['tzo']);
        unset($request['access_token']);
        return Excel::download(new LogsExport($request, $tz), 'log_'.date('Y-m-d').'.xlsx');
    }
}
