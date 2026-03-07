<?php
namespace App\Services;

use Twilio\Rest\Client;
use Log;

class TwilioService
{
    private $account_sid;
    private $auth_token;

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        // Your Account SID and Auth Token from twilio.com/console
        // To set up environmental variables, see http://twil.io/secure
        $this->account_sid = getenv('TWILIO_SID');
        $this->auth_token = getenv('TWILIO_AUTH_TOKEN');
    }

    /**
     * TWILIO SEND WHATSAPP MESSAGE
     * @example
     *   $to: "+15558675310",
     *   $opts: {
     *     "from": "+15017122661",
     *     "body": "Hi there",
     *   }
     * @return \Twilio\Rest\Api\V2010\Account\MessageInstance
     */
    public function sendWspMessage(string $to, array $opts = [])
    {
        return $this->sendMessage($to, $opts, 'wsp');
    }

    /**
     * TWILIO SEND MESSAGE
     * @example
     *   $to: "+15558675310",
     *   $opts: {
     *     "from": "+15017122661",
     *     "body": "Hi there",
     *   },
     *   $channel = "sms|wsp"
     * @return \Twilio\Rest\Api\V2010\Account\MessageInstance
     */
    public function sendMessage(string $to, array $opts = [], string $channel = "sms")
    {
        // on empty
        if (empty($this->account_sid)) {
            return false;
        }

        // clean phonenumbers
        $to = preg_replace("/[a-zA-Z:\(\) ]/", '', $to);
        $opts['from'] = preg_replace("/[a-zA-Z:\(\) ]/", '', $opts['from']);

        // if its via whatsapp
        if ($channel == 'wsp') {
            // add "whatsapp:" prefix for whatsapp sending
            $to = 'whatsapp:'.$to;
            $opts['from'] = 'whatsapp:'.$opts['from'];
        }

        // send message
        $twilio = new \Twilio\Rest\Client($this->account_sid, $this->auth_token);
        $message = $twilio->messages->create($to, $opts);
        return $message;
    }

    /**
     * TWILIO EXECUTE STUDIO FLOW
     * @example
     *   $flow: "FWXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     *   $to: "+15558675310",
     *   $opts: {
     *     "from": "+15017122661",
     *     "parameters" => [
     *       "foo" => "bar",
     *     ]
     *   }
     * @return \Twilio\Rest\Api\V2010\Account\MessageInstance
     */
    public function executeFlow(string $flow, string $to, string $from, array $opts = [], string $channel = "sms")
    {
        // on empty
        if (empty($this->account_sid)) {
            return false;
        }

        // clean phonenumbers
        $to = preg_replace("/[a-zA-Z:\(\) ]/", '', $to);
        $from = preg_replace("/[a-zA-Z:\(\) ]/", '', $from);

        // if its via whatsapp
        if ($channel == 'wsp') {
            // add "whatsapp:" prefix for whatsapp sending
            $to = 'whatsapp:'.$to;
            $from = 'whatsapp:'.$from;
        }

        // execute flow
        $twilio = new \Twilio\Rest\Client($this->account_sid, $this->auth_token);
        $execution = $twilio->studio->v2->flows($flow)->executions->create($to, $from, $opts);
        return $execution;
    }

    /**
     * TWILIO LIST MESSAGES
     * Request structure
     * @example
     * @return void
     */
    public function listMessages($opts)
    {
        $twilio = new \Twilio\Rest\Client($this->account_sid, $this->auth_token);
        // Loop over the list of messages and print a property from each one
        foreach ($twilio->messages->read([], 10) as $message) {
            echo 'sid: '. $message->sid.'<br>';
            echo 'body: '. $message->body.'<br>';
            echo 'status: '. $message->status.'<br>';
            echo 'direction: '. $message->direction.'<br>';
            echo 'from: '. $message->from.'<br>';
            echo 'to: '. $message->to.'<br>';
            echo 'error_code: '. $message->errorCode.'<br>';
            echo 'error_message: '. $message->errorMessage.'<br>';
            echo 'date_created: '. $message->dateCreated->format('Y-m-d H:i:s').'<br>';
            echo "<hr>";
        }
        // errors codes doc: https://www.twilio.com/docs/api/errors
    }
}
