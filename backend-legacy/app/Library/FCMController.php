<?php

namespace App\Library;

use App\Models\Notification;
use App\Events\NewNotification;

class FCMController
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
     * Create a new FCM notification.
     *
     * @return boolean
     */
    public static function sendWebNotification($tokens = [], $title, $data)
    {
        $url = 'https://fcm.googleapis.com/fcm/send';
        $icon = env('API_URL_LOGO', '');
          
        $serverKey = env('FCM_KEY');
        
        if ($serverKey) {
            $data = [
                "registration_ids" => $tokens,
                "notification" => [
                    "title" => $title,
                    "body" => $data,
                    "icon" => $icon
                ]
            ];
            $encodedData = json_encode($data);
        
            $headers = [
                'Authorization: key=' . $serverKey,
                'Content-Type: application/json',
            ];
        
            $ch = curl_init();
        
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            // curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
            // curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
            // Disabling SSL Certificate support temporarly
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);        
            curl_setopt($ch, CURLOPT_POSTFIELDS, $encodedData);
            // Execute post
            $result = curl_exec($ch);
            if ($result === FALSE) {
                die('Curl failed: ' . curl_error($ch));
            }        
            // Close connection
            curl_close($ch);
        }
    }
}