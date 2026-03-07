<?php

namespace App\Imports;

use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithCalculatedFormulas; // transform formula into value calculated https://stackoverflow.com/a/63272754
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Illuminate\Http\Request;
use Validator;
use Log;

use App\Models\ModelStream;
use App\Models\ModelStreamCustomer;
use App\Http\Controllers\ExchangeRateController;

class ModelsStreamsImport implements ToModel, WithCalculatedFormulas, WithMultipleSheets
{
    private $rows = 1;
    private $count = 0;
    protected $start = 2;
    protected $position = 0;
    protected $request;
    protected $parentFile;
    protected $periodUntil;

    private $response = [
        'success' => [
            'data' => [],
            'totalEarningsTokens' => 0,
            'totalEarningsUsd' => 0,
            'totalEarningsEur' => 0,
            'totalEarningsCop' => 0,
            'totalTime' => 0,
        ],
        'inactives' => [
            'data' => [],
            'totalEarningsTokens' => 0,
            'totalEarningsUsd' => 0,
            'totalEarningsEur' => 0,
            'totalEarningsCop' => 0,
            'totalTime' => 0,
        ],
        'errors' => [
            'data' => [],
            'totalEarningsTokens' => 0,
            'totalEarningsUsd' => 0,
            'totalEarningsEur' => 0,
            'totalEarningsCop' => 0,
            'totalTime' => 0,
        ],
    ];
    private $app;
    private $cuenta_nickname;
    private $fecha_hora;
    private $inicio_stream;
    private $fin_stream;
    private $tokens;
    private $valor_usd;
    private $valor_eur;
    private $valor_cop;
    private $horas;

    private $trmUSD;
    private $trmEUR;

    protected $modelsAccountsList = [];
    protected $portalsList = [
        'BONGACAMS',
        'CAM4',
        'CAMSODA ALIADOS',
        'CHATURBATE',
        'FLIRT4FREE',
        'IMLIVE',
        'LIVEJASMIN',
        'ONLYFANS',
        'MYDIRTYHOBBY',
        'MYFREECAMS',
        'SKYPRIVATE',
        'STREAMATE',
        'STREAMRAY',
        'STRIPCHAT',
        'XHAMSTER',
        'XLOVECAM',
        'CHERRY',
        'DREAMCAM',
    ];

