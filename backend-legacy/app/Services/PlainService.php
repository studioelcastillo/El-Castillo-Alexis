<?php
namespace App\Services;

use Log;

class PlainService
{
    private $account_sid;
    private $auth_token;

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct() {
    }

    /**
     * APPLY PLAIN FORMAT BASED ON FORMAT ATTRIBUTES
     * @example
     *   $format: {
     *     "name" => 'CMENTRM-CANT-2',
     *     "type" => 'number', // [string, number]
     *     "length" => 13,
     *     "pos_ini" => 100,
     *     "pos_end" => 112,
     *     "required" => false,
     *     "commentary" => 'Cantidad en unidad de inventario 2 (solo si el ítem la maneja). (Son 9 enteros 3 decimales y el signo al final 999999999999+).',
     *     "decimals" => 3, // only for numeric type
     *     "use_symbols" => true, // only for numeric type i.e. 999999+ | 999999-
     *   },
     *   $value: "+15558675310",
     * @return String formatted
     * @author bgiron
     */
    public function plainFormat(Array $format, $value = '') {
        // debug input
        $debug = [];
        // $debug = ['TIPO_TRANSACCION', 'VALOR_TRANSACCION', 'FECHA_APLICACION']; // uncomment this only for debug
        if (in_array($format['name'], $debug)) {
            Log::info('------');
            Log::info($format['name']);
            Log::info($value);
        }

        // trim value
        $value = trim($value);

        // Remove date format 2022-02-28 >> 20220228
        $value = preg_replace("/([1-2][0-9][0-9][0-9])-([0-1][0-9])-([0-3][0-9])/", "$1$2$3", $value);
        // Remove date format 2022/02/28 >> 20220228
        $value = preg_replace("/([1-2][0-9][0-9][0-9])\/([0-1][0-9])\/([0-3][0-9])/", "$1$2$3", $value);


        // if its string format
        if ($format['type'] == 'string') {
            $value = (string) $value;
            $value = $value . str_repeat(' ', ($format['length']));
            $value = substr($value, 0, $format['length']);
        }

        // if its number format
        if ($format['type'] == 'number') {
            $value = (float) $value;
            // if its set decimal points
            if (isset($format['decimals'])) {
                $value = round($value, $format['decimals']);
                $value = number_format($value, $format['decimals'], '', '');
            } else {
                // ej. 0532000200437548
                $value = round($value, 0); // 5.3200020043755E+14
                $value = number_format($value, 0, '', ''); // 532000200437548
            }

            // if its set to use symbols
            if (isset($format['use_symbols'])) {
                if (intval($value) >= 0) {
                    $value = $value.'+';
                } else {
                    $value = $value.'-';
                }
            }

            $value = str_repeat('0', ($format['length'])) . $value;
            $value = substr($value, ($format['length'] * -1));
        }

        // debug output
        if (in_array($format['name'], $debug)) {
            Log::info($value);
        }

        return $value;
    }

