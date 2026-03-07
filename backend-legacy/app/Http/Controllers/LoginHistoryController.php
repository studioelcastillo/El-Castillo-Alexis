<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LoginHistory;
use App\Library\HelperController;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\DB;
use Exception;
use DateTime;

class LoginHistoryController extends Controller
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
    public function showToDatatable(Request $request)
    {
        try {
            $loghists = LoginHistory::orderBy('lgnhist_id', 'DESC')
            ->where('lgnhist_expire_at', '<', now())
            ->whereNull('lgnhist_logout')
            ->get();

            foreach($loghists as $loghist) {
                $loghist->lgnhist_logout = $loghist->lgnhist_expire_at;
                $loghist->save();
            }

            $skip = $request['start'];
            $take = $request['length'];
            $orderby = $request['sortby'];
            $dir = $request['dir'];
            $filter = $request['filter'];

            $login_history = LoginHistory::select('users.user_name', 'users.user_surname', 'login_history.*')
        	->join('users', 'login_history.user_id', 'users.user_id')
            ->where(function ($query) use ($filter) {
            	if ($filter != '') {
            		$query->where(DB::raw("UPPER(COALESCE(users.user_name, '') || ' ' || COALESCE(users.user_surname, ''))"), 'like', '%'.strtoupper($filter).'%');
            		$query->orWhere('users.user_identification', 'like', '%'.$filter.'%');
            	}
            });
            $login_history_total = clone $login_history;
            $login_history_total = $login_history_total->count();

            $take = ($take == 0) ? $login_history_total : $take; //all selected as option
            $login_history = $login_history
            ->skip($skip)
            ->take($take)
            ->orderBy($orderby, $dir)
            ->get();

            return response()->json([ 'status' => 'success', 'recordsTotal' => $login_history_total, 'data' => $login_history], 200);
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }
}
