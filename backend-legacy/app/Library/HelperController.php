<?php

namespace App\Library;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
// use Firebase\JWT\JWT;
// use Firebase\JWT\ExpiredException;
use DateTime;
use DateTimeZone;
use Validator;
use Log;

use App\Mail\MyEmail;
use App\Support\TenantContext;

class HelperController
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

    public static function parseUrl ($url) {
        return preg_replace("/\/$/", '', $url);
    }

    /**
     * Create a wheres to query.
     *
     * @return array
     */
    public static function generateConditions($request)
    {
        $datos = $request->query();
        $sort = array();
        $where = array();
        $like = array();
        $wor = array(); //condicion de or
        $wraw = '1=1'; //condicion raw
        $isnull = array(); //condicion is null
        $fields = array();
        $page = 1;
        $cantidad = 10;

        // dd($datos);
        // recorro lo que me llega por get y lo organizo para ponerlo en el where separo cuales son de orden, pagina, fields o criterios
        foreach ($datos as $position => $valor) {
            // dd($datos);
            if (strtoupper($position) !== 'AUTHORIZATION') {
                if ($position === 'sort') {
                    $sort[$position] = $valor;
                } else if ($position === 'fields') {
                    $f = $valor;
                    $f = explode(',', $f);
                    foreach ($f as $p) {
                        array_push($fields, $p);
                    }
                } else if ($position === 'page') {
                    $page = $valor;
                } else if ($position === 'or') {
                    $orData = $valor;
                    // var error = false
                    $orData = str_replace("{", "", $orData);
                    $orData = str_replace("}", "", $orData);
                    $datos = explode(",", $orData);

                    for ($i=0; $i < count($datos); $i++) {
                        $vd = explode("=", $datos[$i]);
                        // $where[$vd[0]] = $vd[1];
                        array_push($wor, array($vd[0],$vd[1]));
                    }
                } else if ($position === 'whereRaw') {
                    $wraw = $valor;
                } else if ($position === 'like') {
                    $likeData = $valor;
                    $likeData = str_replace("{", "", $likeData);
                    $likeData = str_replace("}", "", $likeData);
                    $datos = explode(",", $likeData);

                    for ($i=0; $i < count($datos); $i++) {
                        $vd = explode("=", $datos[$i]);
                        array_push($like, array($vd[0],'like',"%".$vd[1]."%"));
                    }
                // where
                } else {
                    $position = str_replace('__', '.', $position);
                    $datos = explode("_", $position);
                    if (is_array($datos)) {
                        if (count($datos) >= 4) {
                            // if (strlen($datos[0]) > 2) {
                            //     $position = str_replace($datos[0].'_', $datos[0].'.', $position);
                            // }
                        }
                    }

                    if ($valor == 'null') {
                        array_push($isnull, $position);
                    } else {
                        array_push($where, array($position, '=' , $valor));
                    }
                }
            }
        }

        if (is_object($request) && method_exists($request, 'user')) {
            $user = $request->user();
            if ($user && !TenantContext::isPrivileged($user)) {
                $tenantStudioId = TenantContext::resolvedStudioId($request);
                $tenantStudioIds = TenantContext::allowedStudioIds($user);

                $alreadyScoped = false;
                foreach ($where as $item) {
                    if (isset($item[0]) && $item[0] === 'std_id') {
                        $alreadyScoped = true;
                        break;
                    }
                }

                if (!$alreadyScoped) {
                    if ($tenantStudioId) {
                        $where[] = ['std_id', '=', $tenantStudioId];
                    } elseif (count($tenantStudioIds) === 1) {
                        $where[] = ['std_id', '=', $tenantStudioIds[0]];
                    }
                }
            }
        }

        $response = array(
            'cantidad' => $cantidad,
            'page' => $page,
            'fields' => $fields,
            'sort' => $sort,
            'where' => $where,
            'likeWhere' => $like,
            'orWhere' => $wor,
            'whereRaw' => $wraw,
            'whereNull' => $isnull
        );
        return $response;
    }

    /**
     * if the number is between two numbers.
     *
     * @return boolean
     */
    public static function int_between($value, $start, $end)
    {
        return in_array($value, range($start, $end));
    }

    /**
     * Send mail.
     *
     * @return array
     */
    public static function sendEmail($plantilla, $data)
    {
        // echo json_encode($data);
        $data['cc'] = (empty($data['cc'])) ? [] : $data['cc'];
        $data['ano'] = date('Y');
        Mail::send($plantilla, $data, function ($message) use ($data) {
            $message->to($data['email'])->cc($data['cc'])->subject($data['subject']);
        });
    }

    /**
     * Create a new token recovery password.
     *
     * @param  \App\User   $user
     * @return string
     */
    public static function rp($user)
    {
        $payload = [
            'uid' => $user->user_id, // iduser
            'uem' => $user->user_email, // emailuser
            'iat' => time(), // Time when JWT was issued.
            'exp' => time() + 24*60*60 // Expiration time
        ];
        return Crypt::encryptString(json_encode($payload));
    }

    /**
     * Decript recovery password.
     *
     * @param  Crypt::encryptString() token
     * @return string
     */
    public static function rpd($token)
    {
        $credentials = json_decode(Crypt::decryptString($token));
        return $credentials;
    }

    /**
     * Validate with custom messages.
     *
     * wildcards
     *   :attribute = field name
     *   :size      = exact size length, for 'size' validation
     *   :other     = comparative field, for 'same' validation
     *   :input     = input value
     *   :min       = min value, for 'between' validation
     *   :max       = max value, for 'between' validation
     *   :values    = array values, for 'in' validation
     *
     * @param  Crypt::encryptString() token
     * @return string
     */
    public static function validateWithMessages($input, $rules)
    {
        // init
        $errors = array();
        $foreignRules = array();
        $mainRules = array('rules' => [], 'messages' => []);

        // if is request object (not array data)
        if (!is_array($input)) {
            $input = $input->all();
        }

        //////////////////
        // DIVIDE RULES //
        //////////////////
        // loop fields
        foreach ($rules as $f => $field) {
            // loop rules
            foreach ($field as $rule => $message) {
                if (preg_match("/(unique:||exists:)/", $rule)) {
                    if (!isset($foreignRules[$f])) {
                        $foreignRules[$f] = array();
                    }
                    $foreignRules[$f][$rule] = $message;
                } else {
                    if (!isset($mainRules['rules'][$f])) {
                        $mainRules['rules'][$f] = array();
                    }
                    // ie. unique:users,idtype_id >> profiles.unique
                    $msgKey = $f.'.'.preg_replace("/(.*):.*,.*/", '${1}', $rule);
                    $mainRules['rules'][$f][] = $rule;

                    // messages
                    if (!empty($message)) {
                        $mainRules['messages'][$msgKey] = $message;
                    }
                }
            }
        }

        /////////////////
        // OTHER RULES //
        /////////////////
        if (!empty($mainRules['rules'])) {
            $validator = Validator::make($input, $mainRules['rules'], $mainRules['messages']);
            if ($validator->fails()) {
                // loop fields
                foreach ($mainRules['rules'] as $f => $field) {
                    // loop errors
                    foreach ($validator->errors()->get($f) as $message) {
                        $errors[$f][] = $message;
                    }
                }
            }
        }

        ///////////////////
        // FOREIGN RULES //
        ///////////////////
        foreach ($foreignRules as $f => $field) {
            foreach ($field as $rule => $message) {
                // ie. unique:users,idtype_id >> profiles.unique
                $msgKey = $f.'.'.preg_replace("/(.*):.*,.*/", '${1}', $rule);
                // ie. $validator = Validator::make($input, ['id' => 'unique:rfps,idtype_id'], ['id.unique' => 'Este registro esta asociado a rfps']);
                $input[$f] = (int) $input[$f];

                if (empty($message)) {
                    $validator = Validator::make($input, [$f => $rule]);
                } else {
                    $validator = Validator::make($input, [$f => $rule], [$msgKey => $message]);
                }
                if ($validator->fails()) {
                    $errors[$f][] = $validator->errors()->first($f);
                }
            }
        }

        // return
        return $errors;
    }

    /**
     * Error Message (generate message with exception)
     *
     * @param  string $e EXCEPTION
     * @return array
     */
    public static function errorArray($e)
    {
        // Common Laravel Errors
        $errors = array();
        if (method_exists($e, 'errors')) {
            $errors = $e->errors();
        }

        // if is a json format
        if (substr($e->getMessage(), 0, 1) == '{') {
            $data = json_decode($e->getMessage(), true);

            // Parsear datos del JSON (siempre, no solo para IMPORT)
            $message = $data['message'] ?? $data['error']['message'] ?? 'Error inesperado';
            $error_code = $data['error']['code'] ?? $data['code'] ?? 'UNEXPECTED_ERROR';
            $errors = $data['errors'] ?? [];
            $position = $data['position'] ?? 0;
            $code = is_numeric($data['code'] ?? null) ? (int)$data['code'] : 500;

            $response = array(
                'data' => array(
                    'status' => 'fail',
                    'message' => $message,
                    'position' => $position,
                    'code' => $error_code,
                    'error' => $data['error'] ?? $e->getMessage(),
                    'errors' => $errors,
                ),
                'code' => $code,
            );

        // on other formats
        } else {
            $response = array(
                'data' => array(
                    // 'status' => 'fail',
                    // 'code' => 'UNEXPECTED_ERROR',
                    // 'error' => '$e'
                    'message' => $e->getMessage(),
                    'errors' => $errors,
                ),
                'code' => 500,
            );
        }

        return $response;

        // Se debe re-validar funcionalidad de este metodo ya que no suele dar informacion util del error

        // log::info($e);
        // $message = '';
        // $error = '';
        // $error_code = '';
        // $position = 0;
        // $code = 500;
        
        // // SQLSTATE
        // if (strlen(stristr($e->getMessage(), 'SQLSTATE'))>0) {
        //     $message = $e->getMessage();
        //     $error = array('SQLSTATE' => array('SQLSTATE'));
        // // IMPORT
        // } else if (strlen(stristr($e->getMessage(), 'IMPORT'))>0) {
        //     $data = json_decode($e->getMessage());
        //     $message = ($data->message) ? $data->message : 'The given data was invalid.' ;
        //     $error_code = ($data->code) ? $data->code : '' ;
        //     $error = $data->errors;
        //     $position = $data->position;
        //     $code = 422;
        // } else if (strlen(stristr($e->getMessage(), 'Host desconocido'))>0 || strlen(stristr($e->getMessage(), 'SMTP'))>0 || strlen(stristr($e->getMessage(), 'Connection could not be established'))>0) {
        //     $message = $e->getMessage();
        //     $error = array('EMAILDOESNOTWORK' => array('emaildoesnotwork'));
        // } else {
        //     $message = $e->getMessage();
        //     $error = $e->getMessage();
        //     $code = 422;
        // }

        // $response = array(
        //     'data' => array(
        //         'status' => 'fail',
        //         'message' => $message,
        //         'position' => $position,
        //         'code' => $error_code,
        //         'error' => $error
        //     ),
        //     'code' => $code
        // );

        // return $response;
    }

    /**
     * ConvertUTC
     *
     * @param string $date
     * @return string $status
     */
    public function convertUTC($date, $tz)
    {
        // create a $dt object with the UTC timezone
        // $dt = new DateTime('2016-12-12 12:12:12', new DateTimeZone('UTC'));
        $dt = new DateTime($date);

        // change the timezone of the object without changing it's time
        $dt->setTimezone(new DateTimeZone($tz));

        // format the datetime
        return $dt->format('Y-m-d H:i:s');
    }

    /**
     * SQL Like operator in PHP.
     * Returns TRUE if match else FALSE.
     * @param string $pattern
     * @param string $subject
     * @return bool
     */
    public static function likeMatch($pattern, $subject)
    {
        $pattern = str_replace('%', '.*', preg_quote($pattern, '/'));
        return (bool) preg_match("/^{$pattern}$/i", $subject);
    }

    public static function nextId($table, $field)
    {
        $statement = DB::select("SELECT max($field) FROM $table");
        $next_id = ($statement[0]['max']) ? $statement[0]['max'] + 1 : 1;
        return $next_id;
    }

    public static function removeAccents($cadena)
    {
        //Reemplazamos la A y a
        $cadena = str_replace(
            array('Á', 'À', 'Â', 'Ä', 'á', 'à', 'ä', 'â', 'ª'),
            array('A', 'A', 'A', 'A', 'a', 'a', 'a', 'a', 'a'),
            $cadena
        );

        //Reemplazamos la E y e
        $cadena = str_replace(
            array('É', 'È', 'Ê', 'Ë', 'é', 'è', 'ë', 'ê'),
            array('E', 'E', 'E', 'E', 'e', 'e', 'e', 'e'),
            $cadena
        );

        //Reemplazamos la I y i
        $cadena = str_replace(
            array('Í', 'Ì', 'Ï', 'Î', 'í', 'ì', 'ï', 'î'),
            array('I', 'I', 'I', 'I', 'i', 'i', 'i', 'i'),
            $cadena
        );

        //Reemplazamos la O y o
        $cadena = str_replace(
            array('Ó', 'Ò', 'Ö', 'Ô', 'ó', 'ò', 'ö', 'ô'),
            array('O', 'O', 'O', 'O', 'o', 'o', 'o', 'o'),
            $cadena
        );

        //Reemplazamos la U y u
        $cadena = str_replace(
            array('Ú', 'Ù', 'Û', 'Ü', 'ú', 'ù', 'ü', 'û'),
            array('U', 'U', 'U', 'U', 'u', 'u', 'u', 'u'),
            $cadena
        );

        //Reemplazamos la N, n, C y c
        $cadena = str_replace(
            array('Ñ', 'ñ', 'Ã±', 'Ç', 'ç'),
            array('N', 'n', 'N', 'C', 'c'),
            $cadena
        );
        
        return $cadena;
    }

    public static function getMonthName($m)
    {
        $months = array(
            'Enero',
            'Febrero',
            'Marzo',
            'Abril',
            'Mayo',
            'Junio',
            'Julio',
            'Agosto',
            'Septiembre',
            'Octubre',
            'Noviembre',
            'Diciembre'
        );
        return $months[$m];
    }

    public static function getMonthPositionByName($month)
    {
        $position = 0;
        $months = array(
            'Enero',
            'Febrero',
            'Marzo',
            'Abril',
            'Mayo',
            'Junio',
            'Julio',
            'Agosto',
            'Septiembre',
            'Octubre',
            'Noviembre',
            'Diciembre'
        );

        for ($i=0; $i < count($months); $i++) {
            if (strtolower($months[$i]) == strtolower($month)) {
                $position = $i + 1;
            }
        }
        return $position;
    }

    public static function getMonthShortName($m)
    {
        $months = array(
            'Ene',
            'Feb',
            'Mar',
            'Abr',
            'May',
            'Jun',
            'Jul',
            'Ago',
            'Sep',
            'Oct',
            'Nov',
            'Dic'
        );
        return $months[$m];
    }

    public static function getMonthPositionByShortName($month)
    {
        $position = 0;
        $months = array(
            'Ene',
            'Feb',
            'Mar',
            'Abr',
            'May',
            'Jun',
            'Jul',
            'Ago',
            'Sep',
            'Oct',
            'Nov',
            'Dic'
        );

        for ($i=0; $i < count($months); $i++) {
            if (strtolower($months[$i]) == strtolower($month)) {
                $position = $i + 1;
            }
        }
        return $position;
    }


    public static function cryptoJs_aes_decrypt($data, $key)
    {
        $data = base64_decode($data);
        if (substr($data, 0, 8) != "Salted__") {
            return false;
        }
        $salt = substr($data, 8, 8);
        $keyAndIV = aes_evpKDF($key, $salt);
        $decryptPassword = openssl_decrypt(
            substr($data, 16),
            "aes-256-cbc",
            $keyAndIV["key"],
            OPENSSL_RAW_DATA, // base64 was already decoded
            $keyAndIV["iv"]
        );
        return $decryptPassword;
    }

    public static function cryptoJs_aes_encrypt($data, $key)
    {

        $salted = "Salted__";
        $salt = openssl_random_pseudo_bytes(8);

        $keyAndIV = self::aes_evpKDF($key, $salt);
        $encrypt  = openssl_encrypt(
            $data,
            "aes-256-cbc",
            $keyAndIV["key"],
            OPENSSL_RAW_DATA, // base64 was already decoded
            $keyAndIV["iv"]
        );
        return  base64_encode($salted . $salt . $encrypt);
    }

    function aes_evpKDF($password, $salt, $keySize = 8, $ivSize = 4, $iterations = 1, $hashAlgorithm = "md5")
    {
        $targetKeySize = $keySize + $ivSize;
        $derivedBytes = "";
        $numberOfDerivedWords = 0;
        $block = NULL;
        $hasher = hash_init($hashAlgorithm);
        while ($numberOfDerivedWords < $targetKeySize) {
            if ($block != NULL) {
                hash_update($hasher, $block);
            }
            hash_update($hasher, $password);
            hash_update($hasher, $salt);
            $block = hash_final($hasher, TRUE);
            $hasher = hash_init($hashAlgorithm);

            // Iterations
            for ($i = 1; $i < $iterations; $i++) {
                hash_update($hasher, $block);
                $block = hash_final($hasher, TRUE);
                $hasher = hash_init($hashAlgorithm);
            }

            $derivedBytes .= substr($block, 0, min(strlen($block), ($targetKeySize - $numberOfDerivedWords) * 4));

            $numberOfDerivedWords += strlen($block) / 4;
        }
        return array(
            "key" => substr($derivedBytes, 0, $keySize * 4),
            "iv"  => substr($derivedBytes, $keySize * 4, $ivSize * 4)
        );
    }

    /**
     * Loop between two dates given.
     *
     * @param  String $dateSince initial date
     * @param  String $dateSince final date
     * @param  String $dateSince looper (seconds|minutes|hours|days|weeks|months|years) https://www.php.net/manual/es/datetime.formats.relative.php
     * @return String date
     * @author bgiron
     */
    public function timeLooper($dateSince, $dateUntil, $looper)
    {
        $dateSince = date('Y-m-d H:i:s', strtotime($dateSince));
        while (strtotime($dateSince) <= strtotime($dateUntil)) {
            yield $dateSince;
            $dateSince = date('Y-m-d H:i:s', strtotime($dateSince . ' +1 '.$looper));
        }
    }

    /**
     * Loop between two dates given.
     *
     * @param  String $dateSince initial date
     * @param  String $dateSince final date
     * @param  String $dateSince looper (seconds|minutes|hours|days|weeks|months|years) https://www.php.net/manual/es/datetime.formats.relative.php
     * @return Int    numeric difference
     * @author bgiron
     */
    public function timeDiff($dateSince, $dateUntil, $looper)
    {
        $diff = 0;
        $dateSince = date('Y-m-d H:i:s', strtotime($dateSince));
        while (strtotime($dateSince) <= strtotime($dateUntil)) {
            $diff++;
            $dateSince = date('Y-m-d H:i:s', strtotime($dateSince . ' +1 '.$looper));
        }
        return $diff;
    }

    /**
     * Basado en un numero que indique la cantidad de horas, retorna las horas en formato time (00:00:00)
     * @param  float  $entero segundos
     * @return string         tiempo en formato de texto
     * @example ej 1 hora y media: numberToTime(1.5 * 60 * 60) >> 01:30:00
     * @author bgiron
     */
    public function numberToTime($flotante)
    {
        // Obtener las horas enteras
        $horas = floor($flotante);

        // Obtener los minutos y segundos
        $minutos = floor(($flotante - $horas) * 60);
        $segundos = round((($flotante - $horas) * 3600) - ($minutos * 60));

        // Formatear y devolver la cadena de tiempo
        $cadenaTiempo = sprintf("%02d:%02d:%02d", $horas, $minutos, $segundos);
        return $cadenaTiempo;
    }

    /**
     * Basado en una cadena tipo Time lo convierta en numero flotante, retorna las horas en formato flotante
     * @param  string $entero tiempo en formato de texto
     * @return float          horas
     * @example ej 1 hora y media: timeToNumber('01:30:00') >> 1.5
     * @author bgiron
     */
    public function timeToNumber($tiempo)
    {
        $parts = explode(':', $tiempo);
        // validate parts
        if (!isset($parts[1])) {
            $parts[1] = 0;
        }
        if (!isset($parts[2])) {
            $parts[2] = 0;
        }
        // res
        $res = (float) ((floatval($parts[0]) * 60 * 60) + (floatval($parts[1]) * 60) + floatval($parts[2])); // return in seconds
        return $res / 60 / 60; // return in hours
    }
}
