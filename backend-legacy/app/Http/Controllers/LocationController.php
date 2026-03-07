<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Models\Country;
use App\Models\Department;
use App\Models\City;

use App\Library\HelperController;
use App\Library\LogController;

class LocationController extends Controller
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
    public function storeCountry(Request $request)
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
            $this->validate($request, [ 'country_name' => 'required|max:255' ]);

            // validate unicity
            if (Country::where('country_name', $data['country_name'])->count() > 0) {
                $response = array(
                    'code' => 400,
                    'errors' => [],
                    'error' => [
                        'code' => 'COUNTRY_ALREADY_EXISTS',
                        'message' => 'El país "'.$data['country_name'].'" ya existe en la base de datos.',
                    ],
                );
                throw new \Exception(json_encode($response));
            }

            // create record
            $record = Country::create(['country_name' => (isset($data['country_name'])) ? strtoupper($data['country_name']) : null ]);
            if ($record) {
                $this->log::storeLog($uAuth, 'country', $record->country_id, 'INSERT', null, $record, $request->ip);
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
    public function storeDepartment(Request $request)
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
                'country_id' => 'required|exists:countries,country_id',
                'dpto_name' => 'required|max:255'
            ]);

            // validate unicity
            if (Department::where('dpto_name', $data['dpto_name'])->where('country_id', $data['country_id'])->count() > 0) {
                $response = array(
                    'code' => 400,
                    'errors' => [],
                    'error' => [
                        'code' => 'DEPARTAMENT_ALREADY_EXISTS',
                        'message' => 'El departamento "'.$data['dpto_name'].'" ya existe en la base de datos.',
                    ],
                );
                throw new \Exception(json_encode($response));
            }

            // create record
            $record = Department::create([
                'dpto_name' => (isset($data['dpto_name'])) ? strtoupper($data['dpto_name']) : null,
                'country_id' => (isset($data['country_id'])) ? $data['country_id'] : null
            ]);
            if ($record) {
                $this->log::storeLog($uAuth, 'department', $record->dpto_id, 'INSERT', null, $record, $request->ip);
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
    public function storeCity(Request $request)
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
                'dpto_id' => 'required|exists:departments,dpto_id',
                'city_name' => 'required|max:255'
            ]);

            // validate unicity
            if (City::where('city_name', $data['city_name'])->where('dpto_id', $data['dpto_id'])->count() > 0) {
                $response = array(
                    'code' => 400,
                    'errors' => [],
                    'error' => [
                        'code' => 'CITY_ALREADY_EXISTS',
                        'message' => 'La ciudad "'.$data['city_name'].'" ya existe en la base de datos.',
                    ],
                );
                throw new \Exception(json_encode($response));
            }

            // create record
            $record = City::create([
                'city_name' => (isset($data['city_name'])) ? strtoupper($data['city_name']) : null,
                'dpto_id' => (isset($data['dpto_id'])) ? $data['dpto_id'] : null
            ]);
            if ($record) {
                $this->log::storeLog($uAuth, 'cities', $record->city_id, 'INSERT', null, $record, $request->ip);
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
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function updateCountry(Request $request, $id)
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
            // validamos los datos
            $this->validate($request, [ 'country_name' => 'required|max:255' ]);

            $record = Country::findOrFail($id);
            $before = Country::findOrFail($id);

            // validate unicity
            if (Country::where('country_name', $data['country_name'])->whereNot('country_id', $id)->count() > 0) {
                $response = array(
                    'code' => 400,
                    'errors' => [],
                    'error' => [
                        'code' => 'COUNTRY_ALREADY_EXISTS',
                        'message' => 'El país "'.$data['country_name'].'" ya existe en la base de datos.',
                    ],
                );
                throw new \Exception(json_encode($response));
            }

            $record->update([ 'country_name' => (isset($data['country_name'])) ? strtoupper($data['country_name']) : null ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'countries', $record->country_id, 'UPDATE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->country_id], 200);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }
        } catch (Exception $e) {
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
    public function updateDepartment(Request $request, $id)
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
            // validamos los datos
            $this->validate($request, [ 'dpto_name' => 'required|max:255' ]);

            $record = Department::findOrFail($id);
            $before = Department::findOrFail($id);

            // validate unicity
            if (Department::where('dpto_name', $data['dpto_name'])->where('country_id', $record->country_id)->whereNot('dpto_id', $id)->count() > 0) {
                $response = array(
                    'code' => 400,
                    'errors' => [],
                    'error' => [
                        'code' => 'DEPARTAMENT_ALREADY_EXISTS',
                        'message' => 'El departamento "'.$data['dpto_name'].'" ya existe en la base de datos.',
                    ],
                );
                throw new \Exception(json_encode($response));
            }

            $record->update(['dpto_name' => (isset($data['dpto_name'])) ? strtoupper($data['dpto_name']) : null ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'departments', $record->dpto_id, 'UPDATE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->dpto_id], 200);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }
        } catch (Exception $e) {
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
    public function updateCity(Request $request, $id)
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
            // validamos los datos
            $this->validate($request, [ 'city_name' => 'required|max:255' ]);

            $record = City::findOrFail($id);
            $before = City::findOrFail($id);

            // validate unicity
            if (City::where('city_name', $data['city_name'])->where('dpto_id', $record->dpto_id)->whereNot('city_id', $id)->count() > 0) {
                $response = array(
                    'code' => 400,
                    'errors' => [],
                    'error' => [
                        'code' => 'CITY_ALREADY_EXISTS',
                        'message' => 'La ciudad "'.$data['city_name'].'" ya existe en la base de datos.',
                    ],
                );
                throw new \Exception(json_encode($response));
            }

            $record->update([
                'city_name' => (isset($data['city_name'])) ? strtoupper($data['city_name']) : null
            ]);

            if ($record) {
                $this->log::storeLog($uAuth, 'cities', $record->city_id, 'UPDATE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->city_id], 200);
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
    public function destroyCountry(Request $request, $id)
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

            // validate relations
            $request['id'] = $id;
            $errors = $this->helper->validateWithMessages($request, [
                'id' => [
                    'required' => '',
                    'integer' => '',
                    'exists:countries,country_id' => '',
                    'unique:departments,country_id' => 'El registro esta asociado a "Departamentos"'
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = Country::findOrFail($id);
            $before = Country::findOrFail($id);
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'countries', $record->country_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->country_id], 200);
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
    public function destroyDepartment(Request $request, $id)
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

            // validate relations
            $request['id'] = $id;
            $errors = $this->helper->validateWithMessages($request, [
                'id' => [
                    'required' => '',
                    'integer' => '',
                    'exists:departments,dpto_id' => '',
                    'unique:cities,dpto_id' => 'El registro esta asociado a "Ciudades"'
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = Department::findOrFail($id);
            $before = Department::findOrFail($id);
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'departments', $record->dpto_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->dpto_id], 200);
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
    public function destroyCity(Request $request, $id)
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

            // validate relations
            $request['id'] = $id;
            $errors = $this->helper->validateWithMessages($request, [
                'id' => [
                    'required' => '',
                    'integer' => '',
                    'exists:cities,city_id' => '',
                    'unique:users,city_id' => 'El registro esta asociado a "Usuarios"',
                    'unique:studios_models,city_id' => 'El registro esta asociado a "Contratos"',
                    'unique:studios,city_id' => 'El registro esta asociado a "Estudios"'
                ]
            ]);
            if (!empty($errors)) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $errors,
                ], 422);
            }

            $record = City::findOrFail($id);
            $before = City::findOrFail($id);
            $record->delete();

            if ($record) {
                $this->log::storeLog($uAuth, 'cities', $record->city_id, 'DELETE', $before, $record, $request->ip);
                return response()->json(['status' => 'success', 'data' => $record->city_id], 200);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function getLocations(Request $request)
    {
        try {
            $locations = Country::with('departments.cities')->orderBy('country_name')->get();
            return response()->json(['status' => 'success', 'data' => $locations], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function countries(Request $request)
    {
        try {
            $countries = Country::orderBy('country_name')->get();
            return response()->json(['status' => 'success', 'data' => $countries], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function departments(Request $request, $country_id)
    {
        try {
            $departments = Department::where('country_id', $country_id)->orderBy('dpto_name')->get();
            return response()->json(['status' => 'success', 'data' => $departments], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            //$response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function cities(Request $request, $dpto_id)
    {
        try {
            $cities = City::where('dpto_id', $dpto_id)->orderBy('city_name')->get();
            return response()->json(['status' => 'success', 'data' => $cities], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            //$response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }
}
