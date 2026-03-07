<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\IOFactory;
use ZipArchive;
use Validator;
use DateTime;
use Exception;

use App\Models\User;
use App\Models\Profile;
use App\Models\Studio;
use App\Models\StudioModel;
use App\Models\Payment;
use App\Models\PaymentFile;
use App\Models\Period;
use App\Models\ModelStream;
use App\Models\Liquidation;
use App\Models\Transaction;
use App\Models\TransactionType;
use App\Models\ModelLivejasminScore;

use App\Services\ParticipationBonusService;

use App\Http\Controllers\ExchangeRateController;
use App\Http\Controllers\PeriodController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\ModelStreamController;

use App\Library\HelperController;
use App\Library\LogController;
use Spatie\LaravelPdf\Facades\Pdf;

class LiquidationModelController extends LiquidationController
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
     * Get execution report.
     *
     * @return response()->json
     */
    public function liquidate($report_since, $report_until, $args = null)
    {

        Log::debug("Entre a liquidation");
        // args
        $where = !empty($args['where']) ? $args['where'] : '';
        $orderBy = !empty($args['orderBy']) ? $args['orderBy'] : 'user_name, modacc_app';
        $having = !empty($args['having']) ? $args['having'] : 'SUM(modstr_earnings_cop) <> 0'; // Se agrega visualizacion de la modelos en negativo
        $include_stream_date = !empty($args['include_stream_date']) ? $args['include_stream_date'] : false;

        // profiles
        $prof_ids_model = implode("','", [Profile::MODELO, Profile::MODELO_SATELITE]);

        $dataset = array();

        //////////////
        // INGRESOS //
        //////////////
        $weeklyApps = [
            // 'BONGACAMS', // no posee webscraping de momento
            'CAM4',
            // 'CAMSODA', // no posee webscraping de momento
            // 'CAMSODA ALIADOS', // no posee webscraping de momento
            'CHATURBATE',
            'CHATURBATE(2)',
            // 'FLIRT4FREE', // opera dia a dia
            'IMLIVE',
            'LIVEJASMIN',
            'LIVEJASMIN(2)',
            // 'ONLYFANS', // no posee webscraping de momento
            // 'MYDIRTYHOBBY', // no posee webscraping de momento
            'MYFREECAMS',
            // 'SKYPRIVATE', // no posee webscraping de momento
            'STREAMATE',
            'STREAMRAY',
            'STRIPCHAT',
            'STRIPCHAT(2)',
            // 'XHAMSTER', // no posee webscraping de momento
            'XLOVECAM',

        ];
        $weeklyApps = implode("','", $weeklyApps);

        // Consulta simplificada usando la tabla liquidations
        // La tabla liquidations ya contiene los datos procesados con la lógica de priorización
        // donde
        $whereTmp = $where;
        $havingTmp = preg_replace("/SUM\(liq_earnings_cop\) > (\d+)/", "SUM(liq_earnings_cop) > 0", $having);
        $havingTmp = str_replace('modstr_earnings_cop', 'liq_earnings_cop', $havingTmp);

        $sql = "SELECT
                    ". (($include_stream_date) ? 'lq.liq_date as modstr_date,' : '') ."
                    us.user_id,
                    us.user_identification,
                    us.user_name,
                    us.user_name2,
                    us.user_surname,
                    us.user_surname2,
                    us.user_bank_entity,
                    us.user_bank_account,
                    us.user_bank_account_type,
                    us.user_document_type,
                    us.user_beneficiary_name,
                    us.user_beneficiary_document,
                    us.user_beneficiary_document_type,
                    sm.stdmod_id,
                    sm.stdmod_commission_type,
                    st.std_id,
                    st.std_name,
                    st.std_ally_master_pays,
                    us2.user_name || ' ' || us2.user_surname AS owner_name,
                    ma.modacc_id,
                    ma.modacc_app,
                    ma.modacc_username,
                    ma.modacc_earnings_rtefte,
                    SUM(liq_price) as sum_price,
                    SUM(liq_earnings_value) as sum_earnings_value,
                    MIN(liq_earnings_trm) as modstr_earnings_trm,
                    MIN(liq_earnings_percent) as modstr_earnings_percent,
                    SUM(liq_earnings_tokens) as sum_earnings_tokens,
                    MIN(liq_earnings_tokens_rate) as modstr_earnings_tokens_rate,
                    SUM(liq_earnings_usd) as sum_earnings_usd,
                    SUM(liq_earnings_eur) as sum_earnings_eur,
                    SUM(liq_earnings_cop) as sum_earnings_cop,
                    SUM(liq_rtefte_model) as sum_rtefte_model,
                    SUM(liq_rtefte_studio) as sum_rtefte_studio,
                    SUM(liq_time) as sum_time
                FROM users us
                INNER JOIN studios_models sm ON sm.user_id_model = us.user_id
                INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                INNER JOIN liquidations lq ON lq.modacc_id = ma.modacc_id
                LEFT JOIN studios st ON st.std_id = lq.std_id
                LEFT JOIN users us2 ON st.user_id_owner = us2.user_id
                LEFT JOIN studios_shifts ss ON ss.stdshift_id = sm.stdshift_id
                WHERE us.prof_id IN ('$prof_ids_model')
                    AND lq.liq_date BETWEEN '$report_since' AND '$report_until'
                    AND $whereTmp
                GROUP BY us.user_id,
                    us.user_identification,
                    us.user_name,
                    us.user_name2,
                    us.user_surname,
                    us.user_surname2,
                    us.user_bank_entity,
                    us.user_bank_account,
                    us.user_bank_account_type,
                    us.user_document_type,
                    us.user_beneficiary_name,
                    us.user_beneficiary_document,
                    us.user_beneficiary_document_type,
                    sm.stdmod_id,
                    sm.stdmod_commission_type,
                    st.std_id,
                    st.std_name,
                    us2.user_name,
                    us2.user_surname,
                    ma.modacc_id,
                    ma.modacc_app,
                    ma.modacc_username,
                    ma.modacc_earnings_rtefte,
                    ". (($include_stream_date) ? 'lq.liq_date,' : '') ."
                    st.std_ally_master_pays
                HAVING $havingTmp
                ORDER BY $orderBy";

        Log::info("SQL de liquidación principal", ['sql' => $sql]);
        // echo "<pre>";
        // echo $sql;
        // echo "</pre>";
        // die();

        $records = DB::select($sql);
        foreach ($records as $r => $row) {
            // init
            if (!isset($dataset[$row->user_id])) {
                $dataset[$row->user_id] = [
                    'sum_earnings_usd' => 0,
                    'sum_earnings_eur' => 0,
                    'sum_earnings_cop' => 0,
                    'sum_earnings_tokens' => 0,
                    'sum_earnings_discounts' => 0,
                    'sum_earnings_others' => 0,
                    'sum_earnings_base_discount_rtefte' => 0, // Descuentos con retención
                    'sum_earnings_base_others_rtefte' => 0, // Otros ingresos con retención
                    'sum_earnings_net' => 0,
                    'sum_earnings_time' => '00:00:00',
                    'sum_earnings_hours' => 0,
                    'sum_earnings_rtefte' => 0,
                    'sum_rtefte_model' => 0,
                    'sum_rtefte_studio' => 0,
                    'sum_earnings_total' => 0,
                    'incomes' => [],
                    'discounts' => [],
                    'others' => [],
                    'payments' => [],
                ];
            }
            $dataset[$row->user_id]['user_id'] = $row->user_id;
            $dataset[$row->user_id]['user_identification'] = $row->user_identification;
            $dataset[$row->user_id]['user_name'] = $row->user_name;
            $dataset[$row->user_id]['user_name2'] = $row->user_name2;
            $dataset[$row->user_id]['user_surname'] = $row->user_surname;
            $dataset[$row->user_id]['user_surname2'] = $row->user_surname2;
            $dataset[$row->user_id]['user_bank_entity'] = $row->user_bank_entity;
            $dataset[$row->user_id]['user_bank_account'] = $row->user_bank_account;
            $dataset[$row->user_id]['user_bank_account_type'] = $row->user_bank_account_type;
            $dataset[$row->user_id]['user_document_type'] = $row->user_document_type;
            $dataset[$row->user_id]['user_beneficiary_name'] = $row->user_beneficiary_name;
            $dataset[$row->user_id]['user_beneficiary_document'] = $row->user_beneficiary_document;
            $dataset[$row->user_id]['user_beneficiary_document_type'] = $row->user_beneficiary_document_type;
            $dataset[$row->user_id]['stdmod_id'] = $row->stdmod_id;
            $dataset[$row->user_id]['stdmod_commission_type'] = $row->stdmod_commission_type;
            $dataset[$row->user_id]['std_id'] = $row->std_id;
            $dataset[$row->user_id]['std_name'] = $row->std_name;
            $dataset[$row->user_id]['std_ally_master_pays'] = $row->std_ally_master_pays;
            $dataset[$row->user_id]['owner_name'] = $row->owner_name;
            $dataset[$row->user_id]['modacc_earnings_rtefte'] = $row->modacc_earnings_rtefte ?? 4.00;

            // incomes
            if (!isset($dataset[$row->user_id]['incomes'])) {
                $dataset[$row->user_id]['incomes'] = [];
            }
            if (!isset($dataset[$row->user_id]['incomes'][$row->modacc_id])) {
                $dataset[$row->user_id]['incomes'][$row->modacc_id] = [
                    'modacc_period' => $report_since . ' al ' . $report_until,
                    'modacc_app' => $row->modacc_app,
                    'modacc_username' => $row->modacc_username,
                    'sum_price' => 0,
                    'sum_earnings_value' => 0,
                    'modstr_earnings_trm' => 0,
                    'modstr_earnings_percent' => 0,
                    'sum_earnings_tokens' => 0,
                    'modstr_earnings_tokens_rate' => 0,
                    'sum_earnings_usd' => 0,
                    'sum_earnings_eur' => 0,
                    'sum_earnings_cop' => 0,
                    'sum_time' => '00:00:00',
                ];
            }
            if ($include_stream_date) {
                if (!isset($dataset[$row->user_id]['commission_sum'])) {
                    $dataset[$row->user_id]['commission_sum'] = [];
                }
                if (!isset($dataset[$row->user_id]['commission_sum'][$row->modstr_date])) {
                    $dataset[$row->user_id]['commission_sum'][$row->modstr_date] = [
                        'sum_price' => 0,
                        'sum_earnings_value' => 0,
                        'modstr_earnings_trm' => 0,
                        'modstr_earnings_percent' => 0,
                        'sum_earnings_tokens' => 0,
                        'modstr_earnings_tokens_rate' => 0,
                        'sum_earnings_usd' => 0,
                        'sum_earnings_eur' => 0,
                        'sum_earnings_cop' => 0,
                        'sum_time' => '00:00:00',
                    ];
                }
            }

            // grand total
            $dataset[$row->user_id]['sum_earnings_usd'] += $row->sum_earnings_usd;
            $dataset[$row->user_id]['sum_earnings_eur'] += $row->sum_earnings_eur;
            $dataset[$row->user_id]['sum_earnings_cop'] += $row->sum_earnings_cop;
            $dataset[$row->user_id]['sum_earnings_tokens'] += $row->sum_earnings_tokens;

            // toma el mayor tiempo de streaming
            if ($dataset[$row->user_id]['sum_earnings_hours'] < $this->helper->timeToNumber($row->sum_time)) {
                $dataset[$row->user_id]['sum_earnings_time'] = $this->helper->timeToNumber($this->helper->timeToNumber($row->sum_time));
                $dataset[$row->user_id]['sum_earnings_time'] = $this->helper->numberToTime($dataset[$row->user_id]['sum_earnings_time']);
                $dataset[$row->user_id]['sum_earnings_hours'] = $this->helper->timeToNumber($row->sum_time);
            }

            // detail
            $dataset[$row->user_id]['incomes'][$row->modacc_id]['sum_price'] += $row->sum_price;
            $dataset[$row->user_id]['incomes'][$row->modacc_id]['sum_earnings_value'] += $row->sum_earnings_value;
            $dataset[$row->user_id]['incomes'][$row->modacc_id]['modstr_earnings_trm'] = $row->modstr_earnings_trm;
            $dataset[$row->user_id]['incomes'][$row->modacc_id]['modstr_earnings_percent'] = $row->modstr_earnings_percent;
            $dataset[$row->user_id]['incomes'][$row->modacc_id]['sum_earnings_tokens'] += $row->sum_earnings_tokens;
            $dataset[$row->user_id]['incomes'][$row->modacc_id]['sum_earnings_tokens_rate'] = $row->modstr_earnings_tokens_rate;
            $dataset[$row->user_id]['incomes'][$row->modacc_id]['sum_earnings_usd'] += $row->sum_earnings_usd;
            $dataset[$row->user_id]['incomes'][$row->modacc_id]['sum_earnings_eur'] += $row->sum_earnings_eur;
            $dataset[$row->user_id]['incomes'][$row->modacc_id]['sum_earnings_cop'] += $row->sum_earnings_cop;
            $dataset[$row->user_id]['incomes'][$row->modacc_id]['sum_time'] = $this->helper->timeToNumber($dataset[$row->user_id]['incomes'][$row->modacc_id]['sum_time']) + $this->helper->timeToNumber($row->sum_time);
            $dataset[$row->user_id]['incomes'][$row->modacc_id]['sum_time'] = $this->helper->numberToTime($dataset[$row->user_id]['incomes'][$row->modacc_id]['sum_time']);

            if ($include_stream_date) {
                // commission sum
                //$dataset[$row->user_id]['commission_sum'][$row->modstr_date]['sum_price'] += $row->sum_price;
                //$dataset[$row->user_id]['commission_sum'][$row->modstr_date]['sum_earnings_value'] += $row->sum_earnings_value;
                $dataset[$row->user_id]['commission_sum'][$row->modstr_date]['modstr_earnings_trm'] = $row->modstr_earnings_trm;
                //$dataset[$row->user_id]['commission_sum'][$row->modstr_date]['modstr_earnings_percent'] = $row->modstr_earnings_percent;
                //$dataset[$row->user_id]['commission_sum'][$row->modstr_date]['sum_earnings_tokens'] += $row->sum_earnings_tokens;
                //$dataset[$row->user_id]['commission_sum'][$row->modstr_date]['sum_earnings_tokens_rate'] = $row->modstr_earnings_tokens_rate;
                $dataset[$row->user_id]['commission_sum'][$row->modstr_date]['sum_earnings_usd'] += $row->sum_earnings_usd;
                $dataset[$row->user_id]['commission_sum'][$row->modstr_date]['sum_earnings_eur'] += $row->sum_earnings_eur;
                $dataset[$row->user_id]['commission_sum'][$row->modstr_date]['sum_earnings_cop'] += $row->sum_earnings_cop;
                //$dataset[$row->user_id]['commission_sum'][$row->modstr_date]['sum_time'] = $this->helper->timeToNumber($dataset[$row->user_id]['commission_sum'][$row->modstr_date]['sum_time']) + $this->helper->timeToNumber($row->sum_time);
                //$dataset[$row->user_id]['commission_sum'][$row->modstr_date]['sum_time'] = $this->helper->numberToTime($dataset[$row->user_id]['commission_sum'][$row->modstr_date]['sum_time']);
            }
        }

        /////////////////////////
        // DESCUENTOS / OTHERS //
        /////////////////////////
        // where
        $whereTmp = $where;
        $whereTmp = str_replace('lq.liq_date', 'trans_date', $whereTmp);
        $whereTmp = str_replace('ms.modstr_date', 'trans_date', $whereTmp);
        $whereTmp = str_replace(' AND liq_earnings_cop > 0', '', $whereTmp);
        $whereTmp = str_replace(' AND liq_earnings_cop > 30000', '', $whereTmp);
        $whereTmp = str_replace(' AND modstr_earnings_cop > 0', '', $whereTmp);
        $whereTmp = str_replace(' AND modstr_earnings_cop > 30000', '', $whereTmp);
        $whereTmp = str_replace(' AND (SELECT COUNT(*) FROM payments WHERE stdmod_id = sm.stdmod_id) = 0', '', $whereTmp);

        // data
        $sql = "SELECT DISTINCT
                    us.user_id,
                    us.user_identification,
                    us.user_name,
                    us.user_name2,
                    us.user_surname,
                    us.user_surname2,
                    us.user_bank_entity,
                    us.user_bank_account,
                    us.user_bank_account_type,
                    us.user_document_type,
                    us.user_beneficiary_name,
                    us.user_beneficiary_document,
                    us.user_beneficiary_document_type,
                    sm.stdmod_id,
                    st.std_id,
                    st.std_name,
                    us2.user_name || ' ' || us2.user_surname AS owner_name,
                    mt.trans_id,
                    mt.transtype_id,
                    pd.prod_code,
                    pd.prod_name,
                    tt.transtype_group,
                    tt.transtype_name,
                    mt.trans_date,
                    mt.trans_description,
                    mt.trans_quantity,
                    mt.trans_amount,
                    mt.trans_rtefte,
                    (mt.trans_quantity * mt.trans_amount) as trans_total
                FROM users us
                INNER JOIN studios_models sm ON sm.user_id_model = us.user_id
                INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                INNER JOIN transactions mt ON mt.stdmod_id = sm.stdmod_id
                INNER JOIN transactions_types tt ON tt.transtype_id = mt.transtype_id
                LEFT JOIN products pd ON pd.prod_id = mt.prod_id
                LEFT JOIN studios st ON st.std_id = sm.std_id
                LEFT JOIN users us2 ON st.user_id_owner = us2.user_id
                LEFT JOIN studios_shifts ss ON ss.stdshift_id = sm.stdshift_id
                WHERE us.prof_id IN ('$prof_ids_model') AND $whereTmp
                ORDER BY user_name
        ";

        // Log::info($sql);
        // echo "<pre>";
        // echo $sql;
        // echo "</pre>";
        // die();

        $records = DB::select($sql);
        foreach ($records as $r => $row) {
            // init
            if (!isset($dataset[$row->user_id])) {
                $dataset[$row->user_id] = [
                    'sum_earnings_usd' => 0,
                    'sum_earnings_eur' => 0,
                    'sum_earnings_cop' => 0,
                    'sum_earnings_discounts' => 0,
                    'sum_earnings_others' => 0,
                    'sum_earnings_base_discount_rtefte' => 0, // Descuentos con retención
                    'sum_earnings_base_others_rtefte' => 0, // Otros ingresos con retención
                    'sum_earnings_net' => 0,
                    'sum_earnings_time' => '00:00:00',
                    'sum_earnings_hours' => 0,
                    'sum_earnings_rtefte' => 0,
                    'sum_rtefte_model' => 0,
                    'sum_rtefte_studio' => 0,
                    'sum_earnings_total' => 0,
                    'incomes' => [],
                    'discounts' => [],
                    'others' => [],
                    'payments' => [],
                ];
            }
            $dataset[$row->user_id]['user_id'] = $row->user_id;
            $dataset[$row->user_id]['user_identification'] = $row->user_identification;
            $dataset[$row->user_id]['user_name'] = $row->user_name;
            $dataset[$row->user_id]['user_name2'] = $row->user_name2;
            $dataset[$row->user_id]['user_surname'] = $row->user_surname;
            $dataset[$row->user_id]['user_surname2'] = $row->user_surname2;
            $dataset[$row->user_id]['user_bank_entity'] = $row->user_bank_entity;
            $dataset[$row->user_id]['user_bank_account'] = $row->user_bank_account;
            $dataset[$row->user_id]['user_bank_account_type'] = $row->user_bank_account_type;
            $dataset[$row->user_id]['user_document_type'] = $row->user_document_type;
            $dataset[$row->user_id]['user_beneficiary_name'] = $row->user_beneficiary_name;
            $dataset[$row->user_id]['user_beneficiary_document'] = $row->user_beneficiary_document;
            $dataset[$row->user_id]['user_beneficiary_document_type'] = $row->user_beneficiary_document_type;
            $dataset[$row->user_id]['stdmod_id'] = $row->stdmod_id;
            $dataset[$row->user_id]['std_id'] = $row->std_id;
            $dataset[$row->user_id]['std_name'] = $row->std_name;
            $dataset[$row->user_id]['owner_name'] = $row->owner_name;

            // DISCOUNTS
            if ($row->transtype_group == 'EGRESOS') {
                // discounts
                if (!isset($dataset[$row->user_id]['discounts'])) {
                    $dataset[$row->user_id]['discounts'] = [];
                }

                $trans_description = '';
                if (!empty($row->prod_code)) {
                    $trans_description = $row->transtype_name . ' | ' . $row->prod_code . ': ' . $row->prod_name;
                } else if (!empty($row->trans_description)) {
                    $trans_description = $row->transtype_name . ': ' . $row->trans_description;
                } else {
                    $trans_description = $row->transtype_name;
                }

                $dataset[$row->user_id]['discounts'][] = [
                    'trans_date' => $row->trans_date,
                    'transtype_name' => $row->transtype_name,
                    'trans_description' => $trans_description,
                    'trans_total' => $row->trans_total,
                    'trans_rtefte' => $row->trans_rtefte,
                ];

                // grand total
                $dataset[$row->user_id]['sum_earnings_discounts'] += $row->trans_total;

                // Separar según tenga o no retención en la fuente
                if ($row->trans_rtefte) {
                    $dataset[$row->user_id]['sum_earnings_base_discount_rtefte'] += $row->trans_total;
                }

                // OTHERS
            } else if ($row->transtype_group == 'INGRESOS') {
                // others
                if (!isset($dataset[$row->user_id]['others'])) {
                    $dataset[$row->user_id]['others'] = [];
                }

                $trans_description = '';
                if (!empty($row->prod_cod)) {
                    $trans_description = $row->transtype_name . '(' . $row->prod_code . ' - ' . $row->prod_name . ')';
                } else if (!empty($row->trans_description)) {
                    $trans_description = $row->transtype_name . ': ' . $row->trans_description;
                } else {
                    $trans_description = $row->transtype_name;
                }

                $dataset[$row->user_id]['others'][] = [
                    'trans_date' => $row->trans_date,
                    'transtype_name' => $row->transtype_name,
                    'trans_description' => $trans_description,
                    'trans_total' => $row->trans_total,
                    'trans_rtefte' => $row->trans_rtefte,
                ];

                // grand total
                $dataset[$row->user_id]['sum_earnings_others'] += $row->trans_total;

                // Separar según tenga o no retención en la fuente
                if ($row->trans_rtefte) {
                    $dataset[$row->user_id]['sum_earnings_base_others_rtefte'] += $row->trans_total;
                }
            }
        }

        ///////////
        // PAGOS //
        ///////////
        // where
        $whereTmp = $where;

        // data
        $sql = "SELECT DISTINCT
                    us.user_id,
                    pmf.payfile_id,
                    pmf.payfile_description,
                    pmf.payfile_filename,
                    pmf.payfile_template,
                    pmf.payfile_total,
                    pmf.created_by,
                    pm.pay_models_retefuente_generated,
                    pm.pay_id
                FROM users us
                INNER JOIN studios_models sm ON sm.user_id_model = us.user_id
                INNER JOIN payments pm ON pm.stdmod_id = sm.stdmod_id
                INNER JOIN payments_files pmf ON pmf.payfile_id = pm.payfile_id
                INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                INNER JOIN liquidations lq ON lq.modacc_id = ma.modacc_id
                LEFT JOIN studios st ON st.std_id = sm.std_id
                LEFT JOIN studios_shifts ss ON ss.stdshift_id = sm.stdshift_id
                WHERE us.prof_id IN ('$prof_ids_model') AND $whereTmp
                AND pm.pay_period_since >= '$report_since' AND pm.pay_period_until <= '$report_until'
                AND lq.liq_date BETWEEN '$report_since' AND '$report_until'
                ORDER BY payfile_id
        ";

        // echo "<pre>";
        // echo $sql;
        // echo "</pre>";
        // die();
        // log::info($sql);

        $records = DB::select($sql);
        foreach ($records as $r => $row) {
            if (isset($dataset[$row->user_id])) {
                $dataset[$row->user_id]['payments'][] = [
                    'payfile_id' => $row->payfile_id,
                    'payfile_description' => $row->payfile_description,
                    'payfile_filename' => $row->payfile_filename,
                    'payfile_template' => $row->payfile_template,
                    'payfile_total' => $row->payfile_total,
                    'created_by' => $row->created_by,
                    'pay_models_retefuente_generated' => $row->pay_models_retefuente_generated,
                    'pay_id' => $row->pay_id
                ];
            }
        }

        /////////////////////////////
        // BONOS DE LIVEJASMIN     //
        /////////////////////////////
        // Solo aplica cuando LIVEJASMIN_PARTICIPATION_ENABLED=true (despliegue Gold Line)
        // En El Castillo principal, LiveJasmin se liquida igual que las demas plataformas (usando models_goals)
        if (env('LIVEJASMIN_PARTICIPATION_ENABLED', false)) {
        // Obtener bonos de LiveJasmin para modelos de esa plataforma en el período
        foreach ($dataset as $user_id => $model) {
            // Verificar si la modelo tiene cuentas de LiveJasmin
            $hasLivejasminAccount = false;
            foreach ($model['incomes'] as $income) {
                if (in_array($income['modacc_app'], ['LIVEJASMIN', 'LIVEJASMIN(2)'])) {
                    $hasLivejasminAccount = true;
                    break;
                }
            }

            if ($hasLivejasminAccount) {
                Log::info("Buscando bonos LiveJasmin para modelo", [
                    'user_id' => $user_id,
                    'user_name' => $model['user_name'] ?? 'N/A',
                    'period_since' => $report_since,
                    'period_until' => $report_until
                ]);

                // Buscar bonos de LiveJasmin para esta modelo en el período
                $livejasminBonuses = ModelLivejasminScore::where('modacc_id', function ($query) use ($user_id) {
                    $query->select('ma.modacc_id')
                        ->from('models_accounts as ma')
                        ->join('studios_models as sm', 'sm.stdmod_id', '=', 'ma.stdmod_id')
                        ->where('sm.user_id_model', $user_id)
                        ->whereIn('ma.modacc_app', ['LIVEJASMIN', 'LIVEJASMIN(2)'])
                        ->limit(1);
                })
                    ->where(function ($query) use ($report_since, $report_until) {
                        $query->where(function ($q) use ($report_since, $report_until) {
                            // El período de LiveJasmin se solapa con el período de liquidación
                            $q->where('modlj_period_start', '<=', $report_until)
                                ->where('modlj_period_end', '>=', $report_since);
                        });
                    })
                    ->orderBy('created_at', 'desc')
                    ->first();

                Log::info("Consulta LiveJasmin ejecutada", [
                    'user_id' => $user_id,
                    'found_bonus' => $livejasminBonuses ? true : false,
                    'bonus_data' => $livejasminBonuses ? [
                        'bonus_5' => $livejasminBonuses->modlj_bonus_5_percent,
                        'bonus_10' => $livejasminBonuses->modlj_bonus_10_percent
                    ] : null
                ]);

                if ($livejasminBonuses) {
                    // Usar ParticipationBonusService para calcular la participación dinámica
                    $participationService = new ParticipationBonusService();
                    $participationResult = $participationService->evaluateModelParticipation($livejasminBonuses);

                    // Calcular comisión basada en la participación final (convertir de % a decimal)
                    $livejasminCommission = $participationResult['success']
                        ? ($participationResult['final_participation'] / 100)
                        : 0.50; // 50% por defecto si hay error

                    // Asignar comisión personalizada de LiveJasmin
                    $dataset[$user_id]['livejasmin_commission_percent'] = $livejasminCommission;

                    // Actualizar la comisión Y recalcular sum_earnings_cop en las cuentas de LiveJasmin
                    // IMPORTANTE: liq_earnings_cop viene con 50% ya aplicado desde la fuente
                    // Necesitamos recalcular: USD × TRM × nueva comisión
                    foreach ($dataset[$user_id]['incomes'] as $key => $income) {
                        if (in_array($income['modacc_app'], ['LIVEJASMIN', 'LIVEJASMIN(2)'])) {
                            $oldCop = $income['sum_earnings_cop'];
                            $usd = $income['sum_earnings_usd'] ?? 0;
                            $trm = $income['modstr_earnings_trm'] ?? 0;

                            // Recalcular COP con la nueva comisión (bruto × comisión)
                            $newCop = round($usd * $trm * $livejasminCommission);

                            // Actualizar el income
                            $dataset[$user_id]['incomes'][$key]['modstr_earnings_percent'] = $livejasminCommission;
                            $dataset[$user_id]['incomes'][$key]['sum_earnings_cop'] = $newCop;

                            // Ajustar el sum_earnings_cop global del modelo
                            $dataset[$user_id]['sum_earnings_cop'] = $dataset[$user_id]['sum_earnings_cop'] - $oldCop + $newCop;

                            Log::debug("Recalculando COP para LiveJasmin", [
                                'user_id' => $user_id,
                                'modacc_app' => $income['modacc_app'],
                                'usd' => $usd,
                                'trm' => $trm,
                                'old_cop' => $oldCop,
                                'new_cop' => $newCop,
                                'commission' => $livejasminCommission
                            ]);
                        }
                    }

                    // Guardar información adicional de participación para reportes
                    $dataset[$user_id]['livejasmin_participation'] = [
                        'model_type' => $participationResult['model_type'] ?? null,
                        'base_participation' => $participationResult['base_participation'] ?? 50,
                        'final_participation' => $participationResult['final_participation'] ?? 50,
                        'bonus_percentage' => $participationResult['bonus_percentage'] ?? 0,
                        'has_welcome_bonus' => $participationResult['has_welcome_bonus'] ?? false,
                        'has_conversion_bonus' => $participationResult['has_conversion_bonus'] ?? false,
                        'penalties' => $participationResult['penalties'] ?? [],
                        'bonuses' => $participationResult['bonuses'] ?? [],
                    ];

                    Log::info("Comisión LiveJasmin calculada con ParticipationBonusService", [
                        'user_id' => $user_id,
                        'final_participation' => $participationResult['final_participation'] ?? 50,
                        'commission_percent' => $livejasminCommission * 100,
                        'model_type' => $participationResult['model_type'] ?? 'unknown',
                        'bonus_percentage' => $participationResult['bonus_percentage'] ?? 0,
                        'success' => $participationResult['success'] ?? false
                    ]);
                } else {
                    // Si no hay datos de LiveJasmin pero tiene cuenta, aplicar comisión por defecto (50%)
                    $dataset[$user_id]['livejasmin_commission_percent'] = 0.50;

                    // Actualizar la comisión en las cuentas de LiveJasmin
                    foreach ($dataset[$user_id]['incomes'] as $key => $income) {
                        if (in_array($income['modacc_app'], ['LIVEJASMIN', 'LIVEJASMIN(2)'])) {
                            $dataset[$user_id]['incomes'][$key]['modstr_earnings_percent'] = 0.50;
                        }
                    }

                    $dataset[$user_id]['livejasmin_participation'] = [
                        'model_type' => null,
                        'base_participation' => 50,
                        'final_participation' => 50,
                        'bonus_percentage' => 0,
                        'has_welcome_bonus' => false,
                        'has_conversion_bonus' => false,
                        'penalties' => [],
                        'bonuses' => [],
                    ];
                }
            }
        }
        } // end LIVEJASMIN_PARTICIPATION_ENABLED

        ////////////////
        // ORDER DATA //
        ////////////////
        // array values apps
        $i = 0;
        foreach ($dataset as $m => $model) {
            $dataset[$m]['incomes'] = array_values($dataset[$m]['incomes']);

            // netos y totales
            // NOTA: sum_earnings_cop YA tiene la comisión correcta aplicada para cada plataforma
            // (recalculada para LiveJasmin usando ParticipationBonusService, original para otras plataformas)
            $dataset[$m]['sum_earnings_net'] = $dataset[$m]['sum_earnings_cop'] - $dataset[$m]['sum_earnings_discounts'] + $dataset[$m]['sum_earnings_others'];

            // Retenciones
            $rtefte = $dataset[$m]['modacc_earnings_rtefte'] ?? 4.00; // 4% por defecto si no existe
            $dataset[$m]['sum_earnings_rtefte'] = ceil($dataset[$m]['sum_earnings_cop'] * ($rtefte / 100)); // Aplica retencion en la fuente dinamica
            // Si hay descuentos con retención, se resta el valor de la retención
            if ($dataset[$m]['sum_earnings_base_discount_rtefte'] > 0) {
                $dataset[$m]['sum_earnings_rtefte'] -= $dataset[$m]['sum_earnings_base_discount_rtefte'] * ($rtefte / 100);
            }
            // Si hay otros ingresos con retención, se resta el valor de la retención
            if ($dataset[$m]['sum_earnings_base_others_rtefte'] > 0) {
                $dataset[$m]['sum_earnings_rtefte'] += $dataset[$m]['sum_earnings_base_others_rtefte'] * ($rtefte / 100);
            }
            $dataset[$m]['sum_earnings_rtefte'] = ceil($dataset[$m]['sum_earnings_rtefte']); // Redondea a entero hacia arriba

            // sum_earnings_total = neto - retefuente (ya NO multiplicamos por comisión porque ya está aplicada en sum_earnings_cop)
            $dataset[$m]['sum_earnings_total'] = $dataset[$m]['sum_earnings_net'] - $dataset[$m]['sum_earnings_rtefte'];

            $i++;
        }
        $dataset = array_values($dataset);

        // Primero filtrar los registros que no sumen más de 30000
        if (preg_match("/SUM\((liq|modstr)_earnings_cop\) > (\d+)/", $having)) {
            $floor = preg_replace("/SUM\((liq|modstr)_earnings_cop\) > (\d+)/", "$2", $having);
            $dataset = array_filter($dataset, function($item) use ($floor) {
                return isset($item['sum_earnings_total']) && $item['sum_earnings_total'] > $floor;
            });
        }

        // Reindexar después del filtrado
        $dataset = array_values($dataset);

        // Reordenar por monto desde php ya que la consulta viene por plataforma
        if ($orderBy == 'sum_earnings_cop DESC') {
            usort($dataset, function($a, $b) {
                if ($a['sum_earnings_total'] == $b['sum_earnings_total']) {
                    return 0;
                }
                return ($a['sum_earnings_total'] > $b['sum_earnings_total']) ? -1 : 1;
            });
        }

        // Reordenar por monto desde php ya que la consulta viene por plataforma
        if ($orderBy == 'sum_earnings_usd DESC, sum_earnings_eur DESC') {
            usort($dataset, function($a, $b) {
                if ($a['sum_earnings_usd'] == $b['sum_earnings_usd']) {
                    return 0;
                }
                return ($a['sum_earnings_usd'] > $b['sum_earnings_usd']) ? -1 : 1;
            });
        }

        if (!$include_stream_date){
            $dataset = array_values($dataset);
        }

        // log::info($dataset);
        return $dataset;
    }

    /**
     * Get execution report.
     *
     * @return response()->json
     */
    public function getLiquidation(Request $request) {
        try {
            // auth
            $uAuth = $request->user();

            // Validar requisitos para modelos (datos personales + documentos firmados)
            if (in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                $validationResult = $this->validateModelRequirements($uAuth->user_id);

                if (!$validationResult['all_complete']) {
                    $response = array(
                        'code' => 400,
                        'errors' => [],
                        'error' => [
                            'code' => 'INCOMPLETE_REQUIREMENTS',
                            'message' => 'Debes completar todos los requisitos antes de acceder a la liquidación',
                            'requirements' => $validationResult['requirements'],
                        ],
                    );
                    throw new \Exception(json_encode($response));
                }
            }

            // query data
            $query = $request->query();
            $today = date('Y-m-d');

            // Validations
            if (empty($query['report_since']) || empty($query['report_until'])) {
                $response = array(
                    'code' => 400,
                    'errors' => [],
                    'error' => [
                        'code' => 'EMPTY_PERIOD',
                        'message' => 'Debe seleccionar un periodo',
                    ],
                );
                throw new \Exception(json_encode($response));
            }

            $report_since = '';
            $report_until = '';
            if (!empty($query['report_since'])) {
                $report_since = $query['report_since'];
            }
            if (!empty($query['report_until'])) {
                $report_until = $query['report_until'];
            }
            $period = Period::where('period_start_date', $report_since)->where('period_end_date', $report_until)->first();
            if ($period->period_state === 'ABIERTO') {
                //PERIODO ANTERIOR
                $last_week_since_date = date('Y-m-d', strtotime('last monday', strtotime($report_since)));
                $last_week_until_date = date('Y-m-d', strtotime('last sunday', strtotime($report_until)));
                $last_period = Period::where('period_start_date', $last_week_since_date)->where('period_end_date', $last_week_until_date)->first();

                // Si no existe el periodo anterior
                if (empty($last_period)) {
                    $period_count = Period::count();
                    // Si es el primer periodo ? no crea ni valida que este cerrado (porque no tiene con que compararse)
                    if ($period_count == 1) {
                        $last_period = null;
                    }
                    // De lo contrario, crea el periodo
                    else {
                        $last_period = PeriodController::retrieveOrCreatePeriod($last_week_until_date);
                    }
                }

                if (!empty($last_period) && $last_period->period_state === 'ABIERTO') {
                    $response = array(
                        'code' => 400,
                        'errors' => [],
                        'error' => [
                            'code' => 'LAST_PERIOD_NOT_CLOSED',
                            'message' => 'El periodo anterior debe estar cerrado',
                        ],
                    );
                    throw new \Exception(json_encode($response));
                }

                // Calculate and populate liquidations table for this period
                // Se ejecuta ANTES de los cálculos para consolidar datos de models_streams
                $this->calculateLiquidation($report_since, $report_until, $period->period_id);

                // Valida los STREAMS pendientes de pagar
                // $last_week_since_date = date('Y-m-d', strtotime('last monday', strtotime($report_since)));
                // $last_week_until_date = date('Y-m-d', strtotime('last sunday', strtotime($report_until)));
                $last_week_models_streams = Liquidation::select('sm.user_id_model', 'liquidations.liq_earnings_cop', 'sm.stdmod_id', 'ma.modacc_earnings_rtefte')
                ->join('models_accounts AS ma', 'ma.modacc_id', 'liquidations.modacc_id')
                ->join('studios_models AS sm', 'sm.stdmod_id', 'ma.stdmod_id')
                ->where('liq_date', $last_week_until_date)
                ->get();

                // Valida las Transacciones pendientes de pagar
                $last_week_transactions_with_row_number = Transaction::select('*', DB::raw('ROW_NUMBER() OVER (PARTITION BY user_id, stdmod_id ORDER BY trans_date DESC, trans_pendingbalance DESC) AS row_num'))
                ->where('transactions.trans_date', '<', $report_since)
                ->toBase();
                $last_week_transactions = DB::table(DB::raw("({$last_week_transactions_with_row_number->toSql()}) AS t"))
                ->mergeBindings($last_week_transactions_with_row_number)
                ->select('tt.transtype_group', 'user_id', 'trans_amount', 'trans_quantity', 'stdmod_id', 'trans_pendingbalance_unchanged_times', 't.row_num', 't.trans_date', 't.trans_rtefte')
                ->join('transactions_types AS tt', 'tt.transtype_id', 't.transtype_id')
                ->whereBetween('t.trans_date', [$last_week_since_date, $last_week_until_date])
                ->orWhere(function ($query) {// o si es el primer elemento de la subconsulta (organizado el indice por user_id y stdmod_id) y es una transaccion pendiente con indice 5, (puede ser de cualquier fecha inferior a report_since)
                    $query->where('t.row_num', 1)
                    ->where('t.trans_pendingbalance', true)
                    ->where('t.trans_pendingbalance_unchanged_times', 5);
                })
                ->get();

                // Si posee Streams por migrar o transacciones por migrar
                if ($last_week_transactions->count() > 0 || $last_week_models_streams->count() > 0) {
                    $transaction_type_balance = TransactionType::where('transtype_behavior', 'SALDO PENDIENTE')
                    ->whereNull('deleted_at')
                    ->orderBy('transtype_id', 'desc')
                    ->limit(2)
                    ->get();
                    if ($transaction_type_balance->count() != 2) {
                        $response = array(
                            'code' => 400,
                            'errors' => [],
                            'error' => [
                                'code' => 'TRANSACTIONS_TYPE_NOT_FOUND',
                                'message' => 'No se encontro el numero correcto de tipos de transacciones con comportamiento SALDO PENDIENTE',
                            ],
                        );
                        throw new \Exception(json_encode($response));
                    }
                    $transactions_types = array();
                    foreach ($transaction_type_balance as $transaction_type) {
                        $transactions_types[$transaction_type->transtype_group] = $transaction_type->transtype_id;
                    }

                    $trans_pendingbalance_unchanged_times = array();
                    $users_balance = array();
                    foreach ($last_week_models_streams as $last_week_model_stream) {
                        if (isset($last_week_model_stream->liq_earnings_cop)) {
                            $user_id = $last_week_model_stream->user_id_model;
                            $earns = $last_week_model_stream->liq_earnings_cop;

                            // Calcula rte. fte
                            if (!empty($last_week_model_stream->modacc_earnings_rtefte)) {
                                $rtefte = $last_week_model_stream->modacc_earnings_rtefte ?? 4.00; // 4% por defecto si no existe
                                $earns -= ($earns * $rtefte / 100);
                            }

                            $stdmod_id = $last_week_model_stream->stdmod_id;
                            if (!isset($users_balance[$user_id])) {
                                $users_balance[$user_id] = array();
                            }
                            $users_balance[$user_id][$stdmod_id] = (isset($users_balance[$user_id][$stdmod_id])) ? $earns + $users_balance[$user_id][$stdmod_id] : $earns;
                            if (!isset($trans_pendingbalance_unchanged_times[$user_id])) {
                                $trans_pendingbalance_unchanged_times[$user_id] = array();
                                $trans_pendingbalance_unchanged_times[$user_id][$stdmod_id]['times'] = 1;
                                $trans_pendingbalance_unchanged_times[$user_id][$stdmod_id]['balance'] = $earns;
                            }
                        }
                    }
                    foreach ($last_week_transactions as $last_week_transaction) {
                        if (isset($last_week_transaction->trans_amount)) {
                            $user_id = $last_week_transaction->user_id;
                            $earns_presigned = $last_week_transaction->trans_amount * $last_week_transaction->trans_quantity;
                            $earns = ($last_week_transaction->transtype_group == 'EGRESOS') ? -$earns_presigned : $earns_presigned;

                            // Calcula rte. fte
                            if ($last_week_transaction->trans_rtefte) {
                                $rtefte = 4.00;
                                $earns -= ($earns * $rtefte / 100);
                            }

                            $stdmod_id = $last_week_transaction->stdmod_id;
                            if (!isset($users_balance[$user_id])) {
                                $users_balance[$user_id] = array();
                            }
                            $users_balance[$user_id][$stdmod_id] = (isset($users_balance[$user_id][$stdmod_id])) ? $earns + $users_balance[$user_id][$stdmod_id] : $earns;

                            if (!isset($trans_pendingbalance_unchanged_times[$user_id])) {
                                $trans_pendingbalance_unchanged_times[$user_id] = array();
                            }
                            $tpbut = intval($last_week_transaction->trans_pendingbalance_unchanged_times);
                            if (!isset($trans_pendingbalance_unchanged_times[$user_id][$stdmod_id]) ||
                                ($tpbut + 1) > $trans_pendingbalance_unchanged_times[$user_id][$stdmod_id]['times']) {
                                $trans_pendingbalance_unchanged_times[$user_id][$stdmod_id]['times'] = $tpbut + 1;
                                $trans_pendingbalance_unchanged_times[$user_id][$stdmod_id]['balance'] = $earns_presigned;
                            }

                        }
                    }

                    $liquidated_transactions = Transaction::join('transactions_types AS tt', 'tt.transtype_id', 'transactions.transtype_id')
                    ->where('transtype_behavior', 'SALDO PENDIENTE')
                    ->where('transactions.trans_pendingbalance', true)
                    ->where('transactions.trans_pendingbalance_unchanged_times', '!=',-1)
                    ->whereBetween('transactions.trans_date', [$report_since, $report_until])
                    ->whereIn('transactions.user_id', array_keys($users_balance))
                    ->get();


                    $liquidated_transactions_dic = array();
                    foreach ($liquidated_transactions as $liquidated_transaction) {
                        if (!isset($liquidated_transactions_dic[$liquidated_transaction->user_id])) {
                            $liquidated_transactions_dic[$liquidated_transaction->user_id] = array();
                        }
                        $quantity = (isset($liquidated_transaction->trans_quantity)) ? $liquidated_transaction->trans_quantity : 1;
                        $liquidated_transactions_dic[$liquidated_transaction->user_id][$liquidated_transaction->stdmod_id] = $liquidated_transaction->trans_amount * $quantity;
                    }
                    /* usado para contar las transacciones del periodo actual que no sean pendientes
                    y poder identificar si en el periodo actual hay alguna transaccion que merezca que las transaccione
                    pendiente sea contabilizada de nuevo */
                    $count_not_pending_transactions = Transaction::select(DB::raw('COUNT(transactions.trans_id) AS count_trans'), 'user_id', 'stdmod_id')
                    ->where('transactions.trans_pendingbalance', false)
                    ->whereBetween('transactions.trans_date', [$report_since, $report_until])
                    ->whereIn('transactions.user_id', array_keys($users_balance))
                    ->groupBy('user_id', 'stdmod_id')
                    ->get();

                    //igualmente en los streams
                    $count_not_pending_streams = Liquidation::select(DB::raw('COUNT(liquidations.liq_id) AS count_modstr'), 'sm.user_id_model', 'sm.stdmod_id')
                    ->join('models_accounts AS ma', 'liquidations.modacc_id', 'ma.modacc_id')
                    ->join('studios_models AS sm', 'ma.stdmod_id', 'sm.stdmod_id')
                    ->whereBetween('liquidations.liq_date', [$report_since, $report_until])
                    ->whereIn('sm.user_id_model', array_keys($users_balance))
                    ->groupBy('sm.user_id_model', 'sm.stdmod_id')
                    ->get();


                    $count_not_pending_dic = array();
                    foreach($count_not_pending_transactions AS $cnpt) {
                        $count_not_pending_dic[$cnpt->user_id][$cnpt->stdmod_id] = $cnpt->count_trans;
                    }
                    foreach($count_not_pending_streams AS $cnps) {
                        if (isset($count_not_pending_dic[$cnps->user_id_model][$cnps->stdmod_id])) {
                            $count_not_pending_dic[$cnps->user_id_model][$cnps->stdmod_id] += $cnps->count_modstr;
                        } else {
                            $count_not_pending_dic[$cnps->user_id_model][$cnps->stdmod_id] = $cnps->count_modstr;
                        }
                    }

                    $transactions_insert = array();
                    foreach ($users_balance as $key => $stdmods) {
                        foreach($stdmods as $key2 => $user_balance) {
                            if (isset($user_balance)) {
                                $balance = ($user_balance >= 0) ? $user_balance : -$user_balance;
                                $cnptd_actual = (isset($count_not_pending_dic[$key][$key2])) ? $count_not_pending_dic[$key][$key2] : 0;

                                $tpbu = $trans_pendingbalance_unchanged_times[$key][$key2];
                                $tpbut = ($tpbu['balance'] == $balance && $cnptd_actual == 0) ? $tpbu['times'] : 1;
                                $tpbut = ($tpbut == 0) ? 1 : $tpbut;
                                if (!isset($liquidated_transactions_dic[$key][$key2]) && $tpbut < 6 && $user_balance <= 30000 && $user_balance != 0) {
                                    $transactions_insert[] = array(
                                        'transtype_id' => ($user_balance >= 0) ? $transactions_types['INGRESOS'] : $transactions_types['EGRESOS'],
                                        'user_id' => $key,
                                        'prod_id' => NULL,
                                        'trans_date' => $report_until,
                                        'trans_description' => NULL,
                                        'trans_amount' => round($balance),
                                        'trans_quantity' => 1,
                                        'trans_rtefte' => false, //deberia ser true?
                                        'created_at' => now(),
                                        'updated_at' => now(),
                                        'stdmod_id' => $key2,
                                        'trans_pendingbalance' => true,
                                        'trans_pendingbalance_unchanged_times' => $tpbut
                                    );
                                }
                                else if (isset($liquidated_transactions_dic[$key])
                                    && isset($liquidated_transactions_dic[$key][$key2])
                                    && ($liquidated_transactions_dic[$key][$key2] != $user_balance || $user_balance == 0 || $user_balance >= 30000)
                                ) {
                                    $existing_transaction = Transaction::join('transactions_types AS tt', 'tt.transtype_id', 'transactions.transtype_id')
                                    ->where('tt.transtype_behavior', 'SALDO PENDIENTE')
                                    ->where('transactions.user_id', $key)
                                    ->where('transactions.stdmod_id', $key2)
                                    ->where('transactions.trans_pendingbalance', true)
                                    ->whereBetween('transactions.trans_date', [$report_since, $report_until]);
                                    if ($user_balance <= 30000 && $user_balance != 0) {
                                        // $existing_transaction->update(['transactions.trans_amount' => $balance]); // Se comenta para que se pueda modificar el valor MANUALMENTE y no sea reemplazado
                                    }
                                    else {
                                        $existing_transaction->delete();
                                    }
                                }
                            }
                        }
                    }
                    Transaction::insert($transactions_insert);
                }
                //FIN PERIODO ANTERIOR


                // BORRA METAS AUTOMATICAS
                // Delete comisiones automaticas
                DB::select("DELETE FROM models_goals WHERE modgoal_auto = true AND modgoal_date BETWEEN '$report_since' AND '$report_until'");
                DB::select("DELETE FROM studios_goals WHERE stdgoal_auto = true AND stdgoal_date BETWEEN '$report_since' AND '$report_until'");

                //////////////////////
                // ASIGNAR ESTUDIOS //
                //////////////////////
                // Asignar estudio correspondiente a models_streams
                $sql = "UPDATE models_streams ms
                        SET stdmod_id = sm.stdmod_id, std_id = st.std_id
                        FROM models_accounts ma
                        INNER JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
                        INNER JOIN studios st ON st.std_id = sm.std_id
                        WHERE modstr_date BETWEEN '$report_since' AND '$report_until'
                            AND ms.std_id IS NULL
                            AND ma.modacc_id = ms.modacc_id
                ";
                // Log::info($sql);
                DB::select($sql);

                // Asignar estudio correspondiente a liquidations
                $sql = "UPDATE liquidations lq
                        SET stdmod_id = sm.stdmod_id, std_id = st.std_id
                        FROM models_accounts ma
                        INNER JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
                        INNER JOIN studios st ON st.std_id = sm.std_id
                        WHERE liq_date BETWEEN '$report_since' AND '$report_until'
                            AND lq.std_id IS NULL
                            AND ma.modacc_id = lq.modacc_id
                ";
                // Log::info($sql);
                DB::select($sql);

                ////////////////////////
                // METAS PRESENCIALES //
                ////////////////////////
                // reglas quemadas
                $commissionList = [
                    'coin' => 'usd',
                    'defaultGoal' => 400,
                    'defaultCommission' => 50,
                    'cases' => [
                        // 'since' => 400,        // Rango inicial de meta
                        // 'until' => 500,        // Rango final de meta
                        // 'incrementGoal' => 25, // Incremento de meta por cada vez q cumpla la meta
                        // 'reaches' => 1,        // Cantidad de cumplimientos para incrementar la comision
                        // 'commission' => 60,    // Comision si se cumple con la meta
                        [ 'since' => 400, 'until' => 500, 'incrementGoal' => 25, 'reaches' => 1, 'commission' => 60 ],
                        [ 'since' => 500, 'until' => null, 'incrementGoal' => 25, 'reaches' => 2, 'commission' => 60 ],
                    ],
                ];

                // default
                $goalCase = "";
                $commissionCase = "";

                // rules
                foreach ($commissionList['cases'] as $c => $case) {
                    // default
                    $case['until'] = !empty($case['until']) ? $case['until'] : 999999999;
                    $case['until'] = $case['until'] - 1; // le resta 1 para que no cruce con el siguiente

                    // increment
                    if ($commissionList['coin'] == 'usd') {
                        $goalCase.= "
                                WHEN (
                                    SELECT COUNT(*) as n_reaches
                                    FROM models_goals
                                    WHERE modgoal_reach_goal = true AND stdmod_id = sm.stdmod_id AND modgoal_amount = sm.stdmod_goal
                                        AND modgoal_amount BETWEEN ".$case['since']." AND ".$case['until']."
                                    GROUP BY stdmod_id, modgoal_amount
                                ) >= ".$case['reaches']."
                                THEN stdmod_goal + ".$case['incrementGoal'];

                        // Solo debe superar una vez para otorgarle el incremento
                        $commissionCase.= "
                                WHEN mg.modgoal_reach_goal = true AND (
                                    SELECT COUNT(*) as n_reaches
                                    FROM models_goals mg_history
                                    WHERE mg_history.modgoal_reach_goal = true AND stdmod_id = sm.stdmod_id AND modgoal_amount = sm.stdmod_goal
                                        AND modgoal_amount BETWEEN ".$case['since']." AND ".$case['until']."
                                    GROUP BY stdmod_id, modgoal_amount
                                ) >= 1
                                THEN ".$case['commission'];
                    }
                }

                if (!empty($commissionList['cases'][0])) {
                    $goalCase.= "
                                WHEN stdmod_goal IS NOT NULL THEN stdmod_goal
                                ELSE ".($commissionList['defaultGoal']);
                    $commissionCase.= "
                                ELSE ".$commissionList['defaultCommission'];

                // default goal
                } else {
                    $goalCase.= "
                                WHEN stdmod_goal IS NOT NULL THEN stdmod_goal
                                ELSE 400";
                    $commissionCase.= "
                                ELSE 50";
                }

                // Add comisiones automaticas, en PRESENCIAL lo toma en base a la ultima meta
                $sql = "INSERT INTO models_goals (stdmod_id, modgoal_type, modgoal_amount, modgoal_percent, modgoal_auto, modgoal_date, created_at, updated_at)
                        SELECT
                            sm.stdmod_id,
                            stdmod_commission_type,
                            (CASE $goalCase
                            END) as goal,
                            0 as percent,
                            true,
                            '$report_until',
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP
                        FROM studios st
                        INNER JOIN studios_models sm ON sm.std_id = st.std_id
                        INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                        INNER JOIN liquidations lq ON lq.modacc_id = ma.modacc_id
                        WHERE liq_date BETWEEN '$report_since' AND '$report_until'
                            AND stdmod_commission_type = 'PRESENCIAL'
                            AND sm.stdmod_id NOT IN (SELECT stdmod_id FROM models_goals WHERE modgoal_date BETWEEN '$report_since' AND '$report_until')
                        GROUP BY sm.stdmod_id, stdmod_commission_type
                ";
                // Log::info($sql);
                DB::select($sql);

                // Valida si se cumplio la meta
                $sql = "UPDATE models_goals mg
                        SET modgoal_reach_goal = (CASE WHEN sum_earnings > modgoal_amount THEN true ELSE false END)
                        FROM studios_models sm
                        INNER JOIN studios st ON st.std_id = sm.std_id
                        INNER JOIN (
                            SELECT ma.stdmod_id, SUM(liq_earnings_usd) as sum_earnings
                            FROM liquidations lq
                            INNER JOIN models_accounts ma ON ma.modacc_id = lq.modacc_id
                            WHERE liq_date BETWEEN '$report_since' AND '$report_until'
                            GROUP BY ma.stdmod_id
                        ) ms ON ms.stdmod_id = sm.stdmod_id
                        WHERE modgoal_date BETWEEN '$report_since' AND '$report_until'
                            AND sm.stdmod_id = mg.stdmod_id
                            AND stdmod_commission_type = 'PRESENCIAL'
                ";
                // Log::info($sql);
                DB::select($sql);

                // Valida si se cumplio la meta >> incrementa el porcentaje automaticamente
                $sql = "UPDATE models_goals mg
                        SET modgoal_percent = (CASE $commissionCase
                            END)
                        FROM studios_models sm
                        INNER JOIN studios st ON st.std_id = sm.std_id
                        WHERE modgoal_date BETWEEN '$report_since' AND '$report_until'
                            AND sm.stdmod_id = mg.stdmod_id
                            AND stdmod_commission_type = 'PRESENCIAL'
                            AND modgoal_auto = true
                ";
                // Log::info($sql);
                DB::select($sql);

                ////////////////////
                // METAS SATELITE //
                ////////////////////
                // reglas quemadas
                $commissionList = [
                    'coin' => 'usd',
                    'default' => 75,
                    'cases' => [
                        [ 'since' => 0,    'until' => 399,  'commission' => 75 ],
                        [ 'since' => 400,  'until' => 499,  'commission' => 80 ],
                        [ 'since' => 500,  'until' => 599,  'commission' => 82 ],
                        [ 'since' => 600,  'until' => 749,  'commission' => 83 ],
                        [ 'since' => 750,  'until' => 999,  'commission' => 84 ],
                        [ 'since' => 1000, 'until' => null, 'commission' => 85 ],
                    ],
                ];

                // default
                $goalCase = "";
                $commissionCase = "";

                // rules
                foreach ($commissionList['cases'] as $c => $case) {
                    // increment
                    if ($commissionList['coin'] == 'usd') {
                        // meta si no es el ultimo (entre)
                        if (($c + 1) < count($commissionList['cases'])) {
                            $goalCase.= "
                                WHEN SUM(liq_earnings_usd) BETWEEN ".$case['since']." AND ".$case['until']." THEN ".$commissionList['cases'][$c + 1]['since'];

                            $commissionCase.= "
                                WHEN SUM(liq_earnings_usd) BETWEEN ".$case['since']." AND ".$case['until']." THEN ".$case['commission'];

                        // meta si es el ultimo (mayor q)
                        } else {
                            $goalCase.= "
                                WHEN SUM(liq_earnings_usd) > ".$case['since']." THEN ".$case['since'];

                            $commissionCase.= "
                                WHEN SUM(liq_earnings_usd) > ".$case['since']." THEN ".$case['commission'];
                        }
                    }
                }

                if (!empty($commissionList['cases'][0])) {
                    $goalCase.= "
                                WHEN stdmod_goal IS NOT NULL THEN stdmod_goal
                                ELSE ".($commissionList['cases'][0]['until'] + 1);
                    $commissionCase.= "
                                ELSE ".$commissionList['cases'][0]['commission'];

                // default goal
                } else {
                    $goalCase.= "
                                WHEN stdmod_goal IS NOT NULL THEN stdmod_goal
                                ELSE 400";
                    $commissionCase.= "
                                ELSE 75";
                }

                // Add comisiones automaticas
                $sql = "INSERT INTO models_goals (stdmod_id, modgoal_type, modgoal_amount, modgoal_percent, modgoal_auto, modgoal_date, created_at, updated_at)
                        SELECT
                            sm.stdmod_id,
                            stdmod_commission_type,
                            (CASE $goalCase
                            END) as goal,
                            (CASE $commissionCase
                            END) as commission,
                            true,
                            '$report_until',
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP
                        FROM studios st
                        INNER JOIN studios_models sm ON sm.std_id = st.std_id
                        INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                        INNER JOIN liquidations lq ON lq.modacc_id = ma.modacc_id
                        WHERE liq_date BETWEEN '$report_since' AND '$report_until'
                            AND stdmod_commission_type = 'SATELITE'
                            AND sm.stdmod_id NOT IN (SELECT stdmod_id FROM models_goals WHERE modgoal_date BETWEEN '$report_since' AND '$report_until')
                        GROUP BY sm.stdmod_id, stdmod_commission_type
                ";
                // Log::info($sql);
                DB::select($sql);

                //////////////
                // COMISION //
                //////////////
                $sql = "UPDATE studios_models sm
                        SET stdmod_percent = (CASE WHEN modgoal_percent IS NOT NULL THEN modgoal_percent ELSE 50 END),
                            stdmod_goal = (CASE WHEN modgoal_amount IS NOT NULL THEN modgoal_amount ELSE 400 END)
                        FROM models_goals mg
                        WHERE modgoal_date BETWEEN '$report_since' AND '$report_until'
                            AND sm.stdmod_id = mg.stdmod_id
                            AND stdmod_commission_type IN ('PRESENCIAL', 'SATELITE')
                ";
                // Log::info($sql);
                DB::select($sql);


                ////////////////////
                // METAS ESTUDIOS //
                ////////////////////
                // reglas quemadas
                $commissionList = [
                    'coin' => 'usd',
                    'default' => 75,
                    'cases' => [
                        [ 'since' => 0,    'until' => 999,  'commission' => 75 ],
                        [ 'since' => 1000,  'until' => 1999,  'commission' => 80 ],
                        [ 'since' => 2000,  'until' => 3999,  'commission' => 82 ],
                        [ 'since' => 4000,  'until' => 7499,  'commission' => 83 ],
                        [ 'since' => 7500,  'until' => 9999,  'commission' => 84 ],
                        [ 'since' => 10000, 'until' => null, 'commission' => 85 ],
                    ],
                ];

                // default
                $goalCase = "";
                $commissionCase = "";

                // rules
                foreach ($commissionList['cases'] as $c => $case) {
                    // increment
                    if ($commissionList['coin'] == 'usd') {
                        // meta si no es el ultimo (entre)
                        if (($c + 1) < count($commissionList['cases'])) {
                            $goalCase.= "
                                WHEN SUM(liq_earnings_usd) BETWEEN ".$case['since']." AND ".$case['until']." THEN ".$commissionList['cases'][$c + 1]['since'];

                            $commissionCase.= "
                                WHEN SUM(liq_earnings_usd) BETWEEN ".$case['since']." AND ".$case['until']." THEN ".$case['commission'];

                        // meta si es el ultimo (mayor q)
                        } else {
                            $goalCase.= "
                                WHEN SUM(liq_earnings_usd) > ".$case['since']." THEN ".$case['since'];

                            $commissionCase.= "
                                WHEN SUM(liq_earnings_usd) > ".$case['since']." THEN ".$case['commission'];
                        }
                    }
                }

                if (!empty($commissionList['cases'][0])) {
                    $goalCase.= "
                                ELSE ".($commissionList['cases'][0]['until'] + 1);
                    $commissionCase.= "
                                ELSE ".$commissionList['cases'][0]['commission'];

                // default goal
                } else {
                    $goalCase.= "
                                ELSE 4000";
                    $commissionCase.= "
                                ELSE 75";
                }

                // Add comisiones automaticas
                $sql = "INSERT INTO studios_goals (std_id, stdgoal_type, stdgoal_amount, stdgoal_percent, stdgoal_auto, stdgoal_date, created_at, updated_at)
                        SELECT
                            st.std_id,
                            'NIVELES',
                            (CASE $goalCase
                            END) as goal,
                            (CASE $commissionCase
                            END) as commission,
                            true,
                            '$report_until',
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP
                        FROM studios st
                        INNER JOIN studios_models sm ON sm.std_id = st.std_id
                        INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                        INNER JOIN liquidations lq ON lq.modacc_id = ma.modacc_id
                        WHERE liq_date BETWEEN '$report_since' AND '$report_until'
                            AND st.std_id NOT IN (SELECT std_id FROM studios_goals WHERE stdgoal_date BETWEEN '$report_since' AND '$report_until')
                        GROUP BY st.std_id
                        ORDER BY st.std_id
                ";
                // Log::info($sql);
                DB::select($sql);


                /////////////////
                // LIQUIDACION //
                /////////////////
                $exchangeRateController = new ExchangeRateController();

                // fecha del trm es la del fin del periodo +1 dia
                $trm_date = date('Y-m-d', strtotime($query['report_until'] . ' +1 day'));
                // Si la fecha del trm es mayor a hoy
                if (strtotime($trm_date) > strtotime(date('Y-m-d'))) {
                    $trm_date = date('Y-m-d');
                }

                // $trm_usd = 3931.31;
                $trm_usd = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'USD', $to = 'COP', $trm_date); // USD

                // $trm_eur = 4001.31;
                $trm_eur = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'EUR', $to = 'COP', $trm_date); // EUR

                if ($trm_usd <= 0) {
                    $response = array(
                        'code' => 400,
                        'errors' => [],
                        'error' => [
                            'code' => 'INVALID_TRM',
                            'message' => 'La tasa de cambio de USD no es válida ($'.$trm_usd.')',
                        ],
                    );
                    throw new \Exception(json_encode($response));
                }
                if ($trm_eur <= 0) {
                    $response = array(
                        'code' => 400,
                        'errors' => [],
                        'error' => [
                            'code' => 'INVALID_TRM',
                            'message' => 'La tasa de cambio de EUR no es válida ($'.$trm_eur.')',
                        ],
                    );
                    throw new \Exception(json_encode($response));
                }

                // Actualizar TRM y porcentajes en liquidations (USD)
                $sql = "UPDATE liquidations lq
                        SET liq_earnings_trm            = ($trm_usd - COALESCE(std_discountmodel_usd, 160)),
                            liq_earnings_percent        = COALESCE((stdmod_percent / 100), 0.50),
                            liq_earnings_trm_studio     = ($trm_usd - COALESCE(std_discountstudio_usd, 60)),
                            liq_earnings_percent_studio = (
                                CASE
                                    WHEN std_ally_master_pays = true -- valida si la nomina lo paga el estudio master o el estudio aliado
                                        THEN COALESCE((std_percent / 100), 0.90) - COALESCE((stdmod_percent / 100), 0.50)
                                    ELSE COALESCE((std_percent / 100), 0.90)
                                END
                            )
                        FROM models_accounts ma
                        INNER JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
                        INNER JOIN studios st ON st.std_id = sm.std_id
                        WHERE liq_date BETWEEN '$report_since' AND '$report_until'
                            AND liq_earnings_usd IS NOT NULL
                            AND ma.modacc_id = lq.modacc_id
                ";
                // Log::info($sql);
                DB::select($sql);

                // Actualizar TRM y porcentajes en liquidations (EUR)
                $sql = "UPDATE liquidations lq
                        SET liq_earnings_trm            = ($trm_eur - COALESCE(std_discountmodel_eur, 160)),
                            liq_earnings_percent        = COALESCE((stdmod_percent / 100), 0.50),
                            liq_earnings_trm_studio     = ($trm_eur - COALESCE(std_discountstudio_eur, 60)),
                            liq_earnings_percent_studio = (
                                CASE
                                    WHEN std_ally_master_pays = true -- valida si la nomina lo paga el estudio master o el estudio aliado
                                        THEN COALESCE((std_percent / 100), 0.90) - COALESCE((stdmod_percent / 100), 0.50)
                                    ELSE COALESCE((std_percent / 100), 0.90)
                                END
                            )
                        FROM models_accounts ma
                        INNER JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
                        INNER JOIN studios st ON st.std_id = sm.std_id
                        WHERE liq_date BETWEEN '$report_since' AND '$report_until'
                            AND liq_earnings_eur IS NOT NULL
                            AND ma.modacc_id = lq.modacc_id
                ";
                // Log::info($sql);
                DB::select($sql);

                // Validar que la comision no sea inferior a la brindada por la plataforma en liquidations
                DB::select("UPDATE liquidations lq
                            SET liq_earnings_percent_studio = 0.90
                            FROM models_accounts ma
                            INNER JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
                            INNER JOIN studios st ON st.std_id = sm.std_id
                            WHERE liq_date BETWEEN '$report_since' AND '$report_until'
                                AND liq_earnings_percent_studio > 0.90
                                AND modacc_app IN ('CAMSODA', 'CAMSODA ALIADOS')
                                AND ma.modacc_id = lq.modacc_id
                ");

                // Convertir USD/EUR a COP en liquidations
                DB::select("UPDATE liquidations lq
                            SET liq_earnings_cop = (
                                CASE
                                    WHEN liq_earnings_usd IS NOT NULL THEN FLOOR((liq_earnings_usd * liq_earnings_trm) * liq_earnings_percent)
                                    WHEN liq_earnings_eur IS NOT NULL THEN FLOOR((liq_earnings_eur * liq_earnings_trm) * liq_earnings_percent)
                                END),
                                liq_earnings_cop_studio = (
                                CASE
                                    WHEN liq_earnings_usd IS NOT NULL THEN FLOOR((liq_earnings_usd * liq_earnings_trm_studio) * liq_earnings_percent_studio)
                                    WHEN liq_earnings_eur IS NOT NULL THEN FLOOR((liq_earnings_eur * liq_earnings_trm_studio) * liq_earnings_percent_studio)
                                END)
                            FROM models_accounts ma
                            INNER JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
                            INNER JOIN studios st ON st.std_id = sm.std_id
                            WHERE liq_date BETWEEN '$report_since' AND '$report_until'
                                AND ma.modacc_id = lq.modacc_id
                ");

                // Calcular retenciones en la fuente
                DB::select("UPDATE liquidations lq
                            SET liq_rtefte_model = (
                                CASE
                                    WHEN sm.stdmod_rtefte = true THEN CEIL(liq_earnings_cop * 0.04)
                                    ELSE 0
                                END),
                                liq_rtefte_studio = (
                                CASE
                                    WHEN st.std_rtefte = true THEN CEIL(liq_earnings_cop_studio * 0.04)
                                    ELSE 0
                                END)
                            FROM studios_models sm
                            INNER JOIN studios st ON st.std_id = sm.std_id
                            WHERE liq_date BETWEEN '$report_since' AND '$report_until'
                                AND sm.stdmod_id = lq.stdmod_id
                ");
            }

            // where
            $where = '1=1';
            if (!empty($query['report_since'])) {
                $where.= " AND lq.liq_date >= '".$query['report_since']."'";
            }
            if (!empty($query['report_until'])) {
                $where.= " AND lq.liq_date <= '".$query['report_until']."'";
            }
            if (!empty($query['std_ids']) && !in_array('', $query['std_ids'])) {
                $where.= " AND st.std_id IN ('".implode("','", $query['std_ids'])."')";
            } else if ($uAuth->prof_id == Profile::ESTUDIO) {
                $studios = Studio::where('user_id_owner', $uAuth->user_id)->pluck('std_id')->toArray();
                $where.= " AND st.std_id IN ('".implode("','", $studios)."')";

                if (empty($studios)) {
                    $response = array(
                        'code' => 400,
                        'errors' => [],
                        'error' => [
                            'code' => 'EMPTY_PERIOD',
                            'message' => 'No posee estudios asociados',
                        ],
                    );
                    throw new \Exception(json_encode($response));
                }
            }
            if (!empty($query['std_active'])) {
                $where.= " AND st.std_active = ".$query['std_active'];
            }
            if (in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                $where.= " AND us.user_id = '".$uAuth->user_id."'";
            }
            if (!empty($query['report_destiny_banks'])) {
                $where.= " AND us.user_bank_entity IN ('".implode("','", $query['report_destiny_banks'])."')";
            }
            if (!empty($query['report_apps'])) {
                // Agrega control sobre las apps donde se pueden tener multiples cuentas
                foreach ($query['report_apps'] as $app) {
                    if ($app == 'CHATURBATE') {
                        $query['report_apps'][] = 'CHATURBATE(2)';
                    } else if ($app == 'LIVEJASMIN') {
                        $query['report_apps'][] = 'LIVEJASMIN(2)';
                    } else if ($app == 'STRIPCHAT') {
                        $query['report_apps'][] = 'STRIPCHAT(2)';
                    }
                }
                $where.= " AND ma.modacc_app IN ('".implode("','", $query['report_apps'])."')";
            }
            if (!empty($query['report_shifts'])) {
                $where.= " AND ss.stdshift_name IN ('".implode("','", $query['report_shifts'])."')";
            }

            // Filtrar estudios si se consulta con un usuario diferente a estudio
            if (in_array($uAuth->prof_id, [
                Profile::ADMIN,
                Profile::CREADOR_CUENTAS,
                Profile::CONTABILIDAD,
            ])) {
                // En la reunion del 07/05/2025 se decidió que se deben mostrar todos los registros
                // independientemente de si el estudio paga desde la master o no
                // $where.= " AND st.std_ally_master_pays = 'true'";
            }
            if (in_array($uAuth->prof_id, [Profile::JEFE_MONITOR, Profile::MONITOR])) {
                $studio_model_controller = new StudioModelController();
                $studio_models = $studio_model_controller->showStudiosModelByUserId($uAuth->user_id);
                $stdmods_id = [];
                if ($studio_models !== null && !$studio_models->isEmpty()) {
                    $commission_controller = new CommissionController();
                    $stdmods_id = $commission_controller->getCommissionStudioModels($studio_models->toArray());
                }
                if (!empty($stdmods_id)) {
                    $where .= " AND sm.stdmod_id IN (" . implode(',', $stdmods_id) . ")";
                } else {
                    // Sin contratos asignados en el árbol de comisiones, no mostrar resultados
                    $where .= " AND 1=0";
                }
            }

            // orderBy
            $orderBy = '';
            if (!empty($query['orderBy'])) {
                $orderBy = $query['orderBy'];
            }

            // args
            $args = [
                'where' => $where,
                'orderBy' => $orderBy,
            ];

            // liquidate models
            $dataset = $this->liquidate($report_since, $report_until, $args);

            // summary by source
            $summary['bySource'] = $this->getLiquidationBySource($report_since, $report_until, $args);

            // echo "<pre>";
            // print_r($dataset);
            // echo "</pre>";
            // die();

            return response()->json(['status' => 'success', 'data' => $dataset, 'summary' => $summary], 200);
        } catch (Exception $e) {
            Log::info($e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Get execution report.
     *
     * @return response()->json
     */
    public function getLiquidationPdf(Request $request, $id, $type) {
        try {
            // query data
            $query = $request->query();
            $today = date('Y-m-d');
            $uAuth = $request->user();

            // Validations
            if (empty($query['report_since']) || empty($query['report_until'])) {
                $response = array(
                    'code' => 400,
                    'errors' => [],
                    'error' => [
                        'code' => 'EMPTY_PERIOD',
                        'message' => 'Debe seleccionar un periodo',
                    ],
                );
                throw new \Exception(json_encode($response));
            }

            // data
            $model = User::findOrFail($id);
            $studioModel = StudioModel::where('user_id_model', $id)->orderBy('stdmod_id', 'desc')->first();
            $studio = Studio::findOrFail($studioModel->std_id);

            /////////////////
            // LIQUIDACION //
            /////////////////
            $report_since = '';
            $report_until = '';
            if (!empty($query['report_since'])) {
                $report_since = $query['report_since'];
            }
            if (!empty($query['report_until'])) {
                $report_until = $query['report_until'];
            }

            // where
            $where = '1=1';
            if (!empty($query['report_since'])) {
                $where.= " AND lq.liq_date >= '".$query['report_since']."'";
            }
            if (!empty($query['report_until'])) {
                $where.= " AND lq.liq_date <= '".$query['report_until']."'";
            }
            if (!empty($id)) {
                $where .= " AND us.user_id = '" . $id . "'";
            }
            if ($uAuth->prof_id == Profile::ESTUDIO) {
                $studios = Studio::where('user_id_owner', $uAuth->user_id)->pluck('std_id')->toArray();
                $where.= " AND st.std_id IN ('".implode("','", $studios)."')";
                
                if (empty($studios)) {
                    $response = array(
                        'code' => 400,
                        'errors' => [],
                        'error' => [
                            'code' => 'EMPTY_PERIOD',
                            'message' => 'No posee estudios asociados',
                        ],
                    );
                    throw new \Exception(json_encode($response));
                }
            } else if (!empty($query['std_ids']) && !in_array('', $query['std_ids'])) {
                $where.= " AND st.std_id IN ('".implode("','", $query['std_ids'])."')";
            } 

            // args
            $args = [
                'where' => $where,
            ];

            // liquidate models
            $dataset = $this->liquidate($report_since, $report_until, $args);
            $dataset = current($dataset);

            // echo "<pre>";
            // print_r($dataset);
            // echo "</pre>";
            // die();

            /////////
            // PDF //
            /////////
            $data = [
                'studio' => $studio,
                'model' => $model,
                'period_since' => $report_since,
                'period_until' => $report_until,
                'dataset' => $dataset,
            ];

            // echo "<pre>";
            // print_r($data);
            // echo "</pre>";
            // die();

            // Consolida ingresos por empresa
            if ($type == 'byCompany') {
                // Consolidate incomes by modacc_app
                $consolidated = [];

                foreach ($data['dataset']['incomes'] as $item) {
                    $app = $item['modacc_app'];
                    if (!isset($consolidated[$app])) {
                        // Initialize entry
                        $consolidated[$app] = [
                            'modacc_period' => $item['modacc_period'],
                            'modacc_app' => $app,
                            'sum_earnings_value' => 0,
                            'modstr_earnings_trm' => $item['modstr_earnings_trm'],
                            'modstr_earnings_percent' => $item['modstr_earnings_percent'],
                            'sum_earnings_tokens' => 0,
                            'sum_earnings_usd' => 0,
                            'sum_earnings_eur' => 0,
                            'sum_earnings_cop' => 0,
                            'sum_price' => 0,
                            'sum_time' => '00:00:00',
                            'modstr_earnings_tokens_rate' => $item['modstr_earnings_tokens_rate'],
                        ];
                    }

                    // Sum values
                    $consolidated[$app]['sum_earnings_value'] += floatval($item['sum_earnings_value']);
                    $consolidated[$app]['sum_earnings_tokens'] += floatval($item['sum_earnings_tokens']);
                    $consolidated[$app]['sum_earnings_usd'] += floatval($item['sum_earnings_usd']);
                    $consolidated[$app]['sum_earnings_eur'] += floatval($item['sum_earnings_eur']);
                    $consolidated[$app]['sum_earnings_cop'] += floatval($item['sum_earnings_cop']);
                    $consolidated[$app]['sum_price'] += floatval($item['sum_price']);
                    // Sumarizar tiempo
                    // Convert hh:mm:ss to seconds, sum, then back to hh:mm:ss
                    list($h, $m, $s) = array_map('intval', explode(':', $item['sum_time']));
                    $currentSeconds = $h * 3600 + $m * 60 + $s;
                    list($conh, $conm, $cons) = array_map('intval', explode(':', $consolidated[$app]['sum_time']));
                    $totSeconds = $conh * 3600 + $conm * 60 + $cons + $currentSeconds;
                    $ch = floor($totSeconds / 3600);
                    $cm = floor(($totSeconds % 3600) / 60);
                    $cs = $totSeconds % 60;
                    $consolidated[$app]['sum_time'] = sprintf('%02d:%02d:%02d', $ch, $cm, $cs);
                }

                // Replace dataset incomes by consolidated results
                $data['dataset']['incomes'] = array_values($consolidated);
            }

            if ($type == 'byPage') {
                $pdf = \PDF::loadView('pdfs.modelLiquidationByPage', $data);
                return $pdf->stream('Liq. x App '.$model->user_name.' '.$report_since.' al '.$report_until.' por página.pdf');
            } else {
                $pdf = \PDF::loadView('pdfs.modelLiquidation', $data);
                return $pdf->stream('Liq. x App '.$model->user_name.' '.$report_since.' al '.$report_until.'.pdf');
            }
        } catch (Exception $e) {
            Log::info($e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Get execution report.
     *
     * @return response()->json
     */
    public function getCertificationPdf(Request $request, $id)
    {
        try {
            // query data
            $query = $request->query();
            $today = date('Y-m-d');

            // Validations
            if (empty($query['report_since']) || empty($query['report_until'])) {
                $response = array(
                    'code' => 400,
                    'errors' => [],
                    'error' => [
                        'code' => 'EMPTY_PERIOD',
                        'message' => 'Debe seleccionar un periodo',
                    ],
                );
                throw new \Exception(json_encode($response));
            }

            // data
            $model = User::findOrFail($id);
            $studioModel = StudioModel::where('user_id_model', $id)->orderBy('stdmod_id', 'desc')->first();
            $studio = Studio::findOrFail($studioModel->std_id);

            /////////////////
            // LIQUIDACION //
            /////////////////
            $report_since = '';
            $report_until = '';
            if (!empty($query['report_since'])) {
                $report_since = $query['report_since'];
            }
            if (!empty($query['report_until'])) {
                $report_until = $query['report_until'];
            }

            // where
            $where = '1=1';
            if (!empty($query['report_since'])) {
                $where.= " AND lq.liq_date >= '".$query['report_since']."'";
            }
            if (!empty($query['report_until'])) {
                $where.= " AND lq.liq_date <= '".$query['report_until']."'";
            }
            if (!empty($query['std_ids']) && !in_array('', $query['std_ids'])) {
                $where.= " AND st.std_id IN ('".implode("','", $query['std_ids'])."')";
            }
            if (!empty($id)) {
                $where .= " AND us.user_id = '" . $id . "'";
            }

            // orderBy
            $orderBy = '';
            if (!empty($query['orderBy'])) {
                $orderBy = $query['orderBy'];
            }

            // args
            $args = [
                'where' => $where,
                'orderBy' => $orderBy,
            ];

            // liquidate models
            $dataset = $this->liquidate($report_since, $report_until, $args);
            $dataset = current($dataset);

            // echo "<pre>";
            // print_r($dataset);
            // echo "</pre>";
            // die();

            /////////
            // PDF //
            /////////

            // Calcular ingresos del mes anterior para certificaciones
            $monthlyIncome = 0;
            $weeklyIncome = 0;

            // Obtener el primer y último día del mes anterior
            $lastMonthStart = date('Y-m-01', strtotime('first day of last month'));
            $lastMonthEnd = date('Y-m-t', strtotime('last day of last month'));

            // Obtener todas las liquidaciones del mes anterior para este modelo
            if ($studioModel) {
                $liquidations = \App\Models\Liquidation::where('stdmod_id', $studioModel->stdmod_id)
                    ->whereBetween('liq_date', [$lastMonthStart, $lastMonthEnd])
                    ->whereNull('deleted_at')
                    ->get();

                // Sumar todos los ingresos del mes anterior
                $monthlyIncome = $liquidations->sum('liq_earnings_cop');

                // Calcular ingreso semanal (mensual / 4)
                $weeklyIncome = $monthlyIncome > 0 ? $monthlyIncome / 4 : 0;
            }

            $data = [
                'studio' => $studio,
                'model' => $model,
                'period_since' => $report_since,
                'period_until' => $report_until,
                'dataset' => $dataset,
                'monthlyIncome' => $monthlyIncome,
                'weeklyIncome' => $weeklyIncome,
                'studioModel' => $studioModel,
                'signatures' => ['model' => null, 'owner' => null],
            ];

            $pdf = \PDF::loadView('pdfs.modelCertification', $data);
            return $pdf->stream('Certificación ' . $model->user_name . ' ' . $report_since . ' al ' . $report_until . '.pdf');
            // return $pdf->download('CERTIFICADO.pdf');
        } catch (Exception $e) {
            Log::info($e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Get execution report.
     *
     * @return response()->json
     */
    public function getPaymentNotePdf(Request $request, $id)
    {
        try {
            // query data
            $query = $request->query();
            $today = date('Y-m-d');

            // Validations
            if (empty($query['report_since']) || empty($query['report_until'])) {
                $response = array(
                    'code' => 400,
                    'errors' => [],
                    'error' => [
                        'code' => 'EMPTY_PERIOD',
                        'message' => 'Debe seleccionar un periodo',
                    ],
                );
                throw new \Exception(json_encode($response));
            }

            // data
            $model = User::findOrFail($id);
            $studioModel = StudioModel::where('user_id_model', $id)->orderBy('stdmod_id', 'desc')->first();
            $studio = Studio::findOrFail($studioModel->std_id);

            /////////////////
            // LIQUIDACION //
            /////////////////
            $report_since = '';
            $report_until = '';
            if (!empty($query['report_since'])) {
                $report_since = $query['report_since'];
            }
            if (!empty($query['report_until'])) {
                $report_until = $query['report_until'];
            }

            // where
            $where = '1=1';
            if (!empty($query['report_since'])) {
                $where.= " AND lq.liq_date >= '".$query['report_since']."'";
            }
            if (!empty($query['report_until'])) {
                $where.= " AND lq.liq_date <= '".$query['report_until']."'";
            }
            if (!empty($query['std_ids']) && !in_array('', $query['std_ids'])) {
                $where.= " AND st.std_id IN ('".implode("','", $query['std_ids'])."')";
            }
            if (!empty($id)) {
                $where .= " AND us.user_id = '" . $id . "'";
            }

            // args
            $args = [
                'where' => $where,
            ];

            // liquidate models
            $dataset = $this->liquidate($report_since, $report_until, $args);
            $dataset = current($dataset);

            // echo "<pre>";
            // print_r($dataset);
            // echo "</pre>";
            // die();

            /////////
            // PDF //
            /////////
            $data = [
                'studio' => $studio,
                'model' => $model,
                'studioModel' => $studioModel,
                'period_since' => $report_since,
                'period_until' => $report_until,
                'dataset' => $dataset,
            ];

            $pdf = \PDF::loadView('pdfs.modelPaymentNote', $data);
            return $pdf->stream('Cuenta de cobro ' . $model->user_name . ' ' . $report_since . ' al ' . $report_until . '.pdf');
            // return $pdf->download('CERTIFICADO.pdf');
        } catch (Exception $e) {
            Log::info($e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Get execution report plain file.
     *
     * @return response()->json
     */
    public function getLiquidationPaymentPlain(Request $request)
    {
        try {
            // auth
            $uAuth = $request->user();

            // query data
            $query = $request->query();
            $today = date('Y-m-d');

            // Validations
            if (empty($query['report_since']) || empty($query['report_until'])) {
                $response = array(
                    'code' => 400,
                    'errors' => [],
                    'error' => [
                        'code' => 'EMPTY_PERIOD',
                        'message' => 'Debe seleccionar un periodo',
                    ],
                );
                throw new \Exception(json_encode($response));
            }

            /////////////////
            // LIQUIDACION //
            /////////////////
            $report_since = '';
            $report_until = '';
            if (!empty($query['report_since'])) {
                $report_since = $query['report_since'];
            }
            if (!empty($query['report_until'])) {
                $report_until = $query['report_until'];
            }

            // where
            $where = '1=1';
            if (!empty($query['report_since'])) {
                $where.= " AND lq.liq_date >= '".$query['report_since']."'";
            }
            if (!empty($query['report_until'])) {
                $where.= " AND lq.liq_date <= '".$query['report_until']."'";
            }
            if (!empty($query['std_ids']) && !in_array('', $query['std_ids'])) {
                $where.= " AND st.std_id IN ('".implode("','", $query['std_ids'])."')";
            }
            if (in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                $where .= " AND us.user_id = '" . $uAuth->user_id . "'";
            }
            if (!empty($query['report_destiny_banks'])) {
                $where .= " AND us.user_bank_entity IN ('" . implode("','", $query['report_destiny_banks']) . "')";
            }
            if (!empty($query['user_id'])) {
                $where .= " AND us.user_id IN ('" . implode("','", $query['user_id']) . "')";
            }

            // Filtrar estudios si se consulta con un usuario diferente a estudio
            if (in_array($uAuth->prof_id, [
                Profile::ADMIN,
                Profile::CREADOR_CUENTAS,
                Profile::CONTABILIDAD,
            ])) {
                $where .= " AND st.std_ally_master_pays = 'true'";
            }

            // Que no se hayan hecho pagos en el mismo periodo
            $where.= " AND (
                        SELECT COUNT(*) FROM payments
                        WHERE stdmod_id = sm.stdmod_id AND pay_period_since = '$report_since' AND pay_period_until = '$report_until'
                    ) = 0";

            // Que posea banco asociado
            $where.= " AND us.user_bank_entity IS NOT NULL AND us.user_bank_account IS NOT NULL AND us.user_bank_account_type IS NOT NULL ";

            // pagos mayores a 30.000 COP ya q es le monto minimo para pagar por transferencia
            // Se realiza el filtro desde PHP para contemplar tambien la suma de otros ingresos - gastos
            $having = "SUM(liq_earnings_cop) > 30000";

            // orderBy
            $orderBy = 'sum_earnings_cop DESC'; // Ruby indica que los archivos deben ordenarse por el monto
            // if (!empty($query['orderBy'])) {
            //     $orderBy = $query['orderBy'];
            // }

            // args
            $args = [
                'where' => $where,
                'having' => $having,
                'orderBy' => $orderBy,
            ];

            // liquidate models
            $dataset = $this->liquidate($report_since, $report_until, $args);

            // echo "<pre>";
            // print_r($dataset);
            // echo "</pre>";
            // die();

            // Payment
            $payment['bank'] = $query['report_since'];
            $payment['report_since'] = $query['report_since'];
            $payment['report_until'] = $query['report_until'];
            $payment['total'] = 0;
            $payment['nrows'] = 0;
            $payment['detail'] = [];

            // detail
            foreach ($dataset as $data) {
                $payment['total'] += $data['sum_earnings_total'];
                $payment['nrows']++;

                $payment['detail'][] = [
                    'beneficiary_document_type' => $data['user_beneficiary_document_type'],
                    'beneficiary_document' => !empty($data['user_beneficiary_document']) ? $data['user_beneficiary_document'] : $data['user_identification'],
                    'beneficiary_name' => !empty($data['user_beneficiary_name']) ? $data['user_beneficiary_name'] : trim($data['user_name'] . ' ' . $data['user_surname']),
                    'bank_entity' => $data['user_bank_entity'],
                    'bank_account' => $data['user_bank_account'],
                    'bank_account_type' => $data['user_bank_account_type'],
                    'sum_earnings_total' => $data['sum_earnings_total'],
                ];
            }

            // file generation
            $std_id = (Profile::ESTUDIO == $uAuth->prof_id && isset($query['std_ids']) && count($query['std_ids']) == 1 && !in_array('', $query['std_ids'])) ? $query['std_ids'][0] : null;
            if ($std_id != null) {
                $studio = Studio::find($std_id);
                if ($studio->std_ally_master_pays) {
                    $std_id = null;
                }
            }

            $contentType = 'application/txt';
            $paymentController = new PaymentController();
            $paymentFileContent = $paymentController->paymentFileContent($query['bank'], $payment, $std_id);
            $fileContent = $paymentFileContent['fileContent'];
            $fileName = $paymentFileContent['fileName'];

            //////////////////
            // PAYMENT FILE //
            //////////////////
            // create file content
            Storage::put('public/payments/' . $fileName, $fileContent);

            $payfile_description = 'Archivo de pagos ' . date('Y-m-d', strtotime($query['report_until'])) . ' - ' . $query['bank'];

            // create file record
            $paymentFile = PaymentFile::create([
                'payfile_description' => $payfile_description,
                'payfile_filename' => $fileName,
                'payfile_template' => $query['bank'],
                'payfile_total' => $payment['total'],
                'created_by' => $uAuth->user_id,
            ]);

            foreach ($dataset as $data) {
                Payment::create([
                    'payfile_id' => $paymentFile->payfile_id,
                    'stdmod_id' => $data['stdmod_id'],
                    'pay_amount' => $data['sum_earnings_total'],
                    'pay_period_since' => $query['report_since'],
                    'pay_period_until' => $query['report_until'],
                ]);
            }

            // RESPONSE
            header('Content-type: ' . $contentType);
            header('Content-Disposition: attachment;filename="' . $fileName . '"');
            header('Cache-Control: max-age=0');
            header('Pragma: no-cache');
            header('Expires: 0');

            echo $fileContent;
            die();
        } catch (Exception $e) {
            Log::info($e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Get execution report plain file.
     *
     * @return response()->json
     */
    public function getLiquidationPaymentExport(Request $request)
    {
        try {
            // auth
            $uAuth = $request->user();

            // query data
            $query = $request->query();
            $today = date('Y-m-d');

            // Validations
            if (empty($query['report_since']) || empty($query['report_until'])) {
                $response = array(
                    'code' => 400,
                    'errors' => [],
                    'error' => [
                        'code' => 'EMPTY_PERIOD',
                        'message' => 'Debe seleccionar un periodo',
                    ],
                );
                throw new \Exception(json_encode($response));
            }

            /////////////////
            // LIQUIDACION //
            /////////////////
            $report_since = '';
            $report_until = '';
            if (!empty($query['report_since'])) {
                $report_since = $query['report_since'];
            }
            if (!empty($query['report_until'])) {
                $report_until = $query['report_until'];
            }

            // where
            $where = '1=1';
            if (!empty($query['report_since'])) {
                $where.= " AND lq.liq_date >= '".$query['report_since']."'";
            }
            if (!empty($query['report_until'])) {
                $where.= " AND lq.liq_date <= '".$query['report_until']."'";
            }
            if (!empty($query['std_ids']) && !in_array('', $query['std_ids'])) {
                $where.= " AND st.std_id IN ('".implode("','", $query['std_ids'])."')";
            }
            if (in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                $where .= " AND us.user_id = '" . $uAuth->user_id . "'";
            }
            if (!empty($query['report_destiny_banks'])) {
                $where .= " AND us.user_bank_entity IN ('" . implode("','", $query['report_destiny_banks']) . "')";
            }
            if (!empty($query['user_id'])) {
                $where .= " AND us.user_id IN ('" . implode("','", $query['user_id']) . "')";
            }
            // Filtro por estudio si no se especifica y es usuario ESTUDIO
            if (empty($query['std_ids']) && $uAuth->prof_id == Profile::ESTUDIO) {
                $studios = Studio::where('user_id_owner', $uAuth->user_id)->pluck('std_id')->toArray();
                $where .= " AND st.std_id IN ('" . implode("','", $studios) . "')";

                if (empty($studios)) {
                    $response = array(
                        'code' => 400,
                        'errors' => [],
                        'error' => [
                            'code' => 'EMPTY_STUDIOS',
                            'message' => 'No posee estudios asociados',
                        ],
                    );
                    throw new \Exception(json_encode($response));
                }
            }
            if (!empty($query['std_active'])) {
                $where .= " AND st.std_active = " . $query['std_active'];
            }
            if (!empty($query['report_shifts'])) {
                $where .= " AND ss.stdshift_name IN ('" . implode("','", $query['report_shifts']) . "')";
            }
            if (in_array($uAuth->prof_id, [Profile::JEFE_MONITOR, Profile::MONITOR])) {
                $studio_model_controller = new StudioModelController();
                $studio_models = $studio_model_controller->showStudiosModelByUserId($uAuth->user_id);
                $stdmods_id = [];
                if ($studio_models !== null && !$studio_models->isEmpty()) {
                    $commission_controller = new CommissionController();
                    $stdmods_id = $commission_controller->getCommissionStudioModels($studio_models->toArray());
                }
                if (!empty($stdmods_id)) {
                    $where .= " AND sm.stdmod_id IN (" . implode(',', $stdmods_id) . ")";
                } else {
                    // Sin contratos asignados en el árbol de comisiones, no mostrar resultados
                    $where .= " AND 1=0";
                }
            }

            // Filtrar estudios si se consulta con un usuario diferente a estudio
            if (in_array($uAuth->prof_id, [
                Profile::ADMIN,
                Profile::CREADOR_CUENTAS,
                Profile::CONTABILIDAD,
            ])) {
                // En la reunion del 07/05/2025 se decidió que se deben mostrar todos los registros
                // independientemente de si el estudio paga desde la master o no
                // $where .= " AND st.std_ally_master_pays = 'true'";
            }

            // pagos mayores a 30.000 COP ya q es le monto minimo para pagar por transferencia
            $where .= " AND liq_earnings_cop > 0";

            // orderBy
            $orderBy = '';
            if (!empty($query['orderBy'])) {
                $orderBy = $query['orderBy'];
            }

            // args
            $args = [
                'where' => $where,
                'orderBy' => $orderBy,
            ];

            // liquidate models
            $dataset = $this->liquidate($report_since, $report_until, $args);

            // echo "<pre>";
            // print_r($dataset);
            // echo "</pre>";
            // die();

            // totals
            $total = 0;
            $nrows = 0;
            foreach ($dataset as $data) {
                $total += $data['sum_earnings_total'];
                $nrows++;
            }

            $records = $dataset;


            ////////////
            // EXPORT //
            ////////////
            // redirect output to client browser
            $fileName = 'liquidation_export.xlsx';
            header("Content-type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            header('Content-Disposition: attachment;filename="' . $fileName . '"');
            header('Cache-Control: max-age=0');
            header("Pragma: no-cache");
            header("Expires: 0");

            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();


            //////////////////////
            // 1 - LIQ. GENERAL //
            //////////////////////
            // Create a new worksheet
            $newSheet = new \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet($spreadsheet, 'Liq. General');
            // Attach the worksheet as the first worksheet in the Spreadsheet object
            $spreadsheet->addSheet($newSheet);
            // Active the worksheet by name
            $sheet = $spreadsheet->getSheet($spreadsheet->getIndex($spreadsheet->getSheetByName('Liq. General')));


            // $header is an array containing column headers
            $header = [
                array(
                    'MODELO',
                    'ESTUDIO',
                    '(USD)',
                    '(EUR)',
                    '(COP)',
                    'DESCUENTOS',
                    'OTROS ING.',
                    'NETO',
                    'HORAS (40H)',
                    'RTE/FTE',
                    'A PAGAR',
                    'COMENTARIO',
                )
            ];
            $sheet->fromArray($header, null, 'A1');

            // $dataset is an array containing data content
            $dataset = array();
            foreach ($records as $data) {
                // pago realizado
                if (count($data['payments']) > 0) {
                    $commentary = 'Ya se ha realizado pago';

                // valor inferior a 30000
                } else if ($data['sum_earnings_total'] < 30000) {
                    $commentary = 'Pago debe ser superior a $30.000 (COP)';

                // pendiente de pago
                } else {
                    $commentary = 'Pendiente de pago';
                }

                $dataset[] = array(
                    $data['user_name'] . ' ' . $data['user_surname'], // MODELO
                    $data['std_name'], // ESTUDIO
                    $data['sum_earnings_usd'], // (USD)
                    $data['sum_earnings_eur'], // (EUR)
                    $data['sum_earnings_cop'], // (COP)
                    $data['sum_earnings_discounts'], // DESCUENTOS
                    $data['sum_earnings_others'], // OTROS ING.
                    $data['sum_earnings_net'], // NETO
                    $data['sum_earnings_time'], // HORAS (40H)
                    $data['sum_earnings_rtefte'], // RTE/FTE
                    $data['sum_earnings_total'], // A PAGAR
                    $commentary, // COMENTARIO
                );
            }
            $sheet->fromArray($dataset, null, 'A2');

            ////////////
            // FORMAT //
            ////////////
            $highestRow = $sheet->getHighestRow();
            $highestColumn = $sheet->getHighestColumn();

            // titles
            $sheet->getStyle('A1:' . $highestColumn . '1')->applyFromArray([
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
            $sheet->getStyle('A1:' . $highestColumn . '1')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('215867');

            // content
            $sheet->getStyle('A2:' . $highestColumn . $highestRow)->applyFromArray([
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
            // content
            $sheet->getStyle('C2:' . 'H' . $highestRow)->getNumberFormat()->setFormatCode('#,##0.00');
            $sheet->getStyle('J2:' . 'K' . $highestRow)->getNumberFormat()->setFormatCode('#,##0.00');

            /////////////////
            // 2 - STREAMS //
            /////////////////
            // Create a new worksheet
            $newSheet = new \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet($spreadsheet, 'Streams');
            // Attach the worksheet as the first worksheet in the Spreadsheet object
            $spreadsheet->addSheet($newSheet);
            // Active the worksheet by name
            $sheet = $spreadsheet->getSheet($spreadsheet->getIndex($spreadsheet->getSheetByName('Streams')));


            // $header is an array containing column headers
            $header = [
                array(
                    'MODELO',
                    'PERIODO',
                    'PLATAFORMA',
                    'NICK',
                    'TASA',
                    'COMISIÓN',
                    'TOKENS',
                    'TOKENS (%)',
                    'TIEMPO',
                    '(USD)',
                    '(EUR)',
                    'TOTAL',
                )
            ];
            $sheet->fromArray($header, null, 'A1');

            // $dataset is an array containing data content
            $datasetApps = array();
            $dataset = array();
            foreach ($records as $data) {
                foreach ($data['incomes'] as $income) {
                    $dataset[] = array(
                        $data['user_name'] . ' ' . $data['user_surname'], // MODELO
                        $income['modacc_period'], // PERIODO
                        $income['modacc_app'], // PLATAFORMA
                        $income['modacc_username'], // NICK
                        $income['modstr_earnings_trm'], // TASA
                        $income['modstr_earnings_percent'], // COMISIÓN
                        $income['sum_earnings_tokens'], // TOKENS
                        isset($income['modstr_tokens_rate']) ? $income['modstr_tokens_rate'] : '', // TOKENS (%)
                        $income['sum_time'], // TIEMPO
                        $income['sum_earnings_usd'], // (USD)
                        $income['sum_earnings_eur'], // (EUR)
                        $income['sum_earnings_cop'], // TOTAL
                    );

                    // Total por plataform
                    if (!isset($datasetApps[$income['modacc_app']])) {
                        $datasetApps[$income['modacc_app']]['modacc_app'] = $income['modacc_app'];
                        $datasetApps[$income['modacc_app']]['sum_earnings_tokens'] = 0;
                        $datasetApps[$income['modacc_app']]['sum_earnings_usd'] = 0;
                        $datasetApps[$income['modacc_app']]['sum_earnings_eur'] = 0;
                        $datasetApps[$income['modacc_app']]['sum_earnings_cop'] = 0;
                    }
                    // sum
                    $datasetApps[$income['modacc_app']]['sum_earnings_tokens'] += $income['sum_earnings_tokens'];
                    $datasetApps[$income['modacc_app']]['sum_earnings_usd'] += $income['sum_earnings_usd'];
                    $datasetApps[$income['modacc_app']]['sum_earnings_eur'] += $income['sum_earnings_eur'];
                    $datasetApps[$income['modacc_app']]['sum_earnings_cop'] += $income['sum_earnings_cop'];
                }
            }
            $sheet->fromArray($dataset, null, 'A2');

            ////////////
            // FORMAT //
            ////////////
            $highestRow = $sheet->getHighestRow();
            $highestColumn = $sheet->getHighestColumn();

            // titles
            $sheet->getStyle('A1:' . $highestColumn . '1')->applyFromArray([
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
            $sheet->getStyle('A1:' . $highestColumn . '1')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('215867');

            // content
            $sheet->getStyle('A2:' . $highestColumn . $highestRow)->applyFromArray([
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
            // content
            $sheet->getStyle('E2:' . 'G' . $highestRow)->getNumberFormat()->setFormatCode('#,##0.00');
            $sheet->getStyle('J2:' . 'L' . $highestRow)->getNumberFormat()->setFormatCode('#,##0.00');


            //////////////////////////////
            // 3 - STREAMS X PLATAFORMA //
            //////////////////////////////
            // Create a new worksheet
            $newSheet = new \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet($spreadsheet, 'Streams x Plataforma');
            // Attach the worksheet as the first worksheet in the Spreadsheet object
            $spreadsheet->addSheet($newSheet);
            // Active the worksheet by name
            $sheet = $spreadsheet->getSheet($spreadsheet->getIndex($spreadsheet->getSheetByName('Streams x Plataforma')));


            // $header is an array containing column headers
            $header = [
                array(
                    'PLATAFORMA',
                    'TOKENS',
                    '(USD)',
                    '(EUR)',
                    'TOTAL',
                )
            ];
            $sheet->fromArray($header, null, 'A1');

            // $datasetApps is an array containing data content
            $sheet->fromArray($datasetApps, null, 'A2');

            ////////////
            // FORMAT //
            ////////////
            $highestRow = $sheet->getHighestRow();
            $highestColumn = $sheet->getHighestColumn();

            // titles
            $sheet->getStyle('A1:' . $highestColumn . '1')->applyFromArray([
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
            $sheet->getStyle('A1:' . $highestColumn . '1')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('215867');

            // content
            $sheet->getStyle('A2:' . $highestColumn . $highestRow)->applyFromArray([
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

            // content
            $sheet->getStyle('B2:' . 'E' . $highestRow)->getNumberFormat()->setFormatCode('#,##0.00');

            // autosize
            foreach ($sheet->getColumnIterator() as $column) {
                $sheet->getColumnDimension($column->getColumnIndex())->setAutoSize(true);
            }


            ////////////
            // WRITER //
            ////////////
            // remove first sheet
            if ($spreadsheet->getSheetCount() > 1) {
                $spreadsheet->removeSheetByIndex(0);
            }

            // Active the first worksheet
            $spreadsheet->setActiveSheetIndex(0);

            // $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            // $writer->save('php://output');
            $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
            $writer->save('php://output');

            return response('', 200);
        } catch (Exception $e) {
            Log::info($e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Get liquidation summary by source.
     *
     * @return response()->json
     */
    public function getLiquidationBySource($report_since, $report_until, $args = null)
    {
        // Log::debug("Entre a getLiquidationBySource");
        // args
        $where = !empty($args['where']) ? $args['where'] : '' ;
        $orderBy = !empty($args['orderBy']) ? $args['orderBy'] : 'user_name, modacc_app' ;
        $having = !empty($args['having']) ? $args['having'] : 'SUM(liq_earnings_cop) > 0' ;

        // profiles
        $prof_ids_model = implode("','", [Profile::MODELO, Profile::MODELO_SATELITE]);
        $dataset = array();

        //////////////
        // INGRESOS //
        //////////////
        $weeklyApps = [
            // 'BONGACAMS', // no posee webscraping de momento
            'CAM4',
            // 'CAMSODA', // no posee webscraping de momento
            // 'CAMSODA ALIADOS', // no posee webscraping de momento
            'CHATURBATE',
            'CHATURBATE(2)',
            // 'FLIRT4FREE', // opera dia a dia
            'IMLIVE',
            'LIVEJASMIN',
            'LIVEJASMIN(2)',
            // 'ONLYFANS', // no posee webscraping de momento
            // 'MYDIRTYHOBBY', // no posee webscraping de momento
            'MYFREECAMS',
            // 'SKYPRIVATE', // no posee webscraping de momento
            'STREAMATE',
            'STREAMRAY',
            'STRIPCHAT',
            'STRIPCHAT(2)',
            // 'XHAMSTER', // no posee webscraping de momento
            'XLOVECAM',

        ];
        $weeklyApps = implode("','", $weeklyApps);

        // Consulta simplificada usando la tabla liquidations
        // where
        $whereTmp = $where;

        $sql = "SELECT
                    lq.liq_source as modstr_source,
                    ma.modacc_app,
                    SUM(liq_price) as sum_price,
                    SUM(liq_earnings_value) as sum_earnings_value,
                    MIN(liq_earnings_trm) as modstr_earnings_trm,
                    MIN(liq_earnings_percent) as modstr_earnings_percent,
                    SUM(liq_earnings_tokens) as sum_earnings_tokens,
                    MIN(liq_earnings_tokens_rate) as modstr_earnings_tokens_rate,
                    SUM(liq_earnings_usd) as sum_earnings_usd,
                    SUM(liq_earnings_eur) as sum_earnings_eur,
                    SUM(liq_earnings_cop) as sum_earnings_cop,
                    SUM(liq_rtefte_model) as sum_rtefte_model,
                    SUM(liq_rtefte_studio) as sum_rtefte_studio,
                    SUM(liq_time) as sum_time
                FROM users us
                INNER JOIN studios_models sm ON sm.user_id_model = us.user_id
                INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                INNER JOIN liquidations lq ON lq.modacc_id = ma.modacc_id
                LEFT JOIN studios st ON st.std_id = lq.std_id
                LEFT JOIN users us2 ON st.user_id_owner = us2.user_id
                LEFT JOIN studios_shifts ss ON ss.stdshift_id = sm.stdshift_id
                WHERE us.prof_id IN ('$prof_ids_model')
                    AND lq.liq_date BETWEEN '$report_since' AND '$report_until'
                    AND $whereTmp
                GROUP BY lq.liq_source, ma.modacc_app
                HAVING $having
                ORDER BY liq_source, modacc_app";

        // Log::info($sql);
        // echo "<pre>";
        // echo $sql;
        // echo "</pre>";
        // die();


        $records = DB::select($sql);
        foreach ($records as $r => $row) {
            // init
            if (!isset($dataset[$row->modstr_source])) {
                $dataset[$row->modstr_source] = [
                    'sum_earnings_usd' => 0,
                    'sum_earnings_eur' => 0,
                    'sum_earnings_cop' => 0,
                    'sum_earnings_tokens' => 0,
                    'sum_earnings_discounts' => 0,
                    'sum_earnings_others' => 0,
                    'sum_earnings_base_discount_rtefte' => 0, // Descuentos con retención
                    'sum_earnings_base_others_rtefte' => 0, // Otros ingresos con retención
                    'sum_earnings_net' => 0,
                    'sum_earnings_time' => '00:00:00',
                    'sum_earnings_hours' => 0,
                    'sum_earnings_rtefte' => 0,
                    'sum_rtefte_model' => 0,
                    'sum_rtefte_studio' => 0,
                    'sum_earnings_total' => 0,
                    'incomes' => [],
                    'discounts' => [],
                    'others' => [],
                    'payments' => [],
                ];
            }

            $dataset[$row->modstr_source]['modstr_source'] = $row->modstr_source;

            // incomes
            if (!isset($dataset[$row->modstr_source]['incomes'])) {
                $dataset[$row->modstr_source]['incomes'] = [];
            }
            if (!isset($dataset[$row->modstr_source]['incomes'][$row->modacc_app])) {
                $dataset[$row->modstr_source]['incomes'][$row->modacc_app] = [
                    'modacc_period' => $report_since . ' al ' . $report_until,
                    'modacc_app' => $row->modacc_app,
                    'modstr_source' => $row->modstr_source,
                    'sum_price' => 0,
                    'sum_earnings_value' => 0,
                    'modstr_earnings_trm' => 0,
                    'modstr_earnings_percent' => 0,
                    'sum_earnings_tokens' => 0,
                    'modstr_earnings_tokens_rate' => 0,
                    'sum_earnings_usd' => 0,
                    'sum_earnings_eur' => 0,
                    'sum_earnings_cop' => 0,
                    'sum_time' => '00:00:00',
                ];
            }

            // grand total
            $dataset[$row->modstr_source]['sum_earnings_usd'] += $row->sum_earnings_usd;
            $dataset[$row->modstr_source]['sum_earnings_eur'] += $row->sum_earnings_eur;
            $dataset[$row->modstr_source]['sum_earnings_cop'] += $row->sum_earnings_cop;
            $dataset[$row->modstr_source]['sum_earnings_tokens'] += $row->sum_earnings_tokens;
            $dataset[$row->modstr_source]['sum_earnings_time'] = $this->helper->timeToNumber($dataset[$row->modstr_source]['sum_earnings_time']) + $this->helper->timeToNumber($row->sum_time);
            $dataset[$row->modstr_source]['sum_earnings_time'] = $this->helper->numberToTime($dataset[$row->modstr_source]['sum_earnings_time']);
            $dataset[$row->modstr_source]['sum_earnings_hours'] += $this->helper->timeToNumber($row->sum_time);

            // detail
            $dataset[$row->modstr_source]['incomes'][$row->modacc_app]['sum_price'] += $row->sum_price;
            $dataset[$row->modstr_source]['incomes'][$row->modacc_app]['sum_earnings_value'] += $row->sum_earnings_value;
            $dataset[$row->modstr_source]['incomes'][$row->modacc_app]['modstr_earnings_trm'] = $row->modstr_earnings_trm;
            $dataset[$row->modstr_source]['incomes'][$row->modacc_app]['modstr_earnings_percent'] = $row->modstr_earnings_percent;
            $dataset[$row->modstr_source]['incomes'][$row->modacc_app]['sum_earnings_tokens'] += $row->sum_earnings_tokens;
            $dataset[$row->modstr_source]['incomes'][$row->modacc_app]['sum_earnings_tokens_rate'] = $row->modstr_earnings_tokens_rate;
            $dataset[$row->modstr_source]['incomes'][$row->modacc_app]['sum_earnings_usd'] += $row->sum_earnings_usd;
            $dataset[$row->modstr_source]['incomes'][$row->modacc_app]['sum_earnings_eur'] += $row->sum_earnings_eur;
            $dataset[$row->modstr_source]['incomes'][$row->modacc_app]['sum_earnings_cop'] += $row->sum_earnings_cop;
            $dataset[$row->modstr_source]['incomes'][$row->modacc_app]['sum_time'] = $this->helper->timeToNumber($dataset[$row->modstr_source]['incomes'][$row->modacc_app]['sum_time']) + $this->helper->timeToNumber($row->sum_time);
            $dataset[$row->modstr_source]['incomes'][$row->modacc_app]['sum_time'] = $this->helper->numberToTime($dataset[$row->modstr_source]['incomes'][$row->modacc_app]['sum_time']);
        }

        ////////////////
        // ORDER DATA //
        ////////////////
        // array values apps
        $i = 0;
        foreach ($dataset as $m => $model) {
            $dataset[$m]['incomes'] = array_values($dataset[$m]['incomes']);

            // netos y totales
            $dataset[$m]['sum_earnings_net'] = $dataset[$m]['sum_earnings_cop'] - $dataset[$m]['sum_earnings_discounts'] + $dataset[$m]['sum_earnings_others'];
            $dataset[$m]['sum_earnings_rtefte'] = $dataset[$m]['sum_rtefte_model']; // Usa la retención calculada específicamente para la modelo
            $dataset[$m]['sum_earnings_total'] = $dataset[$m]['sum_earnings_net'] - $dataset[$m]['sum_earnings_rtefte'];

            $i++;
        }
        $dataset = array_values($dataset);

        return $dataset;
    }

    /**
     * Genera un PDF resumen de liquidación por plataforma (Resumen Mandantes Paginas).
     *
     * @return \Illuminate\Http\Response
     */
    public function getLiquidationSummaryPdf(Request $request) {
        try {
            // Filtros del request
            $query = $request->query();
            $today = date('Y-m-d');
            $uAuth = $request->user();

            // Validaciones
            if (empty($query['report_since']) || empty($query['report_until'])) {
                $response = array(
                    'code' => 400,
                    'errors' => [],
                    'error' => [
                        'code' => 'EMPTY_PERIOD',
                        'message' => 'Debe seleccionar un periodo',
                    ],
                );
                throw new \Exception(json_encode($response));
            }

            $report_since = $query['report_since'];
            $report_until = $query['report_until'];

            // Construir where igual que en getLiquidation
            $where = '1=1';
            if (!empty($query['report_since'])) {
                $where.= " AND lq.liq_date >= '".$query['report_since']."'";
            }
            if (!empty($query['report_until'])) {
                $where.= " AND lq.liq_date <= '".$query['report_until']."'";
            }
            if (!empty($query['std_active'])) {
                $where.= " AND st.std_active = ".$query['std_active'];
            }
            if (!empty($query['report_destiny_banks'])) {
                $where.= " AND us.user_bank_entity IN ('".implode("','", $query['report_destiny_banks'])."')";
            }
            if (!empty($query['report_apps'])) {
                foreach ($query['report_apps'] as $app) {
                    if ($app == 'CHATURBATE') {
                        $query['report_apps'][] = 'CHATURBATE(2)';
                    } else if ($app == 'LIVEJASMIN') {
                        $query['report_apps'][] = 'LIVEJASMIN(2)';
                    } else if ($app == 'STRIPCHAT') {
                        $query['report_apps'][] = 'STRIPCHAT(2)';
                    }
                }
                $where.= " AND ma.modacc_app IN ('".implode("','", $query['report_apps'])."')";
            }
            if (!empty($query['report_shifts'])) {
                $where.= " AND ss.stdshift_name IN ('".implode("','", $query['report_shifts'])."')";
            }
            if ($uAuth->prof_id == Profile::ESTUDIO) {
                $studios = Studio::where('user_id_owner', $uAuth->user_id)->pluck('std_id')->toArray();
                $where.= " AND st.std_id IN ('".implode("','", $studios)."')";
                
                if (empty($studios)) {
                    $response = array(
                        'code' => 400,
                        'errors' => [],
                        'error' => [
                            'code' => 'EMPTY_PERIOD',
                            'message' => 'No posee estudios asociados',
                        ],
                    );
                    throw new \Exception(json_encode($response));
                }
            } else if (!empty($query['std_ids']) && !in_array('', $query['std_ids'])) {
                $where.= " AND st.std_id IN ('".implode("','", $query['std_ids'])."')";
            } 

            // orderBy
            $orderBy = '';
            if (!empty($query['orderBy'])) {
                $orderBy = $query['orderBy'];
            }

            // args para getLiquidation
            $args = [
                'where' => $where,
                'orderBy' => $orderBy,
            ];

            // Obtener el dataset completo
            $dataset = $this->liquidate($report_since, $report_until, $args);

            // Agrupar por plataforma (modacc_app)
            $grouped = [];
            foreach ($dataset as $model) {
                if (!isset($model['incomes']) || !is_array($model['incomes'])) continue;
                foreach ($model['incomes'] as $income) {
                    $platform = $income['modacc_app'] ?? 'OTROS';
                    $grouped[$platform][] = [
                        'modacc_username' => $income['modacc_username'] ?? '',
                        'mandante' => trim(($model['user_name'] ?? '') . ' ' . ($model['user_surname'] ?? '')),
                        'sum_earnings_tokens' => $income['sum_earnings_tokens'] ?? 0,
                        'sum_earnings_usd' => $income['sum_earnings_usd'] ?? 0,
                        'sum_earnings_eur' => $income['sum_earnings_eur'] ?? 0,
                        'modstr_earnings_percent' => $income['modstr_earnings_percent'] ?? 0,
                        'sum_earnings_cop' => $income['sum_earnings_cop'] ?? 0,
                        'modacc_app' => $platform,
                    ];
                }
            }

            // ordenar por monto desde php ya que la consulta viene por plataforma
            if ($orderBy == 'sum_earnings_usd DESC, sum_earnings_eur DESC') {
                foreach ($grouped as $platform => $data) {
                    usort($grouped[$platform], function($a, $b) {
                        if ($a['sum_earnings_usd'] == $b['sum_earnings_usd']) {
                            return 0;
                        }
                        return ($a['sum_earnings_usd'] > $b['sum_earnings_usd']) ? -1 : 1;
                    });
                }
            }

            // Buscar el Studio principal para la cabecera
            $studio = \App\Models\Studio::where('std_principal', true)->first();

            // Consultar el estado del periodo
            $period = \App\Models\Period::where('period_start_date', $report_since)->where('period_end_date', $report_until)->first();
            $period_state = $period ? $period->period_state : '';

            // Datos para la vista
            $data = [
                'studio' => $studio,
                'period_since' => $report_since,
                'period_until' => $report_until,
                'period_state' => $period_state,
                'summary' => $grouped,
            ];

            // $pdf = \PDF::loadView('pdfs.liquidationSummary', $data);
            $pdf = \PDF::loadView('pdfs.liquidationSummary', $data);
            $pdf->setOptions(['enable_php' => true]);
            return $pdf->stream('ResumenMandantesPaginas_'.$report_since.'_al_'.$report_until.'.pdf');
        } catch (\Exception $e) {
            \Log::info($e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Validate all requirements for a model to access liquidation
     * Returns consolidated status of personal data and signed documents
     *
     * @param int $userId
     * @return array
     */
    private function validateModelRequirements($userId)
    {
        $requirements = [
            'personal_data' => [
                'title' => 'Datos Personales',
                'items' => [],
                'complete' => true,
                'action' => '/myprofile',
                'action_label' => 'Completar perfil'
            ],
            'documents' => [
                'title' => 'Documentos Firmados',
                'items' => [],
                'complete' => true,
                'action' => '/my_documents',
                'action_label' => 'Firmar documentos'
            ]
        ];

        // 1. Validar datos personales
        $user = User::find($userId);

        $requirements['personal_data']['items'][] = [
            'label' => 'Email personal',
            'complete' => !empty($user->user_personal_email),
            'value' => $user->user_personal_email ?? ''
        ];

        $requirements['personal_data']['items'][] = [
            'label' => 'Teléfono',
            'complete' => !empty($user->user_telephone),
            'value' => $user->user_telephone ?? ''
        ];

        // Verificar si todos los datos personales están completos
        $requirements['personal_data']['complete'] = collect($requirements['personal_data']['items'])
            ->every(fn($item) => $item['complete']);

        // 2. Validar documentos firmados
        $studioModel = StudioModel::where('user_id_model', $userId)
            ->whereNull('deleted_at')
            ->orderBy('stdmod_id', 'desc')
            ->first();

        if ($studioModel) {
            $requiredDocs = [
                'contract' => 'Contrato',
                'code_conduct' => 'Código de Conducta',
                'habeas_data' => 'Habeas Data'
            ];

            foreach ($requiredDocs as $docType => $docLabel) {
                $signatureStatus = $studioModel->getSignatureStatus($docType);

                $requirements['documents']['items'][] = [
                    'label' => $docLabel,
                    'complete' => $signatureStatus['fully_signed'] ?? false,
                    'details' => $signatureStatus
                ];
            }

            // Verificar si todos los documentos están firmados
            $requirements['documents']['complete'] = collect($requirements['documents']['items'])
                ->every(fn($item) => $item['complete']);
        } else {
            $requirements['documents']['complete'] = false;
            $requirements['documents']['items'][] = [
                'label' => 'No hay contrato activo',
                'complete' => false
            ];
        }

        // Determinar si todos los requisitos están completos
        $allComplete = $requirements['personal_data']['complete'] &&
                       $requirements['documents']['complete'];

        return [
            'all_complete' => $allComplete,
            'requirements' => $requirements
        ];
    }
}
