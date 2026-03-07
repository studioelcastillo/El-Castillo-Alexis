<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Exception;
use DateTime;

use App\Library\HelperController;
use App\Library\LogController;
use App\Models\Profile;
use App\Models\User;

class ProfileController extends Controller
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
        try {
            $data = $request->all();
            // $uAuth = $request->auth;
            $uAuth = $request->user();

            // validamos los datos
            $this->validate($request, [
                'prof_name' => 'required'
            ]);

            $data['prof_name'] = strtoupper($data['prof_name']);

            $profile = Profile::create($data);
            if ($profile) {
                $this->log::storeLog($uAuth, 'profiles', $profile->prof_id, 'INSERT', null, $profile, $request->ip);
                return response()->json(['status' => 'success', 'data' => $profile], 201);
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
    public function show(Request $request)
    {
        try {
            $data = $this->helper::generateConditions($request);
            $profs_id = array(3, 9, 10, 12, 13);
            if ($request->user()->prof_id == Profile::ESTUDIO) {
                $profs_id = array_merge($profs_id, [1, 2, 3, 6, 11]);
            } else if ($request->user()->prof_id == Profile::JEFE_MONITOR) {
                $profs_id = array_merge($profs_id, [1, 2, 3, 6, 7, 11]);
            } else if ($request->user()->prof_id == Profile::MONITOR) {
                $profs_id = array_merge($profs_id, [1, 2, 3, 6, 7, 8, 11]);
            }
            if ($request->user()->prof_id != Profile::ADMIN) {
                $profs_id[] = 1;
            }
            $profiles = Profile::where($data['where'])
            ->orWhere($data['orWhere'])
            ->whereRaw($data['whereRaw'])
            ->whereNotIn('prof_id', $profs_id)
            ->whereNull('deleted_at')
            ->orderBy('prof_id', 'ASC')
            ->get();

            return response()->json(['status' => 'success', 'data' => $profiles], 200);
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
    public function update(Request $request, $id)
    {
        try {
            $data = $request->all();
            // $uAuth = $request->auth;
            $uAuth = $request->user();

            $this->validate($request, [
                'prof_name' => 'required'
            ]);
            $data['prof_name'] = strtoupper($data['prof_name']);
            $profile = Profile::findOrFail($id);
            $before = Profile::findOrFail($id);
            $profile->update([
                'prof_name' => $data['prof_name']
            ]);

            if ($profile) {
                $this->log::storeLog($uAuth, 'profiles', $profile->prof_id, 'UPDATE', $before, $profile, $request->ip);
                return response()->json(['status' => 'success', 'data' => $profile->prof_id], 200);
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

            $request['id'] = $id;

            $this->validate($request, [
                'id' => 'required|integer|noExists:users,prof_id'
            ]);

            $profile = Profile::findOrFail($id);
            $before = Profile::findOrFail($id);
            $profile->delete();

            if ($profile) {
                $this->log::storeLog($uAuth, 'profiles', $before->prof_id, 'DELETE', $before, null, $request->ip);
                return response()->json(['status' => 'success', 'data' => $profile->prof_id], 200);
            } else {
                return response()->json(['status' => 'fail'], 500);
            }
        } catch (Exception $e) {
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }
}