    /**
     * GET BBVA PAYMENT FORMAT
     * @return array fields
     * @author bgiron
     * @doc https://www.scribd.com/document/420970123/Estructura-de-Archivos-de-Pagos-Por-Lineas-BBVA
     */
    public function getFormatBBVA() {
        $format = [
            'body' => [
                [
                    'name' => 'TIPO_DOC_RECEPTOR',
                    'type' => 'number',
                    'pos_ini' => 1,
                    'length' => 2,
                    'pos_end' => 2,
                    'required' => true,
                    'commentary' => 'Tipo identificación receptor',
                ],
                [
                    'name' => 'NUM_DOC_RECEPTOR',
                    'type' => 'number',
                    'pos_ini' => 3,
                    'length' => 16,
                    'pos_end' => 18,
                    'required' => true,
                    'commentary' => 'Número identificación receptor',
                ],
                [
                    'name' => 'FORMA_PAGO',
                    'type' => 'number',
                    'pos_ini' => 19,
                    'length' => 1,
                    'pos_end' => 19,
                    'required' => true,
                    'commentary' => 'Forma de pago',
                ],
                [
                    'name' => 'COD_BANCO_RECEPTOR',
                    'type' => 'number',
                    'pos_ini' => 20,
                    'length' => 4,
                    'pos_end' => 23,
                    'required' => true,
                    'commentary' => 'Código Banco receptor',
                ],
                [
                    'name' => 'NUM_CUENTA_BBVA',
                    'type' => 'string',
                    'pos_ini' => 24,
                    'length' => 16,
                    'pos_end' => 39,
                    'required' => true,
                    'commentary' => 'Numero de Cuenta BBVA',
                ],
                [
                    'name' => 'TIPO_CUENTA_NACHAM',
                    'type' => 'number',
                    'pos_ini' => 40,
                    'length' => 2,
                    'pos_end' => 41,
                    'required' => true,
                    'commentary' => 'Tipo de cuenta Nacham',
                ],
                [
                    'name' => 'NUM_CUENTA_NACHAM',
                    'type' => 'string',
                    'pos_ini' => 42,
                    'length' => 17,
                    'pos_end' => 58,
                    'required' => true,
                    'commentary' => 'Número de cuenta Nacham',
                ],
                [
                    'name' => 'VALOR', // Se suma en un solo campo el valor entero y el decimal
                    'type' => 'number',
                    'pos_ini' => 59,
                    'length' => 15,
                    'pos_end' => 73,
                    'required' => false,
                    'commentary' => 'Valor de operación',
                    'decimals' => 2,
                ],
                [
                    'name' => 'FECHA', // Se suma en un solo campo el anho, el mes y el dia
                    'type' => 'string',
                    'pos_ini' => 74,
                    'length' => 8,
                    'pos_end' => 81,
                    'required' => false,
                    'commentary' => 'Fecha',
                ],
                [
                    'name' => 'COD_OFICINA',
                    'type' => 'number',
                    'pos_ini' => 82,
                    'length' => 4,
                    'pos_end' => 85,
                    'required' => true,
                    'commentary' => 'Código oficina pagadora',
                ],
                [
                    'name' => 'NOM_BENEFICIARIO',
                    'type' => 'string',
                    'pos_ini' => 86,
                    'length' => 36,
                    'pos_end' => 121,
                    'required' => true,
                    'commentary' => 'Nombre de beneficiario',
                ],
                [
                    'name' => 'DIR_1',
                    'type' => 'string',
                    'pos_ini' => 122,
                    'length' => 36,
                    'pos_end' => 157,
                    'required' => true,
                    'commentary' => 'Dirección No 1',
                ],
                [
                    'name' => 'DIR_2',
                    'type' => 'string',
                    'pos_ini' => 158,
                    'length' => 36,
                    'pos_end' => 193,
                    'required' => false,
                    'commentary' => 'Dirección No 2',
                ],
                [
                    'name' => 'EMAIL',
                    'type' => 'string',
                    'pos_ini' => 194,
                    'length' => 48,
                    'pos_end' => 241,
                    'required' => false,
                    'commentary' => 'Email',
                ],
                [
                    'name' => 'CONCEPTO_1',
                    'type' => 'string',
                    'pos_ini' => 242,
                    'length' => 40,
                    'pos_end' => 281,
                    'required' => false,
                    'commentary' => 'Concepto 1',
                ],
                [
                    'name' => 'CONCEPTO_2',
                    'type' => 'string',
                    'pos_ini' => 282,
                    'length' => 40,
                    'pos_end' => 321,
                    'required' => false,
                    'commentary' => 'Concepto 2',
                ],
                [
                    'name' => 'CONCEPTO_3',
                    'type' => 'string',
                    'pos_ini' => 322,
                    'length' => 40,
                    'pos_end' => 361,
                    'required' => false,
                    'commentary' => 'Concepto 3',
                ],
                [
                    'name' => 'CONCEPTO_4',
                    'type' => 'string',
                    'pos_ini' => 362,
                    'length' => 40,
                    'pos_end' => 401,
                    'required' => true,
                    'commentary' => 'Concepto 4',
                ],
                [
                    'name' => 'CONCEPTO_5',
                    'type' => 'string',
                    'pos_ini' => 402,
                    'length' => 40,
                    'pos_end' => 441,
                    'required' => false,
                    'commentary' => 'Concepto 5',
                ],
                [
                    'name' => 'CONCEPTO_6',
                    'type' => 'string',
                    'pos_ini' => 442,
                    'length' => 40,
                    'pos_end' => 481,
                    'required' => false,
                    'commentary' => 'Concepto 6',
                ],
                [
                    'name' => 'CONCEPTO_7',
                    'type' => 'string',
                    'pos_ini' => 482,
                    'length' => 40,
                    'pos_end' => 521,
                    'required' => false,
                    'commentary' => 'Concepto 7',
                ],
                [
                    'name' => 'CONCEPTO_8',
                    'type' => 'string',
                    'pos_ini' => 522,
                    'length' => 40,
                    'pos_end' => 561,
                    'required' => false,
                    'commentary' => 'Concepto 8',
                ],
                [
                    'name' => 'CONCEPTO_9',
                    'type' => 'string',
                    'pos_ini' => 562,
                    'length' => 40,
                    'pos_end' => 601,
                    'required' => false,
                    'commentary' => 'Concepto 9',
                ],
                [
                    'name' => 'CONCEPTO_10',
                    'type' => 'string',
                    'pos_ini' => 602,
                    'length' => 40,
                    'pos_end' => 641,
                    'required' => false,
                    'commentary' => 'Concepto 10',
                ],
                [
                    'name' => 'CONCEPTO_11',
                    'type' => 'string',
                    'pos_ini' => 642,
                    'length' => 40,
                    'pos_end' => 681,
                    'required' => false,
                    'commentary' => 'Concepto 11',
                ],
                [
                    'name' => 'CONCEPTO_12',
                    'type' => 'string',
                    'pos_ini' => 682,
                    'length' => 40,
                    'pos_end' => 721,
                    'required' => false,
                    'commentary' => 'Concepto 12',
                ],
                [
                    'name' => 'CONCEPTO_13',
                    'type' => 'string',
                    'pos_ini' => 722,
                    'length' => 40,
                    'pos_end' => 761,
                    'required' => false,
                    'commentary' => 'Concepto 13',
                ],
                [
                    'name' => 'CONCEPTO_14',
                    'type' => 'string',
                    'pos_ini' => 762,
                    'length' => 40,
                    'pos_end' => 801,
                    'required' => false,
                    'commentary' => 'Concepto 14',
                ],
                [
                    'name' => 'CONCEPTO_15',
                    'type' => 'string',
                    'pos_ini' => 802,
                    'length' => 40,
                    'pos_end' => 841,
                    'required' => true,
                    'commentary' => 'Concepto 15',
                ],
                [
                    'name' => 'CONCEPTO_16',
                    'type' => 'string',
                    'pos_ini' => 842,
                    'length' => 40,
                    'pos_end' => 881,
                    'required' => false,
                    'commentary' => 'Concepto 16',
                ],
                [
                    'name' => 'CONCEPTO_17',
                    'type' => 'string',
                    'pos_ini' => 882,
                    'length' => 40,
                    'pos_end' => 921,
                    'required' => false,
                    'commentary' => 'Concepto 17',
                ],
                [
                    'name' => 'CONCEPTO_18',
                    'type' => 'string',
                    'pos_ini' => 922,
                    'length' => 40,
                    'pos_end' => 961,
                    'required' => false,
                    'commentary' => 'Concepto 18',
                ],
                [
                    'name' => 'CONCEPTO_19',
                    'type' => 'string',
                    'pos_ini' => 962,
                    'length' => 40,
                    'pos_end' => 1001,
                    'required' => false,
                    'commentary' => 'Concepto 19',
                ],
                [
                    'name' => 'CONCEPTO_20',
                    'type' => 'string',
                    'pos_ini' => 1002,
                    'length' => 40,
                    'pos_end' => 1041,
                    'required' => false,
                    'commentary' => 'Concepto 20',
                ],
                [
                    'name' => 'CONCEPTO_21',
                    'type' => 'string',
                    'pos_ini' => 1042,
                    'length' => 40,
                    'pos_end' => 1081,
                    'required' => false,
                    'commentary' => 'Concepto 121',
                ],
                [
                    'name' => 'CONCEPTO_22',
                    'type' => 'string',
                    'pos_ini' => 1082,
                    'length' => 40,
                    'pos_end' => 1121,
                    'required' => false,
                    'commentary' => 'Concepto 122',
                ],
            ],
        ];

        return $format;
    }

