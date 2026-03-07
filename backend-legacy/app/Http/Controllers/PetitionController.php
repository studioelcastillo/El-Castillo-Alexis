<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;
use App\Library\HelperController;
use App\Library\LogController;
use App\Requests\LoginDto;
use App\Models\Petition;
use App\Models\PetitionState;
use App\Models\UserAdditionalModel;
use App\Models\Document;
use App\Models\Profile;
use App\Models\Studio;
use App\Models\StudioModel;
use App\Models\ModelAccount;
use Carbon\Carbon;

class PetitionController extends Controller
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
                'ptn_type' => 'required|max:50',
                'ptn_nick' => 'required|max:150',
                'ptn_password' => 'required|max:150',
                'ptn_page' => 'required|max:120',
                'user_id' => 'required|exists:users,user_id'
            ]);

            $count_models = UserAdditionalModel::
            join('users AS u', 'users_additional_models.user_id', 'u.user_id')
            ->where('users_additional_models.user_id', $data['user_id'])
            ->where('u.user_model_category', 'PAREJA')
            ->pluck('usraddmod_id');
            $not_required_documents = array('IMG_OTHER');
            $documents_rows = Document::
            select(DB::raw('count(*) AS quantity_docs_bytype'), 'usraddmod_id')
            ->where('user_id', $data['user_id'])
            ->where('doc_type', 'image')
            ->whereNotIn('doc_label', $not_required_documents)
            ->groupBy('usraddmod_id')
            ->orderBy('usraddmod_id', 'desc')
            ->pluck('quantity_docs_bytype', 'usraddmod_id');
            //hacemos un recorrido de count_models, porque es el que contiene las parejas actuales de la modelo, sea la modelo tipo pareja o no
            $missing_documents = false;
            for ($i = -1; $i < sizeof($count_models); $i++) {
                $key = ($i == -1) ? '' : $count_models[$i];
                if (!isset($documents_rows[$key]) || $documents_rows[$key] < 5) {
                    $missing_documents = true;
                }
            }
            if ($missing_documents) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'MISSING_DOCUMENTS',
                    'message' => 'Faltan documentos por subir',
                ], 400);
            }

            $consecutive = Petition::max('ptn_consecutive');
            $consecutive = ($consecutive == null) ? 0 : $consecutive;
            $petitions_state = array();
            $i = 1;
            foreach ($data['ptn_page'] as $page) {
            	$record = Petition::create([
            		'ptn_consecutive' => intval($consecutive) + $i,
            		'ptn_type' => $data['ptn_type'],
            		'ptn_nick' => $data['ptn_nick'],
                    'ptn_nick_final' => $data['ptn_nick'],
                    'ptn_password' => $data['ptn_password'],
                    'ptn_password_final' => $data['ptn_password'],
            		'ptn_page' => $page,
            		'user_id' => $data['user_id'],
                    'stdmod_id' => $data['stdmod_id']
            	]);
            	$petitions_state[] = [
            		'ptn_id' => $record->ptn_id,
            		'ptnstate_state' => 'EN PROCESO',
            		'ptnstate_observation' => (isset($data['ptnstate_observation'])) ? $data['ptnstate_observation'] : null,
            		'user_id' => $uAuth->user_id,
            		'created_at' => Carbon::now()
            	];
            	$i++;
            }
            PetitionState::insert($petitions_state);

            if ($record) {
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
     * Create a new record.
     *
     * @return response()->json
     */
    public function store_state(Request $request)
    {
        try {
            DB::beginTransaction();
            $data = $request->all();
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
                'ptnstate_observation' => 'nullable'
            ]);
            $petition = Petition::findOrFail($request['ptn_id']);
            $petition->ptn_payment_pseudonym = $request['ptn_payment_pseudonym'];
            $petition->ptn_nick_final = $request['ptn_nick_final'];
            $petition->ptn_mail = $request['ptn_mail'];
            $petition->ptn_password_final = $request['ptn_password_final'];
            $petition->ptn_linkacc = $request['ptn_linkacc'];
            $petition->save();

            $data['user_id'] = $uAuth->user_id;
            $data['created_at'] = Carbon::now();
            unset($data['token'], $data['ptn_nick_final'], $data['ptn_mail'], $data['ptn_password_final'], $data['ptn_payment_pseudonym']);
            $record = PetitionState::create($data);

            if ($data['ptnstate_state'] === 'APROBADA') {
                $repeated_account = ModelAccount::whereNull('deleted_at')
                ->whereRaw("modacc_app LIKE '".$petition->ptn_page."%'")
                ->whereRaw("modacc_username ILIKE '".$petition->ptn_nick_final."'")
                ->count();
                if ($repeated_account != 0) {
                    DB::rollBack();
                    return response()->json([
                        'status' => 'fail',
                        'code' => 'EXISTING_ACCOUNT',
                        'message' => 'Ya existe una cuenta para la aplicación seleccionada que tiene el mismo nombre de usuario digitado',
                    ], 400);
                }

                $model_account = ModelAccount::create([
                    'stdmod_id' => $petition->stdmod_id,
                    'modacc_app' => $petition->ptn_page,
                    'modacc_state' => '',
                    'modacc_username' => $petition->ptn_nick_final,
                    'modacc_password' => $petition->ptn_password_final,
                    'modacc_active' => true,
                    'modacc_payment_username' => $petition->ptn_payment_pseudonym,
                    'modacc_mail' => $petition->ptn_mail,
                    'modacc_linkacc' => $petition->ptn_linkacc
                ]);
                $petition->modacc_id = $model_account->modacc_id;
                $petition->save();
            }

            if ($record) {
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

    public function show(Request $request)
    {
        try {
            $skip = $request['start'];
            $take = $request['length'];
            $orderby = $request['sortby'];
            $dir = $request['dir'];
            $filter = $request['filter'];
            $columns = $columns = explode(',', $request['columns']);
            $studios = $request['studios'];
            $studios = (isset($studios) && $studios != '') ? explode(",", $studios) : null;
            $in_states = (isset($request['states'])) ? explode(",", $request['states']) : ['EN PROCESO', 'PENDIENTE', 'APROBADA', 'RECHAZADA'];
            $user_id = $request['user_id'];
            $stdmods_ids = Studio::join('studios_models AS sm', 'studios.std_id', 'sm.std_id')
            ->whereNull('studios.deleted_at')
            ->whereNull('sm.deleted_at')
            ->where('studios.user_id_owner', $user_id)
            ->pluck('stdmod_id');

            $petitions_states = DB::table('petitions_states')->select('ptn_id', 'ptnstate_state', DB::raw('ROW_NUMBER() OVER (PARTITION BY ptn_id ORDER BY created_at DESC) AS row_num', 'user_name'));
            $record = Petition::with(['user.additional_models', 'petition_state.user'])
            ->select('petitions.*')
            ->joinSub($petitions_states, 'ps', function ($join) {
                $join->on('ps.ptn_id', '=', 'petitions.ptn_id')
                ->where('row_num', 1);
            })
            ->leftJoin('users', 'users.user_id', 'petitions.user_id')
            ->leftJoin('studios_models AS sm', 'petitions.stdmod_id', 'sm.stdmod_id')
            ->leftJoin('studios AS s', 'sm.std_id', 's.std_id')
            ->whereIn('ps.ptnstate_state', $in_states)
            ->where(function ($query) use ($user_id, $stdmods_ids) {
                if(isset($user_id)) {
                    $query
                    ->where('petitions.user_id', $user_id)
                    ->orWhereIn('petitions.stdmod_id', $stdmods_ids)
                    ->orWhere('ps.ptn_id', function ($query) use ($user_id) {
                        $query->select('ps2.ptn_id')
                        ->from('petitions_states AS ps2')
                        ->where('ps2.user_id', $user_id)
                        ->where('ps2.ptnstate_state', 'EN PROCESO')
                        ->whereRaw('ps2.ptn_id = ps.ptn_id');
                    });
                }
            })
            ->where(function ($query) use ($columns, $filter) {
                for ($i=0; $i < count($columns); $i++) {
                    if ($i === 0) {
                        $query->where(DB::raw("UPPER(CAST(".$columns[$i]." as VARCHAR))"), 'like', "%".strtoupper($filter)."%");
                    } else {
                        $query->orWhere(DB::raw("UPPER(CAST(".$columns[$i]." as VARCHAR))"), 'like', "%".strtoupper($filter)."%");
                    }
                }
                $query->orWhere(DB::raw("UPPER(COALESCE(users.user_name, '') || ' ' || COALESCE(users.user_name2, '') || ' ' || COALESCE(users.user_surname, '')  || ' ' || COALESCE(users.user_surname2, ''))"), 'like', '%'.strtoupper($filter).'%');
                $query->orWhere(DB::raw("UPPER(COALESCE(users.user_name, '') || ' ' || COALESCE(users.user_surname, ''))"), 'like', '%'.strtoupper($filter).'%');
                $query->orWhere(DB::raw("UPPER(COALESCE(users.user_name2, '') || ' ' || COALESCE(users.user_surname, ''))"), 'like', '%'.strtoupper($filter).'%');
                $query->orWhere(DB::raw("UPPER(COALESCE(users.user_name, '') || ' ' || COALESCE(users.user_name2, ''))"), 'like', '%'.strtoupper($filter).'%');
                $query->orWhere(DB::raw("UPPER(COALESCE(users.user_name, '') || ' ' || COALESCE(users.user_name2, '') || ' ' || COALESCE(users.user_surname, ''))"), 'like', '%'.strtoupper($filter).'%');
                $query->orWhere(DB::raw("UPPER(COALESCE(users.user_surname, '') || ' ' || COALESCE(users.user_surname2, ''))"), 'like', '%'.strtoupper($filter).'%');
            })
            ->where(function ($query) use ($studios) {
                if (isset($studios)) {
                    $query->whereIn('s.std_id', $studios);
                }
            })
            ->orderBy(DB::raw($orderby), $dir)//'petitions.created_at', 'desc'
            ->distinct();

            $recordsTotal = clone $record;
            $recordsTotal = $recordsTotal->count();

            $take = ($take == 0) ? $recordsTotal : $take;
            $record = $record
            ->skip($skip)
            ->take($take)
            ->get();
            return response()->json(['status' => 'success', 'data' => $record, 'recordsTotal' => $recordsTotal], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    public function showPetitions(Request $request)
    {
        try {
            $data = $this->helper::generateConditions($request);
            $record = Petition::with(['user.additional_models', 'petition_state.user', 'studio_model.studio:std_id,std_name'])
            ->where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->orderBy('petitions.created_at', 'desc');

            if (in_array($request->user()->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
                $record = $record->where('petitions.user_id', $request->user()->user_id);
            }
            else if ($request->user()->prof_id == Profile::ESTUDIO) {
                $record = $record->join('studios_models AS sm', 'sm.stdmod_id', 'petitions.stdmod_id')
                ->join('studios AS s', 's.std_id', 'sm.std_id')
                ->where('s.user_id_owner', $request->user()->user_id);
            }
            $record = $record->get();
            return response()->json(['status' => 'success', 'data' => $record], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    public function pending_petitions(Request $request)
    {
        try {
            $record = Petition::where('petitions.user_id', $request['user_id'])
            ->where('ptn_type', 'CREACIÓN DE CUENTA')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                      ->from('petitions_states')
                      ->whereRaw('petitions.ptn_id = petitions_states.ptn_id')
                      ->whereIn('ptnstate_state', ['APROBADA', 'RECHAZADA']);
            })
            ->pluck('ptn_page');
            return response()->json(['status' => 'success', 'data' => $record], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    public function check_model_associated_studio(Request $request) 
    {
        $studio_model = StudioModel::whereNull('deleted_at')->where('user_id_model', $request->input('user_id'))->orderBy('updated_at', 'DESC')->first();
        if ($studio_model == null) {
            return response()->json(['status' => 'fail']);
        }
        return response()->json(['status' => 'success'], 201);
    }

    public function getStudiosModelsByModel(Request $request)
    {
         try {
            $studios_models = StudioModel::join('studios AS s', 'studios_models.std_id', 's.std_id')
            ->select('studios_models.stdmod_id AS value', DB::raw("studios_models.stdmod_id || ' ' || s.std_name AS label"))
            ->whereNull('studios_models.deleted_at')
            ->where('studios_models.stdmod_active', true)
            ->where('user_id_model', $request->input('user_id'))
            ->orderBy('studios_models.updated_at', 'DESC');
            if ($request->user()->prof_id == Profile::ESTUDIO) {
                $studios_models = $studios_models->where('s.user_id_owner', $request->user()->user_id);
            }
            $studios_models = $studios_models->get();
            if ($studios_models == null) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'STUDIOMODEL_NOT_FOUND',
                    'message' => 'Modelo no esta ligado a ningun contrato',
                ], 400);
            }
            return response()->json(['status' => 'success', 'data' => $studios_models], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    public function getPreviousObservations(Request $request)
    {
        try {
            $search = $request->input('search');
            $observations = PetitionState::select('ptnstate_observation')
            ->where('user_id', $request->user()->user_id)
            ->where('ptnstate_observation', 'ILIKE', '%' . $search . '%')
            ->whereNotNull('ptnstate_observation')
            ->where('ptnstate_observation', '!=', '')
            ->distinct()
            ->limit(4)
            ->pluck('ptnstate_observation')
            ->toArray();
            
            return response()->json(['status' => 'success', 'data' => $observations], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            return response()->json(['status' => 'fail'], 500);
        }
    }
}
