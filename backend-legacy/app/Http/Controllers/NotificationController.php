<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Exception;
use DateTime;

use App\Library\HelperController;
use App\Library\LogController;
use App\Models\Notification;
use App\Models\User;

class NotificationController extends Controller
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
     * Display the specified resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request)
    {
        $uAuth = $request->user();
        $skip = $request['start'];
        $take = $request['length'];
        $isTypeNull = ($request->has('noti_type') && $request['noti_type'] === 'null');
        if ($isTypeNull) { unset($request['noti_type']); };
        unset($request['start'], $request['length']);
        $data = $this->helper::generateConditions($request);

        $recordsTotal = Notification::where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->where('user_id_to_notify', $uAuth->user_id)
            ->where(function ($query) use ($isTypeNull) {
                if ($isTypeNull) {
                    $query->whereNull('noti_type');
                }
            })
            ->whereNull('deleted_at')
            ->count();

        $noReaded = Notification::where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->where('user_id_to_notify', $uAuth->user_id)
            ->where(function ($query) use ($isTypeNull) {
                if ($isTypeNull) {
                    $query->whereNull('noti_type');
                }
            })
            ->where('noti_read', false)
            ->whereNull('deleted_at')
            ->count();

        $take = ($take == 0) ? $recordsTotal : $take;

        $notifications = Notification::with(['from', 'to'])
                ->where($data['where'])
                ->orWhere($data['orWhere'])
                ->whereRaw($data['whereRaw'])
                ->where('user_id_to_notify', $uAuth->user_id)
                ->where(function ($query) use ($isTypeNull) {
                    if ($isTypeNull) {
                        $query->whereNull('noti_type');
                    }
                })
                ->whereNull('deleted_at')
                ->skip($skip)
                ->take($take)
                ->orderBy('created_at', 'DESC')
                ->get();
        

        return $this->queryResponse(['NoRead' => $noReaded, 'recordsTotal' => $recordsTotal, 'data' => $notifications]);
    }

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function showToDatatable(Request $request)
    {
        $uAuth = $request->user();
        $data = $this->helper::generateConditions($request);
        
        $types = Notification::select('noti_type')
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->where('user_id_to_notify', $uAuth->user_id)
            ->whereNull('notifications.deleted_at')
            ->groupBy('noti_type')
            ->orderBy('noti_type', 'ASC')
            ->get();

        $noReaded = Notification::select('noti_type', DB::raw('count(noti_read) as noRead'))
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->where('user_id_to_notify', $uAuth->user_id)
            ->where('noti_read', false)
            ->whereNull('notifications.deleted_at')
            ->groupBy('noti_type')
            ->orderBy('noti_type', 'ASC')
            ->get();

        return $this->queryResponse([
            'NoRead' => $noReaded,
            'types' => $types
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function read(Request $request, $id)
    {
        $data = $request->all();
        // $uAuth = $request->auth;
        $uAuth = $request->user();

        $notification = Notification::findOrFail($id);
        $before = Notification::findOrFail($id);
        $notification->update([
            'noti_read' => true
        ]);

        $this->log::storeLog($uAuth, 'notifications', $notification->noti_id, 'UPDATE', $before, $notification, $request->ip);
        return $this->successResponse(['noti_id' => $notification->noti_id], 'Notification readed');
    }
}