    /**
     * GET BANCOLOMBIA PAYMENT FORMAT
     * @return array fields
     * @author bgiron
     * @doc https://www.bancolombia.com/wcm/connect/www.bancolombia.com-26918/21009d17-b6a6-4103-aeff-b3c16c39927b/FormatoPagosPAB.pdf?MOD=AJPERES&CVID=nVQ1NPY
     */
    public function getFormatBancolombiaPAB() {
        $format = [
            'header' => [
                [
                    'name' => 'TIPO_REGISTRO',
                    'type' => 'number',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'Tipo registro',
                    'default' => 1,
                ],
                [
                    'name' => 'NIT_ENTIDAD_ORIGINADORA',
                    'type' => 'number',
                    'length' => 15,
                    'required' => true,
                    'commentary' => 'Nit entidad Originadora',
                ],
                [
                    'name' => 'APLICACION',
                    'type' => 'string',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'Aplicacion',
                    'default' => 'I', // [I=Inmediata, M=Medio D, N=Noche]
                ],
                [
                    'name' => 'FILLER_1',
                    'type' => 'string',
                    'length' => 15,
                    'required' => false,
                    'commentary' => 'Filler',
                ],
                [
                    'name' => 'CLASE_TRANSACCION',
                    'type' => 'number',
                    'length' => 3,
                    'required' => false,
                    'commentary' => 'Clase de transacción',
                ],
                [
                    'name' => 'DESCRIPCION_PROPOSITO_TRANSACCIONES',
                    'type' => 'string',
                    'length' => 10,
                    'required' => true,
                    'commentary' => 'Descripción propósito transacciones',
                ],
                [
                    'name' => 'FECHA_TRANSMISION_LOTE',
                    'type' => 'number',
                    'length' => 8,
                    'required' => true,
                    'commentary' => 'Fecha Transmisión de lote',
                ],
                [
                    'name' => 'SECUENCIA_ENVIO_LOTES',
                    'type' => 'string',
                    'length' => 2,
                    'required' => true,
                    'commentary' => 'Secuencia envio de lotes ese día',
                ],
                [
                    'name' => 'FECHA_APLICACION_TRANSACCIONES',
                    'type' => 'number',
                    'length' => 8,
                    'required' => true,
                    'commentary' => 'Fecha aplicación transacciones',
                ],
                [
                    'name' => 'NUMERO_REGISTROS',
                    'type' => 'number',
                    'length' => 6,
                    'required' => true,
                    'commentary' => 'Número de registros',
                ],
                [
                    'name' => 'SUMATORIA_DEBITOS',
                    'type' => 'number',
                    'length' => 17,
                    'required' => true,
                    'commentary' => 'Sumatoria de débitos',
                    'decimals' => 2,
                ],
                [
                    'name' => 'SUMATORIA_CREDITOS',
                    'type' => 'number',
                    'length' => 17,
                    'required' => true,
                    'commentary' => 'Sumatoria de créditos',
                    'decimals' => 2,
                ],
                [
                    'name' => 'CUENTA_CLIENTE_DEBITAR',
                    'type' => 'number',
                    'length' => 11,
                    'required' => true,
                    'commentary' => 'Cuenta cliente a debitar',
                ],
                [
                    'name' => 'TIPO_CUENTA_CLIENTE_DEBITAR',
                    'type' => 'string',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'Tipo de cuenta cliente a debitar',
                ],
                [
                    'name' => 'FILLER_2',
                    'type' => 'string',
                    'length' => 149,
                    'required' => true,
                    'commentary' => 'Filler',
                ],
            ],
            'body' => [
                [
                    'name' => 'TIPO_REGISTRO',
                    'type' => 'number',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'Tipo registro',
                    'default' => '6',
                ],
                [
                    'name' => 'NIT_BENEFICIARIO',
                    'type' => 'string',
                    'length' => 15,
                    'required' => true,
                    'commentary' => 'Nit beneficiario',
                ],
                [
                    'name' => 'NOMBRE_BENEFICIARIO',
                    'type' => 'string',
                    'length' => 30,
                    'required' => true,
                    'commentary' => 'Nombre del beneficiario',
                ],
                [
                    'name' => 'BANCO_CUENTA_BENEFICIARIO_DESTINO',
                    'type' => 'number',
                    'length' => 9,
                    'required' => true,
                    'commentary' => 'Banco cuenta del beneficiario (destino)',
                ],
                [
                    'name' => 'NUMERO_CUENTA_BENEFICIARIO',
                    'type' => 'string',
                    'length' => 17,
                    'required' => true,
                    'commentary' => 'Número cuenta del beneficiario',
                ],
                [
                    'name' => 'INDICADOR_LUGAR_PAGO',
                    'type' => 'string',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'Indicador Lugar de pago',
                ],
                [
                    'name' => 'TIPO_TRANSACCION',
                    'type' => 'number',
                    'length' => 2,
                    'required' => true,
                    'commentary' => 'Tipo de transacción',
                ],
                [
                    'name' => 'VALOR_TRANSACCION',
                    'type' => 'number',
                    'length' => 17,
                    'required' => true,
                    'commentary' => 'Valor transacción',
                    'decimals' => 2,
                ],
                [
                    'name' => 'FECHA_APLICACION',
                    'type' => 'number',
                    'length' => 8,
                    'required' => true,
                    'commentary' => 'Fecha aplicación',
                ],
                [
                    'name' => 'REFERENCIA',
                    'type' => 'string',
                    'length' => 21,
                    'required' => true,
                    'commentary' => 'Referencia',
                ],
                [
                    'name' => 'TIPO_DOCUMENTO_IDENTIFICACION',
                    'type' => 'string',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'Tipo de documento de identificación',
                ],
                [
                    'name' => 'OFICINA_ENTREGA',
                    'type' => 'number',
                    'length' => 5,
                    'required' => true,
                    'commentary' => 'Oficina de entrega',
                ],
                [
                    'name' => 'NUMERO_FAX',
                    'type' => 'string',
                    'length' => 15,
                    'required' => true,
                    'commentary' => 'Número de Fax',
                ],
                [
                    'name' => 'EMAIL',
                    'type' => 'string',
                    'length' => 80,
                    'required' => true,
                    'commentary' => 'e-mail',
                ],
                [
                    'name' => 'NUMERO_IDENTIFICACION_AUTORIZADO',
                    'type' => 'string',
                    'length' => 15,
                    'required' => true,
                    'commentary' => 'Número identificación del autorizado',
                ],
                [
                    'name' => 'FILLER',
                    'type' => 'string',
                    'length' => 27,
                    'required' => true,
                    'commentary' => 'Filler',
                ],
            ],
        ];

        return $format;
    }

