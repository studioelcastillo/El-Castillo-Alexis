<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Carbon\Carbon;
use Log;

use App\Library\HelperController;
use App\Library\LogController;
use App\Services\PlainService;
use App\Requests\LoginDto;
use App\Models\User;
use App\Models\Payment;
use App\Models\Studio;

class PaymentController extends Controller
{
    private $helper;
    private $log;

    /**
     * Create a new instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->helper = new HelperController();
        $this->log = new LogController();
    }

    /**
     * Create a new record.
     *
     * @return response()->json
     */
    public function store(Request $request)
    {
        try {
            DB::beginTransaction();
            $data = $request->all();
            // $uAuth = $request->auth;
            $uAuth = $request->user();

            // validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            // validamos los datos
            $this->validate($request, [
                'payfile_id' => 'required|exists:payments_files,payfile_id',
                'std_id' => 'nullable|exists:studios,std_id',
                'stdmod_id' => 'nullable|exists:studios_models,stdmod_id',
                'pay_amount' => 'required',
                'pay_period_since' => 'required',
                'pay_period_until' => 'required',
            ]);

            // create record
            $record = Payment::create([
                'payfile_id' => (isset($data['payfile_id'])) ? $data['payfile_id'] : null,
                'std_id' => (isset($data['std_id'])) ? $data['std_id'] : null,
                'stdmod_id' => (isset($data['stdmod_id'])) ? $data['stdmod_id'] : null,
                'pay_amount' => (isset($data['pay_amount'])) ? $data['pay_amount'] : null,
                'pay_period_since' => (isset($data['pay_period_since'])) ? $data['pay_period_since'] : null,
                'pay_period_until' => (isset($data['pay_period_until'])) ? $data['pay_period_until'] : null,
            ]);
            if ($record) {
                $this->log::storeLog($uAuth, 'payments', $record->pay_id, 'INSERT', null, $record, $request->ip);
                DB::commit();
                return response()->json(['status' => 'success', 'data' => $record], 201);
            } else {
                DB::rollBack();
                return response()->json(['status' => 'fail']);
            }
        } catch (Exception $e) {
            DB::rollBack();
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
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
            $record = Payment::with(['studio', 'studioModel', 'studioModel.userModel', 'studioModel.studio', 'paymentFile'])
                ->where($data['where'])
                ->orWhere($data['orWhere'])
                ->whereRaw($data['whereRaw'])
                ->whereNull('deleted_at')
                ->orderBy('pay_id', 'desc');

            $record = $this->applyTenantScope($record, $request, 'payments.std_id')->get();
            return response()->json(['status' => 'success', 'data' => $record], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        try {
            $data = $request->all();
            // $uAuth = $request->auth;
            $uAuth = $request->user();

            // validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            $record = Payment::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'payfile_id' => 'required|exists:payments_files,payfile_id',
                'std_id' => 'nullable|exists:studios,std_id',
                'stdmod_id' => 'nullable|exists:studios_models,stdmod_id',
                'pay_amount' => 'required',
                'pay_period_since' => 'required',
                'pay_period_until' => 'required',
            ]);

            $before = Payment::findOrFail($id);
            $record->update([
                'payfile_id' => (isset($data['payfile_id'])) ? $data['payfile_id'] : null,
                'std_id' => (isset($data['std_id'])) ? $data['std_id'] : null,
                'stdmod_id' => (isset($data['stdmod_id'])) ? $data['stdmod_id'] : null,
                'pay_amount' => (isset($data['pay_amount'])) ? $data['pay_amount'] : null,
                'pay_period_since' => (isset($data['pay_period_since'])) ? $data['pay_period_since'] : null,
                'pay_period_until' => (isset($data['pay_period_until'])) ? $data['pay_period_until'] : null,
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'payments', $record->pay_id, 'UPDATE', $before, $record, $request->ip);

                return response()->json(['status' => 'success', 'data' => $record->pay_id], 200);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $id)
    {
        try {
            $data = $request->all();
            // $uAuth = $request->auth;
            $uAuth = $request->user();

            // validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            // validate relations
            $request['id'] = $id;
            $errors = $this->helper->validateWithMessages($request, [
                'id' => [
                    'required' => '',
                    'integer' => '',
                    'exists:payments,pay_id' => '',
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = Payment::findOrFail($id);
            $before = Payment::findOrFail($id);
            // $record->update([
            //     'deleted_at' => new DateTime()
            // ]);
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'payments', $record->pay_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->pay_id], 200);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * export resources to Excel
     *
     * @param  \Illuminate\Http\Request  $request
     */
    public function export(Request $request)
    {
        //////////
        // DATA //
        //////////
        $data = $this->helper::generateConditions($request);
        $records = Payment::with(['studio', 'studioModel', 'paymentFile'])
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNull('deleted_at')
            ->orderBy('pay_id', 'desc')
            ->get();

        ////////////
        // EXPORT //
        ////////////
        // redirect output to client browser
        $fileName = 'payments_export.xlsx';
        header("Content-type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        header('Content-Disposition: attachment;filename="'.$fileName.'"');
        header('Cache-Control: max-age=0');
        header("Pragma: no-cache");
        header("Expires: 0");

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // $header is an array containing column headers
        $header = [
            array(
                'ID',
                'CARGUE DE PAGOS',
                'ESTUDIO',
                'MODELO',
                'MONTO PAGO',
                'PERIODO (DESDE)',
                'PERIODO (HASTA)',
                'FECHA CREACIÓN',
            )
        ];
        $sheet->fromArray($header, null, 'A1');

        // $dataset is an array containing data content
        $dataset = array();
        foreach ($records as $data) {
            $dataset[] = array(
                $data->pay_id, // ID
                isset($data->paymentFile) ? $data->paymentFile->payfile_description : '', // CARGUE DE PAGOS
                isset($data->studio) ? $data->studio->std_name : '', // ESTUDIO
                $data->pay_amount, // MONTO PAGO
                $data->pay_period_since, // PERIODO (DESDE)
                $data->pay_period_until, // PERIODO (HASTA)
                $data->created_at, // FECHA CREACIÓN
            );
        }
        $sheet->fromArray($dataset, null, 'A2');

        ////////////
        // FORMAT //
        ////////////
        $highestRow = $sheet->getHighestRow();
        $highestColumn = $sheet->getHighestColumn();

        // titles
        $sheet->getStyle('A1:'.$highestColumn.'1')->applyFromArray([
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
            ],
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'ffffff']
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => 'thin',
                    'color' => ['rgb' => '215867']
                ],
            ]
        ]);
        $sheet->getStyle('A1:'.$highestColumn.'1')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('215867');

        // content
        $sheet->getStyle('A2:'.$highestColumn.$highestRow)->applyFromArray([
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
            ],
            'font' => [
                'bold' => false,
                'color' => ['argb' => '000']
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => 'thin',
                    'color' => ['rgb' => '215867']
                ],
            ]
        ]);

        // autofilters
        $spreadsheet->getActiveSheet()->setAutoFilter(
            $spreadsheet->getActiveSheet()->calculateWorksheetDimension()
        );

        // autosize
        foreach ($sheet->getColumnIterator() as $column) {
            $sheet->getColumnDimension($column->getColumnIndex())->setAutoSize(true);
        }

        ////////////
        // WRITER //
        ////////////
        // $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        // $writer->save('php://output');
        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save('php://output');

        return response('', 200);
    }


