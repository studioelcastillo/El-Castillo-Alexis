<?php

namespace App\Library;

use App\Models\Notification;
use App\Events\NewNotification;
use App\Library\FCMController;
use Illuminate\Support\Facades\DB;

class NotificationController
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
     * Create a new notification.
     *
     * @return boolean
     */
    public static function storeNotification($user, $to, $type, $title, $message, $menu)
    {
        // datos
        $data = array(
            'user_id' => $user->user_id,
            'user_id_to_notify' => $to->user_id,
            'noti_type' => $type, 
            'noti_title' => $title,
            'noti_data' => $message,
            'noti_menu' => $menu
        );

        // creamos una nueva notification
        $notificacion = Notification::create($data);

        $data = Notification::with(['from', 'to'])->where('noti_id', $notificacion->noti_id)->get();
        event(new NewNotification($user->user_id, $data[0]));
        $fcmTokens = DB::table('oauth_access_tokens')->where('user_id', $user->user_id)->whereNotNull('fcm_token')->pluck('fcm_token')->all();
        FCMController::sendWebNotification($fcmTokens, $title, $message);
        return $notificacion;
    }
}
