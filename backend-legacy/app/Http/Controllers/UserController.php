<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

use App\Library\HelperController;
use App\Library\LogController;
use App\Requests\LoginDto;
use App\Models\User;
use App\Models\UserUser;
use App\Models\Profile;
use App\Models\UserAdditionalModel;
use App\Models\SkippedCoincidence;
use App\Models\Coincidence;
use App\Models\Transaction;
use App\Models\TransactionType;
use App\Models\ModelStream;
use App\Models\Period;
use App\Models\StudioModel;
use App\Http\Controllers\StudioModelController;
use App\Http\Controllers\CommissionController;

use Maatwebsite\Excel\Facades\Excel;
use App\Exports\UsersExport;

class UserController extends Controller
{
    private $helper;
    private $log;
    /**
     * Create a new AuthController instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->helper = new HelperController();
        $this->log = new LogController();
    }

    /**
     * Create a new user.
     *
     * @return response()->json
     */
    public function store(Request $request)
    {
        try {
            DB::beginTransaction();
            $data = $request->all();
            $uAuth = $request->user();

            if (isset($data['users_coincidences'])) {
                //users coincidences
                $users_coincidences = $data['users_coincidences'];
                $users_coincidences_observation = $data['users_coincidences_observation'];
                unset($data['users_coincidences']);
                unset($data['users_coincidences_observation']);
            }
            if (isset($data['studio_model'])) {
                $studio_model_data = $data['studio_model'];
                unset($data['studio_model']);
            }

            // validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            // user login = identification
            $request['user_email'] = isset($request['user_identification']) ? $request['user_identification'] : null;
            $data['user_email'] = isset($data['user_identification']) ? $data['user_identification'] : null;

            // Validar unicidad
            $userExists = User::where('user_email', $data['user_email'])->first();
            if ($userExists) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'USER_ALREADY_EXISTS',
                    'message' => 'Este correo ya se encuentra registrado',
                ], 400);
            }

            // validamos los datos
            $this->validate($request, [
                'user_identification' => 'nullable|max:255',
                'user_identification_type' => 'nullable|max:255',
                'user_issued_in' => 'nullable|max:255',
                'user_name' => 'required|max:255',
                'user_name2' => 'nullable|max:255',
                'user_surname' => 'nullable|max:255',
                'user_surname2' => 'nullable|max:255',
                'user_email' => 'required|max:255|unique:users,user_email',
                'prof_id' => 'required|exists:profiles,prof_id',
                'user_sex' => 'nullable|max:255',
                'user_telephone' => 'nullable|max:255',
                'user_address' => 'nullable|max:255',
                'user_rh' => 'nullable|max:20',
                'user_model_category' => 'nullable|max:40',
                'user_personal_email' => 'nullable|max:255|unique:users,user_personal_email',
            ], [
                'prof_id.exists' => 'Perfil no valido'
            ]);

            // ciframos el password
            $password = substr($data['user_identification'], -5);
            $data['user_password'] = bcrypt($password);

            $additional_models = $data['additional_models'];

            // creamos un nuevo usuario
            unset($data['additional_models']);
            $user = User::create($data);
            if ($user) {
                if ($uAuth->prof_id == Profile::ESTUDIO || $uAuth->prof_id == Profile::GESTOR) {
                    $studio_model_controller = new StudioModelController();
                    $studio_model_arr = $studio_model_data;
                    $studio_model_arr['user_id_model'] = $user->user_id; //agregar el usuario recien creado
                    $studio_model_request = new Request($studio_model_arr); // crear peticion con datos
                    // Copiar el usuario autenticado de la request original
                    $studio_model_request->setUserResolver(function () use ($request) {
                        return $request->user();
                    });
                    $response = $studio_model_controller->store($studio_model_request);
                    // Convertir la respuesta JSON
                    $studio_model = json_decode($response->getContent(), true);
                    if ($studio_model['status'] !== 'success') {
                        DB::rollBack();
                        return response()->json([
                            'status' => 'fail',
                            'message' => 'Error al crear el contrato'
                        ], 400);
                    }
                }
                $this->log::storeLog($uAuth, 'users', $user->user_id, 'INSERT', null, $user, $request->ip);

                // permissions
                if (isset($data['permissions'])) {
                    foreach ($data['permissions'] as $feat => $state) {
                        $up = UserPermission::create([
                            'user_id' => $user->user_id,
                            'userperm_feature' => $feat,
                            'userperm_state' => $state,
                        ]);

                        $this->log::storeLog($uAuth, 'users_permissions', $up->userperm_id, 'INSERT', null, $up, $request->ip);
                    }
                }

                // $this->helper::sendEmail('mail.Confirmation', array(
                //     'subject' => 'Bienvenido a GK-THRESHOLD',
                //     'email' => $user->user_email,
                //     'contraseña' => $password,
                //     'url' => env('APP_CLIENT'),
                //     'base_url' => env('APP_SERVER'),
                // ));
                if (in_array($user->prof_id, [Profile::MODELO, Profile::MODELO_SATELITE]) && $user->user_model_category == 'PAREJA') {
                    $additional_models_toinsert = array();
                    foreach ($additional_models as $key => $additional_model) {
                        $additional_models_toinsert[] = array(
                            'user_id' => $user->user_id,
                            'usraddmod_name' => $additional_model['name'],
                            'usraddmod_identification' => $additional_model['identification'],
                            'usraddmod_birthdate' => $additional_model['birthdate'],
                            'usraddmod_category' => (isset($additional_model['model_category'])) ? $additional_model['model_category'] : null
                        );
                    }
                    UserAdditionalModel::insert($additional_models_toinsert);
                }
                if (isset($data['users_coincidences']) && sizeof($users_coincidences) > 0) {
                    $skipped_coincidence = SkippedCoincidence::create([
                        'user_id_new' => $user->user_id,
                        'user_id_created_by' => $uAuth->user_id,
                        'skpcoin_observation' => $users_coincidences_observation,
                        'skpcoin_type' => 'INSERT'
                    ]);
                    $coincidence_insert = [];
                    foreach ($users_coincidences as $user_coincidences) {
                        $coincidence_insert[] = array(
                            'skpcoin_id' => $skipped_coincidence->skpcoin_id,
                            'coin_entity' => json_encode($user_coincidences),
                            'created_at' => now(),
                            'updated_at' => now()
                        );
                    }
                    Coincidence::insert($coincidence_insert);
                }
                DB::commit();
                return response()->json(['status' => 'success', 'data' => $user], 201);
            }
            else {
                DB::rollBack();
                return response()->json(['status' => 'fail']);
            }
        }
        catch (Exception $e) {
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
            // Mock response for local development
            if (env('APP_ENV') === 'local' && $request->user() && $request->user()->user_id === 4243) {
                return response()->json([
                    'status' => 'success',
                    'data' => [
                        [
                            'user_id' => 1,
                            'user_name' => 'Demo User 1',
                            'user_identification' => '12345',
                            'user_active' => true,
                            'profile' => ['prof_name' => 'Admin'],
                            'city' => ['city_name' => 'Localhost']
                        ],
                        [
                            'user_id' => 2,
                            'user_name' => 'Demo User 2',
                            'user_identification' => '67890',
                            'user_active' => true,
                            'profile' => ['prof_name' => 'Model'],
                            'city' => ['city_name' => 'Localhost']
                        ]
                    ]
                ], 200);
            }

            $data = $this->helper::generateConditions($request);
            $user = User::with(['profile', 'studio', 'city.department.country', 'additional_models.latest_documents', 'latest_documents'])
                ->where($data['where'])
                ->orWhere($data['orWhere'])
                ->whereRaw($data['whereRaw'])
                ->whereNull('users.deleted_at')
                ->orderBy('users.user_id', 'desc');

            if ($request->user()->prof_id == Profile::ESTUDIO) {
                $user = $user->join('studios_models AS sm', 'sm.user_id_model', 'users.user_id')
                    ->join('studios AS s', 'sm.std_id', 's.std_id')
                    ->where('s.user_id_owner', $request->user()->user_id);
            }
            if ($request->user()->prof_id != Profile::ADMIN) {
                $user = $user->where('users.prof_id', '!=', 1);
            }

            $user = $this->applyTenantScope($user, $request, 'users.std_id')->get();
            return response()->json(['status' => 'success', 'data' => $user], 200);
        }
        catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    public function getUserStdmods(Request $request)
    {
        $id = $request->input('user_id');
        try {
            $stdmods = StudioModel::with('studio')->where('user_id_model', $id);
            $stdmods = $this->applyTenantScope($stdmods, $request, 'std_id')->get();
            return response()->json(['status' => 'success', 'data' => $stdmods], 200);
        }
        catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    public function getUserWithPermissions(Request $request)
    {
        try {
            // Mock response for local development
            if (env('APP_ENV') === 'local' && $request->user() && $request->user()->user_id === 4243) {
                return response()->json([
                    'status' => 'success',
                    'data' => [
                        'user_id' => 4243,
                        'user_name' => 'Mock User',
                        'permissions' => []
                    ]
                ], 200);
            }

            $user = User::with('permissions')->where('user_id', $request->input('user_id'))->first();
            return response()->json(['status' => 'success', 'data' => $user], 200);
        }
        catch (Exception $e) {
            dd($e->getMessage());
        // $response = $this->helper::errorArray($e);
        //return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function showDatatable(Request $request)
    {
        try {
            // Mock response for local development
            if (env('APP_ENV') === 'local' && $request->user() && $request->user()->user_id === 4243) {
                $mockUsers = [
                    [
                        'user_id' => 1,
                        'user_name' => 'Demo User 1',
                        'user_surname' => 'Lastname',
                        'user_identification' => '12345',
                        'user_active' => true,
                        'toggleActive' => true,
                        'profile' => ['prof_name' => 'Admin'],
                        'studios' => 'Main Studio',
                        'user_age' => 25,
                        'created_at' => now()->toISOString()
                    ],
                    [
                        'user_id' => 2,
                        'user_name' => 'Demo User 2',
                        'user_surname' => 'Lastname',
                        'user_identification' => '67890',
                        'user_active' => true,
                        'toggleActive' => true,
                        'profile' => ['prof_name' => 'Model'],
                        'studios' => 'Satellite Studio',
                        'user_age' => 30,
                        'created_at' => now()->toISOString()
                    ]
                ];

                return response()->json([
                    'status' => 'success',
                    'data' => $mockUsers,
                    'recordsTotal' => 2,
                    'recordsFiltered' => 2
                ], 200);
            }

            //dd($record);
            $skip = $request['start'];
            $take = $request['length'];
            $orderby = $request['sortby'];
            $dir = $request['dir'];
            $filter = $request['filter'];
            $columns = $columns = explode(',', $request['columns']);

            $studios = $request['studios'];
            $profiles = $request['profiles'];
            $studios = (isset($studios) && $studios != '') ? explode(",", $studios) : null;
            $profiles = (isset($profiles) && $profiles != '') ? explode(",", $profiles) : null;
            $bool_active_users = filter_var($request->input('activeusers', true), FILTER_VALIDATE_BOOLEAN);

            Log::info("UserController@showDatatable - Filter activeusers: " . ($bool_active_users ? 'true' : 'false'));

            $user_prof_id = $request->user()->prof_id;
            $user_ids = [];
            $stdmods_ids = [];

            if ($user_prof_id == Profile::JEFE_MONITOR || $user_prof_id == Profile::MONITOR) {
                //$user_ids = $this->getAllDescendantUserIds(Auth::user()->user_id);
                $studio_model_controller = new StudioModelController();
                $studio_models = $studio_model_controller->showStudiosModelByUserId(Auth::user()->user_id);
                if (!empty($studio_models)) {
                    $commission_controller = new CommissionController();
                    $stdmods_ids = $commission_controller->getCommissionStudioModels($studio_models->toArray());
                }
                // Obtener std_ids del monitor y fusionar con $studios sin duplicados
                // $user_std_ids = $studio_model_controller->getStudioIdsByUserId(Auth::user()->user_id);
                // if (empty($user_std_ids)) {
                //     $studios = ['-1']; // Si no hay estudios, asignar un valor que no exista para evitar traer resultados
                // } else {
                //     if (isset($studios)) {
                //         $studios = array_values(array_unique(array_merge($studios, array_map('strval', $user_std_ids))));
                //     } else {
                //         $studios = $user_std_ids;
                //     }
                // }

                // Sin contratos asignados en el árbol de comisiones, solo traer a sí mismo
                if (empty($stdmods_ids)) {
                    $user_ids = [Auth::user()->user_id];
                }
            }
            // poner estudios del usuario desde el select separado por commmas o algun caracter
            $users = User::with(['profile', 'city.department.country', 'additional_models.latest_documents', 'latest_documents', 'studioModel.modelsAccounts', 'profile_picture_document'])
                //->leftJoin('studios_models AS sm', 'users.user_id', 'sm.user_id_model')
                ->leftJoin('studios_models AS sm', function ($join) {
                $join->on('users.user_id', 'sm.user_id_model')->whereNull('sm.deleted_at');
            })
                ->leftJoin('models_accounts AS ma', 'sm.stdmod_id', 'ma.stdmod_id')
                ->leftJoin('studios AS s', 'sm.std_id', 's.std_id')
                ->select('users.*', 'users.user_active AS toggleActive', DB::raw("STRING_AGG(DISTINCT s.std_name, ';' ORDER BY s.std_name) studios"), DB::raw("EXTRACT(YEAR FROM AGE(users.user_birthdate)) AS user_age"))
                ->where(function ($query) use ($columns, $filter) {
                for ($i = 0; $i < count($columns); $i++) {
                    if ($i === 0) {
                        $query->where(DB::raw("UPPER(CAST(" . $columns[$i] . " as VARCHAR))"), 'like', "%" . strtoupper($filter) . "%");
                    }
                    else {
                        $query->orWhere(DB::raw("UPPER(CAST(" . $columns[$i] . " as VARCHAR))"), 'like', "%" . strtoupper($filter) . "%");
                    }
                }
                $query->orWhere(DB::raw("UPPER(COALESCE(users.user_name, '') || ' ' || COALESCE(users.user_name2, '') || ' ' || COALESCE(users.user_surname, '')  || ' ' || COALESCE(users.user_surname2, ''))"), 'like', '%' . strtoupper($filter) . '%');
                $query->orWhere(DB::raw("UPPER(COALESCE(users.user_name, '') || ' ' || COALESCE(users.user_surname, ''))"), 'like', '%' . strtoupper($filter) . '%');
                $query->orWhere(DB::raw("UPPER(COALESCE(users.user_name2, '') || ' ' || COALESCE(users.user_surname, ''))"), 'like', '%' . strtoupper($filter) . '%');
                $query->orWhere(DB::raw("UPPER(COALESCE(users.user_name, '') || ' ' || COALESCE(users.user_name2, ''))"), 'like', '%' . strtoupper($filter) . '%');
                $query->orWhere(DB::raw("UPPER(COALESCE(users.user_name, '') || ' ' || COALESCE(users.user_name2, '') || ' ' || COALESCE(users.user_surname, ''))"), 'like', '%' . strtoupper($filter) . '%');
                $query->orWhere(DB::raw("UPPER(COALESCE(users.user_surname, '') || ' ' || COALESCE(users.user_surname2, ''))"), 'like', '%' . strtoupper($filter) . '%');
            })
                ->where(function ($query) use ($studios, $profiles) {
                if (isset($studios)) {
                    $query->whereIn('s.std_id', $studios);
                }
                if (isset($profiles)) {
                    $query->whereIn('users.prof_id', $profiles);
                }
            })
                ->where(function ($query) use ($user_prof_id, $user_ids, $stdmods_ids) {
                if ($user_prof_id != Profile::ADMIN) {
                    $query->where('users.prof_id', '!=', 1);
                }
                if (sizeof($user_ids) > 0) {
                    $query->whereIn('users.user_id', $user_ids);
                }
                if (sizeof($stdmods_ids) > 0) {
                    $query->whereIn('sm.stdmod_id', $stdmods_ids);
                }
            })
                ->where('user_active', $bool_active_users)
                ->whereNull('users.deleted_at')
                ->whereNull('s.deleted_at')
                ->orderBy(DB::raw($orderby), $dir)
                ->distinct();

            Log::debug("UserController@showDatatable - Query check: " . $users->toSql());

            if ($request->user()->prof_id == Profile::ESTUDIO) {
                $users = $users->where('s.user_id_owner', $request->user()->user_id);
            }

            // Clonar la consulta antes de paginar para obtener el conteo correcto
            $usersTotal = clone $users;
            // Agrupar y contar usuarios únicos correctamente
            $usersTotal = $usersTotal
                ->groupByRaw('users.user_id, users.created_at')
                ->get()
                ->count();

            $take = ($take == 0) ? $usersTotal : $take;
            $users = $users
                ->skip($skip)
                ->take($take)
                ->groupByRaw('users.user_id, users.created_at')
                ->get();

            Log::info("UserController@showDatatable - Total Records Found: " . $usersTotal . " | Page size: " . count($users));

            return response()->json(['status' => 'success', 'data' => $users, 'recordsTotal' => $usersTotal, 'recordsFiltered' => $usersTotal], 200);
        }
        catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }
    public function showUsersByOwner(Request $request)
    {
        try {
            $searchTerm = $request['searchterm'];
            $prof_id = $request->input('prof_id', null);
            $user_id = $request->user()->user_id;
            $bool_estudio = ($request->user()->prof_id == Profile::ESTUDIO);
            $user = User::select(
                DB::raw("CONCAT(users.user_name, ' ', users.user_name2, ' ', users.user_surname, ' ', users.user_surname2, ' (', users.user_identification, ')') AS label"),
                'users.user_id AS value',
                'users.user_id AS user_id',
            )
                ->with([
                'studioModel' => function ($query) use ($bool_estudio, $user_id) {
                if ($bool_estudio) {
                    $query->whereHas('studio', function ($q) use ($user_id) {
                                $q->where('studios.user_id_owner', $user_id);
                            }
                            );
                        }
                    },
                'studioModel.studio'
            ])
                ->join('studios_models AS sm', 'users.user_id', 'sm.user_id_model')
                ->where(function ($query) use ($searchTerm) {
                $query
                    ->where(DB::raw("UPPER(COALESCE(users.user_name, '') || ' ' || COALESCE(users.user_name2, '') || ' ' || COALESCE(users.user_surname, '')  || ' ' || COALESCE(users.user_surname2, ''))"), 'like', '%' . strtoupper($searchTerm) . '%')
                    ->orWhere(DB::raw("UPPER(COALESCE(users.user_name, '') || ' ' || COALESCE(users.user_surname, ''))"), 'like', '%' . strtoupper($searchTerm) . '%')
                    ->orWhere(DB::raw("UPPER(COALESCE(users.user_name2, '') || ' ' || COALESCE(users.user_surname, ''))"), 'like', '%' . strtoupper($searchTerm) . '%')
                    ->orWhere(DB::raw("UPPER(COALESCE(users.user_name, '') || ' ' || COALESCE(users.user_name2, ''))"), 'like', '%' . strtoupper($searchTerm) . '%')
                    ->orWhere(DB::raw("UPPER(COALESCE(users.user_name, '') || ' ' || COALESCE(users.user_name2, '') || ' ' || COALESCE(users.user_surname, ''))"), 'like', '%' . strtoupper($searchTerm) . '%')
                    ->orWhere(DB::raw("UPPER(COALESCE(users.user_surname, '') || ' ' || COALESCE(users.user_surname2, ''))"), 'like', '%' . strtoupper($searchTerm) . '%');
            })
                ->whereNull('users.deleted_at')
                ->whereNull('sm.deleted_at')
                ->where('users.user_active', true)
                ->where('sm.stdmod_active', true)
                ->orderBy('users.user_id', 'desc')
                ->distinct();
            if ($prof_id) {
                $user = $user->where('users.prof_id', $prof_id);
            }
            if ($bool_estudio) {
                $user = $user->join('studios AS s', 'sm.std_id', 's.std_id')->where('s.user_id_owner', $user_id);
            }
            $user = $user->get();
            return response()->json(['status' => 'success', 'data' => $user], 200);
        }
        catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    public function showModelsByOwner(Request $request)
    {
        try {
            //$data = $this->helper::generateConditions($request);
            $searchTerm = $request['searchterm'];
            $user_mutual_studios_id = $request['user_mutual_studios_id'];
            $prof_ids = $request['prof_ids'];
            $prof_ids = explode(',', $prof_ids);

            // Hacer explode del searchTerm por espacios para buscar cada palabra individualmente
            $searchWords = explode(' ', trim($searchTerm));
            $searchWords = array_filter($searchWords); // Eliminar elementos vacíos
            $user = User::select(DB::raw("CONCAT(users.user_name, ' ', users.user_name2, ' ', users.user_surname, ' ', users.user_surname2, ' (', users.user_identification, ')') AS label"), 'users.user_id AS value')
                // Si se cumple la condición, usar leftJoin; de lo contrario, usar join normal
                ->when(
                $prof_ids[0] !== "",
                function ($query) {
                return $query->leftJoin('studios_models AS sm', 'users.user_id', 'sm.user_id_model');
            },
                function ($query) {
                return $query->join('studios_models AS sm', 'users.user_id', 'sm.user_id_model');
            }
            )
                ->join('studios AS s', 'sm.std_id', 's.std_id')
                ->where(function ($query) use ($searchWords) {
                // Recorrer cada palabra del explode en un bucle for
                foreach ($searchWords as $index => $word) {
                    if ($index === 0) {
                        // Para la primera palabra, usar where
                        $query->where(function ($subQuery) use ($word) {
                                        $subQuery
                                            ->where('users.user_name', 'ilike', "%$word%")
                                            ->orWhere('users.user_name2', 'ilike', "%$word%")
                                            ->orWhere('users.user_surname', 'ilike', "%$word%")
                                            ->orWhere('users.user_surname2', 'ilike', "%$word%")
                                            ->orWhere('users.user_identification', 'like', "%$word%");
                                    }
                                    );
                                }
                                else {
                                    // Para las siguientes palabras, usar orWhere
                                    $query->orWhere(function ($subQuery) use ($word) {
                                        $subQuery
                                            ->where('users.user_name', 'ilike', "%$word%")
                                            ->orWhere('users.user_name2', 'ilike', "%$word%")
                                            ->orWhere('users.user_surname', 'ilike', "%$word%")
                                            ->orWhere('users.user_surname2', 'ilike', "%$word%")
                                            ->orWhere('users.user_identification', 'like', "%$word%");
                                    }
                                    );
                                }
                            }
                        })
                ->whereNull('users.deleted_at')
                ->whereNull('sm.deleted_at')
                ->where('users.user_active', true)
                ->where('sm.stdmod_active', true)
                ->when($prof_ids[0] !== "", function ($query) use ($prof_ids) {
                $query->whereIn('users.prof_id', $prof_ids);
            })
                ->orderBy('users.user_id', 'desc')
                ->distinct();
            if ($request->user()->prof_id == Profile::ESTUDIO) {
                $user = $user->where('user_id_owner', $request->user()->user_id);
            }
            // monitors usa este bloque if, se usa para que unicamente traiga los usuarios que comparten los mismos estudios con el $user_mutual_studios_id
            if (isset($user_mutual_studios_id) && $user_mutual_studios_id !== '' && $user_mutual_studios_id !== 'undefined') {
                $user = $user->whereIn('s.std_id', function ($query) use ($user_mutual_studios_id) {
                    //se usa para que unicamente traiga los usuarios que comparten los mismos estudios con el $user_mutual_studios_id
                    $query->select('std_id')
                        ->from('studios_models')
                        ->where('user_id_model', $user_mutual_studios_id)
                        ->whereNull('deleted_at');
                })->whereNotIn('users.user_id', function ($query) use ($user_mutual_studios_id) {
                    //se usa para que no traiga los usuarios que ya son hijos del $user_mutual_studios_id
                    $query->select('uu.userchild_id')
                        ->from('users_users AS uu')
                        ->where('userparent_id', $user_mutual_studios_id);
                });

            }
            $user = $user->get();
            return response()->json(['status' => 'success', 'data' => $user], 200);
        }
        catch (Exception $e) {
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

            //users coincidences
            if (isset($data['users_coincidences'])) {
                $users_coincidences = $data['users_coincidences'];
                $users_coincidences_observation = $data['users_coincidences_observation'];
                unset($data['users_coincidences']);
                unset($data['users_coincidences_observation']);
            }
            // validate token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }

            $user = User::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'user_identification' => 'nullable|max:255',
                'user_identification_type' => 'nullable|max:255',
                'user_issued_in' => 'nullable|max:255',
                'user_name' => 'required',
                'user_name2' => 'nullable|max:255',
                'user_surname' => 'nullable|max:255',
                'user_surname2' => 'nullable|max:255',
                // 'user_email' => ($user->user_email === $request->input('user_email')) ? 'required|max:255|email' : 'required|max:255|email|unique:users,user_email',
                'prof_id' => 'nullable|exists:profiles,prof_id',
                'user_sex' => 'nullable|max:255',
                'user_telephone' => 'nullable|max:255',
                'user_address' => 'nullable|max:255',
                'user_rh' => 'nullable|max:20',
                'user_model_category' => 'nullable|max:40',
                'user_personal_email' => [
                    'nullable',
                    'max:255',
                    Rule::unique('users', 'user_personal_email')->ignore($id, 'user_id'),
                ], //'required|max:255|unique:users,user_personal_email'
            ], [
                'prof_id.exists' => 'Perfil no valido'
            ]);
            $before = User::findOrFail($id);
            if (isset($data['additional_models'])) {
                $additional_models = $data['additional_models'];
                $additional_models_todelete = $data['additional_models_todelete'];
                unset($data['additional_models']);
                unset($data['additional_models_todelete']);
            }

            $user->update([
                'user_identification' => $data['user_identification'],
                'user_identification_type' => $data['user_identification_type'],
                'user_issued_in' => (isset($data['user_issued_in'])) ? $data['user_issued_in'] : $user->user_issued_in,
                'user_name' => $data['user_name'],
                'user_name2' => (isset($data['user_name2'])) ? $data['user_name2'] : null,
                'user_surname' => $data['user_surname'],
                'user_surname2' => (isset($data['user_surname2'])) ? $data['user_surname2'] : null,
                // 'user_email' => $data['user_email'],
                'prof_id' => (isset($data['prof_id'])) ? $data['prof_id'] : $user->prof_id,
                'user_active' => (isset($data['user_active'])) ? $data['user_active'] : $user->user_active,
                'user_sex' => $data['user_sex'],
                'user_telephone' => $data['user_telephone'],
                'user_birthdate' => $data['user_birthdate'],
                'user_address' => $data['user_address'],
                'user_bank_entity' => $data['user_bank_entity'],
                'user_bank_account' => $data['user_bank_account'],
                'user_bank_account_type' => $data['user_bank_account_type'],
                'user_beneficiary_name' => $data['user_beneficiary_name'],
                'user_beneficiary_document' => $data['user_beneficiary_document'],
                'user_beneficiary_document_type' => $data['user_beneficiary_document_type'],
                'city_id' => (isset($data['city_id'])) ? $data['city_id'] : $user->city_id,
                'user_rh' => (isset($data['user_rh'])) ? $data['user_rh'] : $user->user_rh,
                'user_model_category' => (isset($data['user_model_category'])) ? $data['user_model_category'] : $user->user_model_category,
                'user_personal_email' => $data['user_personal_email']
            ]);

            if ($user) {
                $this->log::storeLog($uAuth, 'users', $user->user_id, 'UPDATE', $before, $user, $request->ip);

                /////////////////
                // PERMISSIONS //
                /////////////////
                if (!empty($data['permissions'])) {
                    UserPermission::where('user_id', '=', $user->user_id)
                        ->whereNotIn('userperm_feature', array_keys($data['permissions']))
                        ->update([
                        'deleted_at' => new DateTime()
                    ]);

                    $exists = UserPermission::where('user_id', '=', $user->user_id)->whereNull('deleted_at')->get();

                    foreach ($data['permissions'] as $feat => $state) {
                        $existIndex = -1;
                        // loop exists searching exist index
                        for ($u = 0; $u < count($exists); $u++) {
                            if ($feat === $exists[$u]->userperm_feature) {
                                $existIndex = $u;
                            }
                        }

                        // update
                        if ($existIndex >= 0) {
                            $before = $exists[$existIndex];

                            $up = UserPermission::where('user_id', '=', $user->user_id)
                                ->where('userperm_feature', $feat)
                                ->whereNull('deleted_at')
                                ->first();

                            $up->update([
                                'userperm_state' => $state
                            ]);

                            $this->log::storeLog($uAuth, 'users_permissions', $up->userperm_id, 'UPDATE', $before, $up, $request->ip);

                        // create
                        }
                        else {
                            $up = UserPermission::create([
                                'user_id' => $user->user_id,
                                'userperm_feature' => $feat,
                                'userperm_state' => $state,
                            ]);

                            $this->log::storeLog($uAuth, 'users_permissions', $up->userperm_id, 'INSERT', null, $up, $request->ip);
                        }
                    }
                }
                ///////////////////////
                // END - PERMISSIONS //
                ///////////////////////
                if (($user->prof_id == 4 || $user->prof_id == 5) && $user->user_model_category == 'PAREJA' && ($uAuth->prof_id != 4 && $uAuth->prof_id != 5)) {
                    UserAdditionalModel::destroy($additional_models_todelete);
                    $additional_models_toinsert = array();
                    foreach ($additional_models as $key => $additional_model) {
                        if (isset($additional_model['usraddmod_id']) && $additional_model['usraddmod_id'] != 0) {
                            $additional_model_toupdate = array(
                                'usraddmod_name' => $additional_model['name'],
                                'usraddmod_identification' => $additional_model['identification'],
                                'usraddmod_birthdate' => $additional_model['birthdate'],
                                'usraddmod_category' => (isset($additional_model['model_category'])) ? $additional_model['model_category'] : null
                            );
                            UserAdditionalModel::where('usraddmod_id', $additional_model['usraddmod_id'])->update($additional_model_toupdate);
                        }
                        else {
                            $additional_models_toinsert[] = array(
                                'user_id' => $user->user_id,
                                'usraddmod_name' => $additional_model['name'],
                                'usraddmod_identification' => $additional_model['identification'],
                                'usraddmod_birthdate' => $additional_model['birthdate'],
                                'usraddmod_category' => (isset($additional_model['model_category'])) ? $additional_model['model_category'] : null
                            );
                        }
                    }
                    UserAdditionalModel::insert($additional_models_toinsert);
                }

                if (isset($data['users_coincidences']) && sizeof($users_coincidences) > 0) {
                    $skipped_coincidence = SkippedCoincidence::create([
                        'user_id_new' => $user->user_id,
                        'user_id_created_by' => $uAuth->user_id,
                        'skpcoin_observation' => $users_coincidences_observation,
                        'skpcoin_type' => 'UPDATE'
                    ]);
                    $coincidence_insert = [];
                    foreach ($users_coincidences as $user_coincidences) {
                        $coincidence_insert[] = array(
                            'skpcoin_id' => $skipped_coincidencia->skpcoin_id,
                            'coin_entity' => json_encode($user_coincidences),
                            'created_at' => now(),
                            'updated_at' => now()
                        );
                    }
                    Coincidence::insert($coincidence_insert);
                }
                return response()->json(['status' => 'success', 'data' => $user->user_id], 200);
            }
            else {
                return response()->json(['status' => 'fail'], 500);
            }
        }
        catch (Exception $e) {
            $response = $this->helper::errorArray($e);
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
    public function updateMyProfile(Request $request, $id)
    {
        try {
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

            $user = User::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'user_telephone' => 'nullable|max:255',
                'user_personal_email' => [
                    'nullable',
                    'max:255',
                    Rule::unique('users', 'user_personal_email')->ignore($id, 'user_id'),
                ],
            ], [
                'prof_id.exists' => 'Perfil no valido'
            ]);
            $before = User::findOrFail($id);

            $user->update([
                'user_telephone' => $data['user_telephone'],
                'city_id' => (isset($data['city_id'])) ? $data['city_id'] : $user->city_id,
                'user_personal_email' => $data['user_personal_email']
            ]);

            if ($user) {
                $this->log::storeLog($uAuth, 'users', $user->user_id, 'UPDATE', $before, $user, $request->ip);
                return response()->json(['status' => 'success', 'data' => $user->user_id], 200);
            }
            else {
                return response()->json(['status' => 'fail'], 500);
            }
        }
        catch (Exception $e) {
            $response = $this->helper::errorArray($e);
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
    public function setToken(Request $request)
    {
        $data = $request->all();
        // $uAuth = $request->auth;
        $uAuth = $request->user();

        DB::table('oauth_access_tokens')
            ->where('id', $request->user()->token()['id'])
            ->update(['fcm_token' => $data['fcm']]);

        return response()->json(['status' => 'success'], 200);
    }

    /**
     * Change user password
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function changePassword(Request $request, $id)
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

            $user = User::findOrFail($id);
            // validamos los datos
            $this->validate($request, ['user_password' => 'required|max:255']);

            $before = User::findOrFail($id);
            $user->update(['user_password' => bcrypt($data['user_password'])]);

            if ($user) {
                $this->log::storeLog($uAuth, 'users', $user->user_id, 'CHANGE_PASS', $before, $user, $request->ip);
                return response()->json(['status' => 'success', 'data' => $user->user_id], 200);
            }
            else {
                return response()->json(['status' => 'fail'], 500);
            }
        }
        catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Remove the specified resource from storage. * inactive user
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

            if ($uAuth->user_id === $id) {
                return response()->json([
                    'status' => 'fail',
                    'message' => 'user cannot delete himself'
                ], 400);
            }

            $request['id'] = $id;

            $this->validate($request, [
                'id' => 'required|integer|exists:users,user_id'
            ]);
            $user = User::findOrFail($id);
            $before = User::findOrFail($id);
            // $user->update([
            //     'deleted_at' => new DateTime()
            // ]);
            $user->delete();

            if ($user) {
                $this->log::storeLog($uAuth, 'users', $user->user_id, 'DELETE', $before, $user, $request->ip);
                return response()->json(['status' => 'success', 'data' => $user->user_id], 200);
            }
            else {
                return response()->json(['status' => 'fail'], 500);
            }
        }
        catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Active the specified resource from storage.
     *
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
    public function active(Request $request, $id)
    {
        try {
            $data = $request->all();
            // $uAuth = $request->auth;
            $uAuth = $request->user();

            $request['id'] = $id;
            //////////////////////////////////////
            //  RECUPERAR ULTIMO PERIODO        //
            //  DE ULTIMA TRANSACCION PENDIENTE //
            //////////////////////////////////////
            $date = date('Y-m-d');
            $period = PeriodController::retrieveOrCreatePeriod($date);
            if (isset($period) && $period->period_state === 'ABIERTO') {
                // consulta usada para obtener la ultima transaccion pendiente que no sea por activacion de usuario
                $last_pending_transaction = Transaction::join('transactions_types AS tt', 'tt.transtype_id', 'transactions.transtype_id')
                    ->where('transtype_behavior', 'SALDO PENDIENTE')
                    ->where('transactions.trans_pendingbalance', true)
                    ->where('transactions.trans_pendingbalance_unchanged_times', '!=', -1)
                    ->where('transactions.user_id', $id)
                    ->orderBy('transactions.created_at', 'DESC')
                    ->first();

                //entrar solo si se encontro una transaccion pendiente cuyo periodo sea anterior al periodo de la fecha actual
                if (isset($last_pending_transaction) && $last_pending_transaction->count() > 0 && strtotime($last_pending_transaction->trans_date) <= strtotime('last Sunday', strtotime($date))) {
                    $since_date = date('Y-m-d', strtotime('last monday', strtotime($last_pending_transaction->trans_date)));
                    $until_date = $last_pending_transaction->trans_date;

                    $models_streams = ModelStream::select('sm.user_id_model', 'models_streams.modstr_earnings_cop', 'sm.stdmod_id')
                        ->join('models_accounts AS ma', 'ma.modacc_id', 'models_streams.modacc_id')
                        ->join('studios_models AS sm', 'sm.stdmod_id', 'ma.stdmod_id')
                        ->where('modstr_date', $until_date)
                        ->where('sm.user_id_model', $id)
                        ->get(); // todos los streams de la fecha de $last_pending_transaction y el usuario actual
                    $transactions = Transaction::select('tt.transtype_group', 'user_id', 'trans_amount', 'trans_quantity', 'stdmod_id', 'trans_pendingbalance_unchanged_times')
                        ->join('transactions_types AS tt', 'tt.transtype_id', 'transactions.transtype_id')
                        ->whereBetween('transactions.trans_date', [$since_date, $until_date])
                        ->where('transactions.user_id', $id)
                        ->get(); // todas las transacciones de la fecha de $last_pending_transaction y el usuario actual
                    // entrar solo si existe alguna transaccion o streams
                    if ($transactions->count() > 0 || $models_streams->count() > 0) {
                        $transaction_type_balance = TransactionType::where('transtype_behavior', 'SALDO PENDIENTE')
                            ->whereNull('deleted_at')
                            ->orderBy('transtype_id', 'desc')
                            ->limit(2)
                            ->get();
                        // buscar que existan al menos dos tipos de transferencias con comportamiento SALDO PENDIENTE
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
                        // generar diccionario de los tipos de transaccion para que INGRESOS e EGRESOS redireccionen al id del tipo de transaccion usada
                        $transactions_types = array();
                        foreach ($transaction_type_balance as $transaction_type) {
                            $transactions_types[$transaction_type->transtype_group] = $transaction_type->transtype_id;
                        }
                        // generarar diccionario de donde las claves son usuario_id y el stdmod_id y el valor devuelto es el total que lleva el usuario para dicho contrato
                        $users_balance = array();
                        foreach ($models_streams as $last_week_model_stream) {
                            if (isset($last_week_model_stream->modstr_earnings_cop)) {
                                $user_id = $last_week_model_stream->user_id_model;
                                $earns = $last_week_model_stream->modstr_earnings_cop;
                                $stdmod_id = $last_week_model_stream->stdmod_id;
                                if (!isset($users_balance[$user_id])) {
                                    $users_balance[$user_id] = array();
                                }
                                $users_balance[$user_id][$stdmod_id] = (isset($users_balance[$user_id][$stdmod_id])) ? $earns + $users_balance[$user_id][$stdmod_id] : $earns;
                            }
                        }
                        foreach ($transactions as $transaction) {
                            if (isset($transaction->trans_amount)) {
                                $user_id = $transaction->user_id;
                                $earns_presigned = $transaction->trans_amount * $transaction->trans_quantity;
                                $earns = ($transaction->transtype_group == 'EGRESOS') ? -$earns_presigned : $earns_presigned;
                                $stdmod_id = $transaction->stdmod_id;
                                if (!isset($users_balance[$user_id])) {
                                    $users_balance[$user_id] = array();
                                }
                                $users_balance[$user_id][$stdmod_id] = (isset($users_balance[$user_id][$stdmod_id])) ? $earns + $users_balance[$user_id][$stdmod_id] : $earns;
                            }
                        }

                        $liquidated_transactions = Transaction::join('transactions_types AS tt', 'tt.transtype_id', 'transactions.transtype_id')
                            ->where('transtype_behavior', 'SALDO PENDIENTE')
                            ->where('transactions.trans_pendingbalance', true)
                            ->where('transactions.trans_pendingbalance_unchanged_times', '=', -1)
                            ->whereBetween('transactions.trans_date', [$period->period_start_date, $period->period_end_date])
                            ->where('transactions.user_id', $id)
                            ->get(); // encontrar las transacciones del periodo a insertar la transaccion que sean de tipo reactivacion de usuario (trans_pendingbalance_unchanged_times = -1)

                        //diccionario del total con llaves usuario_id y stdmod_id
                        $liquidated_transactions_dic = array();
                        foreach ($liquidated_transactions as $liquidated_transaction) {
                            if (!isset($liquidated_transactions_dic[$liquidated_transaction->user_id])) {
                                $liquidated_transactions_dic[$liquidated_transaction->user_id] = array();
                            }
                            $quantity = (isset($liquidated_transaction->trans_quantity)) ? $liquidated_transaction->trans_quantity : 1;
                            $liquidated_transactions_dic[$liquidated_transaction->user_id][$liquidated_transaction->stdmod_id] = $liquidated_transaction->trans_amount * $quantity;
                        }
                        //usado para insertar la suma de esas transacciones para cada usuario que no sean mayor a 30000
                        //o actualizar en caso de que cambie el balance y se haya vuelto a reactivar.
                        $transactions_insert = array();
                        foreach ($users_balance as $key => $stdmods) {
                            foreach ($stdmods as $key2 => $user_balance) {
                                if (isset($user_balance) && $user_balance <= 30000) {
                                    $balance = ($user_balance >= 0) ? $user_balance : -$user_balance;
                                    if (!isset($liquidated_transactions_dic[$key][$key2])) {
                                        $transactions_insert[] = array(
                                            'transtype_id' => ($user_balance >= 0) ? $transactions_types['INGRESOS'] : $transactions_types['EGRESOS'],
                                            'user_id' => $key,
                                            'prod_id' => NULL,
                                            'trans_date' => $period->period_end_date,
                                            'trans_description' => NULL,
                                            'trans_amount' => $balance,
                                            'trans_quantity' => 1,
                                            'trans_rtefte' => false, //deberia ser true?
                                            'created_at' => now(),
                                            'updated_at' => now(),
                                            'stdmod_id' => $key2,
                                            'trans_pendingbalance' => true,
                                            'trans_pendingbalance_unchanged_times' => -1 // determina que la transaccion es de tipo reactivar usuario
                                        );
                                    }
                                    else if (isset($liquidated_transactions_dic[$key]) && $liquidated_transactions_dic[$key][$key2] != $user_balance) {
                                        Transaction::join('transactions_types AS tt', 'tt.transtype_id', 'transactions.transtype_id')
                                            ->where('tt.transtype_behavior', 'SALDO PENDIENTE')
                                            ->where('transactions.user_id', $key)
                                            ->where('transactions.stdmod_id', $key2)
                                            ->where('transactions.trans_pendingbalance', true)
                                            ->whereBetween('transactions.trans_date', [$period->period_start_date, $period->period_end_date])
                                            ->update(['transactions.trans_amount' => $balance]);
                                    }
                                }
                            }
                        }
                        Transaction::insert($transactions_insert);
                    }
                }
            }
            //////////////////////////////////////
            //  FIN RECUPERAR ULTIMO PERIODO    //
            //  DE ULTIMA TRANSACCION PENDIENTE //
            //////////////////////////////////////

            $this->validate($request, [
                'id' => 'required|integer|exists:users,user_id'
            ]);
            $user = User::findOrFail($id);
            $before = User::findOrFail($id);
            $user->update([
                'user_active' => true
            ]);

            if ($user) {
                $this->log::storeLog($uAuth, 'users', $user->user_id, 'UPDATE', $before, $user, $request->ip);
                return response()->json(['status' => 'success', 'data' => $user->user_id], 200);
            }
            else {
                return response()->json(['status' => 'fail'], 500);
            }
        }
        catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Inactive the specified resource from storage.
     *
     * @param  int $id
     * @return \Illuminate\Http\Response
     */
    public function inactive(Request $request, $id)
    {
        try {
            $data = $request->all();
            // $uAuth = $request->auth;
            $uAuth = $request->user();

            $request['id'] = $id;

            $this->validate($request, [
                'id' => 'required|integer|exists:users,user_id'
            ]);
            $user = User::findOrFail($id);
            $before = User::findOrFail($id);
            $user->update([
                'user_active' => false
            ]);

            if ($user) {
                $this->log::storeLog($uAuth, 'users', $user->user_id, 'UPDATE', $before, $user, $request->ip);
                return response()->json(['status' => 'success', 'data' => $user->user_id], 200);
            }
            else {
                return response()->json(['status' => 'fail'], 500);
            }
        }
        catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    public function getUsersByProfile(Request $request, $prof_name)
    {
        try {
            $data = DB::select('SELECT * FROM users
            INNER JOIN profiles ON users.prof_id = profiles.prof_id
            WHERE profiles.prof_name = :profile_name', ['profile_name' => $prof_name]);
            return response()->json(['status' => 'success', 'data' => $data], 200);
        }
        catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Export
     *
     * @return excel
     */
    public function export(Request $request)
    {
        $tz = $request['tz'];
        unset($request['tz']);
        unset($request['tzo']);
        unset($request['access_token']);
        return Excel::download(new UsersExport($request, $tz), 'usuarios_' . date('Y-m-d') . '.xlsx');
    }

    public function uploadImage(Request $request, $id)
    {
        try {
            $data = $request->all();
            // $uAuth = $request->auth;
            $uAuth = $request->user();

            $record = User::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'files' => 'mimes:jpeg,bmp,png,gif,svg'
            ]);

            $before = User::findOrFail($id);

            if ($request->has('files')) {
                $file = $data['files'];
                $original_filename = $file->getClientOriginalName();
                $original_filename_arr = explode('.', $original_filename);
                $file_ext = end($original_filename_arr);
                $uploadedFileName = 'MODEL-' . $record->user_id . '.' . $file_ext;

                // save file in server
                $file->move(public_path('images/models'), $uploadedFileName);

                // create file record
                $record->user_image = $uploadedFileName;
                $record->save();
            }

            $this->log::storeLog($uAuth, 'users', $record->user_id, 'UPDATE', $before, $record, $request->ip);

            return response()->json(['status' => 'success', 'data' => $record->user_id], 200);
        }
        catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    public function deleteImage(Request $request, $id)
    {
        try {
            $data = $request->all();
            // $uAuth = $request->auth;
            $uAuth = $request->user();

            $record = User::findOrFail($id);
            // validamos los datos
            $this->validate($request, [
                'files' => 'mimes:jpeg,bmp,png,gif,svg'
            ]);

            $before = User::findOrFail($id);

            if ($request->has('files')) {
                $file = $data['files'];
                $original_filename = $file->getClientOriginalName();
                $original_filename_arr = explode('.', $original_filename);
                $file_ext = end($original_filename_arr);
                $uploadedFileName = 'MODEL-' . $record->user_id . '.' . $file_ext;

                // save file in server
                $file->move(public_path('images/models'), $uploadedFileName);

                // create file record
                $record->user_image = $uploadedFileName;
                $record->save();
            }

            $this->log::storeLog($uAuth, 'users', $record->user_id, 'UPDATE', $before, $record, $request->ip);

            return response()->json(['status' => 'success', 'data' => $record->user_id], 200);
        }
        catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    public function getUserCoincide(Request $request)
    {
        try {
            $user_coincide_fields = [
                ['user_name', 'user_surname'],
                ['user_identification']
            ];

            $user_db_to_client_fields = [
                'user_document_type' => 'identification_type',
                'user_identification' => 'identification',
                'user_birthdate' => 'birthdate',
                'user_name' => 'name',
                'user_surname' => 'surname'
            ];
            $users_query = User::query()->whereNull('deleted_at');
            $data = $request->all();
            $users_query->where(function ($query) use ($user_coincide_fields, $user_db_to_client_fields, $data) {
                foreach ($user_coincide_fields as $user_coincide_field) {
                    $query->orWhere(function ($query) use ($user_coincide_field, $user_db_to_client_fields, $data) {
                                foreach ($user_coincide_field as $field) {
                                    $filter = ($data[$user_db_to_client_fields[$field]] != '') ? $data[$user_db_to_client_fields[$field]] : 's#sv24ga&SvD5Ae1332iJ';
                                    $query->where($field, $filter);
                                }
                            }
                            );
                        }
                    });
            $id = $data['id'];
            if (isset($id) && $id != 0) {
                $already_skipped_coincidences = SkippedCoincidence::join('coincidences AS c', 'skipped_coincidences.skpcoin_id', 'c.skpcoin_id')
                    ->where('user_id_new', $id)
                    ->pluck('c.coin_entity');

                $skipped_coincidence_ids = array($id);
                foreach ($already_skipped_coincidences as $skipped_coincidence) {
                    $user = json_decode($skipped_coincidence);
                    $skipped_coincidence_ids[] = $user->user_id;
                }

                $users_query->where(function ($query) use ($skipped_coincidence_ids) {
                    $query->whereNotIn('user_id', $skipped_coincidence_ids);
                });
            }
            $users = $users_query->get();
            $unsubmittable = ($users->contains('user_identification', $data['identification'])) ? true : false;
            return response()->json(['status' => 'success', 'data' => $users, 'unsubmittable' => $unsubmittable], 200);
        }
        catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Overwrite user data with only the fields that are sent.
     * se diferencia con edit user en que se usa el mismo elemento si no llega a cambiar el valor
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function overwriteUser(Request $request, $id)
    {
        try {
            DB::beginTransaction();
            $data = $request->all();
            $uAuth = $request->user();

            // Validar token
            if (!isset($uAuth->user_id)) {
                return response()->json([
                    'status' => 'fail',
                    'code' => 'INVALID_TOKEN',
                    'message' => 'El token de sesión ha expirado',
                ], 400);
            }
            // Buscar usuario
            $user = User::findOrFail($id);

            // Validar datos
            $this->validate($request, [
                'user_identification' => ['nullable', 'max:255'],
                'user_identification_type' => ['nullable', 'max:255'],
                'user_issued_in' => ['nullable', 'max:255'],
                'user_name' => ['required', 'max:255'],
                'user_name2' => ['nullable', 'max:255'],
                'user_surname' => ['nullable', 'max:255'],
                'user_surname2' => ['nullable', 'max:255'],
                'user_email' => [
                    'nullable',
                    'email',
                    'max:255',
                    Rule::unique('users', 'user_email')->ignore($id, 'user_id'),
                ],
                'prof_id' => ['nullable', 'exists:profiles,prof_id'],
                'user_sex' => ['nullable', 'max:255'],
                'user_telephone' => ['nullable', 'max:255', 'min:6'],
                'user_address' => ['nullable', 'max:255'],
                'user_rh' => ['nullable', 'max:20'],
                'user_model_category' => ['nullable', 'max:40'],
                'user_personal_email' => [
                    'nullable',
                    'email',
                    'max:255',
                    Rule::unique('users', 'user_personal_email')->ignore($id, 'user_id'),
                ],
            ], [
                'prof_id.exists' => 'Perfil no válido',
                'user_telephone.min' => 'El teléfono debe tener al menos 6 caracteres.',
                'user_email.unique' => 'El correo electrónico ya está registrado.',
                'user_email.email' => 'El correo electrónico debe ser una dirección válida.',
                'user_personal_email.unique' => 'El correo personal ya está registrado.',
                'user_personal_email.email' => 'El correo personal debe ser una dirección válida.',
            ]);
            $before = User::findOrFail($id);
            $user->update([
                'user_identification' => isset($data['user_identification']) ? $data['user_identification'] : $user->user_identification,
                'user_identification_type' => isset($data['user_identification_type']) ? $data['user_identification_type'] : $user->user_identification_type,
                'user_issued_in' => isset($data['user_issued_in']) ? $data['user_issued_in'] : $user->user_issued_in,
                'user_name' => isset($data['user_name']) ? $data['user_name'] : $user->user_name,
                'user_name2' => isset($data['user_name2']) ? $data['user_name2'] : $user->user_name2,
                'user_surname' => isset($data['user_surname']) ? $data['user_surname'] : $user->user_surname,
                'user_surname2' => isset($data['user_surname2']) ? $data['user_surname2'] : $user->user_surname2,
                'prof_id' => isset($data['prof_id']) ? $data['prof_id'] : $user->prof_id,
                'user_active' => isset($data['user_active']) ? $data['user_active'] : $user->user_active,
                'user_sex' => isset($data['user_sex']) ? $data['user_sex'] : $user->user_sex,
                'user_telephone' => isset($data['user_telephone']) ? $data['user_telephone'] : $user->user_telephone,
                'user_birthdate' => isset($data['user_birthdate']) ? $data['user_birthdate'] : $user->user_birthdate,
                'user_address' => isset($data['user_address']) ? $data['user_address'] : $user->user_address,
                'user_bank_entity' => isset($data['user_bank_entity']) ? $data['user_bank_entity'] : $user->user_bank_entity,
                'user_bank_account' => isset($data['user_bank_account']) ? $data['user_bank_account'] : $user->user_bank_account,
                'user_bank_account_type' => isset($data['user_bank_account_type']) ? $data['user_bank_account_type'] : $user->user_bank_account_type,
                'user_beneficiary_name' => isset($data['user_beneficiary_name']) ? $data['user_beneficiary_name'] : $user->user_beneficiary_name,
                'user_beneficiary_document' => isset($data['user_beneficiary_document']) ? $data['user_beneficiary_document'] : $user->user_beneficiary_document,
                'user_beneficiary_document_type' => isset($data['user_beneficiary_document_type']) ? $data['user_beneficiary_document_type'] : $user->user_beneficiary_document_type,
                'city_id' => isset($data['city_id']) ? $data['city_id'] : $user->city_id,
                'user_rh' => isset($data['user_rh']) ? $data['user_rh'] : $user->user_rh,
                'user_model_category' => isset($data['user_model_category']) ? $data['user_model_category'] : $user->user_model_category,
                'user_personal_email' => isset($data['user_personal_email']) ? $data['user_personal_email'] : $user->user_personal_email
            ]);
            if ($user) {
                $this->log::storeLog($uAuth, 'users', $user->user_id, 'UPDATE', $before, $user, $request->ip);
                if (($user->prof_id == 4 || $user->prof_id == 5) && $user->user_model_category == 'PAREJA' && ($uAuth->prof_id != 4 && $uAuth->prof_id != 5)) {
                    UserAdditionalModel::destroy($additional_models_todelete);
                    $additional_models_toinsert = array();
                    foreach ($additional_models as $key => $additional_model) {
                        if (isset($additional_model['usraddmod_id']) && $additional_model['usraddmod_id'] != 0) {
                            $additional_model_toupdate = array(
                                'usraddmod_name' => $additional_model['name'],
                                'usraddmod_identification' => $additional_model['identification'],
                                'usraddmod_birthdate' => $additional_model['birthdate'],
                                'usraddmod_category' => (isset($additional_model['model_category'])) ? $additional_model['model_category'] : null
                            );
                            UserAdditionalModel::where('usraddmod_id', $additional_model['usraddmod_id'])->update($additional_model_toupdate);
                        }
                        else {
                            $additional_models_toinsert[] = array(
                                'user_id' => $user->user_id,
                                'usraddmod_name' => $additional_model['name'],
                                'usraddmod_identification' => $additional_model['identification'],
                                'usraddmod_birthdate' => $additional_model['birthdate'],
                                'usraddmod_category' => (isset($additional_model['model_category'])) ? $additional_model['model_category'] : null
                            );
                        }
                    }
                    UserAdditionalModel::insert($additional_models_toinsert);
                }
                DB::commit();
                return response()->json(['status' => 'success', 'data' => $user], 200);
            }
        }
        catch (\Exception $e) {
            DB::rollback();
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    public function getChiefMonitorsRelations(Request $request)
    {
        try {
            $user_id = (in_array($request->user()->prof_id, [Profile::ESTUDIO, PROFILE::GESTOR])) ? $request->user()->user_id : null;
            $records = $this->getUserRelations(null, $user_id);

            $users = [];
            foreach ($records as $r => $row) {
                $tree_route = $this->pgArrayToPhpArray($row->routee);
                $users = $this->buildUserTree($users, $row, $tree_route);
            }
            // Convierte a arrays indexados para el frontend
            $users = $this->treeToIndexedArray($users);
            return response()->json(['status' => 'success', 'data' => $users], 200);
        }
        catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    // recibe un id de usuario y devuelve un array de id de usuarios descendientes
    public function getUserRelations($user_id = null, $user_id_owner = null)
    {
        $conditions = ($user_id == null) ? "u.prof_id = 7" : "u.user_id = " . $user_id;
        if ($user_id_owner !== null && is_numeric($user_id_owner)) {
            $conditions .= " AND s.user_id_owner = " . $user_id_owner;
        }

        $records = DB::select("WITH RECURSIVE hierarchy AS (
            SELECT
            TRIM(
                COALESCE(u.user_name, '') || ' ' ||
                COALESCE(u.user_name2, '') || ' ' ||
                COALESCE(u.user_surname, '') || ' ' ||
                COALESCE(u.user_surname2, '')
            ) AS userparent_name,
            u.user_id AS userparent_id,
            TRIM(
                COALESCE(u2.user_name, '') || ' ' ||
                COALESCE(u2.user_name2, '') || ' ' ||
                COALESCE(u2.user_surname, '') || ' ' ||
                COALESCE(u2.user_surname2, '')
            ) AS userchild_name,
            uu.userchild_id,
            u2.prof_id,
            ARRAY[u.user_id]::int[] AS routee
            FROM users u
            LEFT JOIN users_users uu ON u.user_id = uu.userparent_id
            LEFT JOIN users u2 ON u2.user_id = uu.userchild_id
            INNER JOIN studios_models sm ON sm.user_id_model = u.user_id
            INNER JOIN studios s ON s.std_id = sm.std_id
            WHERE u.user_active = TRUE
            AND $conditions

            UNION ALL

            SELECT
            TRIM(
                COALESCE(u.user_name, '') || ' ' ||
                COALESCE(u.user_name2, '') || ' ' ||
                COALESCE(u.user_surname, '') || ' ' ||
                COALESCE(u.user_surname2, '')
            ) AS userparent_name,
            uu.userparent_id,
            TRIM(
                COALESCE(u2.user_name, '') || ' ' ||
                COALESCE(u2.user_name2, '') || ' ' ||
                COALESCE(u2.user_surname, '') || ' ' ||
                COALESCE(u2.user_surname2, '')
            ) AS userchild_name,
            uu.userchild_id,
            u2.prof_id,
            j.routee || uu.userparent_id
            FROM users_users uu
            INNER JOIN hierarchy j ON uu.userparent_id = j.userchild_id
            INNER JOIN users u ON uu.userparent_id = u.user_id
            INNER JOIN users u2 ON uu.userchild_id = u2.user_id
        )
        SELECT * FROM hierarchy;"); //COMPROBAR QUE AL INSERTAR UN PADRE COMO HIJO DE SU HIJO NO SE PUEDA EN BASE DE DATOS
        return $records;
    }
    public function getAllDescendantUserIds($user_id, $bool_onlymodels = false)
    {
        $relations = $this->getUserRelations($user_id);
        return collect($relations)
            ->filter(function ($relation) use ($bool_onlymodels) {
            if ($bool_onlymodels) {
                return ($relation->prof_id == 4 || $relation->prof_id == 5);
            }
            return true;
        })
            ->pluck('userchild_id')
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
    //convierte un array de postgres a un array de php
    private function pgArrayToPhpArray(string $pgArray): array
    {
        // Elimina las llaves de PostgreSQL array
        $pgArray = trim($pgArray, '{}');
        // Si está vacío, devuelve un array vacío
        if ($pgArray === '') {
            return [];
        }
        // Divide por comas y devuelve el array
        return explode(',', $pgArray);
    }

    //usando un arbol con o sin valores introduce un nuevo elemento en el arbol en el sitio que le corresponde
    // $user_tree es el arbol de usuarios
    // $row es el elemento a insertar
    // $tree_route es el camino que lleva al elemento a insertar
    // $depth es la profundidad del arbol
    private function buildUserTree($user_tree, $row, $tree_route, $depth = 0)
    {
        //paso base
        if (sizeof($tree_route) == 0 && !isset($user_tree[$row->userchild_id]) && $row->userchild_id !== null) { // el fin del arreglo de direcciones
            $user_tree[$row->userchild_id] = array(
                'user_id' => $row->userchild_id,
                'user_name' => $row->userchild_name,
                'users' => array()
            );
        }
        else if (sizeof($tree_route) == 1 && $depth == 0 && !isset($user_tree[$row->userparent_id])) { // paso recursivo caso 1// es un elemento padre semilla
            $user_tree[$row->userparent_id] = array(
                'user_id' => $row->userparent_id,
                'user_name' => $row->userparent_name,
                'users' => $this->buildUserTree([], $row, array_slice($tree_route, 1), $depth + 1)
            );
        }
        else if (isset($tree_route[0]) && $tree_route[0] != 'NULL') { //paso recursivo caso 2
            $user_tree[$tree_route[0]]['users'] = $this->buildUserTree($user_tree[$tree_route[0]]['users'], $row, array_slice($tree_route, 1), $depth + 1);
        }

        return $user_tree;
    }

    // Convierte todos los arrays asociativos de hijos (users) a arrays indexados recursivamente
    private function treeToIndexedArray($tree)
    {
        if (!empty($tree) && array_keys($tree) !== range(0, count($tree) - 1)) {
            $tree = array_values($tree);
        }
        foreach ($tree as &$node) {
            if (isset($node['users'])) {
                $node['users'] = $this->treeToIndexedArray($node['users']);
            }
        }
        return $tree;
    }

    public function storeMonitorsRelations(Request $request)
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
            $this->validate($request, [
                'userchild_id' => 'required|integer|exists:users,user_id',
                'userparent_id' => 'required|integer|exists:users,user_id'
            ]);
            // creamos un nuevo usuario
            $user = UserUser::create($data);
            if ($user) {
                DB::commit();
                return response()->json(['status' => 'success', 'data' => $user], 201);
            }
            else {
                DB::rollBack();
                return response()->json(['status' => 'fail']);
            }
        }
        catch (Exception $e) {
            DB::rollBack();
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    public function deleteMonitorsRelations(Request $request, $userParentId, $userChildId)
    {
        try {
            $request['userChildId'] = $userChildId;
            $request['userParentId'] = $userParentId;
            $this->validate($request, [
                'userChildId' => 'required|integer|exists:users_users,userchild_id',
                'userParentId' => 'required|integer|exists:users_users,userparent_id'
            ]);
            $user = UserUser::where('userchild_id', $userChildId)->where('userparent_id', $userParentId)->first();
            $user->delete();

            if ($user) {
                return response()->json(['status' => 'success', 'data' => $user], 200);
            }
            else {
                return response()->json(['status' => 'fail'], 500);
            }
        }
        catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }
    //get only monitors of a chief monitor
    public function getMonitorsOfChiefMonitor(Request $request, $id)
    {
        try {
            $uAuth = $request->user();
            $chief_monitor = User::findOrFail($id);
            if ($chief_monitor) {
                $monitors = User::join('users_users AS uu', 'uu.userchild_id', 'users.user_id')
                    ->where('uu.userparent_id', $id)
                    ->where('users.prof_id', 8)
                    ->select(
                    'users.user_id',
                    DB::raw(
                    "COALESCE(users.user_name, '') || ' ' || " .
                    "COALESCE(users.user_name2, '') || ' ' || " .
                    "COALESCE(users.user_surname, '') || ' ' || " .
                    "COALESCE(users.user_surname2, '') AS user_name"
                )
                )
                    ->get();
                return response()->json(['status' => 'success', 'data' => $monitors], 200);
            }
            else {
                return response()->json(['status' => 'fail'], 500);
            }
        }
        catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }

    }
}