    public function __construct(Request $request, $parentFile = null, $fileTemplate = 'default', $periodUntil)
    {
        $this->request = $request;
        $this->parentFile = $parentFile;
        $this->periodUntil = $periodUntil;

        ///////////////////////////////////////
        // fields based on template selected //
        ///////////////////////////////////////
        // default
        if ($fileTemplate == 'DEFAULT') {
            // start data
            $this->start           = 2;
            // file data
            $this->app             = 0;
            $this->cuenta_nickname = 1;
            $this->fecha_hora      = 2;
            $this->inicio_stream   = 3;
            $this->fin_stream      = 4;
            $this->tokens          = 5;
            $this->valor_usd       = 6;
            $this->valor_eur       = 7;
            $this->valor_cop       = 8;
            $this->horas           = 9;

        // not valid
        } else {
            $response = array(
                'code' => 'IMPORT_ERROR',
                // 'position' => $this->position,
                'errors' => [['La plantilla seleccionada no es válida']],
            );
            throw new \Exception(json_encode($response));
        }

        // fecha del trm es la del fin del periodo +1 dia
        $trm_date = date('Y-m-d', strtotime($periodUntil . ' +1 day'));
        // Si la fecha del trm es mayor a hoy
        if (strtotime($trm_date) > strtotime(date('Y-m-d'))) {
            $trm_date = date('Y-m-d');
        }
        // Obtener el trm
        $exchangeRateController = new ExchangeRateController();
        $this->trmUSD = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'USD', $to = 'COP', $trm_date); // USD
        $this->trmEUR = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'EUR', $to = 'COP', $trm_date); // EUR        

        // get models accounts list
        $records = DB::select(
            "SELECT modacc_id, modacc_app, modacc_payment_username,
                    us.user_name || ' ' || us.user_surname as name,
                    std_discountmodel_usd, std_discountmodel_eur,
                    std_discountstudio_usd, std_discountstudio_eur,
                    st.std_id
            FROM models_accounts ma 
            LEFT JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
            LEFT JOIN studios st ON st.std_id = sm.std_id
            LEFT JOIN users us ON us.user_id = sm.user_id_model
            WHERE modacc_active=true");
        foreach ($records as $r => $row) {
            $row->modacc_app = preg_replace("/(.*)\(.*\)/", "$1", $row->modacc_app); // STRIPCHAT(2) >> STRIPCHAT
            $row->modacc_app = trim($row->modacc_app);
            $row->modacc_payment_username = trim($row->modacc_payment_username);
            $row->modacc_payment_username = strtoupper($row->modacc_payment_username);
            $this->modelsAccountsList[$row->modacc_app][$row->modacc_payment_username] = $row;
        }
    }

    /**
     * @param array $row
     *
     * @return Plan|null
     */
    public function model(array $row)
    {
        // init
        $this->position++;

        // fila de titulos
        if ($this->rows == 1) {

        // file data
        } else if ($this->rows >= $this->start) {
            $this->count++;
            $this->sanitizeRow($row);
            $this->validateRow($row);

            if (!empty($row[$this->app]) && !empty($this->cuenta_nickname)) {
                // data default values
                $data = [
                    'row' => $this->rows,
                    'nickname' => $row[$this->cuenta_nickname],
                    'modacc_app' => null,
                    'modstrfile_id' => $this->parentFile->modstrfile_id,
                    'modstr_date' => null,
                    'modstr_period' => null,
                    'modstr_start_at' => null,
                    'modstr_finish_at' => null,
                    'modstr_earnings_value' => 0,
                    'modstr_earnings_tokens' => null,
                    'modstr_earnings_usd' => null,
                    'modstr_earnings_eur' => null,
                    'modstr_earnings_cop' => null,
                    'modstr_time' => null,
                ];

                // app en el archivo
                $appOrigin = $row[$this->app];
                $row[$this->app] = str_replace('STREAMATE PREMIOS', 'STREAMATE', $row[$this->app]);
                $row[$this->app] = str_replace('KWIKY', 'STREAMATE', $row[$this->app]);

                if (!empty($this->app) || $this->app === 0) {
                    $data['modacc_app'] = !empty($row[$this->app]) ? $row[$this->app] : null ;
                }
                if (!empty($this->fecha_hora)) {
                    $data['modstr_date'] = !empty($row[$this->fecha_hora]) ? $row[$this->fecha_hora] : null ;
                }
                if (!empty($this->inicio_stream)) {
                    $data['modstr_start_at'] = !empty($row[$this->inicio_stream]) ? $row[$this->inicio_stream] : null ;
                }
                if (!empty($this->fin_stream)) {
                    $data['modstr_finish_at'] = !empty($row[$this->fin_stream]) ? $row[$this->fin_stream] : null ;
                }
                if (!empty($this->tokens)) {
                    $data['modstr_earnings_tokens'] = !empty($row[$this->tokens]) ? $row[$this->tokens] : null ;
                }
                if (!empty($this->valor_usd)) {
                    $data['modstr_earnings_usd'] = !empty($row[$this->valor_usd]) ? $row[$this->valor_usd] : null ;
                }
                if (!empty($this->valor_eur)) {
                    $data['modstr_earnings_eur'] = !empty($row[$this->valor_eur]) ? $row[$this->valor_eur] : null ;
                }
                if (!empty($this->valor_cop)) {
                    $data['modstr_earnings_cop'] = !empty($row[$this->valor_cop]) ? $row[$this->valor_cop] : null ;
                }
                if (!empty($this->horas)) {
                    $data['modstr_time'] = !empty($row[$this->horas]) ? $row[$this->horas] : null ;
                }

                // modstr_period
                $data['modstr_period'] = date('Y-m-d', strtotime($row[$this->fecha_hora]));

                // modstr_earnings_value
                $data['modstr_earnings_value'] = 0;
                $data['modstr_earnings_trm'] = 0;
                $data['modstr_earnings_cop'] = 0;
                $data['modstr_earnings_trm_studio'] = 0;
                $data['modstr_earnings_cop_studio'] = 0;
                if (!empty($this->valor_usd)) {
                    $data['modstr_earnings_value'] = (float) $row[$this->valor_usd];
                } else if (!empty($this->valor_eur)) {
                    $data['modstr_earnings_value'] = (float) $row[$this->valor_eur];
                } else if (!empty($this->tokens)) {
                    $data['modstr_earnings_value'] = (float) $row[$this->tokens];
                } else if (!empty($this->valor_cop)) {
                    $data['modstr_earnings_value'] = (float) $row[$this->valor_cop];
                }

                // modstr_earnings_tokens_rate

                // modstr_source
                $data['modstr_source'] = 'CARGUE_ARCHIVO';

                // Log::info('json_encode($data)');
                // Log::info(json_encode($data));

                // if match with DB model (on success)
                if (isset($this->modelsAccountsList[$row[$this->app]]) && isset($this->modelsAccountsList[$row[$this->app]][$row[$this->cuenta_nickname]])) {
                    $data['modacc_id'] = $this->modelsAccountsList[$row[$this->app]][$row[$this->cuenta_nickname]]->modacc_id;
                    $data['name'] = $this->modelsAccountsList[$row[$this->app]][$row[$this->cuenta_nickname]]->name;

                    $data['std_discountmodel_usd'] = $this->modelsAccountsList[$row[$this->app]][$row[$this->cuenta_nickname]]->std_discountmodel_usd;
                    $data['std_discountstudio_usd'] = $this->modelsAccountsList[$row[$this->app]][$row[$this->cuenta_nickname]]->std_discountstudio_usd;
                    $data['std_discountmodel_eur'] = $this->modelsAccountsList[$row[$this->app]][$row[$this->cuenta_nickname]]->std_discountmodel_eur;
                    $data['std_discountstudio_eur'] = $this->modelsAccountsList[$row[$this->app]][$row[$this->cuenta_nickname]]->std_discountstudio_eur;

                    // modstr_earnings_value
                    if (empty($data['modstr_earnings_cop'])) {
                        if (!empty($data['modstr_earnings_usd'])) {
                            $data['modstr_earnings_trm'] = floatval($this->trmUSD) - floatval($data['std_discountmodel_usd']);
                            $data['modstr_earnings_cop'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm']);
                            $data['modstr_earnings_trm_studio'] = floatval($this->trmUSD) - floatval($data['std_discountstudio_usd']);
                            $data['modstr_earnings_cop_studio'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm_studio']);
                            
                        } else if (!empty($data['modstr_earnings_eur'])) {
                            $data['modstr_earnings_trm'] = floatval($this->trmEUR) - floatval($data['std_discountmodel_eur']);
                            $data['modstr_earnings_cop'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm']);
                            $data['modstr_earnings_trm_studio'] = floatval($this->trmEUR) - floatval($data['std_discountstudio_eur']);
                            $data['modstr_earnings_cop_studio'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm_studio']);
                        }
                    }

                    // Si es Streamate premios >> guarda el detalle
                    if ($appOrigin == 'STREAMATE PREMIOS') {
                        $data['modstr_addon'] = 'PREMIOS';
                    }

                    // Si es KWIKY >> guarda el detalle
                    if ($appOrigin == 'KWIKY') {
                        $data['modstr_addon'] = 'KWIKY';
                    }

                    // validamos los datos
                    $validator = Validator::make($data, [
                        'modstrfile_id' => 'required|exists:models_streams_files,modstrfile_id',
                        'modacc_id' => 'required|exists:models_accounts,modacc_id',
                        'modstr_date' => 'required',
                        'modstr_period' => 'required|max:255',
                        'modstr_start_at' => 'nullable',
                        'modstr_finish_at' => 'nullable',
                        'modstr_price' => 'nullable',
                        'modstr_earnings_value' => 'required|min:0',
                        'modstr_earnings_trm' => 'nullable',
                        'modstr_earnings_percent' => 'nullable',
                        'modstr_earnings_tokens' => 'nullable|min:0',
                        'modstr_earnings_tokens_rate' => 'nullable|min:0',
                        'modstr_earnings_usd' => 'nullable|min:0',
                        'modstr_earnings_eur' => 'nullable|min:0',
                        'modstr_earnings_cop' => 'nullable|min:0',
                        'modstr_earnings_trm_studio' => 'nullable',
                        'modstr_earnings_percent_studio' => 'nullable',
                        'modstr_earnings_cop_studio' => 'nullable|min:0',
                        'modstr_time' => 'nullable|min:0',
                        'modstr_source' => 'required|max:255',
                        'modstr_addon' => 'nullable',
                    ]);

                    if ($validator->fails()) {
                        $response = array(
                            'code' => 'IMPORT_ERROR',
                            'position' => $this->position,
                            'errors' => $validator->errors()
                        );
                        throw new \Exception(json_encode($response));
                    }

                    // create record
                    $record = ModelStream::create($data);

                    // return dataset
                    $this->response['success']['data'][] = $data;
                    $this->response['success']['totalEarningsTokens']+= (float) (isset($data['modstr_earnings_tokens']) ? $data['modstr_earnings_tokens'] : 0);
                    $this->response['success']['totalEarningsEur']+= (float) (isset($data['modstr_earnings_eur']) ? $data['modstr_earnings_eur'] : 0);
                    $this->response['success']['totalEarningsUsd']+= (float) (isset($data['modstr_earnings_usd']) ? $data['modstr_earnings_usd'] : 0);
                    $this->response['success']['totalTime']+= (float) (isset($data['modstr_time']) ? $data['modstr_time'] : 0);

                    return $record;

                // else (on error)
                } else {
                    // data default values
                    $data['error'] = [
                        'type' => 'NOT_MATCH',
                        'message' => 'No se encuentra la modelo "'.$row[$this->cuenta_nickname].'" en la base de datos',
                    ];

                    // return dataset
                    $this->response['errors']['data'][] = $data;
                    $this->response['errors']['totalEarningsTokens']+= (float) (isset($data['modstr_earnings_tokens']) ? $data['modstr_earnings_tokens'] : 0);
                    $this->response['errors']['totalEarningsEur']+= (float) (isset($data['modstr_earnings_eur']) ? $data['modstr_earnings_eur'] : 0);
                    $this->response['errors']['totalEarningsUsd']+= (float) (isset($data['modstr_earnings_usd']) ? $data['modstr_earnings_usd'] : 0);
                    $this->response['errors']['totalTime']+= (float) (isset($data['modstr_time']) ? $data['modstr_time'] : 0);

                    return null;
                }
            }
        }
        $this->rows++;
    }

    /**
     * @param array $row
     *
     * @return
     */
    public function sanitizeRow(&$row)
    {
        if (!empty($this->app)) {
            $row[$this->app] = preg_replace("/(.*)\(.*\)/", "$1", $row[$this->app]); // STRIPCHAT(2) >> STRIPCHAT
            $row[$this->app] = trim($row[$this->app]);
        }
        if (!empty($this->cuenta_nickname)) {
            $row[$this->cuenta_nickname] = trim($row[$this->cuenta_nickname]);
            $row[$this->cuenta_nickname] = strtoupper($row[$this->cuenta_nickname]);
        }
        if (!empty($this->fecha_hora)) {
            $row[$this->fecha_hora] = trim($row[$this->fecha_hora]);
            if (is_numeric($row[$this->fecha_hora])) {
                $row[$this->fecha_hora] = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($row[$this->fecha_hora]);
                $row[$this->fecha_hora] = $row[$this->fecha_hora]->format('Y-m-d');
            }
        }
        if (!empty($this->inicio_stream)) {
            $row[$this->inicio_stream] = trim($row[$this->inicio_stream]);
        }
        if (!empty($this->fin_stream)) {
            $row[$this->fin_stream] = trim($row[$this->fin_stream]);
        }
        if (!empty($this->tokens)) {
            $row[$this->tokens] = trim($row[$this->tokens]);
        }
        if (!empty($this->valor_usd)) {
            $row[$this->valor_usd] = trim($row[$this->valor_usd]);
        }
        if (!empty($this->valor_eur)) {
            $row[$this->valor_eur] = trim($row[$this->valor_eur]);
        }
        if (!empty($this->valor_cop)) {
            $row[$this->valor_cop] = trim($row[$this->valor_cop]);
        }
        if (!empty($this->horas)) {
            $row[$this->horas] = trim($row[$this->horas]);
        }
    }

    /**
     * @param array $row
     *
     * @return
     */
    public function validateRow($row)
    {
        //
    }

    /**
     * @param
     *
     * @return int
     */
    public function getRowCount(): int
    {
        return $this->count;
    }

    /**
     * @param
     *
     * @return int
     */
    public function searchInactives()
    {
        // echo "<pre>";
        // print_r($dataset);
        // echo "</pre>";
        // die();

        $where = "1=2";
        foreach ($this->response['errors']['data'] as $d => $data) {
            // build where for inactives search
            $where .= " OR (modacc_app LIKE '%".$data['modacc_app']."%' AND modacc_payment_username LIKE '%".$data['nickname']."%')";
        }

        //////////////////////
        // SEARCH INACTIVES //
        //////////////////////
        // get inactive models accounts list
        $modelsAccountsList = [];
        $records = DB::select(
            "SELECT modacc_id, modacc_app, modacc_payment_username,
                    us.user_name || ' ' || us.user_surname as name,
                    std_discountmodel_usd, std_discountmodel_eur,
                    std_discountstudio_usd, std_discountstudio_eur,
                    st.std_id
            FROM models_accounts ma 
            LEFT JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
            LEFT JOIN studios st ON st.std_id = sm.std_id
            LEFT JOIN users us ON us.user_id = sm.user_id_model 
            WHERE $where"
        );
        //Log::info("SELECT modacc_id, modacc_app, modacc_payment_username FROM models_accounts WHERE $where");
        foreach ($records as $r => $row) {
            $row->modacc_app = preg_replace("/(.*)\(.*\)/", "$1", $row->modacc_app); // STRIPCHAT(2) >> STRIPCHAT
            $row->modacc_app = trim($row->modacc_app);
            $row->modacc_payment_username = trim($row->modacc_payment_username);
            $row->modacc_payment_username = strtoupper($row->modacc_payment_username);
            $this->modelsAccountsList[$row->modacc_app][$row->modacc_payment_username] = $row;
        }

        foreach ($this->response['errors']['data'] as $d => $data) {
            // valida si el marcado error esta dentro de los inactivos
            if (isset($this->modelsAccountsList[$data['modacc_app']][$data['nickname']])) {
                $data['modacc_id'] = $this->modelsAccountsList[$data['modacc_app']][$data['nickname']]->modacc_id;
                $data['name'] = $this->modelsAccountsList[$data['modacc_app']][$data['nickname']]->name;
                $data['toggleActive'] = false;

                $data['std_discountmodel_usd'] = $this->modelsAccountsList[$data['modacc_app']][$data['nickname']]->std_discountmodel_usd;
                $data['std_discountstudio_usd'] = $this->modelsAccountsList[$data['modacc_app']][$data['nickname']]->std_discountstudio_usd;
                $data['std_discountmodel_eur'] = $this->modelsAccountsList[$data['modacc_app']][$data['nickname']]->std_discountmodel_eur;
                $data['std_discountstudio_eur'] = $this->modelsAccountsList[$data['modacc_app']][$data['nickname']]->std_discountstudio_eur;

                // modstr_earnings_value
                if (empty($data['modstr_earnings_cop'])) {
                    if (!empty($data['modstr_earnings_usd'])) {
                        $data['modstr_earnings_trm'] = floatval($this->trmUSD) - floatval($data['std_discountmodel_usd']);
                        $data['modstr_earnings_cop'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm']);
                        $data['modstr_earnings_trm_studio'] = floatval($this->trmUSD) - floatval($data['std_discountstudio_usd']);
                        $data['modstr_earnings_cop_studio'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm_studio']);
                        
                    } else if (!empty($data['modstr_earnings_eur'])) {
                        $data['modstr_earnings_trm'] = floatval($this->trmEUR) - floatval($data['std_discountmodel_eur']);
                        $data['modstr_earnings_cop'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm']);
                        $data['modstr_earnings_trm_studio'] = floatval($this->trmEUR) - floatval($data['std_discountstudio_eur']);
                        $data['modstr_earnings_cop_studio'] = floatval($data['modstr_earnings_value']) * floatval($data['modstr_earnings_trm_studio']);
                    }
                }

                // lo agrega a los inactives
                unset($data['errors']);
                $this->response['inactives']['data'][] = $data;
                $this->response['inactives']['totalEarningsUsd']+= $data['modstr_earnings_usd'];
                $this->response['inactives']['totalEarningsEur']+= $data['modstr_earnings_eur'];
                $this->response['inactives']['totalEarningsTokens']+= $data['modstr_earnings_tokens'];
                $this->response['inactives']['totalTime']+= $data['modstr_time'];
                // lo quita de los errors
                unset($this->response['errors']['data'][$d]);

                // En caso contrario se suma al total de errores
            } else {
                $this->response['errors']['totalEarningsUsd']+= $data['modstr_earnings_usd'];
                $this->response['errors']['totalEarningsEur']+= $data['modstr_earnings_eur'];
                $this->response['errors']['totalEarningsTokens']+= $data['modstr_earnings_tokens'];
                $this->response['errors']['totalTime']+= $data['modstr_time'];
            }
        }
        $this->response['errors']['data'] = array_values($this->response['errors']['data']);
    }

    /**
     * @param
     *
     * @return int
     */
    public function getRecords()
    {
        return $this->response;
    }

    /**
     * @return array
     */
    public function sheets(): array
    {
        return [
            0 => $this, // Only process the first sheet (index 0)
        ];
    }
}
