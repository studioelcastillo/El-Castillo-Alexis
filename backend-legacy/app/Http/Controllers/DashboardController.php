<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Imports\PaymentsFilesImport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Storage;

use App\Models\Profile;
use App\Models\User;
use App\Models\UserAdditionalModel;
use App\Http\Controllers\ExchangeRateController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\StudioModelController;
use App\Http\Controllers\CommissionController;
use App\Models\Petition;
use App\Models\Studio;

use App\Library\LogController;
use App\Library\HelperController;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\IOFactory;

// use Exception;
use DateTime;
use Log;
use ZipArchive;
use Validator;

class DashboardController extends Controller
{
    private $helper;
    private $log;
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->helper = new HelperController();
        $this->log = new LogController();
    }

    /**
     * Create a new profile.
     *
     * @return response()->json
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function showToDatatable(Request $request)
    {
        //
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
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $id)
    {
        //
    }

    /**
     * find dashboard tasks
     *
     * @return response()->json
     */
    public function tasks(Request $request)
    {
        try {
            $res = array();
            $data = $this->helper::generateConditions($request);
            $today = date('Y-m-d');
            $uAuth = $request->user();

            $prof_id = $uAuth->prof_id;
            if ($prof_id == Profile::ADMIN || $prof_id == Profile::ESTUDIO || $prof_id == Profile::GESTOR || $prof_id == Profile::CONTABILIDAD || $prof_id == Profile::CREADOR_CUENTAS) {
                $where_studio = '';
                if (in_array($uAuth->prof_id, [Profile::ESTUDIO])) {
                    $records = DB::select("SELECT std_id FROM studios WHERE user_id_owner = '".$uAuth->user_id."'");
                    if (empty($records)) {
                        $response = array(
                            'code' => 400,
                            'errors' => [],
                            'error' => [
                                'code' => 'EMPTY_PERIOD',
                                'message' => 'No posee estudios asociados',
                            ],
                        );
                        throw new \Exception(json_encode($response));
                    } else {
                        $where_studio = ' AND s.user_id_owner = '.$uAuth->user_id.' ';
                    }
                }
                //////////////////////////////
                // TASK - UPLOAD EXECUTIONS //
                //////////////////////////////
                $thisYear = date('Y').'-01-01';
                $lastMonth = date('m', strtotime(date('Y-m').'-01'.' -1 month'));

                //////////////////////////////////////
                // CUENTAS SIN INFORMACION BANCARIA //
                //////////////////////////////////////
                $records = DB::select("
                    SELECT DISTINCT u.user_id, u.user_name
                    FROM liquidations
                    INNER JOIN models_accounts AS ma ON ma.modacc_id = liquidations.modacc_id
                    INNER JOIN studios_models AS sm ON sm.stdmod_id = ma.stdmod_id
                    INNER JOIN studios AS s ON sm.std_id = s.std_id
                    INNER JOIN users AS u ON u.user_id = sm.user_id_model
                    WHERE liquidations.liq_earnings_value > 0
                    ".$where_studio."
                    AND (
                        (u.user_bank_entity IS NULL OR u.user_bank_entity = '')
                        OR (u.user_bank_account IS NULL OR u.user_bank_account = '')
                        OR (u.user_bank_account_type IS NULL OR u.user_bank_account_type = '')
                        OR (u.user_beneficiary_name IS NULL OR u.user_beneficiary_name = '')
                        OR (u.user_beneficiary_document IS NULL OR u.user_beneficiary_document = '')
                        OR (u.user_beneficiary_document_type IS NULL OR u.user_beneficiary_document_type = '')
                    )
                    LIMIT 50
                ");

                foreach ($records as $row) {
                    $res[] = array(
                        'task_id' => (count($res)+1),
                        'task_key_id' => $row->user_id,
                        'task_type' => 'MISSING_BANK_INFO',
                        'task_icon' => 'supervisor_account',
                        'task_icon_color' => 'blue-8',
                        'task_title' => 'El usuario "'.$row->user_name.' le falta llenar datos bancarios.',
                        'task_description' => 'Debe llenar los datos del banco.',
                    );
                }

                /////////////////////////
                // CUARTOS DISPONIBLES //
                /////////////////////////
                $records = DB::select("
                    SELECT ss.stdshift_capacity, count(sm.stdmod_id) AS occupied, s.std_name, s.std_id, ss.stdshift_name
                    FROM studios_models AS sm
                    INNER JOIN studios_shifts AS ss ON sm.stdshift_id = ss.stdshift_id
                    INNER JOIN studios AS s ON s.std_id = sm.std_id
                    INNER JOIN users AS u ON u.user_id = sm.user_id_model
                    WHERE ss.std_id = sm.std_id
                    AND sm.stdmod_active = TRUE
                    AND u.user_active = TRUE
                    AND s.std_active = TRUE
                    AND sm.deleted_at IS NULL
                    AND s.deleted_at IS NULL
                    AND u.deleted_at IS NULL
                    GROUP BY sm.stdshift_id, ss.stdshift_id, s.std_name, s.std_id
                    LIMIT 50
                ");

                // loop records
                foreach ($records as $row) {
                    $difference = intval($row->stdshift_capacity) - intval($row->occupied);
                    if ($difference != 0) {
                        $res[] = array(
                            'task_id' => (count($res)+1),
                            'task_key_id' => $row->std_id,
                            'task_type' => 'AVAILABLE_ROOM',
                            'task_icon' => 'meeting_room',
                            'task_icon_color' => 'yellow-8',
                            'task_title' => 'El turno "' . $row->stdshift_name . '" del estudio "' . $row->std_name . '"' . (($difference < 0) ? ' ha excedido la cantidad disponible de cuartos con ' . (-$difference) . ' ocupantes' : ' posee ' . $difference . ' cuartos disponibles'),
                            'task_description' => '',
                        );
                    }
                }

                $user_id_owner = null;
                if ($uAuth->prof_id == Profile::ESTUDIO) {
                    $user_id_owner = $uAuth->user_id;
                }
                /////////////////////////
                //     PETICIONES       //
                /////////////////////////
                $in_states = ['EN PROCESO'];
                $petitions_states = DB::table('petitions_states')->select('ptn_id', 'ptnstate_state', DB::raw('ROW_NUMBER() OVER (PARTITION BY ptn_id ORDER BY created_at DESC) AS row_num', 'user_name'));
                $records = Petition::with(['user.additional_models', 'petition_state.user'])
                ->select('petitions.*')
                ->joinSub($petitions_states, 'ps', function ($join) {
                    $join->on('ps.ptn_id', '=', 'petitions.ptn_id')->where('row_num', 1);
                })
                ->leftJoin('users', 'users.user_id', 'petitions.user_id')
                ->leftJoin('studios_models AS sm', 'petitions.stdmod_id', 'sm.stdmod_id')
                ->leftJoin('studios AS s', 'sm.std_id', 's.std_id')
                ->whereIn('ps.ptnstate_state', $in_states)
                ->where('petitions.ptn_type', 'like', 'CREACI_N DE CUENTA')
                ->where(function ($query) use ($user_id_owner) {
                    if (isset($user_id_owner)) {
                        $query->where('s.user_id_owner', $user_id_owner);
                    }
                })
                ->whereNull('users.deleted_at')
                ->where('users.user_active', true)
                ->orderBy('petitions.created_at', 'desc')//
                ->limit(50)
                ->distinct()
                ->get();

                $statesLabels = [
                    'EN PROCESO' => 'ABIERTO',
                    'PENDIENTE' => 'EN PROCESO',
                    'APROBADA' => 'APROBADA',
                    'RECHAZADA' => 'RECHAZADA'
                ];
                foreach ($records as $row) {
                    $state = $row->petition_state[count($row->petition_state) - 1];
                    $res[] = array(
                        'task_id' => (count($res)+1),
                        'task_key_id' => $row->ptn_id,
                        'task_type' => 'PETITIONS',
                        'task_icon' => 'fact_check',
                        'task_icon_color' => ($state->ptnstate_state == 'RECHAZADA') ? 'red' : 'deep-purple',
                        'task_title' =>  $statesLabels[$state->ptnstate_state],
                        'task_description' => 'Peticion de cuenta <b>'.$row->ptn_nick.
                         '</b> para la modelo <b>'.$row->user->user_name. ' '.$row->user->user_surname.'</b> de la pagina <b>'. $row->ptn_page.'</b>',
                    );
                }

                //////////////////////////////
                //   DOCUMENTOS FALTANTES  //
                /////////////////////////////
                $extra_models_by_user = UserAdditionalModel::
                join('users AS u', 'users_additional_models.user_id', 'u.user_id')
                ->where('u.user_model_category', 'PAREJA')
                ->groupBy('users_additional_models.user_id')
                ->pluck(DB::raw('COUNT(users_additional_models.*) AS countusers'), 'users_additional_models.user_id');
                $not_required_documents = array('IMG_OTHER');
                $records = User::select('users.user_id',
                    'users.user_name', 'users.user_surname', 'users.user_name2', 'users.user_surname2',
                    DB::raw('COUNT(d.*) AS documents')
                )
                ->leftJoin('documents AS d',  function($join) use ($not_required_documents) {
                    $join->on('users.user_id', '=', 'd.user_id')
                        ->whereNotIn('d.doc_label', $not_required_documents);
                })
                ->leftJoin('studios_models AS sm', 'users.user_id', 'sm.user_id_model')
                ->leftJoin('studios AS s', 'sm.std_id', 's.std_id')
                ->where(function ($query) {
                    $query->where(function ($query) {
                        $query->where('users.user_model_category', '!=', 'PAREJA')
                        ->whereNull('usraddmod_id');
                    })
                    ->orWhere('users.user_model_category', '=', 'PAREJA');
                })
                ->where(function ($query) use ($user_id_owner) {
                    if (isset($user_id_owner)) {
                        $query->where('s.user_id_owner', $user_id_owner);
                    }
                })
                ->whereIn('users.prof_id', [4, 5])
                ->whereNull('users.deleted_at')
                ->where('users.user_active', true)
                ->groupBy('users.user_id')
                ->limit(50)
                ->get();
                foreach ($records as $row) {
                    $quant_models = (isset($extra_models_by_user[$row->user_id])) ? $extra_models_by_user[$row->user_id] + 1 : 1;
                    if ($row->documents != (5 * $quant_models)) {
                        $res[] = array(
                            'task_id' => (count($res)+1),
                            'task_key_id' => $row->user_id,
                            'task_type' => 'DOCUMENTS_MISSING',
                            'task_icon' => 'description',
                            'task_icon_color' => 'orange',
                            'task_title' =>  'Faltan documentos',
                            'task_description' => $row->user_name.' '.$row->user_name2.' '.$row->user_surname.' '.$row->user_surname2.' le faltan documentos por subir',
                        );
                    }
                }

                //////////////////////////////
                //       NO CONTRATOS       //
                /////////////////////////////
                if ($user_id_owner == NULL) {
                    $records = User::select('users.user_id',
                        'users.user_name', 'users.user_surname', 'users.user_name2', 'users.user_surname2',
                        DB::raw('COUNT(sm.*) AS countcontracts')
                    )
                    ->leftJoin('studios_models AS sm', function($join) {
                        $join->on('users.user_id', 'sm.user_id_model')
                            ->where('sm.stdmod_active', true)
                            ->whereNull('sm.deleted_at');
                    })
                    ->whereIn('users.prof_id', [4, 5])
                    ->whereNull('users.deleted_at')
                    ->where('users.user_active', true)
                    ->groupBy('users.user_id')
                    ->havingRaw('COUNT(sm.*) = ?', [0])
                    ->limit(50)
                    ->get();
                    foreach ($records as $row) {
                        $res[] = array(
                            'task_id' => (count($res)+1),
                            'task_key_id' => $row->user_id,
                            'task_type' => 'CONTRACTS',
                            'task_icon' => 'handshake',
                            'task_icon_color' => 'green',
                            'task_title' =>  'Ningun contrato asociado',
                            'task_description' => $row->user_name.' '.$row->user_name2.' '.$row->user_surname.' '.$row->user_surname2.' no tiene ningun contrato activo asociado',
                        );
                    }
                }
            }

            //////////////////////////////
            //       CUMPLEANIOS       //
            /////////////////////////////
            $prof_id = $uAuth->prof_id;
            $user_id = $uAuth->user_id;
            $happy_birthdays = User::
            select('user_name', 'user_surname', 'user_name2', 'user_surname2', 'users.user_id',
                DB::raw('EXTRACT(MONTH FROM user_birthdate) AS mes'),
                DB::raw('EXTRACT(DAY FROM user_birthdate) AS dia'),
                DB::raw('EXTRACT(MONTH FROM CURRENT_DATE) AS mes_hoy'),
                DB::raw('EXTRACT(DAY FROM CURRENT_DATE) AS dia_hoy')
            )
            ->leftJoin('studios_models AS sm', 'users.user_id', 'sm.user_id_model')
            ->leftJoin('studios AS s', 'sm.std_id', 's.std_id')
            ->leftJoin('studios AS s2', 's2.user_id_owner', 'users.user_id')
            ->whereRaw('EXTRACT(MONTH FROM user_birthdate) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(DAY FROM user_birthdate) BETWEEN EXTRACT(DAY FROM CURRENT_DATE) AND EXTRACT(DAY FROM CURRENT_DATE) + 30')
            ->whereNull('users.deleted_at')
            ->where('users.user_active', true)
            ->where(function ($query) use ($prof_id, $user_id) {
                if (isset($prof_id) && ($prof_id == Profile::ADMIN || $prof_id == Profile::CONTABILIDAD || $prof_id == Profile::CREADOR_CUENTAS)) {
                    $query->where('s.std_principal', true)
                    ->orWhere('s2.std_ally', true);
                } else if (isset($prof_id) && $prof_id == Profile::ESTUDIO) {
                    $query->where('s.user_id_owner', $user_id);
                } else {
                    $query->whereIn('s.std_id', function ($query) use ($user_id) {
                        $query->select('ss.std_id')
                        ->from('studios AS ss')
                        ->join('studios_models AS sms', 'sms.std_id', 'ss.std_id')
                        ->where('sms.user_id_model', $user_id)
                        ->where('sms.stdmod_active', true);
                    });
                }
            })
            ->orderByRaw('EXTRACT(MONTH FROM user_birthdate) ASC, EXTRACT(DAY FROM user_birthdate) ASC')
            ->get();

            foreach ($happy_birthdays as $row) {
                $res[] = array(
                    'task_id' => (count($res)+1),
                    'task_key_id' => $row->user_id,
                    'task_type' => 'BIRTHDAYS',
                    'task_icon' => 'cake',
                    'task_icon_color' => 'pink',
                    'task_title' =>  'Feliz cumpleaños',
                    'task_description' => (($row->dia == $row->dia_hoy && $row->mes == $row->mes_hoy) ? 'Hoy' : 'El '.$row->dia.'/'.$row->mes).' es el cumpleaños '.$row->user_name.' '.$row->user_name2.' '.$row->user_surname.' '.$row->user_surname2,
                );
            }
            // echo "<pre>";
            // print_r($res);
            // echo "</pre>";
            // die();
            return response()->json(['status' => 'success', 'data' => $res], 200);
        } catch (Exception $e) {
            Log::info($e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * find dashboard indicators
     *
     * @return response()->json
     */
    public function indicators(Request $request)
    {
        try {
            // auth
            $uAuth = $request->user();
            if ($request->filled('user_id') && $request->input('user_id') != 'undefined') {
                $uAuth = User::find($request->input('user_id'));
            }
            $lastMonth = date('m', strtotime(date('Y-m').'-01'.' -1 month'));
            $lastMonthLabel = date('Y-m', strtotime(date('Y-m').'-01'.' -1 month'));
            $res = [];
            $data = $this->helper::generateConditions($request);
            $today = date('Y-m-d');

            $query = $request->query();
            if (empty($query['report_until'])) {
                $query['report_until'] = date('Y-m-d');
            }

            $where = "1=1";
            $std_ids = array();
            // profile = studio
            if (in_array($uAuth->prof_id, [Profile::ESTUDIO])) {
                $records = DB::select("SELECT std_id FROM studios WHERE user_id_owner = '".$uAuth->user_id."'");
                foreach ($records as $row) {
                    $std_ids[] = $row->std_id;
                }
                if (empty($std_ids)) {
                    $response = array(
                        'code' => 400,
                        'errors' => [],
                        'error' => [
                            'code' => 'EMPTY_PERIOD',
                            'message' => 'No posee estudios asociados',
                        ],
                    );
                    throw new \Exception(json_encode($response));
                } else {
                    $std_ids_imploded = implode(',', $std_ids);
                    $where.= " AND st.std_id IN ($std_ids_imploded)";
                }
            }
            // profile = model
            if (in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                $where.= " AND us.user_id = '".$uAuth->user_id."'";
            }
            if (!empty($query['std_id'])) {
                $where.= " AND st.std_id = '".$query['std_id']."'";
            }

            // report_since and report_until
            $report_since = '';
            $report_until = '';
            if (!empty($query['report_since'])) {
                $report_since = $query['report_since'];
            }
            if (!empty($query['report_until'])) {
                $report_until = $query['report_until'];
            }

            $where .= " AND report_period BETWEEN '$report_since' AND '$report_until'";

            // Determinar si el período está ABIERTO o CERRADO
            $period = DB::table('periods')
                ->where('period_start_date', '<=', $report_until)
                ->where('period_end_date', '>=', $report_since)
                ->first();

            $useLiquidations = false;
            $streamTable = 'models_streams';
            $streamAlias = 'ms';
            $streamDateCol = 'modstr_date';
            $streamPrefix = 'modstr_';

            if ($period && $period->period_state === 'CERRADO') {
                $useLiquidations = true;
                $streamTable = 'liquidations';
                $streamAlias = 'lq';
                $streamDateCol = 'liq_date';
                $streamPrefix = 'liq_';
            }

            if (in_array($uAuth->prof_id, [Profile::JEFE_MONITOR, Profile::MONITOR])) {
                $studio_model_controller = new StudioModelController();
                $monitor_id = (isset($query['monitor_id'])) ? $query['monitor_id'] : $uAuth->user_id;
                $studio_models = $studio_model_controller->showStudiosModelByUserId($monitor_id);
                $stdmods_id = [];
                if (!empty($studio_models)) {
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
            ////////////////
            // CUMPLEAÑOS //
            ////////////////
            $whereTmp = $where;
            $whereTmp = preg_replace("/ AND report_period BETWEEN '.*?' AND '.*?'/", '', $whereTmp);
            // $indicators = DB::select("
            //     SELECT
            //         user_id,
            //         user_name,
            //         user_surname,
            //         user_birthdate,
            //         CASE
            //             -- Validar si el día y el mes corresponden al 29 de febrero en un año no bisiesto
            //             WHEN CAST(EXTRACT(MONTH FROM user_birthdate) AS integer) = 2
            //                  AND CAST(EXTRACT(DAY FROM user_birthdate) AS integer) = 29
            //                  AND NOT ((CAST(EXTRACT(YEAR FROM CURRENT_DATE) AS integer) % 4 = 0
            //                            AND CAST(EXTRACT(YEAR FROM CURRENT_DATE) AS integer) % 100 != 0)
            //                           OR CAST(EXTRACT(YEAR FROM CURRENT_DATE) AS integer) % 400 = 0)
            //             THEN make_date(
            //                     CAST(EXTRACT(YEAR FROM CURRENT_DATE) AS integer),
            //                     2,
            //                     28 -- Ajustar al 28 de febrero si el año no es bisiesto
            //                  )
            //             ELSE make_date(
            //                     CAST(EXTRACT(YEAR FROM CURRENT_DATE) AS integer),
            //                     CAST(EXTRACT(MONTH FROM user_birthdate) AS integer),
            //                     CAST(EXTRACT(DAY FROM user_birthdate) AS integer)
            //                  )
            //         END AS next_birthdate
            //     FROM users us
            //     LEFT JOIN studios_models sm ON sm.user_id_model = us.user_id
            //     LEFT JOIN studios st ON st.std_id = sm.std_id
            //     WHERE prof_id IN ('$prof_ids_model')
            //         AND user_active = true
            //         AND CASE
            //             WHEN CAST(EXTRACT(MONTH FROM user_birthdate) AS integer) = 2
            //                 AND CAST(EXTRACT(DAY FROM user_birthdate) AS integer) = 29
            //                 AND NOT ((CAST(EXTRACT(YEAR FROM CURRENT_DATE) AS integer) % 4 = 0
            //                         AND CAST(EXTRACT(YEAR FROM CURRENT_DATE) AS integer) % 100 != 0)
            //                         OR CAST(EXTRACT(YEAR FROM CURRENT_DATE) AS integer) % 400 = 0)
            //             THEN make_date(
            //                     CAST(EXTRACT(YEAR FROM CURRENT_DATE) AS integer),
            //                     2,
            //                     28
            //                 )
            //             ELSE make_date(
            //                     CAST(EXTRACT(YEAR FROM CURRENT_DATE) AS integer),
            //                     CAST(EXTRACT(MONTH FROM user_birthdate) AS integer),
            //                     CAST(EXTRACT(DAY FROM user_birthdate) AS integer)
            //                 )
            //         END > CURRENT_DATE
            //         AND $whereTmp
            //     ORDER BY next_birthdate
            //     LIMIT 3
            // ");
            if (!empty($query['std_id'])) {
                $std_ids = array($query['std_id']);
            }
            $prof_id = $uAuth->prof_id;
            $user_id = $uAuth->user_id;
            $indicators = User::
            select('user_name', 'user_surname', 'user_name2', 'user_surname2', 'users.user_id',
                DB::raw('EXTRACT(MONTH FROM user_birthdate) AS mes'),
                DB::raw('EXTRACT(DAY FROM user_birthdate) AS dia'),
                DB::raw('EXTRACT(MONTH FROM CURRENT_DATE) AS mes_hoy'),
                DB::raw('EXTRACT(DAY FROM CURRENT_DATE) AS dia_hoy'),
                DB::raw('EXTRACT(YEAR FROM CURRENT_DATE) AS anio'),
            )
            ->leftJoin('studios_models AS sm', 'users.user_id', 'sm.user_id_model')
            ->leftJoin('studios AS s', 'sm.std_id', 's.std_id')
            ->leftJoin('studios AS s2', 's2.user_id_owner', 'users.user_id')
            ->whereRaw('EXTRACT(MONTH FROM user_birthdate) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(DAY FROM user_birthdate) BETWEEN EXTRACT(DAY FROM CURRENT_DATE) AND EXTRACT(DAY FROM CURRENT_DATE) + 30')
            ->whereNull('users.deleted_at')
            ->where('users.user_active', true)
            ->where(function ($query) use ($prof_id, $user_id, $std_ids) {
                if (isset($prof_id) && ($prof_id == Profile::ADMIN || $prof_id == Profile::CONTABILIDAD || $prof_id == Profile::CREADOR_CUENTAS)) {
                    if (isset($std_ids) && sizeof($std_ids) > 0) {
                        $query->whereIn('s.std_id', $std_ids);
                    } else {
                        $query->where('s.std_principal', true)->orWhere('s2.std_ally', true);
                    }
                } else if (isset($prof_id) && $prof_id == Profile::ESTUDIO) {
                    $query->where('s.user_id_owner', $user_id);
                } else {
                    $query->whereIn('s.std_id', function ($query) use ($user_id) {
                        $query->select('ss.std_id')
                        ->from('studios AS ss')
                        ->join('studios_models AS sms', 'sms.std_id', 'ss.std_id')
                        ->where('sms.user_id_model', $user_id)
                        ->where('sms.stdmod_active', true);
                    });
                }
            })
            ->orderByRaw('EXTRACT(MONTH FROM user_birthdate) ASC, EXTRACT(DAY FROM user_birthdate) ASC')
            ->limit(3)
            ->get();
            $res['next_happy_birthdays'] = [];
            foreach ($indicators as $key => $row) {
                $birthdate = $row->anio.'-'.$row->mes.'-'.$row->dia;
                // que no haya pasado el cumpleaños
                if (strtotime($birthdate) >= strtotime(date('Y-m-d'))) {
                    $res['next_happy_birthdays'][] = [
                        'user_id' => $row->user_id,
                        'user_name' => $row->user_name,
                        'user_surname' => $row->user_surname,
                        'user_birthdate' => $birthdate,
                    ];
                }
            }
            ksort($res['next_happy_birthdays']);
            $res['next_happy_birthdays'] = array_values($res['next_happy_birthdays']);
            // if usado para que no traiga informacion adicional
            if ($uAuth->prof_id !== Profile::CREADOR_CUENTAS) {
                /////////////////////
                // INDICADORES XYZ //
                /////////////////////
                $whereTmp = $where;
                $whereTmp = preg_replace("/ AND report_period BETWEEN '.*?' AND '.*?'/", '', $whereTmp);
                $res['sum_studios'] = 0;

                // profile != model
                if (!in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                    if ($useLiquidations) {
                        // Periodo CERRADO - usar liquidations directamente
                        $indicators = Studio::selectRaw('COUNT(DISTINCT studios.std_id) AS sum_studios')
                        ->join('studios_models AS sm', 'sm.std_id', 'studios.std_id')
                        ->join('models_accounts AS ma', 'ma.stdmod_id', 'sm.stdmod_id')
                        ->join('liquidations AS lq', 'ma.modacc_id', 'lq.modacc_id')
                        ->whereBetween('lq.liq_date', [$report_since, $report_until])
                        ->where('studios.std_active', true)
                        ->where('sm.stdmod_active', true)
                        ->where('ma.modacc_active', true)
                        ->where(function ($query) use ($std_ids) {
                            if (isset($std_ids) && sizeof($std_ids) > 0) {
                                $query->whereIn('studios.std_id', $std_ids);
                            }
                        })
                        ->first();
                    } else {
                        // Periodo ABIERTO - usar models_streams con MAX(modstr_id)
                        $indicators = DB::selectOne("
                            SELECT COUNT(DISTINCT studios.std_id) AS sum_studios
                            FROM studios
                            INNER JOIN studios_models sm ON sm.std_id = studios.std_id
                            INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                            INNER JOIN (
                                SELECT modstr_date, modacc_id, MAX(modstr_id) as modstr_id
                                FROM models_streams
                                WHERE modstr_date BETWEEN '$report_since' AND '$report_until'
                                GROUP BY modstr_date, modacc_id
                            ) last_ms ON last_ms.modacc_id = ma.modacc_id
                            INNER JOIN models_streams ms ON ms.modstr_id = last_ms.modstr_id
                            WHERE studios.std_active = true
                            AND sm.stdmod_active = true
                            AND ma.modacc_active = true
                            ".(!empty($std_ids) && sizeof($std_ids) > 0 ? "AND studios.std_id IN (".implode(',', $std_ids).")" : "")."
                        ");
                    }

                    // loop indicators
                    if (isset($indicators)) {
                        $res['sum_studios'] = $indicators->sum_studios;
                    }
                }

                if ($useLiquidations) {
                    // Periodo CERRADO - usar liquidations directamente
                    $indicators = User::selectRaw('COUNT(DISTINCT users.user_id) AS sum_studio_models')
                    ->join('studios_models AS sm', 'sm.user_id_model', 'users.user_id')
                    ->join('models_accounts AS ma', 'ma.stdmod_id', 'sm.stdmod_id')
                    ->join('liquidations AS lq', 'ma.modacc_id', 'lq.modacc_id')
                    ->whereIn('users.prof_id', [Profile::MODELO, Profile::MODELO_SATELITE])
                    ->whereBetween('lq.liq_date', [$report_since, $report_until])
                    ->where('users.user_active', true)
                    ->where('sm.stdmod_active', true)
                    ->where('ma.modacc_active', true)
                    ->where(function ($query) use ($std_ids) {
                        if (isset($std_ids) && sizeof($std_ids) > 0) {
                            $query->whereIn('sm.std_id', $std_ids);
                        }
                    })
                    ->first();
                } else {
                    // Periodo ABIERTO - usar models_streams con MAX(modstr_id)
                    $indicators = DB::selectOne("
                        SELECT COUNT(DISTINCT users.user_id) AS sum_studio_models
                        FROM users
                        INNER JOIN studios_models sm ON sm.user_id_model = users.user_id
                        INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                        INNER JOIN (
                            SELECT modstr_date, modacc_id, MAX(modstr_id) as modstr_id
                            FROM models_streams
                            WHERE modstr_date BETWEEN '$report_since' AND '$report_until'
                            GROUP BY modstr_date, modacc_id
                        ) last_ms ON last_ms.modacc_id = ma.modacc_id
                        INNER JOIN models_streams ms ON ms.modstr_id = last_ms.modstr_id
                        WHERE users.prof_id IN (".implode(',', [Profile::MODELO, Profile::MODELO_SATELITE]).")
                        AND users.user_active = true
                        AND sm.stdmod_active = true
                        AND ma.modacc_active = true
                        ".(!empty($std_ids) && sizeof($std_ids) > 0 ? "AND sm.std_id IN (".implode(',', $std_ids).")" : "")."
                    ");
                }

                // loop indicators
                $res['sum_studio_models'] = 0;
                if (isset($indicators)) {
                    $res['sum_studio_models'] = $indicators->sum_studio_models;
                }

                /////////////////////////
                // CUARTOS DISPONIBLES //
                /////////////////////////
                $indicators = DB::select("
                    SELECT COUNT(sr.stdroom_id) as n_room
                    FROM studios_rooms sr
                    INNER JOIN studios st ON st.std_id = sr.std_id
                    LEFT JOIN studios_models sm ON sm.stdroom_id = sr.stdroom_id
                    LEFT JOIN users us ON us.user_id = sm.user_id_model
                    WHERE st.std_active = TRUE AND $whereTmp
                ");

                $res['n_room'] = $indicators[0]->n_room;

                $indicators = DB::select("
                    SELECT
                        SUM(ss.stdshift_capacity) AS sum_shifts,
                        count(sm.stdmod_id) AS room_busy
                    FROM studios_models AS sm
                    INNER JOIN studios_shifts AS ss ON sm.stdshift_id = ss.stdshift_id
                    INNER JOIN studios AS st ON st.std_id = sm.std_id
                    INNER JOIN users AS us ON us.user_id = sm.user_id_model
                    WHERE ss.std_id = sm.std_id
                    AND sm.stdmod_active = TRUE
                    AND us.user_active = TRUE
                    AND st.std_active = TRUE
                    AND sm.deleted_at IS NULL
                    AND st.deleted_at IS NULL
                    AND us.deleted_at IS NULL
                    AND $whereTmp
                ");

                $res['sum_shifts'] = $indicators[0]->sum_shifts;
                $res['room_busy'] = $indicators[0]->room_busy;
                $res['room_availability'] = $indicators[0]->sum_shifts - $indicators[0]->room_busy;

                //////////////////////////
                // GANANCIAS POR STREAM //
                //////////////////////////
                $whereTmp = $where;
                $whereTmp = str_replace('report_period', $streamAlias.'.'.$streamDateCol, $whereTmp);

                // profiles
                $prof_ids_model = implode("','", [Profile::MODELO, Profile::MODELO_SATELITE]);
                $column_percentage = '';
                if ($uAuth->prof_id == Profile::ESTUDIO) {
                    $column_percentage = '* '.$streamPrefix.'earnings_percent_studio';
                }
                else if ($uAuth->prof_id == Profile::MODELO || $uAuth->prof_id == Profile::MODELO_SATELITE) {
                    $column_percentage = '* '.$streamPrefix.'earnings_percent';
                }

                if ($useLiquidations) {
                    // Periodo CERRADO - usar liquidations directamente
                    $indicators = DB::select("
                        SELECT
                            SUM(liq_earnings_usd $column_percentage) as sum_earnings_usd,
                            SUM(liq_earnings_eur $column_percentage) as sum_earnings_eur,
                            SUM(liq_earnings_usd) as sum_earnings_usd2,
                            SUM(liq_earnings_eur) as sum_earnings_eur2,
                            SUM(liq_earnings_cop) as sum_earnings_cop
                        FROM users us
                        INNER JOIN studios_models sm ON sm.user_id_model = us.user_id
                        LEFT JOIN studios st ON st.std_id = sm.std_id
                        INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                        INNER JOIN liquidations lq ON lq.modacc_id = ma.modacc_id
                        WHERE prof_id IN ('$prof_ids_model') AND $whereTmp
                        ORDER BY sum_earnings_cop DESC
                    ");
                } else {
                    // Periodo ABIERTO - usar models_streams con MAX(modstr_id)
                    $whereTmpMs = str_replace('ms.modstr_date', 'modstr_date', $whereTmp);
                    if (in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                        $whereTmpMs = str_replace('us.user_id', 'sm.user_id_model', $whereTmpMs);
                    }
                    $indicators = DB::select("
                        SELECT
                            SUM(modstr_earnings_usd $column_percentage) as sum_earnings_usd,
                            SUM(modstr_earnings_eur $column_percentage) as sum_earnings_eur,
                            SUM(modstr_earnings_usd) as sum_earnings_usd2,
                            SUM(modstr_earnings_eur) as sum_earnings_eur2,
                            SUM(modstr_earnings_cop) as sum_earnings_cop
                        FROM users us
                        INNER JOIN studios_models sm ON sm.user_id_model = us.user_id
                        LEFT JOIN studios st ON st.std_id = sm.std_id
                        INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                        INNER JOIN (
                            SELECT ms.modstr_date, ms.modacc_id, MAX(ms.modstr_id) as modstr_id
                            FROM models_streams ms
                            INNER JOIN models_accounts ma ON ma.modacc_id = ms.modacc_id
                            INNER JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
                            INNER JOIN studios st ON st.std_id = sm.std_id
                            WHERE $whereTmpMs
                            GROUP BY ms.modstr_date, ms.modacc_id
                        ) last_ms ON last_ms.modacc_id = ma.modacc_id
                        INNER JOIN models_streams ms ON ms.modstr_id = last_ms.modstr_id
                        WHERE prof_id IN ('$prof_ids_model')
                        ORDER BY sum_earnings_cop DESC
                    ");
                }

                $res['sum_earnings_usd'] = (float) $indicators[0]->sum_earnings_usd;
                $res['sum_earnings_eur'] = (float) $indicators[0]->sum_earnings_eur;
                // USD/EUR sin porcentaje (raw, como LiquidationModelController)
                if (in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                    $res['sum_earnings_usd2'] = (float) $indicators[0]->sum_earnings_usd;
                    $res['sum_earnings_eur2'] = (float) $indicators[0]->sum_earnings_eur;
                    $res['sum_earnings_usd'] = (float) $indicators[0]->sum_earnings_usd2;
                    $res['sum_earnings_eur'] = (float) $indicators[0]->sum_earnings_eur2;
                }
                // Para modelos: COP de la BD ya tiene comisión aplicada (como LiquidationModelController)
                $sum_earnings_cop_db = (float) $indicators[0]->sum_earnings_cop;


                ////////////////
                // TOP MODELS //
                ////////////////
                $whereTmp = $where;
                $whereTmp = str_replace('report_period', $streamAlias.'.'.$streamDateCol, $whereTmp);

                if ($useLiquidations) {
                    // Periodo CERRADO - usar liquidations directamente
                    $sql = "
                        SELECT
                            us.user_id,
                            us.user_name,
                            us.user_surname,
                            SUM(liq_price) as sum_price,
                            SUM(liq_earnings_value) as sum_earnings_value,
                            MIN(liq_earnings_trm) as modstr_earnings_trm,
                            MIN(liq_earnings_percent) as modstr_earnings_percent,
                            SUM(liq_earnings_tokens) as sum_earnings_tokens,
                            MIN(liq_earnings_tokens_rate) as modstr_earnings_tokens_rate,
                            SUM(liq_earnings_usd) as sum_earnings_usd,
                            SUM(liq_earnings_eur) as sum_earnings_eur,
                            SUM(liq_earnings_cop) as sum_earnings_cop,
                            SUM(liq_time) as sum_time
                        FROM users us
                        INNER JOIN studios_models sm ON sm.user_id_model = us.user_id
                        LEFT JOIN studios st ON st.std_id = sm.std_id
                        INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                        INNER JOIN liquidations lq ON lq.modacc_id = ma.modacc_id
                        WHERE prof_id IN ('$prof_ids_model') AND $whereTmp
                        GROUP BY us.user_id, us.user_name
                        HAVING SUM(liq_earnings_cop) > 0
                        ORDER BY sum_earnings_cop DESC
                        LIMIT 3
                    ";
                } else {
                    // Periodo ABIERTO - usar models_streams con MAX(modstr_id)
                    $whereTmpMs = str_replace('ms.modstr_date', 'modstr_date', $whereTmp);
                    if (in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                        $whereTmpMs = str_replace('us.user_id', 'sm.user_id_model', $whereTmpMs);
                    }
                    
                    $sql = "
                        SELECT
                            us.user_id,
                            us.user_name,
                            us.user_surname,
                            SUM(modstr_price) as sum_price,
                            SUM(modstr_earnings_value) as sum_earnings_value,
                            MIN(modstr_earnings_trm) as modstr_earnings_trm,
                            MIN(modstr_earnings_percent) as modstr_earnings_percent,
                            SUM(modstr_earnings_tokens) as sum_earnings_tokens,
                            MIN(modstr_earnings_tokens_rate) as modstr_earnings_tokens_rate,
                            SUM(modstr_earnings_usd) as sum_earnings_usd,
                            SUM(modstr_earnings_eur) as sum_earnings_eur,
                            SUM(modstr_earnings_cop) as sum_earnings_cop,
                            SUM(modstr_time) as sum_time
                        FROM users us
                        INNER JOIN studios_models sm ON sm.user_id_model = us.user_id
                        LEFT JOIN studios st ON st.std_id = sm.std_id
                        INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                        INNER JOIN (
                            SELECT ms.modstr_date, ms.modacc_id, MAX(ms.modstr_id) as modstr_id
                            FROM models_streams ms
                            INNER JOIN models_accounts ma ON ma.modacc_id = ms.modacc_id
                            INNER JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
                            INNER JOIN studios st ON st.std_id = sm.std_id
                            WHERE $whereTmpMs
                            GROUP BY ms.modstr_date, ms.modacc_id
                        ) last_ms ON last_ms.modacc_id = ma.modacc_id
                        INNER JOIN models_streams ms ON ms.modstr_id = last_ms.modstr_id
                        WHERE prof_id IN ('$prof_ids_model')
                        GROUP BY us.user_id, us.user_name
                        HAVING SUM(modstr_earnings_cop) > 0
                        ORDER BY sum_earnings_cop DESC
                        LIMIT 3
                    ";
                }
                $indicators = DB::select($sql);

                $res['top_models'] = array();
                foreach ($indicators as $key => $row) {
                    $res['top_models'][] = [
                        'user_id' => $row->user_id,
                        'user_name' => $row->user_name,
                        'user_surname' => $row->user_surname,
                    ];
                }

                // fecha del trm es la del fin del periodo +1 dia
                $trm_date = date('Y-m-d', strtotime($query['report_until'] . ' +1 day'));
                // Si la fecha del trm es mayor a hoy
                if (strtotime($trm_date) > strtotime(date('Y-m-d'))) {
                    $trm_date = date('Y-m-d');
                }

                // GET
                $exchangeRateController = new ExchangeRateController();
                $trmUSD = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'USD', $to = 'COP', $trm_date); // USD
                $trmEUR = $exchangeRateController->getExchangeRateFromDolarHoy($from = 'EUR', $to = 'COP', $trm_date); // EUR
                $discountUSD = 0;
                $discountEUR = 0;

                if ($uAuth->prof_id == Profile::ESTUDIO) {
                    $records = DB::select("
                        SELECT
                            std_id,
                            std_discountstudio_usd,
                            std_discountstudio_eur,
                            std_discountmodel_usd,
                            std_discountmodel_eur,
                            std_active
                        FROM studios
                        WHERE std_active = true AND user_id_owner = '".$uAuth->user_id."'");
                    $studio = !empty($records) ? $records[0] : null;
                    if ($studio) {
                        $discountUSD = $studio->std_discountstudio_usd;
                        $discountEUR = $studio->std_discountstudio_eur;
                    } else {
                        $discountUSD = 60; // default
                        $discountEUR = 60; // default
                    }
                }

                // profile = model
                if (in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                    $records = DB::select("
                        SELECT
                            st.std_id,
                            st.std_discountstudio_usd,
                            st.std_discountstudio_eur,
                            st.std_discountmodel_usd,
                            st.std_discountmodel_eur,
                            st.std_active
                        FROM studios st
                        INNER JOIN studios_models stm ON stm.std_id = st.std_id
                        WHERE std_active = true AND stdmod_active = true AND stm.user_id_model = '".$uAuth->user_id."'");
                    $studio = !empty($records) ? $records[0] : null;
                    if ($studio) {
                        $discountUSD = $studio->std_discountmodel_usd;
                        $discountEUR = $studio->std_discountmodel_eur;
                    } else {
                        $discountUSD = 160; // default
                        $discountEUR = 160; // default
                    }
                }

                $trmUSD = $trmUSD - $discountUSD; // descuento por defecto; 60 a aliados y 160 a modelos.
                $trmEUR = $trmEUR - $discountEUR; // descuento por defecto; 60 a aliados y 160 a modelos.

                $res['trm'] = [
                    'date' => $trm_date,
                    'usd' => $trmUSD,
                    'eur' => $trmEUR,
                ];
                // Para modelos usar COP de la BD (como LiquidationModelController), para otros calcular con TRM
                if (in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                    $res['sum_earnings_cop'] = $sum_earnings_cop_db;
                } else {
                    $res['sum_earnings_cop'] = (float) ($res['sum_earnings_usd'] * $trmUSD) + ($res['sum_earnings_eur'] * $trmEUR);
                }

                // Cálculo de sum_earnings_total solo para modelos (MODELO y MODELO_SATELITE)
                if (in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                    // preparar datos de transacciones (descuentos/otros) similar a liquidate()
                    $whereTmp2 = $where;
                    $whereTmp2 = str_replace('report_period', 'trans_date', $whereTmp2);

                    // inicializar totales antes de sumar
                    $res['sum_earnings_discounts'] = 0;
                    $res['sum_earnings_others'] = 0;
                    $res['sum_earnings_base_discount_rtefte'] = 0;
                    $res['sum_earnings_base_others_rtefte'] = 0;

                    $sql = "SELECT DISTINCT
                                tt.transtype_group,
                                mt.trans_id,
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
                            LEFT JOIN studios_shifts ss ON ss.stdshift_id = sm.stdshift_id
                            WHERE us.prof_id IN ('$prof_ids_model')
                                AND st.std_active = true
                                AND $whereTmp2
                    ";

                    $trans = DB::select($sql);
                    foreach ($trans as $t) {
                        $total = $t->trans_total;
                        if ($t->transtype_group == 'EGRESOS') {
                            $res['sum_earnings_discounts'] += $total;
                            if ($t->trans_rtefte) {
                                $res['sum_earnings_base_discount_rtefte'] += $total;
                            }
                        } elseif ($t->transtype_group == 'INGRESOS') {
                            $res['sum_earnings_others'] += $total;
                            if ($t->trans_rtefte) {
                                $res['sum_earnings_base_others_rtefte'] += $total;
                            }
                        }
                    }

                    $res['sum_earnings_net'] = $res['sum_earnings_cop'] - $res['sum_earnings_discounts'] + $res['sum_earnings_others'];
                    // Retención en la fuente (por defecto 4% si no viene especificado)
                    $rtefte = $res['modacc_earnings_rtefte'] ?? 4.00;
                    $res['sum_earnings_rtefte'] = ceil($res['sum_earnings_cop'] * ($rtefte / 100));

                    // Si hay descuentos con retención, se resta el valor de la retención
                    if ($res['sum_earnings_base_discount_rtefte'] > 0) {
                        $res['sum_earnings_rtefte'] -= $res['sum_earnings_base_discount_rtefte'] * ($rtefte / 100);
                    }
                    // Si hay otros ingresos con retención, se suma el valor de la retención
                    if ($res['sum_earnings_base_others_rtefte'] > 0) {
                        $res['sum_earnings_rtefte'] += $res['sum_earnings_base_others_rtefte'] * ($rtefte / 100);
                    }
                    $res['sum_earnings_rtefte'] = ceil($res['sum_earnings_rtefte']);

                    // Total a pagar: neto menos retefuente
                    $res['sum_earnings_total'] = $res['sum_earnings_net'] - $res['sum_earnings_rtefte'];
                    $res['sum_earnings_cop'] = $res['sum_earnings_total'];
                }
            }
            // echo "<pre>";
            // print_r($res);
            // echo "</pre>";
            // die();

            return response()->json(['status' => 'success', 'data' => $res], 200);
        } catch (Exception $e) {
            Log::info($e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    public function charts(Request $request)
    {
        try {
            // auth
            $uAuth = $request->user();
            if ($request->filled('user_id') && $request->input('user_id') != 'undefined') {
                $uAuth = User::find($request->input('user_id'));
            }
            $data = $this->helper::generateConditions($request);
            $query = $request->query();
            $today = date('Y-m-d');

            $where = "1=1";
            // profile = studio
            if (in_array($uAuth->prof_id, [Profile::ESTUDIO])) {
                $records = DB::select("SELECT std_id FROM studios WHERE user_id_owner = '".$uAuth->user_id."'");
                $std_ids = array();
                foreach ($records as $row) {
                    $std_ids[] = $row->std_id;
                }
                if (empty($std_ids)) {
                    $response = array(
                        'code' => 400,
                        'errors' => [],
                        'error' => [
                            'code' => 'EMPTY_PERIOD',
                            'message' => 'No posee estudios asociados',
                        ],
                    );
                    throw new \Exception(json_encode($response));
                } else {
                    $std_ids = implode(',', $std_ids);
                    $where.= " AND st.std_id IN ($std_ids)";
                }
            }
            // profile = model
            if (in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                $where.= " AND us.user_id = '".$uAuth->user_id."'";
            } else if (in_array($uAuth->prof_id, [Profile::JEFE_MONITOR, Profile::MONITOR])) {
                $studio_model_controller = new StudioModelController();
                $monitor_id = (isset($query['monitor_id'])) ? $query['monitor_id'] : $uAuth->user_id;
                $studio_models = $studio_model_controller->showStudiosModelByUserId($monitor_id);
                $stdmods_id = [];
                if (!empty($studio_models)) {
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

            // report_since and report_until
            $report_since = '';
            $report_until = '';
            if (!empty($query['report_since'])) {
                $report_since = $query['report_since'];
            }
            if (!empty($query['report_until'])) {
                $report_until = $query['report_until'];
            }

            $where .= " AND report_period BETWEEN '$report_since' AND '$report_until'";

            // Determinar si el período está ABIERTO o CERRADO
            $period = DB::table('periods')
                ->where('period_start_date', '<=', $report_until)
                ->where('period_end_date', '>=', $report_since)
                ->first();

            $useLiquidations = false;
            $streamTable = 'models_streams';
            $streamAlias = 'ms';
            $streamDateCol = 'modstr_date';
            $streamPrefix = 'modstr_';

            if ($period && $period->period_state === 'CERRADO') {
                $useLiquidations = true;
                $streamTable = 'liquidations';
                $streamAlias = 'lq';
                $streamDateCol = 'liq_date';
                $streamPrefix = 'liq_';
            }

            //////////////////////////
            // GANANCIAS POR STREAM //
            //////////////////////////
            $whereTmp = $where;
            $whereTmp = str_replace('report_period', $streamAlias.'.'.$streamDateCol, $whereTmp);

        if ($useLiquidations) {
            // Periodo CERRADO - usar liquidations directamente
            $sql = "SELECT
                        ma.modacc_app,
                        SUM(liq_earnings_value) AS sum_earnings,
                        lq.liq_date AS modstr_period
                    FROM users us
                    INNER JOIN studios_models sm ON sm.user_id_model = us.user_id
                    INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                    INNER JOIN liquidations lq ON lq.modacc_id = ma.modacc_id
                    LEFT JOIN studios st ON st.std_id = sm.std_id
                    WHERE $whereTmp
                    GROUP BY modacc_app, lq.liq_date
                    HAVING SUM(liq_earnings_value) > 0
                    ORDER BY modstr_period
            ";
        } else {
            // Periodo ABIERTO - usar models_streams con MAX(modstr_id)
            $whereTmpMs = str_replace('ms.modstr_date', 'modstr_date', $whereTmp);
            if (in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                $whereTmpMs = str_replace('us.user_id', 'sm.user_id_model', $whereTmpMs);
            }
            $sql = "SELECT
                        ma.modacc_app,
                        SUM(modstr_earnings_value) AS sum_earnings,
                        ms.modstr_date AS modstr_period
                    FROM users us
                    INNER JOIN studios_models sm ON sm.user_id_model = us.user_id
                    INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                    INNER JOIN (
                        SELECT ms.modstr_date, ms.modacc_id, MAX(ms.modstr_id) as modstr_id
                        FROM models_streams ms
                        INNER JOIN models_accounts ma ON ma.modacc_id = ms.modacc_id
                        INNER JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
                        INNER JOIN studios st ON st.std_id = sm.std_id
                        WHERE $whereTmpMs
                        GROUP BY ms.modstr_date, ms.modacc_id
                    ) last_ms ON last_ms.modacc_id = ma.modacc_id
                    INNER JOIN models_streams ms ON ms.modstr_id = last_ms.modstr_id
                    LEFT JOIN studios st ON st.std_id = sm.std_id
                    GROUP BY modacc_app, ms.modstr_date
                    HAVING SUM(modstr_earnings_value) > 0
                    ORDER BY modstr_period
            ";
        }
        $records = DB::select($sql);
            // series
            $resByGenere = array();
            $dataset = array();
            $periodsList = array();
            foreach ($records as $r => $row) {
                $period_sunday = date('Y-m-d', strtotime('1 sunday '.$row->modstr_period));
                $periodsList[$period_sunday] = $period_sunday;

                // if not exists
                if (!isset($dataset[$row->modacc_app]) || !isset($dataset[$row->modacc_app][$period_sunday])) {
                    $dataset[$row->modacc_app][$period_sunday] = 0;
                }
                $dataset[$row->modacc_app][$period_sunday] += (float) $row->sum_earnings;
            }
            ksort($dataset);

            // echo "<pre>"; print_r($dataset); echo "</pre>";

            // loop dataset
            $resStreamEarnings['series'] = [];
            foreach ($dataset as $app => $periods) {
                $resStreamEarnings['series'][$app]['name'] = $app;
                // loop periods
                foreach ($periodsList as $p) {
                    if (isset($periods[$p])) {
                        $resStreamEarnings['series'][$app]['data'][] = round($periods[$p], 2);
                    } else {
                        $resStreamEarnings['series'][$app]['data'][] = 0;
                    }
                }
            }
            $resStreamEarnings['series'] = array_values($resStreamEarnings['series']);
            // categories
            $resStreamEarnings['xAxis']['categories'] = array_keys($periodsList);


            ///////////////////////////////////
            // CUMPLIMIENTO DE METAS MODELOS //
            ///////////////////////////////////
            $resModelsGoals = array();

            $orderBy = 'sum_goal DESC';
            if (isset($request['orderBy'])) {
                $orderBy = $request['orderBy'];
            }

            // GOAL
            $whereTmp = $where;
            $whereTmp = str_replace('report_period', 'modgoal_date', $whereTmp);
            $records = DB::select("
                SELECT
                    -- model
                    us.user_identification,
                    us.user_name,
                    us.user_surname,
                    us.user_email,
                    sm.stdmod_commission_type,
                    sm.stdmod_percent,
                    -- goals
                    MAX(mg.modgoal_amount) as sum_goal
                FROM users us
                INNER JOIN studios_models sm ON sm.user_id_model = us.user_id
                INNER JOIN models_goals mg ON mg.stdmod_id = sm.stdmod_id
                LEFT JOIN studios st ON st.std_id = sm.std_id
                WHERE $whereTmp
                GROUP BY us.user_identification, us.user_name, us.user_surname, us.user_email, sm.stdmod_commission_type, sm.stdmod_percent
                ORDER BY $orderBy
            ");
            // series
            foreach ($records as $r => $row) {
                $resModelsGoals[$row->user_identification]['user_identification'] = $row->user_identification;
                $resModelsGoals[$row->user_identification]['user_name'] = $row->user_name;
                $resModelsGoals[$row->user_identification]['user_surname'] = $row->user_surname;
                $resModelsGoals[$row->user_identification]['user_email'] = $row->user_email;
                $resModelsGoals[$row->user_identification]['stdmod_commission_type'] = $row->stdmod_commission_type;
                $resModelsGoals[$row->user_identification]['stdmod_percent'] = $row->stdmod_percent;
                $resModelsGoals[$row->user_identification]['sum_goal'] = $row->sum_goal;
                $resModelsGoals[$row->user_identification]['sum_earnings'] = 0;
                $resModelsGoals[$row->user_identification]['goal_indicator'] = 0;

                // SATELITE
                if ($row->stdmod_commission_type == 'SATELITE') {
                    $resModelsGoals[$row->user_identification]['goals'] = [
                        [ 'since' => 0,    'until' => 399,  'commission' => 75 ],
                        [ 'since' => 400,  'until' => 499,  'commission' => 80 ],
                        [ 'since' => 500,  'until' => 599,  'commission' => 82 ],
                        [ 'since' => 600,  'until' => 749,  'commission' => 83 ],
                        [ 'since' => 750,  'until' => 999,  'commission' => 84 ],
                        [ 'since' => 1000, 'until' => null, 'commission' => 85 ],
                    ];
                }
            }

            // EARNING
            $whereTmp = $where;
            $whereTmp = str_replace('report_period', $streamAlias.'.'.$streamDateCol, $whereTmp);

        if ($useLiquidations) {
            // Periodo CERRADO - usar liquidations directamente
            $records = DB::select("
                SELECT
                    -- model
                    us.user_identification,
                    us.user_name,
                    us.user_surname,
                    us.user_email,
                    sm.stdmod_commission_type,
                    sm.stdmod_percent,
                    -- streams
                    SUM(lq.liq_earnings_value) as sum_earnings
                FROM users us
                INNER JOIN studios_models sm ON sm.user_id_model = us.user_id
                INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                INNER JOIN liquidations lq ON lq.modacc_id = ma.modacc_id
                LEFT JOIN studios st ON st.std_id = sm.std_id
                WHERE $whereTmp
                GROUP BY us.user_identification, us.user_name, us.user_surname, us.user_email, sm.stdmod_commission_type, sm.stdmod_percent
            ");
        } else {
            // Periodo ABIERTO - usar models_streams con MAX(modstr_id)
            $whereTmpMs = str_replace('ms.modstr_date', 'modstr_date', $whereTmp);
            if (in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                $whereTmpMs = str_replace('us.user_id', 'sm.user_id_model', $whereTmpMs);
            }
            $records = DB::select("
                SELECT
                    -- model
                    us.user_identification,
                    us.user_name,
                    us.user_surname,
                    us.user_email,
                    sm.stdmod_commission_type,
                    sm.stdmod_percent,
                    -- streams
                    SUM(ms.modstr_earnings_value) as sum_earnings
                FROM users us
                INNER JOIN studios_models sm ON sm.user_id_model = us.user_id
                INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                INNER JOIN (
                    SELECT ms.modstr_date, ms.modacc_id, MAX(ms.modstr_id) as modstr_id
                    FROM models_streams ms
                    INNER JOIN models_accounts ma ON ma.modacc_id = ms.modacc_id
                    INNER JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
                    INNER JOIN studios st ON st.std_id = sm.std_id
                    WHERE $whereTmpMs
                    GROUP BY ms.modstr_date, ms.modacc_id
                ) last_ms ON last_ms.modacc_id = ma.modacc_id
                INNER JOIN models_streams ms ON ms.modstr_id = last_ms.modstr_id
                LEFT JOIN studios st ON st.std_id = sm.std_id
                GROUP BY us.user_identification, us.user_name, us.user_surname, us.user_email, sm.stdmod_commission_type, sm.stdmod_percent
            ");
        }
            // series
            foreach ($records as $r => $row) {
                if (!isset($resModelsGoals[$row->user_identification])) {
                    $resModelsGoals[$row->user_identification]['sum_goal'] = 0;
                }
                $resModelsGoals[$row->user_identification]['user_identification'] = $row->user_identification;
                $resModelsGoals[$row->user_identification]['user_name'] = $row->user_name;
                $resModelsGoals[$row->user_identification]['user_surname'] = $row->user_surname;
                $resModelsGoals[$row->user_identification]['user_email'] = $row->user_email;
                $resModelsGoals[$row->user_identification]['stdmod_commission_type'] = $row->stdmod_commission_type;
                $resModelsGoals[$row->user_identification]['stdmod_percent'] = $row->stdmod_percent;
                $resModelsGoals[$row->user_identification]['sum_earnings'] = $row->sum_earnings;
                $resModelsGoals[$row->user_identification]['goal_indicator'] = !(empty($resModelsGoals[$row->user_identification]['sum_goal'])) ? $row->sum_earnings / $resModelsGoals[$row->user_identification]['sum_goal'] : 0;

                // SATELITE
                if ($row->stdmod_commission_type == 'SATELITE') {
                    $resModelsGoals[$row->user_identification]['goals'] = [
                        [ 'since' => 0,    'until' => 399,  'commission' => 75 ],
                        [ 'since' => 400,  'until' => 499,  'commission' => 80 ],
                        [ 'since' => 500,  'until' => 599,  'commission' => 82 ],
                        [ 'since' => 600,  'until' => 749,  'commission' => 83 ],
                        [ 'since' => 750,  'until' => 999,  'commission' => 84 ],
                        [ 'since' => 1000, 'until' => null, 'commission' => 85 ],
                    ];
                }
            }

            $resModelsGoals = array_values($resModelsGoals);

            // order by indicator (cumplimiento)
            $sortKey = 'goal_indicator';
            usort($resModelsGoals, function ($a, $b) use ($sortKey) {
                if ($a[$sortKey] > $b[$sortKey]) {
                    return 1;
                } elseif ($a[$sortKey] < $b[$sortKey]) {
                    return -1;
                }
                return 0;
            });

            // invertir orden
            krsort($resModelsGoals);
            $resModelsGoals = array_values($resModelsGoals);


            ////////////////////////////////////
            // CUMPLIMIENTO DE METAS ESTUDIOS //
            ////////////////////////////////////
            $resStudiosGoals = array();

            $orderBy = 'sum_goal DESC';
            if (isset($request['orderBy'])) {
                $orderBy = $request['orderBy'];
            }

            // GOAL
            $whereTmp = $where;
            $whereTmp = str_replace('report_period', 'modgoal_date', $whereTmp);
            $records = DB::select("
                SELECT
                    -- studio
                    st.std_nit,
                    st.std_name,
                    -- goals
                    MAX(mg.modgoal_amount) as sum_goal
                FROM users us
                INNER JOIN studios_models sm ON sm.user_id_model = us.user_id
                INNER JOIN models_goals mg ON mg.stdmod_id = sm.stdmod_id
                LEFT JOIN studios st ON st.std_id = sm.std_id
                WHERE $whereTmp
                GROUP BY st.std_nit, st.std_name
                ORDER BY $orderBy
            ");
            // series
            foreach ($records as $r => $row) {
                $resStudiosGoals[$row->std_nit]['std_nit'] = $row->std_nit;
                $resStudiosGoals[$row->std_nit]['std_name'] = $row->std_name;
                $resStudiosGoals[$row->std_nit]['sum_goal'] = $row->sum_goal;
                $resStudiosGoals[$row->std_nit]['sum_earnings'] = 0;
                $resStudiosGoals[$row->std_nit]['goal_indicator'] = 0;

                // NIVELES
                $resStudiosGoals[$row->std_nit]['goals'] = [
                    [ 'since' => 0,    'until' => 999,  'commission' => 75 ],
                    [ 'since' => 1000,  'until' => 1999,  'commission' => 80 ],
                    [ 'since' => 2000,  'until' => 3999,  'commission' => 82 ],
                    [ 'since' => 4000,  'until' => 7499,  'commission' => 83 ],
                    [ 'since' => 7500,  'until' => 9999,  'commission' => 84 ],
                    [ 'since' => 10000, 'until' => null, 'commission' => 85 ],
                ];
            }

            // EARNING
            $whereTmp = $where;
            $whereTmp = str_replace('report_period', $streamAlias.'.'.$streamDateCol, $whereTmp);

        if ($useLiquidations) {
            // Periodo CERRADO - usar liquidations directamente
            $records = DB::select("
                SELECT
                    -- model
                    st.std_nit,
                    st.std_name,
                    -- streams
                    SUM(lq.liq_earnings_value) as sum_earnings
                FROM users us
                INNER JOIN studios_models sm ON sm.user_id_model = us.user_id
                INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                INNER JOIN liquidations lq ON lq.modacc_id = ma.modacc_id
                LEFT JOIN studios st ON st.std_id = sm.std_id
                WHERE $whereTmp
                GROUP BY st.std_nit, st.std_name
            ");
        } else {
            // Periodo ABIERTO - usar models_streams con MAX(modstr_id)
            $whereTmpMs = str_replace('ms.modstr_date', 'modstr_date', $whereTmp);
            if (in_array($uAuth->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                $whereTmpMs = str_replace('us.user_id', 'sm.user_id_model', $whereTmpMs);
            }
            $records = DB::select("
                SELECT
                    -- model
                    st.std_nit,
                    st.std_name,
                    -- streams
                    SUM(ms.modstr_earnings_value) as sum_earnings
                FROM users us
                INNER JOIN studios_models sm ON sm.user_id_model = us.user_id
                INNER JOIN models_accounts ma ON ma.stdmod_id = sm.stdmod_id
                INNER JOIN (
                    SELECT ms.modstr_date, ms.modacc_id, MAX(ms.modstr_id) as modstr_id
                    FROM models_streams ms
                    INNER JOIN models_accounts ma ON ma.modacc_id = ms.modacc_id
                    INNER JOIN studios_models sm ON sm.stdmod_id = ma.stdmod_id
                    INNER JOIN studios st ON st.std_id = sm.std_id
                    WHERE $whereTmpMs
                    GROUP BY ms.modstr_date, ms.modacc_id
                ) last_ms ON last_ms.modacc_id = ma.modacc_id
                INNER JOIN models_streams ms ON ms.modstr_id = last_ms.modstr_id
                LEFT JOIN studios st ON st.std_id = sm.std_id
                GROUP BY st.std_nit, st.std_name
            ");
        }
            // series
            foreach ($records as $r => $row) {
                if (!isset($resStudiosGoals[$row->std_nit])) {
                    $resStudiosGoals[$row->std_nit]['sum_goal'] = 0;
                }
                $resStudiosGoals[$row->std_nit]['std_nit'] = $row->std_nit;
                $resStudiosGoals[$row->std_nit]['std_name'] = $row->std_name;
                $resStudiosGoals[$row->std_nit]['sum_earnings'] = $row->sum_earnings;
                $resStudiosGoals[$row->std_nit]['goal_indicator'] = (!empty($resStudiosGoals[$row->std_nit]['sum_goal'])) ? $row->sum_earnings / $resStudiosGoals[$row->std_nit]['sum_goal'] : 0;

                // NIVELES
                $resStudiosGoals[$row->std_nit]['goals'] = [
                    [ 'since' => 0,    'until' => 999,  'commission' => 75 ],
                    [ 'since' => 1000,  'until' => 1999,  'commission' => 80 ],
                    [ 'since' => 2000,  'until' => 3999,  'commission' => 82 ],
                    [ 'since' => 4000,  'until' => 7499,  'commission' => 83 ],
                    [ 'since' => 7500,  'until' => 9999,  'commission' => 84 ],
                    [ 'since' => 10000, 'until' => null, 'commission' => 85 ],
                ];
            }

            $resStudiosGoals = array_values($resStudiosGoals);

            // order by indicator (cumplimiento)
            $sortKey = 'goal_indicator';
            usort($resStudiosGoals, function ($a, $b) use ($sortKey) {
                if ($a[$sortKey] > $b[$sortKey]) {
                    return 1;
                } elseif ($a[$sortKey] < $b[$sortKey]) {
                    return -1;
                }
                return 0;
            });

            // invertir orden
            krsort($resStudiosGoals);
            $resStudiosGoals = array_values($resStudiosGoals);


            //////////////
            // response //
            //////////////
            return response()->json(['status' => 'success', 'data' => array(
                'streamEarnings' => $resStreamEarnings,
                'modelsGoals' => $resModelsGoals,
                'studiosGoals' => $resStudiosGoals,
            )], 200);
        } catch (Exception $e) {
            Log::info($e->getMessage());
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * generate color
     *
     * @return string
     */
    public function randColor()
    {
        return '#'.substr(md5(Rand()), 0, 6);
    }
}
