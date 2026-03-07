<?php
namespace App\Services;

use Log;

class RavalabService
{
    private $api_key;

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->api_key = getenv('RAVALAB_API_KEY');
    }

    /**
     * RAVALAB SEND WHATSAPP MESSAGE
     * @example
     *   $to: "+15558675310",
     *   $templateName: "leasing_minute_01"
     *   $templateCode: "es"
     *   $params: {
     *     "1" => "Pedro",
     *     "2" => "https://app.bofeti.com/g/r/2307-q9RUms1s-08",
     *   }
     * @return Ravalab response
     */
    public function sendWspMessage(string $to, string $templateName, string $templateCode = "en", array $params = [])
    {
        return $this->sendMessage($to, $templateName, $templateCode, $params, 'wsp');
    }

    /**
     * RAVALAB SEND MESSAGE
     * @example
     *   $to: "+15558675310",
     *   $templateName: "leasing_minute_01"
     *   $templateCode: "es"
     *   $params: {
     *     "1" => "Pedro",
     *     "2" => "https://app.bofeti.com/g/r/2307-q9RUms1s-08",
     *   }
     *   $channel = "sms|wsp"
     * @return Ravalab response
     */
    public function sendMessage(string $to, string $templateName, string $templateCode = "en", array $params = [], string $channel = "sms")
    {
        // on empty
        if (empty($this->api_key)) {
            return false;
        }

        $to = str_replace('+', '', $to);

        $data = array(
            "to" => $to,
            "template_name" => $templateName,
            "template_code" => $templateCode,
            "variables" => [
                "body" => $params,
            ],
        );
        $json = json_encode($data);

        $url = 'https://api.ravalab.co/template/send/' . $this->api_key;
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
        curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json',
            'Content-Length: ' . strlen($json)
        ));

        $response = curl_exec($ch);
        if (curl_errno($ch)) {
            $res = curl_error($ch);
        } else {
            $res = $response;
        }
        curl_close($ch);
        return $res;
    }
}