    /**
     * GET SCOTIABANK PAYMENT FORMAT
     * @return array fields
     * @author bgiron
     */
    public function getFormatScotiabank() {
        $format = [
            'header' => [
                [
                    'name' => 'REGISTRO', // 00001
                    'type' => 'number',
                    'length' => 5,
                    'required' => true,
                    'commentary' => 'REGISTRO',
                ],
                [
                    'name' => 'TIPO_REGISTRO', // 01
                    'type' => 'number',
                    'length' => 2,
                    'required' => true,
                    'commentary' => 'TIPO_REGISTRO',
                ],
                [
                    'name' => 'FECHA_RECIBO', // 20022024
                    'type' => 'number',
                    'length' => 8,
                    'required' => true,
                    'commentary' => 'FECHA_RECIBO',
                ],
                [
                    'name' => 'NIT_CLIENTE', // 09015312486
                    'type' => 'number',
                    'length' => 11,
                    'required' => true,
                    'commentary' => 'NIT_CLIENTE',
                ],
                [
                    'name' => 'CLAVE', // PGSYRENSAN
                    'type' => 'string',
                    'length' => 10,
                    'required' => true,
                    'commentary' => 'CLAVE',
                ],
                [
                    'name' => 'REGISTROS_ENVIADOS', // 000043
                    'type' => 'number',
                    'length' => 6,
                    'required' => true,
                    'commentary' => 'REGISTROS_ENVIADOS',
                ],
                [
                    'name' => 'TIPO_CARGO', // 2
                    'type' => 'number',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'TIPO_CARGO',
                ],
                [
                    'name' => 'OFICINA_PAGO', // 0002
                    'type' => 'number',
                    'length' => 4,
                    'required' => true,
                    'commentary' => 'OFICINA_PAGO',
                ],
                [
                    'name' => 'NUMERO_CUENTA', // 001581022863
                    'type' => 'number',
                    'length' => 12,
                    'required' => true,
                    'commentary' => 'NUMERO_CUENTA',
                ],
                [
                    'name' => 'RESULTADO_VALIDACION', // 0
                    'type' => 'number',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'RESULTADO_VALIDACION',
                ],
                [
                    'name' => 'NUMERO_LOTE', // 0
                    'type' => 'number',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'NUMERO_LOTE',
                ],
                [
                    'name' => 'MOTIVO_RECHAZO', //
                    'type' => 'string',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'MOTIVO_RECHAZO',
                ],
                [
                    'name' => 'ID_PROCESO', // 0
                    'type' => 'number',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'ID_PROCESO',
                ],
                [
                    'name' => 'USUARIO', //
                    'type' => 'string',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'USUARIO',
                ],
            ],
            'body' => [
                [
                    'name' => 'REGISTRO', // "00002"
                    'type' => 'number',
                    'length' => 5,
                    'required' => true,
                    'commentary' => 'REGISTRO',
                ],
                [
                    'name' => 'TIPO_REGISTRO', // "02"
                    'type' => 'number',
                    'length' => 2,
                    'required' => true,
                    'commentary' => 'TIPO_REGISTRO',
                ],
                [
                    'name' => 'NUMERO_CUENTA', // "000000000000"
                    'type' => 'number',
                    'length' => 12,
                    'required' => true,
                    'commentary' => 'NUMERO_CUENTA',
                ],
                [
                    'name' => 'NIT_BENEFICIARIO', // "01234197873"
                    'type' => 'number',
                    'length' => 11,
                    'required' => true,
                    'commentary' => 'NIT_BENEFICIARIO',
                ],
                [
                    'name' => 'NOMBRE_BENEFICIARIO', // "JENSY DANIELA QUICENO                   "
                    'type' => 'string',
                    'length' => 40,
                    'required' => true,
                    'commentary' => 'NOMBRE_BENEFICIARIO',
                ],
                [
                    'name' => 'CODIGO_TRANSACCION', // "911"
                    'type' => 'number',
                    'length' => 3,
                    'required' => true,
                    'commentary' => 'CODIGO_TRANSACCION',
                ],
                [
                    'name' => 'TIPO_CARGO', // "02"
                    'type' => 'number',
                    'length' => 2,
                    'required' => true,
                    'commentary' => 'TIPO_CARGO',
                ],
                [
                    'name' => 'VALOR_NETO', // "000000190888800"
                    'type' => 'number',
                    'length' => 15,
                    'required' => true,
                    'commentary' => 'VALOR_NETO',
                    'decimals' => 2,
                ],
                [
                    'name' => 'NUMERO_FACTURA', // "          "
                    'type' => 'string',
                    'length' => 10,
                    'required' => true,
                    'commentary' => 'NUMERO_FACTURA',
                ],
                [
                    'name' => 'NUMERO_CONTROL_PAGO', // "000000"
                    'type' => 'number',
                    'length' => 6,
                    'required' => true,
                    'commentary' => 'NUMERO_CONTROL_PAGO',
                ],
                [
                    'name' => 'VALOR_RETENCION', // "000000000000000"
                    'type' => 'number',
                    'length' => 15,
                    'required' => true,
                    'commentary' => 'VALOR_RETENCION',
                ],
                [
                    'name' => 'VALOR_IVA', // "000000000000000"
                    'type' => 'number',
                    'length' => 15,
                    'required' => true,
                    'commentary' => 'VALOR_IVA',
                ],
                [
                    'name' => 'FECHA_PAGO', // "20022024"
                    'type' => 'number',
                    'length' => 8,
                    'required' => true,
                    'commentary' => 'FECHA_PAGO',
                ],
                [
                    'name' => 'NUMERO_NOTA_DEBITO', // "0000000000"
                    'type' => 'number',
                    'length' => 10,
                    'required' => true,
                    'commentary' => 'NUMERO_NOTA_DEBITO',
                ],
                [
                    'name' => 'VALOR_NOTA_DEBITO', // "000000000000000"
                    'type' => 'number',
                    'length' => 15,
                    'required' => true,
                    'commentary' => 'VALOR_NOTA_DEBITO',
                ],
                [
                    'name' => 'CODIGO_BANCO', // "00560013"
                    'type' => 'number',
                    'length' => 8,
                    'required' => true,
                    'commentary' => 'CODIGO_BANCO',
                ],
                [
                    'name' => 'NUMERO_CUENTA_ABONO', // "00000000243241056"
                    'type' => 'number',
                    'length' => 17,
                    'required' => true,
                    'commentary' => 'NUMERO_CUENTA_ABONO',
                ],
                [
                    'name' => 'CLASE_CUENTA', // "2"
                    'type' => 'number',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'CLASE_CUENTA',
                ],
                [
                    'name' => 'TIPO_DOCUMENTO', // "C"
                    'type' => 'string',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'TIPO_DOCUMENTO',
                ],
                [
                    'name' => 'ADENDA', // "                                                                                "
                    'type' => 'string',
                    'length' => 80,
                    'required' => true,
                    'commentary' => 'ADENDA',
                ],
                [
                    'name' => 'MOTIVO_RECHAZO', // " "
                    'type' => 'string',
                    'length' => 2,
                    'required' => true,
                    'commentary' => 'MOTIVO_RECHAZO',
                ],
            ],
            'footer' => [
                [
                    'name' => 'REGISTRO', // "00043"
                    'type' => 'number',
                    'length' => 5,
                    'required' => true,
                    'commentary' => 'REGISTRO',
                ],
                [
                    'name' => 'TIPO_REGISTRO', // "03"
                    'type' => 'number',
                    'length' => 2,
                    'required' => true,
                    'commentary' => 'TIPO_REGISTRO',
                ],
                [
                    'name' => 'NUMERO_REGISTRO', // "000043"
                    'type' => 'number',
                    'length' => 6,
                    'required' => true,
                    'commentary' => 'NUMERO_REGISTRO',
                ],
            ],
        ];

        return $format;
    }