    public function paymentFileContent($format, $payment, $std_id=null)
    {
        $plainService = new PlainService();
        $fileContent = '';
        $fileName = '';
        $studio_condition = (isset($std_id)) ? "st.std_id = ".$std_id : "st.std_principal = true";

        ////////////////
        // BANCO BBVA //
        ////////////////
        if ($format == 'BANCO BBVA') {
            $formatList = $plainService->getFormatBBVA();
            $fileName = 'BBVA_'.date('Ymd', strtotime($payment['report_since'])).'-'.date('Ymd', strtotime($payment['report_until'])).'.txt';
            $contentType = 'application/txt';

            // get studio
            $studio = Studio::where('std_principal', true)->first();

            // header
            if (isset($formatList['header'])) {
                $contentData = [];
                // transform data in plain format
                $fileContent.= $plainService->plainContent($formatList['header'], $contentData);
            }
            // body
            if (isset($formatList['body'])) {
                // loop data
                foreach ($payment['detail'] as $data) {
                    $contentData = [];

                    // data transform
                    $data['beneficiary_name'] = strtoupper($this->helper::removeAccents($data['beneficiary_name']));

                    // TIPO_DOC_RECEPTOR
                    // '01' - Cédula de ciudadanía
                    // '02' - Cédula de extranjería
                    // '03' - N.I.T. Persona Jurídica
                    // '04' - Tarjeta de Identidad
                    // '05' - Pasaporte
                    // '06' - Nit Extranjería
                    // '07' - Sociedad extranjera sin N.I.T. En Colombia
                    // '08' - Fideicomiso
                    // '09' - Nit Persona Natural
                    $opts = [
                        'CEDULA CIUDADANIA' => '01',
                        'CEDULA EXTRANJERIA' => '02',
                        'PASAPORTE' => '05',
                        'NIT' => '03',
                    ];
                    $contentData['TIPO_DOC_RECEPTOR'] = isset($opts[$data['beneficiary_document_type']]) ? $opts[$data['beneficiary_document_type']] : '01';

                    $contentData['NUM_DOC_RECEPTOR'] = $data['beneficiary_document'];

                    // 1 = Abono en Cuenta.
                    // 2 = Abono mediante pago en cheque de gerencia
                    // 3 = Abono Mediante Efectivo.
                    $contentData['FORMA_PAGO'] = 1;

                    // COD_BANCO_RECEPTOR
                    // Para forma de pago "1" (Pago con Abono a cuenta).Colocar del Banco receptor,
                    // existe una tabla de bancos.Para forma de pago "2" 0 "3" (Pago con cheque o efectivo)
                    // Colocar el código 0013 que corresponde a BBVA
                    // --------------------------------------------
                    // | CÓDIGO | DESCRIPCIÓN                     |
                    // --------------------------------------------
                    // | 0      | BANCO DE LA REPÚBLICA           |
                    // | 1      | BANCO DE BOGOTA                 |
                    // | 2      | BANCO POPULAR                   |
                    // | 6      | BANCO ITAU                      |
                    // | 7      | BANCOLOMBIA                     |
                    // | 9      | CITIBANK                        |
                    // | 12     | BANCO GNB SUDAMERIS             |
                    // | 13     | BBVA COLOMBIA                   |
                    // | 19     | SCOTIABANK COLPATRIA            |
                    // | 23     | BANCO DE OCCIDENTE              |
                    // | 32     | BANCO CAJA SOCIAL               |
                    // | 40     | BANCO AGRARIO                   |
                    // | 47     | BANCO MUNDO MUJER S.A.          |
                    // | 51     | BANCO DAVIVIENDA                |
                    // | 52     | BANCO AV VILLAS                 |
                    // | 53     | BANCO W S.A.                    |
                    // | 58     | BANCO CREDIFINANCIERA S.A.C.F   |
                    // | 59     | BANCAMIA S.A.                   |
                    // | 60     | BANCO PICHINCHA S.A.            |
                    // | 61     | BANCOOMEVA S.A.                 |
                    // | 62     | BANCO FALABELLA                 |
                    // | 63     | BANCO FINANDINA S.A. BIC        |
                    // | 65     | BANCO SANTANDER COLOMBIA        |
                    // | 66     | BANCO COOPERATIVO COOPCENTRAL   |
                    // | 67     | BANCO COMPARTIR S.A             |
                    // | 69     | BANCO SERFINANZA                |
                    // | 70     | LULO BANK                       |
                    // | 71     | BANCO J.P. MORGAN COLOMBIA S.A. |
                    // | 97     | DALE                            |
                    // | 1283   | CFA COOPERATIVA FINANCIERA      |
                    // | 1289   | COTRAFA                         |
                    // | 1292   | CONFIAR COOPERATIVA FINANCIERA  |
                    // | 1303   | BANCO UNION antes GIROS         |
                    // | 1370   | COLTEFINANCIERA                 |
                    // | 1507   | NEQUI                           |
                    // | 1551   | DAVIPLATA                       |
                    // | 1558   | BAN100                          |
                    // | 1637   | IRIS                            |
                    // | 1801   | MOVII S.A.                      |
                    // | 1804   | UALÁ                            |
                    // | 1811   | RAPPIPAY                        |
                    // | 1815   | ALIANZA FIDUCIARIA              |
                    // | 1816   | CREZCAMOS                       |
                    // --------------------------------------------
                    $opts = [
                        'BANCO DE BOGOTA' => '1',
                        'BANCO POPULAR' => '2',
                        'BANCOLOMBIA' => '7',
                        'BANCO BBVA' => '13',
                        'COLPATRIA' => '19',
                        'BANCO DE OCCIDENTE' => '23',
                        'BANCO CAJA SOCIAL' => '32',
                        'BANCO DAVIVIENDA' => '51',
                        'BANCO AV VILLAS' => '52',
                        'BANCOOMEVA' => '61',
                        'BANCO FALABELLA' => '62',
                        'SCOTIABANK' => '19',
                        'NEQUI' => '1507',
                    ];
                    $contentData['COD_BANCO_RECEPTOR'] = isset($opts[$data['bank_entity']]) ? $opts[$data['bank_entity']] : '01';

                    // NUM_CUENTA_BBVA
                    if ($data['bank_entity'] == 'BANCO BBVA') {
                        $contentData['NUM_CUENTA_BBVA'] = $data['bank_account'];
                    } else {
                        $contentData['NUM_CUENTA_BBVA'] = '';
                    }
                    
                    // TIPO_CUENTA_NACHAM
                    //  Obligatorio Para Forma de Pago '1' y código de Banco diferente a '0013' (Abono a Cuenta que no es Cuenta del BBVA).
                    //  01 = Cuenta corriente.
                    //  02 = Cuenta de Ahorros.
                    //  00 = En caso de que Banco sea igual a 0013 (Cuenta del BBVA).
                    if ($data['bank_entity'] !== 'BANCO BBVA') {
                        // CORRIENTE
                        if ($data['bank_account_type'] == 'CORRIENTE') {
                            $contentData['TIPO_CUENTA_NACHAM'] = '01';
                        
                        // AHORROS
                        } else if ($data['bank_account_type'] == 'AHORRO') {
                            $contentData['TIPO_CUENTA_NACHAM'] = '02';

                        // OTRO
                        } else {
                            $contentData['TIPO_CUENTA_NACHAM'] = '';
                        }
                    } else {
                        $contentData['TIPO_CUENTA_NACHAM'] = '00';
                    }
                
                    // NUM_CUENTA_NACHAM
                    if ($data['bank_entity'] !== 'BANCO BBVA') {
                        $contentData['NUM_CUENTA_NACHAM'] = $data['bank_account'];
                    } else {
                        $contentData['NUM_CUENTA_NACHAM'] = '';
                    }

                    $contentData['VALOR'] = $data['sum_earnings_total'];
                    $contentData['FECHA'] = date('Ymd');
                    $contentData['NOM_BENEFICIARIO'] = $data['beneficiary_name'];
                    $contentData['DIR_1'] = 'CALI';
                    $contentData['CONCEPTO_1'] = 'PAGO '.date('Ymd', strtotime($payment['report_since'])).'-'.date('Ymd', strtotime($payment['report_until']));

                    // transform data in plain format
                    $fileContent.= $plainService->plainContent($formatList['body'], $contentData);
                }
            }
            // footer
            if (isset($formatList['footer'])) {
                $contentData = [];
                // transform data in plain format
                $fileContent.= $plainService->plainContent($formatList['footer'], $contentData);
            }

        /////////////////
        // BANCOLOMBIA //
        /////////////////
        } else if ($format == 'BANCOLOMBIA') {
            $formatList = $plainService->getFormatBancolombiaPAB();
            $fileName = 'Bancolombia_PAB_'.date('Ymd', strtotime($payment['report_since'])).'-'.date('Ymd', strtotime($payment['report_until'])).'.txt';
            $contentType = 'application/txt';

            // get studio
            $studio = DB::select("
                SELECT
                    -- studio
                    st.std_id,
                    st.std_nit,
                    st.std_name,
                    -- bank_account
                    ba.bankacc_id,
                    ba.bankacc_entity,
                    ba.bankacc_number,
                    ba.bankacc_type,
                    ba.bankacc_main,
                    ba.bankacc_beneficiary_name,
                    ba.bankacc_beneficiary_document,
                    ba.bankacc_beneficiary_document_type
                FROM studios st
                INNER JOIN banks_accounts ba ON ba.std_id = st.std_id
                WHERE bankacc_entity='BANCOLOMBIA' AND $studio_condition
            ");
            if (empty($studio)) {
                echo "Error: No existe cuenta bancaria de ".$payment['bank']." asociada a este estudio";
                die();
                // throw new \Exception("No existe cuenta bancaria asociada a este estudio");
            }
            $studio = $studio[0];

            // header
            if (isset($formatList['header'])) {
                $contentData = [];
                $contentData['NIT_ENTIDAD_ORIGINADORA'] = $studio->std_nit;

                // --------------------------------------------
                // | CODCLAPAGO | DESCRIP                     |
                // --------------------------------------------
                // | 220        | PAGO A PROVEEDORES          |
                // | 221        | PAGO A PROVEEDORES          |
                // | 225        | PAGO DE NOMINA              |
                // | 226        | PAGO DE NOMINA              |
                // | 238        | PAGOS TERCEROS              |
                // | 239        | PAGOS PENSIONES             |
                // | 820        | PAGOS TESORERIA PROVEEDORES |
                // | 825        | PAGOS TESORERIA NOMINA      |
                // | 838        | PAGOS TESORERIA TERCEROS    |
                // | 920        | PAGOS DAT PROVEEDORES       |
                // | 925        | PAGOS DAT NOMINA            |
                // | 938        | PAGOS DAT TERCEROS          |
                // --------------------------------------------
                $contentData['CLASE_TRANSACCION'] = '220';
                
                $contentData['DESCRIPCION_PROPOSITO_TRANSACCIONES'] = 'PAGOS';
                $contentData['FECHA_TRANSMISION_LOTE'] = date('Ymd');

                // Secuencia de envío de lotes en un mismo día, no puede enviarse la misma secuencia.
                // Generar un valor aleatorio de 2 caracteres alfanuméricos
                // $contentData['SECUENCIA_ENVIO_LOTES'] = substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 2);
                $contentData['SECUENCIA_ENVIO_LOTES'] = 'A1';

                $contentData['FECHA_APLICACION_TRANSACCIONES'] = date('Ymd');
                $contentData['NUMERO_REGISTROS'] = $payment['nrows'];
                $contentData['SUMATORIA_DEBITOS'] = 0;
                $contentData['SUMATORIA_CREDITOS'] = $payment['total'];
                $contentData['CUENTA_CLIENTE_DEBITAR'] = $studio->bankacc_number;
                
                // TIPO_CUENTA_CLIENTE_DEBITAR (segun PDF de Bancolombia)
                // S: ahorros
                // D: corriente
                // C: Contable
                // Estos codigos estan como desactualizados mejor tomar estos:
                // D: Debido
                // C: Corriente

                // CORRIENTE
                if ($studio->bankacc_type == 'CORRIENTE') {
                    $contentData['TIPO_CUENTA_CLIENTE_DEBITAR'] = 'C';
                // AHORROS
                } else if ($studio->bankacc_type == 'AHORRO') {
                    $contentData['TIPO_CUENTA_CLIENTE_DEBITAR'] = 'D';
                // OTRO
                } else {
                    $contentData['TIPO_CUENTA_CLIENTE_DEBITAR'] = '';
                }

                // transform data in plain format
                $fileContent.= $plainService->plainContent($formatList['header'], $contentData);
            }
            // body
            if (isset($formatList['body'])) {
                // loop data
                foreach ($payment['detail'] as $data) {
                    $contentData = [];

                    // data transform
                    $data['beneficiary_name'] = strtoupper($this->helper::removeAccents($data['beneficiary_name']));

                    $contentData['NIT_BENEFICIARIO'] = $data['beneficiary_document'];
                    $contentData['NOMBRE_BENEFICIARIO'] = $data['beneficiary_name'];

                    // BANCO_CUENTA_BENEFICIARIO_DESTINO
                    // Banco cuenta del beneficiario. Es requerido solo si la transacción es abono a cuenta.
                    // https://www.satbancolombia.com/conversores#!/bancos
                    // -------------------------------------------
                    // | Código | Banco                          |
                    // -------------------------------------------
                    // | 1059   | BANCAMIA S.A                   |
                    // | 1040   | BANCO AGRARIO                  |
                    // | 1052   | BANCO AV VILLAS                |
                    // | 1805   | BANCO BTG PACTUAL              |
                    // | 1032   | BANCO CAJA SOCIAL BCSC SA      |
                    // | 1066   | BANCO COOPERATIVO COOPCENTRAL  |
                    // | 1558   | BANCO CREDIFINANCIERA SA.      |
                    // | 1051   | BANCO DAVIVIENDA SA            |
                    // | 1001   | BANCO DE BOGOTA                |
                    // | 1023   | BANCO DE OCCIDENTE             |
                    // | 1062   | BANCO FALABELLA S.A.           |
                    // | 1063   | BANCO FINANDINA S.A.           |
                    // | 1012   | BANCO GNB SUDAMERIS            |
                    // | 1071   | BANCO J.P. MORGAN COLOMBIA S.A |
                    // | 1064   | BANCO MULTIBANK S.A.           |
                    // | 1047   | BANCO MUNDO MUJER              |
                    // | 1060   | BANCO PICHINCHA                |
                    // | 1002   | BANCO POPULAR                  |
                    // | 1058   | BANCO PROCREDIT COL            |
                    // | 1065   | BANCO SANTANDER DE NEGOCIOS CO |
                    // | 1069   | BANCO SERFINANZA S.A           |
                    // | 1303   | BANCO UNION S.A                |
                    // | 1053   | BANCO W S.A                    |
                    // | 1031   | BANCOLDEX S.A.                 |
                    // | 1007   | BANCOLOMBIA                    |
                    // | 1061   | BANCOOMEVA                     |
                    // | 1013   | BBVA COLOMBIA                  |
                    // | 1808   | BOLD CF                        |
                    // | 1009   | CITIBANK                       |
                    // | 1812   | COINK                          |
                    // | 1370   | COLTEFINANCIERA S.A            |
                    // | 1292   | CONFIAR COOPERATIVA FINANCIERA |
                    // | 1291   | COOFINEP COOPERATIVA FINANCIER |
                    // | 1283   | COOPERATIVA FINANCIERA DE ANTI |
                    // | 1289   | COOTRAFA COOPERATIVA FINANCIER |
                    // | 1551   | DAVIPLATA                      |
                    // | 1802   | DING TECNIPAGOS SA             |
                    // | 1121   | FINANCIERA JURISCOOP S.A. COMP |
                    // | 1814   | GLOBAL66                       |
                    // | 1010   | HSBC                           |
                    // | 1637   | IRIS                           |
                    // | 1014   | ITAU                           |
                    // | 1006   | ITAU antes Corpbanca           |
                    // | 1286   | JFK COOPERATIVA FINANCIERA     |
                    // | 1070   | LULO BANK S.A.                 |
                    // | 1067   | MIBANCO S.A.                   |
                    // | 1801   | MOVII                          |
                    // | 1507   | NEQUI                          |
                    // | 1560   | PIBANK                         |
                    // | 1803   | POWWI                          |
                    // | 1811   | RAPPIPAY                       |
                    // | 1019   | SCOTIABANK COLPATRIA S.A       |
                    // | 1804   | Ualá                           |
                    // -------------------------------------------
                    $opts = [
                        'BANCO DE BOGOTA' => '1001',
                        'BANCO POPULAR' => '1002',
                        'BANCOLOMBIA' => '1007',
                        'BANCO BBVA' => '1013',
                        'COLPATRIA' => '1019',
                        'BANCO DE OCCIDENTE' => '1023',
                        'BANCO CAJA SOCIAL' => '1032',
                        'BANCO DAVIVIENDA' => '1051',
                        'BANCO AV VILLAS' => '1052',
                        'BANCO FALABELLA' => '1062',
                        'BANCOOMEVA' => '1061',
                        'SCOTIABANK' => '1019',
                        'NEQUI' => '1507'
                    ];
                    $contentData['BANCO_CUENTA_BENEFICIARIO_DESTINO'] = isset($opts[$data['bank_entity']]) ? $opts[$data['bank_entity']] : '01';

                    $contentData['NUMERO_CUENTA_BENEFICIARIO'] = $data['bank_account'];

                    // INDICADOR_LUGAR_PAGO
                    // Indicador de lugar de pago (Región). Solo aplica para generación masiva de cheques. (no aplica)
                    // --------------------------------------------------
                    // | COLUGAR | REGIONL | OFICINA | NOMBREL          |
                    // --------------------------------------------------
                    // | 1       | 1       | 1       | OFICINA CARABOBO |
                    // | 3       | 3       | 60      | CALI             |
                    // | 4       | 4       | 80      | BARANQUILLA      |
                    // | 6       | 3       | 30      | CARRERA OCTAVA   |
                    // --------------------------------------------------
                    // 
                    // Segun el nuevo formato va fijo la "S"
                    $contentData['INDICADOR_LUGAR_PAGO'] = 'S';

                    // TIPO_TRANSACCION
                    // ----------------------------------------------------------
                    // | CODTPOTRN | DESCRIP                                    |
                    // ----------------------------------------------------------
                    // | 10        | NOTIFICACIÓN DE NOVEDADES DE SUPERVIVENCIA |
                    // | 23        | PRENOTIFICACION CTA CTE                    |
                    // | 25        | PAGO POR VENTANILLA                        |
                    // | 26        | CHEQUE DE GERENCIA                         |
                    // | 27        | ABONO CUENTA CORRIENTE                     |
                    // | 28        | INSCRIPCION CUENTA CORRIENTE               |
                    // | 33        | PRENOTIFICACION CTA AHORROS                |
                    // | 36        | CHEQUES GERENCIA ENTREGA INDIVIDUAL        |
                    // | 37        | ABONO A CUENTA DE AHORROS                  |
                    // | 40        | EFECTIVO SEGURO                            |
                    // | 99        | ANULACION DE PAGO                          |
                    // ----------------------------------------------------------
                    $opts = [
                        'CORRIENTE' => '27',
                        'AHORRO' => '37',
                    ];
                    $contentData['TIPO_TRANSACCION'] = isset($opts[$data['bank_account_type']]) ? $opts[$data['bank_account_type']] : '';

                    $contentData['VALOR_TRANSACCION'] = $data['sum_earnings_total'];
                    $contentData['FECHA_APLICACION'] = date('Ymd');

                    // TIPO_DOCUMENTO_IDENTIFICACION
                    // Es requerido solo si el pago es para entregar por ventanilla. (no aplica)
                    // -------------------------------
                    // | COD | DESCRIPCION           |
                    // -------------------------------
                    // | 1   | Cédula                |
                    // | 2   | Cédula de extranjería |
                    // | 3   | Nit                   |
                    // | 4   | Tarjeta de Identidad  |
                    // | 5   | Pasaporte             |
                    // -------------------------------
                    $opts = [
                        'CEDULA CIUDADANIA' => '1',
                        'CEDULA EXTRANJERIA' => '2',
                        'PASAPORTE' => '5',
                        'NIT' => '3',
                        'PPT' => '',
                    ];
                    $contentData['TIPO_DOCUMENTO_IDENTIFICACION'] = isset($opts[$data['beneficiary_document_type']]) ? $opts[$data['beneficiary_document_type']] : '';

                    // OFICINA_ENTREGA
                    // Código de oficina para entrega de cheques disponible para el convenio.
                    // Cuando es entrega en todas las oficinas debe ir en ceros.
                    // Si es abono a cuentas debe ir en ceros.
                    $contentData['OFICINA_ENTREGA'] = 0;

                    // transform data in plain format
                    $fileContent.= $plainService->plainContent($formatList['body'], $contentData);
                }
            }
            // footer
            if (isset($formatList['footer'])) {
                $contentData = [];
                // transform data in plain format
                $fileContent.= $plainService->plainContent($formatList['footer'], $contentData);
            }

        /////////////////
        // SCOTIABANK //
        /////////////////
        } else if ($format == 'SCOTIABANK') {
            $formatList = $plainService->getFormatScotiabank();
            $fileName = 'Scotiabank_'.date('Ymd', strtotime($payment['report_since'])).'-'.date('Ymd', strtotime($payment['report_until'])).'.xml';
            $contentType = 'application/xml';

            // get studio
            $studio = DB::select("
                SELECT
                    -- studio
                    st.std_id,
                    st.std_nit,
                    st.std_verification_digit,
                    st.std_name,
                    -- bank_account
                    ba.bankacc_id,
                    ba.bankacc_entity,
                    ba.bankacc_number,
                    ba.bankacc_type,
                    ba.bankacc_main,
                    ba.bankacc_beneficiary_name,
                    ba.bankacc_beneficiary_document,
                    ba.bankacc_beneficiary_document_type
                FROM studios st
                INNER JOIN banks_accounts ba ON ba.std_id = st.std_id
                WHERE bankacc_entity='SCOTIABANK' AND $studio_condition
            ");
            if (empty($studio)) {
                echo "Error: No existe cuenta bancaria de ".$payment['bank']." asociada a este estudio";
                die();
                // throw new \Exception("No existe cuenta bancaria asociada a este estudio");
            }
            $studio = $studio[0];

            $fileContent.= '<?xml version="1.0" encoding="ISO-8859-1"?>'.PHP_EOL;
            $fileContent.= '<ROOT>'.PHP_EOL;

            // header
            if (isset($formatList['header'])) {
                foreach ($formatList['header'] as $format) {
                    // REGISTRO
                    if ($format['name'] == 'REGISTRO') {
                        $fileContent.= '<ENCABEZADO REGISTRO="'.$plainService->plainFormat($format, 1).'" ';

                    // TIPO_REGISTRO
                    } else if ($format['name'] == 'TIPO_REGISTRO') {
                        $fileContent.= 'TIPO_REGISTRO="'.$plainService->plainFormat($format, 1).'" ';

                    // FECHA_RECIBO
                    } else if ($format['name'] == 'FECHA_RECIBO') {
                        $fileContent.= 'FECHA_RECIBO="'.$plainService->plainFormat($format, date('dmY')).'" ';
                        
                    // NIT_CLIENTE
                    } else if ($format['name'] == 'NIT_CLIENTE') {
                        $fileContent.= 'NIT_CLIENTE="'.$plainService->plainFormat($format, $studio->std_nit.$studio->std_verification_digit).'" ';

                    // CLAVE
                    } else if ($format['name'] == 'CLAVE') {
                        // $fileContent.= 'CLAVE="'.$plainService->plainFormat($format, 'PGSYRENSAN').'" '; // ?? preguntar
                        $fileContent.= 'CLAVE="'.$plainService->plainFormat($format, '0000000000').'" '; // ?? preguntar

                    // REGISTROS_ENVIADOS
                    } else if ($format['name'] == 'REGISTROS_ENVIADOS') {
                        $fileContent.= 'REGISTROS_ENVIADOS="'.$plainService->plainFormat($format, $payment['nrows'] + 2).'" ';

                    // TIPO_CARGO
                    } else if ($format['name'] == 'TIPO_CARGO') {
                        $fileContent.= 'TIPO_CARGO="'.$plainService->plainFormat($format, 2).'" ';

                    // OFICINA_PAGO
                    } else if ($format['name'] == 'OFICINA_PAGO') {
                        $fileContent.= 'OFICINA_PAGO="'.$plainService->plainFormat($format, 2).'" ';

                    // NUMERO_CUENTA
                    } else if ($format['name'] == 'NUMERO_CUENTA') {
                        $fileContent.= 'NUMERO_CUENTA="'.$plainService->plainFormat($format, $studio->bankacc_number).'" ';

                    // RESULTADO_VALIDACION
                    } else if ($format['name'] == 'RESULTADO_VALIDACION') {
                        $fileContent.= 'RESULTADO_VALIDACION="'.$plainService->plainFormat($format, '').'" ';

                    // NUMERO_LOTE
                    } else if ($format['name'] == 'NUMERO_LOTE') {
                        $fileContent.= 'NUMERO_LOTE="'.$plainService->plainFormat($format, '').'" ';

                    // MOTIVO_RECHAZO
                    } else if ($format['name'] == 'MOTIVO_RECHAZO') {
                        $fileContent.= 'MOTIVO_RECHAZO="'.$plainService->plainFormat($format, '').'" ';

                    // ID_PROCESO
                    } else if ($format['name'] == 'ID_PROCESO') {
                        $fileContent.= 'ID_PROCESO="'.$plainService->plainFormat($format, '').'" ';

                    // USUARIO
                    } else if ($format['name'] == 'USUARIO') {
                        $fileContent.= 'USUARIO="'.$plainService->plainFormat($format, '').'"/>';
                    } else {
                        $fileContent.= $plainService->plainFormat($format);
                    }
                }
                $fileContent.= PHP_EOL;
            }
            // body
            if (isset($formatList['body'])) {
                // loop data
                foreach ($payment['detail'] as $d => $data) {
                    // data transform
                    $data['beneficiary_name'] = strtoupper($this->helper::removeAccents($data['beneficiary_name']));

                    foreach ($formatList['body'] as $format) {
                        // REGISTRO
                        if ($format['name'] == 'REGISTRO') {
                            $fileContent.= '<REGISTRO REGISTRO="'.$plainService->plainFormat($format, $d + 2).'" ';

                        // TIPO_REGISTRO
                        } else if ($format['name'] == 'TIPO_REGISTRO') {
                            $fileContent.= 'TIPO_REGISTRO="'.$plainService->plainFormat($format, 2).'" ';

                        // NUMERO_CUENTA
                        } else if ($format['name'] == 'NUMERO_CUENTA') {
                            $fileContent.= 'NUMERO_CUENTA="'.$plainService->plainFormat($format, 0).'" ';

                        // NIT_BENEFICIARIO
                        } else if ($format['name'] == 'NIT_BENEFICIARIO') {
                            $fileContent.= 'NIT_BENEFICIARIO="'.$plainService->plainFormat($format, $data['beneficiary_document']).'" ';

                        // NOMBRE_BENEFICIARIO
                        } else if ($format['name'] == 'NOMBRE_BENEFICIARIO') {
                            $fileContent.= 'NOMBRE_BENEFICIARIO="'.$plainService->plainFormat($format, $data['beneficiary_name']).'" ';

                        // CODIGO_TRANSACCION
                        } else if ($format['name'] == 'CODIGO_TRANSACCION') {
                            $fileContent.= 'CODIGO_TRANSACCION="'.$plainService->plainFormat($format, '911').'" ';

                        // TIPO_CARGO
                        } else if ($format['name'] == 'TIPO_CARGO') {
                            $fileContent.= 'TIPO_CARGO="'.$plainService->plainFormat($format, '02').'" ';

                        // VALOR_NETO
                        } else if ($format['name'] == 'VALOR_NETO') {
                            $fileContent.= 'VALOR_NETO="'.$plainService->plainFormat($format, $data['sum_earnings_total']).'" ';

                        // NUMERO_FACTURA
                        } else if ($format['name'] == 'NUMERO_FACTURA') {
                            $fileContent.= 'NUMERO_FACTURA="'.$plainService->plainFormat($format, '').'" ';

                        // NUMERO_CONTROL_PAGO
                        } else if ($format['name'] == 'NUMERO_CONTROL_PAGO') {
                            $fileContent.= 'NUMERO_CONTROL_PAGO="'.$plainService->plainFormat($format, '').'" ';

                        // VALOR_RETENCION
                        } else if ($format['name'] == 'VALOR_RETENCION') {
                            $fileContent.= 'VALOR_RETENCION="'.$plainService->plainFormat($format, '').'" ';

                        // VALOR_IVA
                        } else if ($format['name'] == 'VALOR_IVA') {
                            $fileContent.= 'VALOR_IVA="'.$plainService->plainFormat($format, '').'" ';

                        // FECHA_PAGO
                        } else if ($format['name'] == 'FECHA_PAGO') {
                            $fileContent.= 'FECHA_PAGO="'.$plainService->plainFormat($format, date('dmY')).'" ';

                        // NUMERO_NOTA_DEBITO
                        } else if ($format['name'] == 'NUMERO_NOTA_DEBITO') {
                            $fileContent.= 'NUMERO_NOTA_DEBITO="'.$plainService->plainFormat($format, '').'" ';

                        // VALOR_NOTA_DEBITO
                        } else if ($format['name'] == 'VALOR_NOTA_DEBITO') {
                            $fileContent.= 'VALOR_NOTA_DEBITO="'.$plainService->plainFormat($format, '').'" ';

                        // CODIGO_BANCO
                        } else if ($format['name'] == 'CODIGO_BANCO') {
                            // --------------------------------------------
                            // | Código   | Banco                         |
                            // --------------------------------------------
                            // | 059     | BANCAMIA S.A                   |
                            // | 040     | BANCO AGRARIO                  |
                            // | 601367  | BANCO AV VILLAS                |
                            // | 805     | BANCO BTG PACTUAL              |
                            // | 560082  | BANCO CAJA SOCIAL BCSC SA      |
                            // | 066     | BANCO COOPERATIVO COOPCENTRAL  |
                            // | 558     | BANCO CREDIFINANCIERA SA.      |
                            // | 589514  | BANCO DAVIVIENDA SA            |
                            // | 560001  | BANCO DE BOGOTA                |
                            // | 560023  | BANCO DE OCCIDENTE             |
                            // | 062     | BANCO FALABELLA S.A.           |
                            // | 063     | BANCO FINANDINA S.A.           |
                            // | 560012  | BANCO GNB SUDAMERIS            |
                            // | 071     | BANCO J.P. MORGAN COLOMBIA S.A |
                            // | 064     | BANCO MULTIBANK S.A.           |
                            // | 047     | BANCO MUNDO MUJER              |
                            // | 060     | BANCO PICHINCHA                |
                            // | 560002  | BANCO POPULAR                  |
                            // | 058     | BANCO PROCREDIT COL            |
                            // | 065     | BANCO SANTANDER DE NEGOCIOS CO |
                            // | 069     | BANCO SERFINANZA S.A           |
                            // | 303     | BANCO UNION S.A                |
                            // | 053     | BANCO W S.A                    |
                            // | 031     | BANCOLDEX S.A.                 |
                            // | 560007  | BANCOLOMBIA                    |
                            // | 061     | BANCOOMEVA                     |
                            // | 560013  | BBVA COLOMBIA                  |
                            // | 808     | BOLD CF                        |
                            // | 560009  | CITIBANK                       |
                            // | 812     | COINK                          |
                            // | 370     | COLTEFINANCIERA S.A            |
                            // | 292     | CONFIAR COOPERATIVA FINANCIERA |
                            // | 291     | COOFINEP COOPERATIVA FINANCIER |
                            // | 283     | COOPERATIVA FINANCIERA DE ANTI |
                            // | 289     | COOTRAFA COOPERATIVA FINANCIER |
                            // | 551     | DAVIPLATA                      |
                            // | 802     | DING TECNIPAGOS SA             |
                            // | 121     | FINANCIERA JURISCOOP S.A. COMP |
                            // | 814     | GLOBAL66                       |
                            // | 560010  | HSBC                           |
                            // | 637     | IRIS                           |
                            // | 560014  | ITAU                           |
                            // | 560006  | ITAU antes Corpbanca           |
                            // | 286     | JFK COOPERATIVA FINANCIERA     |
                            // | 070     | LULO BANK S.A.                 |
                            // | 067     | MIBANCO S.A.                   |
                            // | 801     | MOVII                          |
                            // | 507     | NEQUI                          |
                            // | 560     | PIBANK                         |
                            // | 803     | POWWI                          |
                            // | 811     | RAPPIPAY                       |
                            // | 560019  | SCOTIABANK COLPATRIA S.A       |
                            // | 804     | Ualá                           |
                            // --------------------------------------------
                            $opts = [
                                'BANCO DE BOGOTA' => '560001',
                                'BANCO POPULAR' => '560002',
                                'BANCOLOMBIA' => '560007',
                                'BANCO BBVA' => '560013',
                                'COLPATRIA' => '560019',
                                'BANCO DE OCCIDENTE' => '560023',
                                'BANCO CAJA SOCIAL' => '560082',
                                'BANCO DAVIVIENDA' => '589514',
                                'BANCO AV VILLAS' => '601367',
                                'BANCOOMEVA' => '061',
                                'BANCO FALABELLA' => '062',
                                'SCOTIABANK' => '560019',
                                'NEQUI' => '507'
                            ];
                            $fileContent.= 'CODIGO_BANCO="'.$plainService->plainFormat($format, isset($opts[$data['bank_entity']]) ? $opts[$data['bank_entity']] : '').'" ';

                        // NUMERO_CUENTA_ABONO
                        } else if ($format['name'] == 'NUMERO_CUENTA_ABONO') {
                            $fileContent.= 'NUMERO_CUENTA_ABONO="'.$plainService->plainFormat($format, $data['bank_account']).'" ';

                        // CLASE_CUENTA
                        } else if ($format['name'] == 'CLASE_CUENTA') {
                            if ($data['bank_account_type'] == 'CORRIENTE') {
                                $contentData['CLASE_CUENTA'] = '1';
                            // AHORROS
                            } else if ($data['bank_account_type'] == 'AHORRO') {
                                $contentData['CLASE_CUENTA'] = '2';
                            // OTRO
                            } else {
                                $contentData['CLASE_CUENTA'] = '';
                            }

                            $fileContent.= 'CLASE_CUENTA="'.$plainService->plainFormat($format, $contentData['CLASE_CUENTA']).'" ';

                        // TIPO_DOCUMENTO
                        } else if ($format['name'] == 'TIPO_DOCUMENTO') {
                            // TIPO_DOCUMENTO
                            // No se tiene la documentacion de este campo :(
                            $opts = [
                                'CEDULA CIUDADANIA' => 'C',
                                'CEDULA EXTRANJERIA' => 'E',
                                'PASAPORTE' => 'P',
                                'NIT' => 'N',
                                'PPT' => 'V',
                            ];
                            $contentData['TIPO_DOCUMENTO'] = isset($opts[$data['beneficiary_document_type']]) ? $opts[$data['beneficiary_document_type']] : 'C';

                            $fileContent.= 'TIPO_DOCUMENTO="'.$plainService->plainFormat($format, $contentData['TIPO_DOCUMENTO']).'" ';

                        // ADENDA
                        } else if ($format['name'] == 'ADENDA') {
                            $fileContent.= 'ADENDA="'.$plainService->plainFormat($format, '').'" ';

                        // MOTIVO_RECHAZO
                        } else if ($format['name'] == 'MOTIVO_RECHAZO') {
                            $fileContent.= 'MOTIVO_RECHAZO="'.$plainService->plainFormat($format, '').'"/>';
                        } else {
                            $fileContent.= $plainService->plainFormat($format);
                        }
                    }
                    $fileContent.= PHP_EOL;
                }
            }
            // footer
            if (isset($formatList['footer'])) {
                foreach ($formatList['footer'] as $format) {
                    // REGISTRO
                    if ($format['name'] == 'REGISTRO') {
                        $fileContent.= '<TOTAL REGISTRO="'.$plainService->plainFormat($format, $payment['nrows'] + 2).'" ';

                    // TIPO_REGISTRO
                    } else if ($format['name'] == 'TIPO_REGISTRO') {
                        $fileContent.= 'TIPO_REGISTRO="'.$plainService->plainFormat($format, 3).'" ';

                    // NUMERO_REGISTRO
                    } else if ($format['name'] == 'NUMERO_REGISTRO') {
                        $fileContent.= 'NUMERO_REGISTRO="'.$plainService->plainFormat($format, $payment['nrows'] + 2).'"/>';
                    } else {
                        $fileContent.= $plainService->plainFormat($format);
                    }
                }
            }

            $fileContent.= '</ROOT>'.PHP_EOL;

        /////////////////////
        // BANCO AV VILLAS //
        /////////////////////
        } else if ($format == 'BANCO AV VILLAS') {
            $formatList = $plainService->getFormatAvVillas();
            $fileName = 'Avvillas_'.date('Ymd', strtotime($payment['report_since'])).'-'.date('Ymd', strtotime($payment['report_until'])).'.txt';
            $contentType = 'application/txt';

            // get studio
            $studio = DB::select("
                SELECT
                    -- studio
                    st.std_id,
                    st.std_nit,
                    st.std_name,
                    -- bank_account
                    ba.bankacc_id,
                    ba.bankacc_entity,
                    ba.bankacc_number,
                    ba.bankacc_type,
                    ba.bankacc_main,
                    ba.bankacc_beneficiary_name,
                    ba.bankacc_beneficiary_document,
                    ba.bankacc_beneficiary_document_type
                FROM studios st
                INNER JOIN banks_accounts ba ON ba.std_id = st.std_id
                WHERE bankacc_entity='BANCO AV VILLAS' AND $studio_condition
            ");
            if (empty($studio)) {
                echo "Error: No existe cuenta bancaria de ".$payment['bank']." asociada a este estudio";
                die();
                // throw new \Exception("No existe cuenta bancaria asociada a este estudio");
            }
            $studio = $studio[0];

            // header
            if (isset($formatList['header'])) {
                $contentData = [];

                $contentData['NUMERO_PRODUCTO_ORIGEN'] = $studio->bankacc_number;

                // -------------------------------------
                // | CÓDIGO | TIPO DE PRODUCTO         |
                // -------------------------------------
                // | 0      | Cuenta Corriente         |
                // | 1      | Cuenta de Ahorros        |
                // | 2      | Cupo Rotativo            |
                // | 3      | Generada en otros Bancos |
                // -------------------------------------
                $opts = [
                    'CORRIENTE' => '0',
                    'AHORRO' => '1',
                ];
                $contentData['TIPO_PRODUCTO_ORIGEN'] = isset($opts[$studio->bankacc_type]) ? $opts[$studio->bankacc_type] : '0';

                // ----------------------------------
                // | CÓDIGO | PRODUCTO              |
                // ----------------------------------
                // | PN     | PAGO NOMINA           |
                // | PP     | PAGO PROVEEDORES      |
                // | RT     | RECAUDO TARJETA       |
                // | PC     | PAGO COMISION         |
                // | PH     | PAGO HONORARIOS       |
                // | PO     | OTROS PAGOS           |
                // | RC     | RECAUDO CARTERA       |
                // | RK     | RECAUDO CONVENIO      |
                // | RO     | OTROS RECAUDOS        |
                // | RS     | COBRO SERVIC IOS      |
                // | TC     | TRANSF. CONCENTRACION |
                // | TD     | TRANSF. DISPERSION    |
                // | AS     | ASOCIACION DE CUENTAS |
                // ----------------------------------
                $contentData['CODIGO_PRODUCTO'] = 'PN';
                $contentData['FECHA_EFECTIVA'] = date('Ymd');
                $contentData['NUMERO_IDENTIFICACION_ORIGEN'] = $studio->bankacc_beneficiary_document;

                // ------------------------------------
                // | CÓDIGO | TIPO DE IDENTIFICACIÓN  |
                // ------------------------------------
                // | 1      | Cedula de ciudadania    |
                // | 2      | Cedula de extranjeria   |
                // | 3      | Nit Persona Jurídica    |
                // | 5      | Registro Civil          |
                // | 6      | Nit de Extranjeria      |
                // | 10     | Pasaporte Internacional |
                // ------------------------------------
                $opts = [
                    'CEDULA CIUDADANIA' => '1',
                    'CEDULA EXTRANJERIA' => '2',
                    'PASAPORTE' => '10',
                    'NIT' => '3',
                ];
                $contentData['TIPO_IDENTIFICACION_ORIGEN'] = isset($opts[$studio->bankacc_beneficiary_document_type]) ? $opts[$studio->bankacc_beneficiary_document_type] : '3';
                $contentData['NOMBRE_ORIGEN'] = $studio->bankacc_beneficiary_name;

                // ---------------------------------
                // | CÓDIGO DANE | CIUDAD          |
                // ---------------------------------
                // | 1           | BOGOTA          |
                // | 2           | MEDELLIN        |
                // | 3           | CALI            |
                // | 4           | BARRANQUILLA    |
                // | 5           | BUCARAMANGA     |
                // | 6           | MANIZALES       |
                // | 7           | CARTAGENA       |
                // | 8           | PEREIRA         |
                // | 9           | LA MERCED       |
                // | 10          | IBAGUE          |
                // | 11          | ARMENIA         |
                // | 12          | CUCUTA          |
                // | 13          | NEIVA           |
                // | 14          | SANTA MARTA     |
                // | 15          | VILLAVICENCIO   |
                // | 16          | TULUA           |
                // | 17          | BUGA            |
                // | 18          | TUNJA           |
                // | 19          | CARTAGO         |
                // | 20          | POPAYAN         |
                // | 21          | BARRANCABERMEJA |
                // | 22          | VALLEDUPAR      |
                // | 23          | PASTO           |
                // | 24          | GIRARDOT        |
                // | 25          | MONTERIA        |
                // | 26          | BUENAVENTURA    |
                // | 27          | SINCELEJO       |
                // | 28          | SOGAMOSO        |
                // | 29          | HONDA           |
                // | 30          | DUITAMA         |
                // ---------------------------------
                $contentData['CODIGO_PLAZA_ORIGEN'] = '3';
                $contentData['TIPO_PAGO'] = 'PPD';
                $contentData['SECUENCIA_CLIENTE'] = '0';

                // ---------------------------
                // | CÓDIGO | CANAL          |
                // ---------------------------
                // | 0      | ATH CAJERO     |
                // | 1      | ACH CLIENTE    |
                // | 2      | AudioRespuesta |
                // | 4      | Internet       |
                // | 5      | Audiolínea     |
                // ---------------------------
                $contentData['CANAL'] = '4';

                // transform data in plain format
                $fileContent.= $plainService->plainContent($formatList['header'], $contentData);
            }
            // body
            if (isset($formatList['body'])) {
                // loop data
                foreach ($payment['detail'] as $data) {
                    $contentData = [];

                    // data transform
                    $data['beneficiary_name'] = strtoupper($this->helper::removeAccents($data['beneficiary_name']));

                    // -------------------------------------
                    // | CÓDIGO | TRANSACCIÓN              |
                    // -------------------------------------
                    // | 21     | DEV.CREDITO A CC         |
                    // | 22     | CREDITO  A CC            |
                    // | 23     | PRENOTIF CREDITO A CC    |
                    // | 26     | DEV.DEBITO A CC          |
                    // | 27     | DEBITO A CC              |
                    // | 28     | PRENOTIF DEBITO A CC     |
                    // | 31     | DEV.CREDITO A AH         |
                    // | 32     | CREDITO  A AH            |
                    // | 33     | PRENOTIF CREDITO A AH    |
                    // | 36     | DEV.DEBITO A AH          |
                    // | 37     | DEBITO A AH              |
                    // | 38     | PRENOTIF DEBITO A AH     |
                    // | 50     | PRUEBA                   |
                    // | 62     | REVERSION CREDITO A CC   |
                    // | 63     | REVERSION CREDITO A AH   |
                    // | 72     | REVERSION DEBITO A CC    |
                    // | 73     | REVERSION DEBITO A AH    |
                    // | 82     | DC CREDITO A CC          |
                    // | 83     | DC CREDITO A AH          |
                    // | 88     | COBRO COMISION A CC O AH |
                    // | 92     | DC DEBITO A CC           |
                    // | 93     | DC DEBITO A AH           |
                    // | 97     | ASOCIACION DE CUENTAS    |
                    // -------------------------------------
                    $opts = [
                        'CORRIENTE' => '22',
                        'AHORRO' => '32',
                    ];
                    $contentData['CODIGO_TRANSACCION'] = isset($opts[$data['bank_account_type']]) ? $opts[$data['bank_account_type']] : '';

                    // --------------------------------------------------
                    // | CÓDIGO | NOMBRE BANCO O ENTIDAD FINANCIERA     |
                    // --------------------------------------------------
                    // | 086    | Asopagos S.A                          |
                    // | 1558   | Ban100                                |
                    // | 059    | Bancamia S.A.                         |
                    // | 0040   | Banco Agrario                         |
                    // | 0052   | Banco AV Villas                       |
                    // | 0013   | Banco BBVA                            |
                    // | 1805   | Banco BTG Pactual                     |
                    // | 0032   | Banco Caja Social                     |
                    // | 0009   | Banco Citibank                        |
                    // | 0066   | Banco Cooperativo Coopcentral         |
                    // | 0014   | Banco Corpbanca                       |
                    // | 1558   | Banco Credifinanciera S.A             |
                    // | 551    | Banco Daviplata                       |
                    // | 0051   | Banco Davivienda                      |
                    // | 0001   | Banco de Bogotá                       |
                    // | 000    | Banco de la República                 |
                    // | 0023   | Banco de Occidente                    |
                    // | 0062   | Banco Falabella S.A.                  |
                    // | 0063   | Banco Finandina S.A.                  |
                    // | 0012   | Banco GNB Sudameris                   |
                    // | 0006   | Banco Itaú                            |
                    // | 1071   | Banco J.P. Morgan Colombia S.A.       |
                    // | 0067   | Banco Mi Banco S.A                    |
                    // | 047    | Banco Mundo Mujer S.A.                |
                    // | 0507   | Banco Nequi                           |
                    // | 0060   | Banco Pichincha                       |
                    // | 0002   | Banco Popular                         |
                    // | 0019   | Banco Scotiabank Colpatria            |
                    // | 1303   | Banco Union Antes Giros               |
                    // | 0053   | Banco W S.A.                          |
                    // | 031    | Bancoldex S.A.                        |
                    // | 0007   | Bancolombia                           |
                    // | 0061   | Bancoomeva                            |
                    // | 0065   | Bco. Santander de Neg                 |
                    // | 0042   | BNP Paribas S.A.                      |
                    // | 1808   | Bold CF                               |
                    // | 1812   | Coink                                 |
                    // | 0370   | Coltefinanciera S.A.                  |
                    // | 0121   | Compañía de Financiamiento Juriscoop  |
                    // | 083    | Compensar                             |
                    // | 0292   | Confiar S.A.                          |
                    // | 1291   | Coofinep Cooperativa                  |
                    // | 00283  | Cooperativa Financiera de Antioquia   |
                    // | 090    | Corficolombiana                       |
                    // | 0289   | Cotrafa Cooperativa Financiera        |
                    // | 097    | Dale                                  |
                    // | 550    | Deceval S.A.                          |
                    // | 683    | DGCPTN                                |
                    // | 685    | DGCPTN* - Sistema General de Regaifas |
                    // | 1802   | DING Tecnipagos S.A                   |
                    // | 089    | Enlace Operativo S.A.                 |
                    // | 087    | Fedecajas                             |
                    // | 084    | Gestion y contacto S.A.               |
                    // | 1814   | Global 66                             |
                    // | 1637   | IRIS                                  |
                    // | 006    | ITAU - Corpbanca                      |
                    // | 014    | ITAU - Helm Bank                      |
                    // | 1286   | JFK Cooperativa Financiera            |
                    // | 1070   | Lulo Bank S.A.                        |
                    // | 1801   | Movii                                 |
                    // | 1560   | Pibank                                |
                    // | 803    | Powwi                                 |
                    // | 058    | Procredit                             |
                    // | 151    | Rappipay                              |
                    // | 1813   | Santander Consumer                    |
                    // | 069    | Serfinanza                            |
                    // | 088    | Simple S.A.                           |
                    // | 1804   | Ualá                                  |
                    // | 1809   | UN                                    |
                    // --------------------------------------------------
                    $opts = [
                        'BANCO DE BOGOTA' => '0001',
                        'BANCO POPULAR' => '0002',
                        'BANCOLOMBIA' => '0007',
                        'BANCO BBVA' => '0013',
                        'COLPATRIA' => '0019',
                        'BANCO DE OCCIDENTE' => '0023',
                        'BANCO CAJA SOCIAL' => '0032',
                        'BANCO DAVIVIENDA' => '0051',
                        'BANCO AV VILLAS' => '0052',
                        'BANCO FALABELLA' => '0062',
                        'BANCOOMEVA' => '0061',
                        'SCOTIABANK' => '0019',
                        'NEQUI' => '0507'
                    ];
                    $contentData['CODIGO_BANCO_DESTINO'] = isset($opts[$data['bank_entity']]) ? $opts[$data['bank_entity']] : '0052';

                    // ---------------------------------
                    // | CÓDIGO DANE | CIUDAD          |
                    // ---------------------------------
                    // | 1           | BOGOTA          |
                    // | 2           | MEDELLIN        |
                    // | 3           | CALI            |
                    // | 4           | BARRANQUILLA    |
                    // | 5           | BUCARAMANGA     |
                    // | 6           | MANIZALES       |
                    // | 7           | CARTAGENA       |
                    // | 8           | PEREIRA         |
                    // | 9           | LA MERCED       |
                    // | 10          | IBAGUE          |
                    // | 11          | ARMENIA         |
                    // | 12          | CUCUTA          |
                    // | 13          | NEIVA           |
                    // | 14          | SANTA MARTA     |
                    // | 15          | VILLAVICENCIO   |
                    // | 16          | TULUA           |
                    // | 17          | BUGA            |
                    // | 18          | TUNJA           |
                    // | 19          | CARTAGO         |
                    // | 20          | POPAYAN         |
                    // | 21          | BARRANCABERMEJA |
                    // | 22          | VALLEDUPAR      |
                    // | 23          | PASTO           |
                    // | 24          | GIRARDOT        |
                    // | 25          | MONTERIA        |
                    // | 26          | BUENAVENTURA    |
                    // | 27          | SINCELEJO       |
                    // | 28          | SOGAMOSO        |
                    // | 29          | HONDA           |
                    // | 30          | DUITAMA         |
                    // ---------------------------------
                    $contentData['CODIGO_PLAZA_DESTINO'] = '3';

                    $contentData['NUMERO_IDENTIFICACION_DESTINO'] = $data['beneficiary_document'];

                    // ------------------------------------
                    // | CÓDIGO | TIPO DE IDENTIFICACIÓN  |
                    // ------------------------------------
                    // | 1      | Cedula de ciudadania    |
                    // | 2      | Cedula de extranjeria   |
                    // | 3      | Nit Persona Jurídica    |
                    // | 5      | Registro Civil          |
                    // | 6      | Nit de Extranjeria      |
                    // | 10     | Pasaporte Internacional |
                    // ------------------------------------
                    $opts = [
                        'CEDULA CIUDADANIA' => '1',
                        'CEDULA EXTRANJERIA' => '2',
                        'PASAPORTE' => '10',
                        'NIT' => '3',
                    ];
                    $contentData['TIPO_IDENTIFICACION_DESTINO'] = isset($opts[$data['beneficiary_document_type']]) ? $opts[$data['beneficiary_document_type']] : '1';

                    $contentData['NUMERO_PRODUCTO_DESTINO'] = $data['bank_account'];

                    // -------------------------------------
                    // | CÓDIGO | TIPO DE PRODUCTO         |
                    // -------------------------------------
                    // | 0      | Cuenta Corriente         |
                    // | 1      | Cuenta de Ahorros        |
                    // | 2      | Cupo Rotativo            |
                    // | 3      | Generada en otros Bancos |
                    // -------------------------------------
                    $opts = [
                        'CORRIENTE' => '0',
                        'AHORRO' => '1',
                    ];
                    $contentData['TIPO_PRODUCTO_DESTINO'] = isset($opts[$data['bank_account_type']]) ? $opts[$data['bank_account_type']] : '0';

                    $contentData['NOMBRE_BENEFICIARIO'] = $data['beneficiary_name'];
                    $contentData['INDICADOR_MAS_ADENDAS'] = '0';
                    $contentData['VALOR_TRANSACCION'] = $data['sum_earnings_total'];
                    $contentData['INDICADOR_VALIDACION'] = '1';

                    // transform data in plain format
                    $fileContent.= $plainService->plainContent($formatList['body'], $contentData);
                }
            }
            // footer
            if (isset($formatList['footer'])) {
                $contentData = [];
                $contentData['CANTIDAD_TOTAL_REGISTROS_DETALLE'] = $payment['nrows'];
                $contentData['VALOR_TOTAL_TRANSACCIONES'] = $payment['total'];
                // transform data in plain format
                $fileContent.= $plainService->plainContent($formatList['footer'], $contentData);
            }
        }

        return [ 'fileContent' => $fileContent, 'fileName' => $fileName ];
    }
}
