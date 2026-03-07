<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Models\Commission;
use App\Http\Controllers\CommissionController;
use App\Http\Controllers\LiquidationModelController;
use App\Models\TransactionType;
use App\Models\Transaction;
use App\Models\TransactionCommission;
use Exception;
use Log;
use App\Library\HelperController;
use App\Http\Controllers\ExchangeRateController;

class PaysheetController extends Controller
{
    private $helper;

    /**
     * Create a new instance.
     *
     * @return void
     */
    public function __construct() {
        $this->helper = new HelperController();
    }

    public function getPaysheet(Request $request)
    {
        try {
            $query = $request->query();
            $std_id = $query['std_id'];
            $period_id = $query['period_id'];

            // Validar que el periodo exista
            $period = DB::table('periods')->where('period_id', $period_id)->first();
            if (!$period) {
                return response()->json([
                    'code' => 404,
                    'error' => [
                        'code' => 'PERIOD_NOT_FOUND',
                        'message' => 'El periodo especificado no existe.'
                    ]
                ], 404);
            }
            $transaction_type_balance = TransactionType::where('transtype_behavior', 'COMISION')
            ->whereNull('deleted_at')
            ->orderBy('transtype_id', 'desc')
            ->limit(1)
            ->first();
            if (!$transaction_type_balance) {
                return response()->json([
                    'code' => 400,
                    'errors' => [],
                    'error' => [
                        'code' => 'TRANSACTIONS_TYPE_NOT_FOUND',
                        'message' => 'No se encontro el numero correcto de tipos de transacciones con comportamiento COMISION',
                    ]
                ], 400);
            }
            if ($period->period_state === 'ABIERTO') {
                DB::beginTransaction();
                // Eliminar transacciones y comisiones previas del periodo actual
                $trans_delete = Transaction::select('transactions.trans_id')
                ->join('transactions_commissions as tc', 'transactions.trans_id', '=', 'tc.trans_id')
                ->where('transactions.period_id', $period_id)
                ->get();
                $trans_ids = $trans_delete->pluck('trans_id')->toArray();
                if (!empty($trans_ids)) {
                    TransactionCommission::whereIn('trans_id', $trans_ids)->delete();
                    Transaction::whereIn('trans_id', $trans_ids)->delete();
                }

                $commission_controller = new CommissionController();
                $stdmods_ids = $commission_controller->getCommissionStudioModelsByStudio($std_id);
                //dd($stdmods_ids);
                $args = [
                    'where' => "sm.stdmod_id IN (" . implode(',', $stdmods_ids[1]) . ")",
                    'orderBy' => '',
                    'models_stream_date' => true
                ];
                $liquidation_controller = new LiquidationModelController();
                $models_streams = $liquidation_controller->liquidate($period->period_start_date, $period->period_end_date, $args);

                $exchangeRateController = new ExchangeRateController();
                $trm_date = date('Y-m-d', strtotime($period->period_end_date . ' +1 day'));
                if (strtotime($trm_date) > strtotime(date('Y-m-d'))) {
                    $trm_date = date('Y-m-d');
                }
                $trm_usd = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'USD', $to = 'COP', $trm_date); // USD
                $trm_eur = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'EUR', $to = 'COP', $trm_date); // EUR
                //dd($models_streams);

                foreach ($stdmods_ids[0] as $stdmod) {// recorrer cada usuario que pertenece al estudio y que esta en el arbol de comisiones
                    $commission_sum = 0;
                    $transaction_comm = [];
                    foreach ($stdmod['stdmod_ids'] as $child) { // recorrer de cada usuario los ids de los contratos de los descendientes
                        if (isset($models_streams[$child])) {
                            foreach($models_streams[$child]['commission_sum'] as $date => $model_stream_date) {//recorrer los resultados de la liquidacion
                                foreach ($stdmod['setup_commission']['items'] as $item) { // recorrer las comisiones items de comision del usuario del arbol
                                    if ($model_stream_date['sum_earnings_eur'] != 0) {
                                        $cop = $model_stream_date['sum_earnings_eur'] * intval($trm_eur);
                                        $model_stream_date['sum_earnings_usd'] = $cop / intval($trm_usd);
                                    }
                                    if ($item->setcommitem_limit <= $model_stream_date['sum_earnings_usd']) {// entrar si el sum earnings alcanza el limite configurado
                                        $percentage = 0;
                                        if ($stdmod['setup_commission']['setcomm_type'] === 'Porcentaje') {
                                            $percentage = $item->setcommitem_value;
                                            $commission = $model_stream_date['sum_earnings_usd'] * $percentage / 100;
                                            $commission = $commission * intval($model_stream_date['modstr_earnings_trm']);
                                        } else if ($stdmod['setup_commission']['setcomm_type'] === 'Pesos colombianos') {
                                            $commission = $item->setcommitem_value;
                                        } else {
                                            $commission = $item->setcommitem_value * intval($model_stream_date['modstr_earnings_trm']);
                                        }
                                        $commission_sum += $commission;
                                        $transaction_comm[] = [
                                            'trans_id' => null,
                                            'stdmod_id' => $models_streams[$child]['stdmod_id'],
                                            'transmodstr_str_value' => $model_stream_date['sum_earnings_cop'],
                                            'transmodstr_comm_value' => $commission,
                                            'transmodstr_type' => $stdmod['setup_commission']['setcomm_type'],
                                            'transmodstr_percentage' => $percentage,
                                            'transmodstr_date' => $date
                                        ];
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if ($commission_sum != 0) {
                        $transaction = Transaction::create([
                            'transtype_id' => $transaction_type_balance->transtype_id,
                            'period_id' => $period->period_id,
                            'user_id' => $stdmod['user_id'],
                            'stdmod_id' => $stdmod['stdmod_id'],
                            'trans_amount' => $commission_sum,
                            'trans_date' => $period->period_end_date,
                            'trans_description' => 'Comisión generada en nomina del periodo ' . $period->period_start_date . ' - ' . $period->period_end_date,
                            'trans_quantity' => 1,
                            'trans_rtefte' => false,
                        ]);
                        foreach ($transaction_comm as &$comm) {
                            $comm['trans_id'] = $transaction->trans_id;
                        }
                        unset($comm);
                        TransactionCommission::insert($transaction_comm);
                    }
                }
                DB::commit();
            }
            $transactions = Transaction::select(
                'ts.transmodstr_str_value',
                'ts.transmodstr_comm_value',
                'ts.transmodstr_type',
                'ts.transmodstr_percentage',
                'ts.transmodstr_date',
                DB::raw("uu.user_name || ' ' || uu.user_name2 || ' ' || uu.user_surname || ' ' || uu.user_surname2 AS usuario"),
                DB::raw("um.user_name || ' ' || um.user_name2 || ' ' || um.user_surname || ' ' || um.user_surname2 AS modelo"),
                'smu.stdmod_id',
                'uu.user_id',
                's.std_name',
                's.std_id'
            )
            ->join('transactions_commissions AS ts', 'transactions.trans_id', '=', 'ts.trans_id')
            ->join('studios_models AS smu', 'transactions.stdmod_id', '=', 'smu.stdmod_id')
            ->join('users AS uu', 'smu.user_id_model', '=', 'uu.user_id')
            ->join('studios AS s', 'smu.std_id', '=', 's.std_id')
            ->join('studios_models AS smm', 'ts.stdmod_id', '=', 'smm.stdmod_id')
            ->join('users AS um', 'smm.user_id_model', '=', 'um.user_id')
            ->where('transactions.period_id', $period_id)
            ->orderBy('ts.transmodstr_date', 'desc')
            ->orderBy('um.user_name', 'asc')
            ->get();
            $paysheetData = [];
            foreach($transactions as $transaction) {
                if (isset($paysheetData[$transaction->stdmod_id])) {
                    $paysheetData[$transaction->stdmod_id]['commissions'][] = [
                        'transmodstr_date' => $transaction->transmodstr_date,
                        'transmodstr_str_value' => $transaction->transmodstr_str_value,
                        'transmodstr_comm_value' => $transaction->transmodstr_comm_value,
                        'transmodstr_type' => $transaction->transmodstr_type,
                        'transmodstr_percentage' => $transaction->transmodstr_percentage,
                        'modelo' => $transaction->modelo,
                    ];
                } else {
                    $paysheetData[$transaction->stdmod_id] = [
                        'commissions' => [
                            [
                                'transmodstr_date' => $transaction->transmodstr_date,
                                'transmodstr_str_value' => $transaction->transmodstr_str_value,
                                'transmodstr_comm_value' => $transaction->transmodstr_comm_value,
                                'transmodstr_type' => $transaction->transmodstr_type,
                                'transmodstr_percentage' => $transaction->transmodstr_percentage,
                                'modelo' => $transaction->modelo,
                            ],
                        ],
                        'usuario' => $transaction->usuario,
                        'stdmod_id' => $transaction->stdmod_id,
                        'user_id' => $transaction->user_id,
                        'std_name' => $transaction->std_name,
                        'std_id' => $transaction->std_id
                    ];
                }
            }
            $paysheetData = array_values($paysheetData);

            return response()->json(['data' => $paysheetData], 200);
        } catch (Exception $e) {
            DB::rollBack();
            Log::info($e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Get paysheet PDF.
     *
     * @return response()->json
     */
    public function getPaysheetPdf(Request $request, $id) {
        try {
            // query data
            $query = $request->query();
            $period_id = $query['period_id'];

            // Validar que el periodo exista
            $period = DB::table('periods')->where('period_id', $period_id)->first();
            if (!$period) {
                return response()->json([
                    'code' => 404,
                    'error' => [
                        'code' => 'PERIOD_NOT_FOUND',
                        'message' => 'El periodo especificado no existe.'
                    ]
                ], 404);
            }

            // data
            $user = DB::table('users')->where('user_id', $id)->first();
            if (!$user) {
                return response()->json([
                    'code' => 404,
                    'error' => [
                        'code' => 'USER_NOT_FOUND',
                        'message' => 'El usuario especificado no existe.'
                    ]
                ], 404);
            }

            // Obtener información adicional del usuario (contrato y estudio)
            $user_details = DB::table('users as u')
            ->join('studios_models as sm', 'u.user_id', '=', 'sm.user_id_model')
            ->join('studios as s', 'sm.std_id', '=', 's.std_id')
            ->join('profiles as p', 'u.prof_id', '=', 'p.prof_id')
            ->select(
                'u.*',
                'sm.stdmod_contract_number',
                's.std_name',
                's.std_nit',
                's.std_image',
                'p.prof_name'
            )
            ->where('u.user_id', $id)
            ->first();

            $trans_amount = Transaction::where('transactions.period_id', $period_id)
            ->where('transactions.user_id', $id)
            ->value('trans_amount');


            /////////
            // PDF //
            /////////
            $data = [
                'user' => $user_details ?: $user,
                'period' => $period,
                'trans_amount' => $trans_amount,
                'today' => date('d/m/Y'),
                'formatted_period_start' => date('d/m/Y', strtotime($period->period_start_date)),
                'formatted_period_end' => date('d/m/Y', strtotime($period->period_end_date)),
                'formatted_today' => date('d/m/Y'),
            ];

            $pdf = \PDF::loadView('pdfs.paysheet', $data);
            return $pdf->stream('Recibo de Pago '.$user->user_name.' '.$period->period_start_date.' al '.$period->period_end_date.'.pdf');
        } catch (Exception $e) {
            Log::info($e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }
}