    /**
     * GET AV VILLAS PAYMENT FORMAT
     * @return array fields
     * @author bgiron
     */
    public function getFormatAvVillas() {
        $format = [
            'header' => [
                [
                    'name' => 'TIPO_REGISTRO',
                    'type' => 'number',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'Tipo de Registro',
                    'default' => 1,
                ],
                [
                    'name' => 'NUMERO_PRODUCTO_ORIGEN',
                    'type' => 'number',
                    'length' => 17,
                    'required' => true,
                    'commentary' => 'Número Producto Origen',
                ],
                [
                    'name' => 'TIPO_PRODUCTO_ORIGEN',
                    'type' => 'number',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'Tipo de Producto Origen',
                ],
                [
                    'name' => 'CODIGO_PRODUCTO',
                    'type' => 'string',
                    'length' => 2,
                    'required' => true,
                    'commentary' => 'Código de Producto',
                ],
                [
                    'name' => 'FECHA_EFECTIVA',
                    'type' => 'number',
                    'length' => 8,
                    'required' => true,
                    'commentary' => 'Fecha Efectiva',
                ],
                [
                    'name' => 'NUMERO_IDENTIFICACION_ORIGEN',
                    'type' => 'number',
                    'length' => 15,
                    'required' => true,
                    'commentary' => 'Número Identificación Origen',
                ],
                [
                    'name' => 'TIPO_IDENTIFICACION_ORIGEN',
                    'type' => 'number',
                    'length' => 2,
                    'required' => true,
                    'commentary' => 'Tipo Identificación Origen',
                ],
                [
                    'name' => 'NOMBRE_ORIGEN',
                    'type' => 'string',
                    'length' => 16,
                    'required' => true,
                    'commentary' => 'Nombre Origen',
                ],
                [
                    'name' => 'CODIGO_PLAZA_ORIGEN',
                    'type' => 'number',
                    'length' => 4,
                    'required' => true,
                    'commentary' => 'Código Plaza Origen',
                ],
                [
                    'name' => 'TIPO_PAGO',
                    'type' => 'string',
                    'length' => 3,
                    'required' => true,
                    'commentary' => 'Tipo Pago',
                ],
                [
                    'name' => 'SECUENCIA_CLIENTE',
                    'type' => 'number',
                    'length' => 6,
                    'required' => true,
                    'commentary' => 'Secuencia Cliente',
                ],
                [
                    'name' => 'CANAL',
                    'type' => 'number',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'Canal',
                ],
            ],
            'body' => [
                [
                    'name' => 'TIPO_REGISTRO',
                    'type' => 'number',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'Tipo de Registro',
                    'default' => '2',
                ],
                [
                    'name' => 'CODIGO_TRANSACCION',
                    'type' => 'number',
                    'length' => 2,
                    'required' => true,
                    'commentary' => 'Código Transacción',
                ],
                [
                    'name' => 'CODIGO_BANCO_DESTINO',
                    'type' => 'number',
                    'length' => 4,
                    'required' => true,
                    'commentary' => 'Código Banco Destino',
                ],
                [
                    'name' => 'CODIGO_PLAZA_DESTINO',
                    'type' => 'number',
                    'length' => 4,
                    'required' => true,
                    'commentary' => 'Código Plaza Destino',
                ],
                [
                    'name' => 'NUMERO_IDENTIFICACION_DESTINO',
                    'type' => 'number',
                    'length' => 15,
                    'required' => true,
                    'commentary' => 'Número Identificación Destino',
                ],
                [
                    'name' => 'TIPO_IDENTIFICACION_DESTINO',
                    'type' => 'number',
                    'length' => 2,
                    'required' => true,
                    'commentary' => 'Tipo Identificación Destino',
                ],
                [
                    'name' => 'NUMERO_PRODUCTO_DESTINO',
                    'type' => 'number',
                    'length' => 17,
                    'required' => true,
                    'commentary' => 'Número Producto Destino',
                ],
                [
                    'name' => 'TIPO_PRODUCTO_DESTINO',
                    'type' => 'number',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'Tipo Producto Destino',
                ],
                [
                    'name' => 'NOMBRE_BENEFICIARIO',
                    'type' => 'string',
                    'length' => 22,
                    'required' => true,
                    'commentary' => 'Nombre Beneficiario',
                ],
                [
                    'name' => 'INDICADOR_MAS_ADENDAS',
                    'type' => 'number',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'Indicador Mas Adendas',
                ],
                [
                    'name' => 'VALOR_TRANSACCION',
                    'type' => 'number',
                    'length' => 18,
                    'required' => true,
                    'commentary' => 'Valor Transacción',
                    // 'decimals' => 2,
                ],
                [
                    'name' => 'INDICADOR_VALIDACION',
                    'type' => 'number',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'Indicador Validación',
                ],
                [
                    'name' => 'REFERENCIA_1',
                    'type' => 'string',
                    'length' => 16,
                    'required' => true,
                    'commentary' => 'Referencia 1',
                ],
            ],
            'footer' => [
                [
                    'name' => 'TIPO_REGISTRO',
                    'type' => 'number',
                    'length' => 1,
                    'required' => true,
                    'commentary' => 'Tipo de Registro',
                    'default' => '4',
                ],
                [
                    'name' => 'CANTIDAD_TOTAL_REGISTROS_DETALLE',
                    'type' => 'number',
                    'length' => 8,
                    'required' => true,
                    'commentary' => 'Cantidad Total Registros Detalle',
                ],
                [
                    'name' => 'VALOR_TOTAL_TRANSACCIONES',
                    'type' => 'number',
                    'length' => 18,
                    'required' => true,
                    'commentary' => 'Valor Total Transacciones',
                    // 'decimals' => 2,
                ],
            ],
        ];

        return $format;
    }

    /**
     * [plainContent description]
     * @param  Array $formatList  Formato
     * @param  Array $contentData Listado de parametros
     * @param  string $delimiter  Delimitador
     * @return [type]              [description]
     */
    public function plainContent($formatList, $contentData, $delimiter = '') {
        $content = [];
        foreach ($formatList as $f => $format) {
            if (isset($contentData[$format['name']])) {
                $content[] = self::plainFormat($format, $contentData[$format['name']]);
            } else if (isset($format['default'])) {
                $content[] = self::plainFormat($format, $format['default']);
            } else {
                $content[] = self::plainFormat($format, '');
            }
        }
        $response = implode($delimiter, $content);
        $response.= PHP_EOL;
        return $response;
    }
}
