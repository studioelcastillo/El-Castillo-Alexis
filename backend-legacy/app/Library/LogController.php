<?php

namespace App\Library;

use App\Models\Log;

class LogController
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        //$request->auth
    }

    /**
     * Create a new log.
     *
     * @return boolean
     */
    public static function storeLog($user, $table, $table_id, $action, $before, $after, $ip)
    {
        $ip = empty($ip) ? '' : $ip ;
        // datos
        $data = array(
            'user_id' => ($user) ? $user->user_id : null,
            'log_table' => $table,
            'log_table_id' => $table_id,
            'log_action' => $action,
            'log_ip' => $ip,
            'log_before' => $before,
            'log_after' => $after
        );

        // creamos un nuevo log
        $log = Log::create($data);
        return $log;
    }
}
