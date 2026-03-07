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
use App\Requests\LoginDto;
use App\Models\User;
use App\Models\ExchangeRate;

class ExchangeRateController extends Controller
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
                'exrate_date' => 'required',
                'exrate_from' => 'required|max:255',
                'exrate_to' => 'required|max:255',
                'exrate_rate' => 'required',
                'exrate_type' => 'required|max:255',
            ]);
            $count_exchange_rate = ExchangeRate::whereNull('deleted_at')
            ->where('exrate_date', $data['exrate_date'])
            ->where('exrate_from', $data['exrate_from'])
            ->where('exrate_to', $data['exrate_to'])
            ->count();

            if ($count_exchange_rate > 0) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'EXISTING_EXCHANGERATE',
                    'message' => 'Ya existe un tasa de cambio registrada con la fecha especificada',
                ], 400);
            }

            // exrate_rate floor
            $data['exrate_rate'] = floor((float) $data['exrate_rate']);

            // create record
            $record = ExchangeRate::create([
                'exrate_date' => (isset($data['exrate_date'])) ? $data['exrate_date'] : null,
                'exrate_from' => (isset($data['exrate_from'])) ? $data['exrate_from'] : null,
                'exrate_to' => (isset($data['exrate_to'])) ? $data['exrate_to'] : null,
                'exrate_rate' => (isset($data['exrate_rate'])) ? $data['exrate_rate'] : null,
                'exrate_type' => (isset($data['exrate_type'])) ? $data['exrate_type'] : null,
            ]);
            if ($record) {
                $this->log::storeLog($uAuth, 'exchanges_rates', $record->exrate_id, 'INSERT', null, $record, $request->ip);
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
            $record = ExchangeRate::with([])
                ->where($data['where'])
                ->orWhere($data['orWhere'])
                ->whereRaw($data['whereRaw'])
                ->whereNull('deleted_at')
                ->orderBy('exrate_id', 'desc')
                ->get();
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

            $record = ExchangeRate::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'exrate_date' => 'required',
                'exrate_from' => 'required|max:255',
                'exrate_to' => 'required|max:255',
                'exrate_rate' => 'required',
                'exrate_type' => 'required|max:255',
            ]);
            $count_exchange_rate = ExchangeRate::whereNull('deleted_at')
            ->where('exrate_date', $data['exrate_date'])
            ->where('exrate_from', $data['exrate_from'])
            ->where('exrate_to', $data['exrate_to'])
            ->where('exrate_id', '!=', $record->exrate_id)
            ->count();

            if ($count_exchange_rate > 0) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'EXISTING_EXCHANGERATE',
                    'message' => 'Ya existe un tasa de cambio registrada con la fecha especificada',
                ], 400);
            }

            // exrate_rate floor
            $data['exrate_rate'] = floor((float) $data['exrate_rate']);

            $before = ExchangeRate::findOrFail($id);
            $record->update([
                'exrate_date' => (isset($data['exrate_date'])) ? $data['exrate_date'] : null,
                'exrate_from' => (isset($data['exrate_from'])) ? $data['exrate_from'] : null,
                'exrate_to' => (isset($data['exrate_to'])) ? $data['exrate_to'] : null,
                'exrate_rate' => (isset($data['exrate_rate'])) ? $data['exrate_rate'] : null,
                'exrate_type' => (isset($data['exrate_type'])) ? $data['exrate_type'] : null,
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'exchanges_rates', $record->exrate_id, 'UPDATE', $before, $record, $request->ip);

                return response()->json(['status' => 'success', 'data' => $record->exrate_id], 200);
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
                    'exists:exchanges_rates,exrate_id' => '',
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = ExchangeRate::findOrFail($id);
            $before = ExchangeRate::findOrFail($id);
            // $record->update([
            //     'deleted_at' => new DateTime()
            // ]);
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'exchanges_rates', $record->exrate_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->exrate_id], 200);
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
        $records = ExchangeRate::with([])
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNull('deleted_at')
            ->orderBy('exrate_id', 'desc')
            ->get();

        ////////////
        // EXPORT //
        ////////////
        // redirect output to client browser
        $fileName = 'exchanges_rates_export.xlsx';
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
                'FECHA',
                'MONEDA ORIGEN',
                'MONEDA DESTINO',
                'TASA',
                'TIPO',
                'FECHA CREACIÓN',
            )
        ];
        $sheet->fromArray($header, null, 'A1');

        // $dataset is an array containing data content
        $dataset = array();
        foreach ($records as $data) {
            $dataset[] = array(
                $data->exrate_id, // ID
                $data->exrate_date, // FECHA
                $data->exrate_from, // MONEDA ORIGEN
                $data->exrate_to, // MONEDA DESTINO
                $data->exrate_rate, // TASA
                $data->exrate_type, // TIPO
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

    /**
     * Obtener tasa de cambio del dia desde el banco de la republica.
     * website: https://www.larepublica.co/indicadores-economicos/mercado-cambiario
     * @param  string $from Moneda a convertir (origen) [USD|EUR]
     * @param  string $to   Moneda destino [COP]
     * @param  string $date Fecha de tasa de cambio
     * @return float        exchange rate
     */
    public function getExchangeRateByDate($from, $to = 'COP', $date = null)
    {
        // init
        $exchangeRate = 0;
        if (empty($date)) {
            $date = date('Y-m-d');
        }

        $record = ExchangeRate::with([])
            ->where('exrate_date', $date)
            ->where('exrate_from', $from)
            ->where('exrate_to', $to)
            ->first();

        // Si se tiene la tasa de cambio registrada
        // y fue una actualizacion automatica >> se obtiene desde la db
        if ($record && $record->exrate_type == 'AUTO') {
            return floor((float) $record->exrate_rate);
        
        // En caso contrario >> se obtiene desde la Api
        } else {
            // url de API
            if ($from == 'USD') {
                $url = 'https://www.larepublica.co/api/quote/historic/1?qName=TRM';
            } else if ($from == 'EUR') {
                $url = 'https://www.larepublica.co/api/quote/historic/4?qName=EURO';
            }

            ////////////
            // header //
            ////////////
            // encabezado de la peticion
            $request_headers = array(
                'Content-Type: application/json',
            );

            // set url
            $ch = curl_init($url);

            /////////////////
            // cURL option //
            /////////////////
            curl_setopt($ch, CURLOPT_HTTPHEADER, $request_headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
            curl_setopt($ch, CURLOPT_VERBOSE, true);

            // Disable SSL in request
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            $response = curl_exec($ch);

            // DEBUG
            // echo "<pre>";
            // print_r($response);
            // print_r(json_decode($response));
            // echo "</pre>";
            // die();

            ///////////////////
            // Error Handler //
            ///////////////////
            // Se cierra el recurso CURL y se liberan los recursos del sistema
            if ($errno = curl_errno($ch)) {
                $error_message = curl_strerror($errno);
                echo "cURL error ({$errno}):\n {$error_message}";
                echo 'error ' . $response;
                return [];
            }
            curl_close($ch);
            if (!$response) {
                echo 'error ' . $response;
                return [];
            }

            ///////////////////
            // Response data //
            ///////////////////
            // {
            //     "graphData": [
            //         [
            //             "Hora",
            //             "TRM"
            //         ],
            //         [
            //             "27 abr 24",
            //             3926.02
            //         ],
            //     ],
            //     "buttonsData": [
            //         {
            //             "idx": 1,
            //             "scale": 0,
            //             "name": "Ult. 5",
            //             "active": true
            //         },
            //     ]
            // }
            $dataset = json_decode($response, true);

            // DEBUG
            // echo "<pre>";
            // print_r($dataset);
            // echo "</pre>";
            // die();

            // loop response
            foreach ($dataset['graphData'] as $key => $data) {
                if ($key > 0) {
                    // date transform
                    $trmDate = $data[0];
                    $trmDate = preg_replace("/([a-z]{3})([a-z])/", "$1", $trmDate); // format: 26 sept 24 >> 26 sep 24 (solo 3 letras en el mes)
                    $trmDate = preg_replace("/([0-9]{1,2}) ene ([0-9]{2})/", "20$2-01-$1", $trmDate); // format: 26 ene 24 >> 2026-01-24
                    $trmDate = preg_replace("/([0-9]{1,2}) feb ([0-9]{2})/", "20$2-02-$1", $trmDate); // format: 26 feb 24 >> 2026-02-24
                    $trmDate = preg_replace("/([0-9]{1,2}) mar ([0-9]{2})/", "20$2-03-$1", $trmDate); // format: 26 mar 24 >> 2026-03-24
                    $trmDate = preg_replace("/([0-9]{1,2}) abr ([0-9]{2})/", "20$2-04-$1", $trmDate); // format: 26 abr 24 >> 2026-04-24
                    $trmDate = preg_replace("/([0-9]{1,2}) may ([0-9]{2})/", "20$2-05-$1", $trmDate); // format: 26 may 24 >> 2026-05-24
                    $trmDate = preg_replace("/([0-9]{1,2}) jun ([0-9]{2})/", "20$2-06-$1", $trmDate); // format: 26 jun 24 >> 2026-06-24
                    $trmDate = preg_replace("/([0-9]{1,2}) jul ([0-9]{2})/", "20$2-07-$1", $trmDate); // format: 26 jul 24 >> 2026-07-24
                    $trmDate = preg_replace("/([0-9]{1,2}) ago ([0-9]{2})/", "20$2-08-$1", $trmDate); // format: 26 ago 24 >> 2026-08-24
                    $trmDate = preg_replace("/([0-9]{1,2}) sep ([0-9]{2})/", "20$2-09-$1", $trmDate); // format: 26 sep 24 >> 2026-09-24
                    $trmDate = preg_replace("/([0-9]{1,2}) oct ([0-9]{2})/", "20$2-10-$1", $trmDate); // format: 26 oct 24 >> 2026-10-24
                    $trmDate = preg_replace("/([0-9]{1,2}) nov ([0-9]{2})/", "20$2-11-$1", $trmDate); // format: 26 nov 24 >> 2026-11-24
                    $trmDate = preg_replace("/([0-9]{1,2}) dic ([0-9]{2})/", "20$2-12-$1", $trmDate); // format: 26 dic 24 >> 2026-12-24

                    // Valor redondeado hacia abajo
                    $data[1] = floor($data[1]);

                    // Si es la fecha consultada
                    if ($trmDate == $date) {
                        // CREATE
                        if (!$record) {
                            ExchangeRate::create([
                                'exrate_date' => $date,
                                'exrate_from' => $from,
                                'exrate_to' => $to,
                                'exrate_rate' => $data[1],
                                'exrate_type' => 'AUTO',
                            ]);
                        
                        // UPDATE
                        } else {
                            $record->exrate_rate = $data[1];
                            $record->exrate_type = 'AUTO';
                            $record->save();
                        }
                        return $data[1];
                    }
                }
            }
        }

        // De lo contrario devuelve el valor cargado manualmente
        if ($record) {
            $exchangeRate = floor((float) $record->exrate_rate);
        }

        return $exchangeRate;
    }

    /**
     * Obtener tasa de cambio del dia desde el sitio de Google.
     * website: https://www.google.com/finance/quote/USD-COP?hl=en
     * @param  string $from Moneda a convertir (origen) [USD|EUR]
     * @param  string $to   Moneda destino [COP]
     * @param  string $date Fecha de tasa de cambio
     * @return float        exchange rate
     */
    public function getExchangeRateFromGoogle($from, $to = 'COP', $date = null)
    {
        // init
        $exchangeRate = 0;
        if (empty($date)) {
            $date = date('Y-m-d');
        }
        $today = date('Y-m-d');

        $record = ExchangeRate::with([])
            ->where('exrate_date', $date)
            ->where('exrate_from', $from)
            ->where('exrate_to', $to)
            ->first();

        // Si se tiene la tasa de cambio registrada
        // y fue una actualizacion automatica
        // y no es el dia de hoy >> se obtiene desde la db
        if ($record && $record->exrate_type == 'AUTO' && $date != $today) {
            return floor((float) $record->exrate_rate);
        
        // En caso contrario >> se obtiene desde la Api
        } else {
            // url de API
            if ($from == 'USD') {
                $url = 'https://www.google.com/finance/quote/USD-COP?hl=en';
            } else if ($from == 'EUR') {
                $url = 'https://www.google.com/finance/quote/EUR-COP?hl=en';
            }

            ////////////
            // header //
            ////////////
            // encabezado de la peticion
            $request_headers = array(
                // 'Content-Type: application/json',
            );

            // set url
            $ch = curl_init($url);

            /////////////////
            // cURL option //
            /////////////////
            curl_setopt($ch, CURLOPT_HTTPHEADER, $request_headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
            curl_setopt($ch, CURLOPT_VERBOSE, true);

            // Disable SSL in request
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            $response = curl_exec($ch);

            // DEBUG
            // echo "<pre>";
            // print_r($response);
            // // print_r(json_decode($response));
            // echo "</pre>";
            // die();

            ///////////////////
            // Error Handler //
            ///////////////////
            // Se cierra el recurso CURL y se liberan los recursos del sistema
            if ($errno = curl_errno($ch)) {
                $error_message = curl_strerror($errno);
                echo "cURL error ({$errno}):\n {$error_message}";
                echo 'error ' . $response;
                return [];
            }
            curl_close($ch);
            if (!$response) {
                echo 'error ' . $response;
                return [];
            }

            ///////////////////
            // Response data //
            ///////////////////
            // Response:
            //
            // <!doctype html>
            // <html lang="en-US" dir="ltr">
            // ..
            // <div class="eYanAe" role="region" aria-labelledby="key-stats-heading">
            //     <div class="vvDK2c">
            //         <c-wiz jsrenderer="jTQKHc" jsshadow jsdata="deferred-i10"
            //             data-p="%.@.null,[&quot;EUR&quot;,&quot;COP&quot;]]" data-node-index="1;0" jsmodel="hc6Ubd" c-wiz>
            //             <div class="UaHgge">
            //                 <span data-is-tooltip-wrapper="true">
            //                     <a href="./markets/currencies">
            //                         <span class="PKgTzb " aria-describedby="i11" data-tooltip-x-position="2" aria-labelledby="0">
            //                             <i class="google-material-icons vMqgdc fpfLkb" aria-hidden="true">paid</i>
            //                         <span class="w2tnNd">Exchange Rate</span>
            //                      </span></a>
            //                 <div class="EY8ABd-OWXEXe-TAWMXe" id="i11" role="tooltip" aria-hidden="true">Value of the base
            //                     currency compared to the quote currency</div></span>
            //             </div>
            //             <c-data id="i10" jsdata=" vMtosf;_;10"></c-data>
            //         </c-wiz>
            //     </div>
            //     <div class="gyFHrc">
            //         <span data-is-tooltip-wrapper="true">
            //             <div class="mfs7Fc" aria-describedby="i12" data-tooltip-x-position="2">Previous close</div>
            //             <div class="EY8ABd-OWXEXe-TAWMXe" id="i12" role="tooltip" aria-hidden="true">The last closing price</div>
            //         </span>
            //         <div class="P6K39c">4,648.02</div>
            //     </div>
            //     ..
            //     <div jsaction="click:upfQVb" jsname="UEIKff" data-mid="/g/11bvvy88g6"
            //         data-source="USD" data-target="COP" data-name="USD / COP"
            //         data-percent="-0.0018870415941419298" data-percent-precision="2"
            //         data-price-precision="4" data-price="4157.39"
            //         jslog="105757;ved:2ahUKEwiLoLaD_NGIAxXIx3MEHVwAPX8QnboGegQIAhAg;track:click"
            //         soy-skip ssk='6:gtdIyd'>
            //         <div class="fgdCnd WUAmMe">
            //             <div class="cJd7w">
            //                 <div class="qIEjSe" title="USD / COP">USD / COP</div>
            //                 <div class="Z63m9d"><span>4,157.3900</span></div>
            //                 <div class="eqjaGd">
            //                     <span class="lUuFj">USD</span><span class="Z63m9d Fj5M3"><span class="" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" focusable="false" class="XpWNJe NMm5M"><path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/></svg></span>0.19%</span>
            //                 </div>
            //                 <div class="Pt6Xcb"></div>
            //             </div>
            //         </div>
            //     </div>
            //     ..
            // </div>
            // ..
            // </html>
            $response = str_replace("\r\n", "", $response);
            $response = str_replace("\r", "", $response);
            $response = str_replace("\n", "", $response);


            ///////////////
            // Yesterday //
            ///////////////
            // Yesterday
            $yesterdayValue = $response;
            $yesterdayValue = preg_replace("/.*(key-stats-heading)/", '$1', $yesterdayValue);
            // Response:
            // <div class="P6K39c">4,165.25</div>
            $yesterdayValue = preg_replace("/key-stats-heading.*?<\/div><div.*?<\/span>(<div.*?<\/div>).*/", '$1', $yesterdayValue);
            $yesterdayValue = preg_replace("/.*>(.*)<\/.*/", '$1', $yesterdayValue); // 4,165.25
            $yesterdayValue = str_replace(",", '', $yesterdayValue);          // 4165.25
            $yesterdayValue = floor((float) $yesterdayValue);

            // CREATE
            if (!$record) {
                ExchangeRate::create([
                    'exrate_date' => $yesterday,
                    'exrate_from' => $from,
                    'exrate_to' => $to,
                    'exrate_rate' => $yesterdayValue,
                    'exrate_type' => 'AUTO',
                ]);
            
            // UPDATE
            } else {
                $record->exrate_rate = $yesterdayValue;
                $record->exrate_type = 'AUTO';
                $record->save();
            }


            ///////////
            // Today //
            ///////////
            $todayValue = $response;
            // regexp ej: /.*data-source="USD" data-target="COP" data-last-price="(.*?)".*/
            $todayValue = preg_replace("/.*data-source=\"".$from."\" data-target=\"".$to."\" data-last-price=\"(.*?)\".*/", '$1', $todayValue);
            $todayValue = str_replace(",", '', $todayValue); // 4165.25
            $todayValue = floor((float) $todayValue);

            $record = ExchangeRate::with([])
                ->where('exrate_date', $today)
                ->where('exrate_from', $from)
                ->where('exrate_to', $to)
                ->first();

            // CREATE
            if (!$record) {
                ExchangeRate::create([
                    'exrate_date' => $today,
                    'exrate_from' => $from,
                    'exrate_to' => $to,
                    'exrate_rate' => $todayValue,
                    'exrate_type' => 'AUTO',
                ]);
            
            // UPDATE
            } else {
                $record->exrate_rate = $todayValue;
                $record->exrate_type = 'AUTO';
                $record->save();
            }


            //////////////
            // Response //
            //////////////
            // Si es la fecha de hoy
            if ($date == $today) {
                return floor((float) $todayValue);

            // Si es la fecha de ayer
            } else if ($date == $yesterday) {
                return floor((float) $yesterdayValue);
            }
        }

        // De lo contrario devuelve el valor cargado manualmente
        if ($record) {
            $exchangeRate = floor((float) $record->exrate_rate);
        }

        return $exchangeRate;
    }

    /**
     * Obtener tasa de cambio del dia desde el sitio del DolarHoy.
     * website: https://www.dolarhoy.co y https://www.dolarhoy.co/eurohoy
     * @param  string $from Moneda a convertir (origen) [USD|EUR]
     * @param  string $to   Moneda destino [COP]
     * @param  string $date Fecha de tasa de cambio
     * @return float        exchange rate
     */
    public function getExchangeRateFromDolarHoy($from, $to = 'COP', $date = null)
    {
        // init
        $exchangeRate = 0;
        if (empty($date)) {
            $date = date('Y-m-d');
        }

        $today = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime($today . ' -1 day'));

        $record = ExchangeRate::with([])
            ->where('exrate_date', $date)
            ->where('exrate_from', $from)
            ->where('exrate_to', $to)
            ->first();

        // Si se tiene la tasa de cambio registrada MANUALMENTE
        if ($record && $record->exrate_type == 'MANUAL' && $record->exrate_rate <> 0) {
            $exchangeRate = floor((float) $record->exrate_rate);

        // Si se tiene la tasa de cambio registrada
        // y fue una actualizacion automatica
        // y el valor retonado es mayor 0
        // y no es el dia de hoy >> se obtiene desde la db
        } else if ($record && $record->exrate_type == 'AUTO' && $record->exrate_rate <> 0 && $date != $today) {
            return floor((float) $record->exrate_rate);
        
        // En caso contrario >> se obtiene desde la Api
        } else {
            // url de API
            if ($from == 'USD') {
                $url = 'https://www.dolarhoy.co/'.$date;
            } else if ($from == 'EUR') {
                $url = 'https://www.dolarhoy.co/eurohoy/'.$date;
            }

            ////////////
            // header //
            ////////////
            // encabezado de la peticion
            $request_headers = array(
                // 'Content-Type: application/json',
            );

            // set url
            $ch = curl_init($url);

            /////////////////
            // cURL option //
            /////////////////
            curl_setopt($ch, CURLOPT_HTTPHEADER, $request_headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
            curl_setopt($ch, CURLOPT_VERBOSE, true);

            // Disable SSL in request
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            $response = curl_exec($ch);

            // DEBUG
            // echo "<pre>";
            // print_r($response);
            // Log::info($response);
            // echo "</pre>";
            // die();

            ///////////////////
            // Error Handler //
            ///////////////////
            // Se cierra el recurso CURL y se liberan los recursos del sistema
            if ($errno = curl_errno($ch)) {
                $error_message = curl_strerror($errno);
                echo "cURL error ({$errno}):\n {$error_message}";
                echo 'error ' . $response;
                return [];
            }
            curl_close($ch);
            if (!$response) {
                echo 'error ' . $response;
                return [];
            }

            ///////////////////
            // Response data //
            ///////////////////
            // Response:
            //
            // <!doctype html>
            // <html lang="en-US" dir="ltr">
            // ..
            // <div class="col-12 col-md-6 col-lg-4">
            //     <div class="card  shadow-sm">
            //         <div class="card-body text-center">
            //             <h1>Dolar Hoy</h1>
            //             <h2 class="fecha">
            //                 <a href="https://www.dolarhoy.co/trm-hoy/">TRM</a> del
            //                 <strong>Sábado 21 de Septiembre del 2024</strong> - Precio hoy
            //             </h2>
            //             <span class="h1">
            //                 <i class="icon-down-open rojo"></i>
            //                 $ 4,156.89
            //             </span>
            //             <br/>
            //             <small>Cuatro mil ciento cincuenta y seis pesos con ochenta y nueve centavos</small>
            //             <hr/>
            //             <small class="">Disponible precio del
            //                 <a href="https://www.dolarhoy.co/2024-09-22" title="Dolar mañana" class="">dólar TRM de mañana
            //                     <i class="icon-right-open"></i>
            //                 </a>
            //             </small>
            //         </div>
            //     </div>
            // </div>
            // ..
            // </html>
            $response = str_replace("\r\n", "", $response);
            $response = str_replace("\r", "", $response);
            $response = str_replace("\n", "", $response);
            $response = preg_replace("/^.*?(<div class=\"col-12 col-md-6 col-lg-4\">.*?<\/div>.*?<\/div>.*?<\/div>).*?<div.*/", '$1', $response);
            $response = preg_replace("/^.*?<span.*?([\$\€].*?)<\/span>.*/", '$1', $response);
            $response = str_replace('$', '', $response);
            $response = str_replace('€', '', $response);
            $response = str_replace(',', '', $response);
            $response = trim($response);
            $response = floor((float) $response);

            // DEBUG
            // echo "<pre>";
            // print_r($response);
            // Log::info($response);
            // echo "</pre>";
            // die();

            // CREATE
            if (!$record) {
                ExchangeRate::create([
                    'exrate_date' => $date,
                    'exrate_from' => $from,
                    'exrate_to' => $to,
                    'exrate_rate' => $response,
                    'exrate_type' => 'AUTO',
                ]);
            
            // UPDATE
            } else {
                $record->exrate_rate = $response;
                $record->exrate_type = 'AUTO';
                $record->save();
            }

            // Response
            return $response;
        }

        return $exchangeRate;
    }

    /**
     * Get USD to EUR exchange rate from Investing.com API
     *
     * @param string $startDate
     * @param string $endDate
     * @return array
     */
    public function getUsdToEurFromInvesting($startDate = null, $endDate = null)
    {
        try {
            // Validate that dates are provided
            if (empty($startDate) || empty($endDate)) {
                return ['error' => 'Both start date and end date are required'];
            }

            // Validate date format
            if (!strtotime($startDate) || !strtotime($endDate)) {
                return ['error' => 'Invalid date format. Use Y-m-d format'];
            }

            // Check if we already have EUR to USD rates in database for the date range
            $existingRates = ExchangeRate::where('exrate_from', 'EUR')
                ->where('exrate_to', 'USD')
                ->whereBetween('exrate_date', [$startDate, $endDate])
                ->orderBy('exrate_date', 'asc')
                ->get();

            // If we have existing rates for the entire date range, use those
            if ($existingRates->count() > 0) {
                $exchangeRates = [];
                foreach ($existingRates as $rate) {
                    // Convert EUR to USD rate to USD to EUR rate (inverse)
                    $usdToEurRate = 1 / (float) $rate->exrate_rate;
                    
                    $exchangeRates[] = [
                        'date' => $rate->exrate_date,
                        'usd_to_eur_rate' => round($usdToEurRate, 6),
                        'source' => 'database (converted from EUR/USD)',
                        'original_eur_usd_rate' => (float) $rate->exrate_rate
                    ];

                    // Save the calculated USD to EUR rate to database
                    //$this->saveExchangeRateToDatabase('USD', 'EUR', $rate->exrate_date, round($usdToEurRate, 6), 'AUTO');
                }

                return [
                    'success' => true,
                    'data' => $exchangeRates,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'source' => 'database_conversion'
                ];
            }

            // If no existing rates found, proceed with API call
            // Build the URL with date parameters
            $url = "https://api.investing.com/api/financialdata/historical/1?start-date={$startDate}&end-date={$endDate}&time-frame=Daily&add-missing-rows=false";

            // Initialize cURL
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Accept: application/json',
                'Accept-Language: en-US,en;q=0.9',
                'Cache-Control: no-cache'
            ]);

            // Execute request
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            
            if (curl_error($ch)) {
                Log::error('cURL Error in getUsdToEurFromInvesting: ' . curl_error($ch));
                curl_close($ch);
                return ['error' => 'Connection error'];
            }
            
            curl_close($ch);

            // Check if request was successful
            if ($httpCode !== 200) {
                Log::error("HTTP Error in getUsdToEurFromInvesting: HTTP {$httpCode}");
                return ['error' => "HTTP Error: {$httpCode}"];
            }

            // Parse JSON response
            $data = json_decode($response, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('JSON Error in getUsdToEurFromInvesting: ' . json_last_error_msg());
                return ['error' => 'Invalid JSON response'];
            }

            // Process the data and extract exchange rates
            $exchangeRates = [];
            
            if (isset($data['data']) && is_array($data['data'])) {
                foreach ($data['data'] as $item) {
                    if (isset($item['rowDate']) && isset($item['last_close'])) {
                        $date = date('Y-m-d', strtotime($item['rowDate']));
                        $rate = (float) $item['last_close'];
                        
                        $exchangeRates[] = [
                            'date' => $date,
                            'usd_to_eur_rate' => $rate,
                            'source' => 'investing.com'
                        ];

                        // Save to database
                        $this->saveExchangeRateToDatabase('USD', 'EUR', $date, $rate, 'AUTO');
                    }
                }
            }

            return [
                'success' => true,
                'data' => $exchangeRates,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'source' => 'investing_api'
            ];

        } catch (\Exception $e) {
            Log::error('Exception in getUsdToEurFromInvesting: ' . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Save exchange rate to database
     *
     * @param string $from
     * @param string $to
     * @param string $date
     * @param float $rate
     * @param string $type
     * @return void
     */
    private function saveExchangeRateToDatabase($from, $to, $date, $rate, $type = 'AUTO')
    {
        try {
            // Check if record already exists
            $existingRecord = ExchangeRate::where('exrate_date', $date)
                ->where('exrate_from', $from)
                ->where('exrate_to', $to)
                ->first();

            if ($existingRecord) {
                // Update existing record
                $existingRecord->update([
                    'exrate_rate' => $rate,
                    'exrate_type' => $type,
                    'updated_at' => now()
                ]);
            } else {
                // Create new record
                ExchangeRate::create([
                    'exrate_date' => $date,
                    'exrate_from' => $from,
                    'exrate_to' => $to,
                    'exrate_rate' => $rate,
                    'exrate_type' => $type,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error saving exchange rate to database: ' . $e->getMessage());
        }
    }
}
