<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

use App\Library\HelperController;
use App\Library\LogController;
use App\Requests\Auth\LoginDto;
use App\Requests\Auth\NewPasswordDto;
use App\Requests\Auth\RecoveryPasswordDto;
use App\Requests\Auth\ChangePasswordDto;
use App\Requests\Auth\AuthSession;
use App\Models\User;
use App\Models\Policy;
use App\Models\AgreementUserPolicy;
use App\Models\LoginHistory;

use Laravel\Socialite\Facades\Socialite;
use App\Services\SocialAccountsService;
use Illuminate\Support\Facades\Session;

/**
 * @OA\Info(
 *   title="SIH-CALIDAD",
 *   version="0.1",
 *   description="SIH CALIDAD - Documentation",
 *   x={
 *      "logo": {
 *          "url": ""
 *      }
 *   }
 * )
 * 
 * @OA\Server(
 *      url=L5_SWAGGER_CONST_HOST,
 *      description="API Server"
 * )
 *
 * @OA\SecurityScheme(
 *     type="http",
 *     description="Authentication Bearer Token",
 *     name="Authentication Bearer Token",
 *     in="header",
 *     scheme="bearer",
 *     bearerFormat="JWT",
 *     securityScheme="Authentication",
 * )
*/
class AuthController extends Controller
{
    public const PROVIDERS = ['google', 'facebook', 'github'];
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
     * @OA\Post(
     *   path="/api/auth/login",
     *   tags={"AUTH"},
     *   summary="iniciar session",
     *   description="Returna token",
     *   @OA\RequestBody(
     *     required=true,
     *     description="informacion requerida",
     *     @OA\JsonContent(ref="#/components/schemas/LoginDto"),
     *   ),
     *
     *   @OA\Response(
     *     response=200,
     *     description="Operacion exitosa",
     *     @OA\JsonContent(ref="#/components/schemas/SuccessResponse"),
     *   ),
     *
     *   @OA\Response(
     *     response="default",
     *     description="Operacion fallida",
     *     @OA\JsonContent(ref="#/components/schemas/ErrorResponse"),
     *   )
     * )
     *
     * login.
     *
     * @return response()->json
     */
    public function login(LoginDto $loginDto)
    {   
        try {
            DB::beginTransaction();
            $policy = Policy::find($loginDto->policy_id);
            if (!isset($policy)) {
                return response()->json([
                    'message' => 'Politica no encontrada'
                ], 402);
            }
            if (!$loginDto->policy_answer) {
                return response()->json([
                    'message' => 'Politica no aceptada'
                ], 403);
            }

            $credentials = array(
                'user_email' => $loginDto->email,
                'password' => $loginDto->password
            );

            if (!Auth::guard('web')->attempt($credentials)) {
                return response()->json([
                    'message' => 'Unauthorized'
                ], 401);
            }

            $user = Auth::guard('web')->user();
            AgreementUserPolicy::create([ 'pol_id' => $loginDto->policy_id, 'user_id' => $user->user_id, 'aggusrpol_agreement' => true ]);
            // $request->user();
            // $token = Auth::guard('regular_user')->user()->createToken('auth_token')->accessToken;
            $tokenResult = $user->createToken('Personal Access Token');
            $token = $tokenResult->token;
            // if ($request->remember_me)
            //     $token->expires_at = Carbon::now()->addWeeks(1);
            $token->expires_at = now()->addMinutes(1);//now()->addHours(1);
            $token->save();

            $loghist = LoginHistory::create([
                'user_id' => $user->user_id,
                'lgnhist_login' => now(),
                'lgnhist_logout' => null,
                'lgnhist_expire_at' => Carbon::parse($token->expires_at)->toDateTimeString()
            ]);

            $data = array(
                'access_token' => $tokenResult->accessToken,
                'token_type' => 'Bearer',
                'expires_at' => Carbon::parse($token->expires_at)->toDateTimeString(),
                'user' => $user
            );
            DB::commit();
            return $this->successResponse($data, 'User logged');
        } catch (Exception $e) {
            DB::rollBack();
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * @OA\Post(
     *   path="/api/auth/logout",
     *   tags={"AUTH"},
     *   summary="cerrar session",
     *   description="Returna token",
     *   security={{ "bearer_token": {} }},
     *   @OA\Response(
     *     response=200,
     *     description="Operacion exitosa",
     *     @OA\JsonContent(ref="#/components/schemas/SuccessResponse"),
     *   ),
     *
     *   @OA\Response(
     *     response="default",
     *     description="Operacion fallida",
     *     @OA\JsonContent(ref="#/components/schemas/ErrorResponse"),
     *   )
     * )
     *
     * logout.
     *
     * @return response()->json
     */
    public function logout(Request $request)
    {
        try {
            DB::beginTransaction();
            $uAuth = $request->user();
            $loghist = LoginHistory::where('user_id', $uAuth->user_id)
            ->where('lgnhist_expire_at', '>', now())
            ->orderBy('lgnhist_id', 'DESC')
            ->first();
            $loghist->lgnhist_logout = now();
            $loghist->save();

            $request->user()->token()->revoke();
            DB::commit();

            return $this->successResponse([], 'Successfully logged out');
        } catch (Exception $e) {
            DB::rollBack();
            $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    /**
     * @OA\Get(
     *   path="/api/auth/user",
     *   tags={"AUTH"},
     *   summary="obtener usuario",
     *   description="Returna user",
     *   security={{ "bearer_token": {} }},
     *   @OA\Response(
     *     response=200,
     *     description="Operacion exitosa",
     *     @OA\JsonContent(ref="#/components/schemas/SuccessResponse"),
     *   ),
     *
     *   @OA\Response(
     *     response="default",
     *     description="Operacion fallida",
     *     @OA\JsonContent(ref="#/components/schemas/ErrorResponse"),
     *   )
     * )
     *
     * user.
     *
     * @return response()->json
     */
    public function user(AuthSession $auth)
    {
        return $this->successResponse(['user' => $auth], 'Token active');
    }


    /**
     * @OA\Post(
     *   path="/api/auth/recoveryPassword",
     *   tags={"AUTH"},
     *   summary="recuperar contrase�a",
     *   description="Solicita un correo con token para cambio de contrase�a",
     *   @OA\RequestBody(
     *     required=true,
     *     description="informacion requerida",
     *     @OA\JsonContent(ref="#/components/schemas/RecoveryPasswordDto"),
     *   ),
     *
     *   @OA\Response(
     *     response=200,
     *     description="Operacion exitosa",
     *     @OA\JsonContent(ref="#/components/schemas/SuccessResponse"),
     *   ),
     *
     *   @OA\Response(
     *     response="default",
     *     description="Operacion fallida",
     *     @OA\JsonContent(ref="#/components/schemas/ErrorResponse"),
     *   )
     * )
     *
     * Recovery password.
     *
     * @return response()->json
     */
    public function recoveryPassword(RecoveryPasswordDto $recoveryPasswordDto)
    {
        $user = User::where('user_email', $recoveryPasswordDto->email)->whereNull('deleted_at')->where('user_active', true)->first();
        if ($user) {
            $token = $this->helper::rp($user);

            $user->update([
                'user_token_recovery_password' => $token
            ]);

            // $this->helper::sendEmail('mail.RecoveryPassword', array(
            //     'subject' => 'Recuperar Contrase�a',
            //     'email' => $user->user_email,
            //     'contrase�a' => 'GK123',
            //     'url' => preg_replace("/\/$/", '', env('APP_CLIENT')).'/recovery-password/'.$user->user_email.'/'.$token.'/',
            //     'base_url' => env('APP_SERVER'),
            // ));
            return $this->successResponse([], 'Password recovery email sent');
        } else {
            throw new \Exception('Not active user', 400);
        }
    }

    /**
     * @OA\Put(
     *   path="/api/auth/newPassword",
     *   tags={"AUTH"},
     *   summary="cambiar contrase�a",
     *   description="Asigna nueva contrase�a",
     *   @OA\RequestBody(
     *     required=true,
     *     description="informacion requerida",
     *     @OA\JsonContent(ref="#/components/schemas/NewPasswordDto"),
     *   ),
     *
     *   @OA\Response(
     *     response=200,
     *     description="Operacion exitosa",
     *     @OA\JsonContent(ref="#/components/schemas/SuccessResponse"),
     *   ),
     *
     *   @OA\Response(
     *     response="default",
     *     description="Operacion fallida",
     *     @OA\JsonContent(ref="#/components/schemas/ErrorResponse"),
     *   )
     * )
     *
     * Assign new password.
     * Cuando el usuario lo cambia desde el revocery de password
     *
     * @param  App\Requests\Auth\NewPasswordDto $newPasswordDto
     * @return \Illuminate\Http\Response
     */
    public function newPassword(NewPasswordDto $newPasswordDto)
    {
        $user = User::where('user_email', $newPasswordDto->u)->where('user_token_recovery_password', $newPasswordDto->t)->whereNull('deleted_at')->first();
        $before = User::findOrFail($user->user_id);
        $token = $this->helper::rpd($newPasswordDto->t);

        if ($user->user_id === $token->uid && $user->user_email === $token->uem && time() <= $token->exp) {
            $user->update([
                'user_token_recovery_password' => null,
                'user_password' => bcrypt($newPasswordDto->password),
            ]);

            $this->log::storeLog($user, 'users', $user->user_id, 'UPDATE', $before, $user, $newPasswordDto->requestIp);

            return $this->successResponse(['user' => $user->user_id], 'New password assigned');
        } else {
            throw new \Exception('Token not working', 400);
        }
    }

    /**
     * @OA\Put(
     *   path="/api/auth/changePassword",
     *   tags={"AUTH"},
     *   summary="cambiar contrase�a",
     *   description="Cambiar contrase�a sin solicitar token",
     *   security={{ "bearer_token": {} }},
     *   @OA\RequestBody(
     *     required=true,
     *     description="informacion requerida",
     *     @OA\JsonContent(ref="#/components/schemas/ChangePasswordDto"),
     *   ),
     *
     *   @OA\Response(
     *     response=200,
     *     description="Operacion exitosa",
     *     @OA\JsonContent(ref="#/components/schemas/SuccessResponse"),
     *   ),
     *
     *   @OA\Response(
     *     response="default",
     *     description="Operacion fallida",
     *     @OA\JsonContent(ref="#/components/schemas/ErrorResponse"),
     *   )
     * )
     *
     * Update the password.
     * Cuando el usuario lo cambia desde dentro de la aplicacion
     *
     * @param  App\Requests\Auth\ChangePasswordDto $changePasswordDto
     * @return \Illuminate\Http\Response
     */
    public function changePassword(ChangePasswordDto $changePasswordDto, AuthSession $auth)
    {
        $user = User::where('user_email', $changePasswordDto->u)->where('user_id', $changePasswordDto->i)->whereNull('deleted_at')->first();
        if ($user) {
            $before = User::findOrFail($user->user_id);
            
            if (!Hash::check( $changePasswordDto->opassword, $user->user_password)) {
                throw new \Exception('Password does not match this email', 422);
            }

            $user->update([
                'user_token_recovery_password' => null,
                'user_password' => bcrypt($changePasswordDto->password),
            ]);

            $this->log::storeLog($auth->user, 'users', $user->user_id, 'UPDATE', $before, $user, $auth->ip);
            return $this->successResponse(['user' => $user->user_id], 'Password changed');
        } else {
            throw new \Exception('Id does not match this email', 400);
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
     * @OA\Post(
     *   path="/api/auth/checkSession",
     *   tags={"AUTH"},
     *   summary="Validar session",
     *   description="Returna token",
     *   security={{ "bearer_token": {} }},
     *   @OA\Response(
     *     response=200,
     *     description="Operacion exitosa",
     *     @OA\JsonContent(ref="#/components/schemas/SuccessResponse"),
     *   ),
     *
     *   @OA\Response(
     *     response="default",
     *     description="Operacion fallida",
     *     @OA\JsonContent(ref="#/components/schemas/ErrorResponse"),
     *   )
     * )
     *
     * Check Session.
     *
     * @return response()->json
     */
    public function checkSession(Request $request)
    {
        $uAuth = $request->user();
        if (now() > $uAuth->token()->expires_at) {
            return response()->json(['session' => 'expired'], 401);
        }
        $user = User::with(['permissions', 'studio', 'studiosOwned'])->where('user_id', $uAuth->user_id)->first();
        return response()->json(['session' => 'active', 'user' => $user]);
    }


    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function redirectToProvider($provider)
    {
        if(!in_array($provider, self::PROVIDERS)){
            throw new \Exception('Social Login Not Found', 400);
        }

        $success['provider_redirect'] = Socialite::driver($provider)->stateless()->redirect()->getTargetUrl();

        return redirect($success['provider_redirect']);
    }
        
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function handleProviderCallback($provider)
    {
        if (!in_array($provider, self::PROVIDERS)) {
            throw new \Exception('Social Login Not Found', 400);
        }

        $providerUser = Socialite::driver($provider)->stateless()->user();
        
        if ($providerUser) {
            $user = (new SocialAccountsService())->findOrCreate($providerUser, $provider);

            $tokenResult = $user->createToken('Personal Access Token');

            $token = $tokenResult->token;
            $token->save();

            return view('callback', [
                'access_token' => $tokenResult->accessToken,
                'token_type' => 'Bearer',
                'expires_at' => Carbon::parse($token->expires_at)->toDateTimeString(),
                'user' => json_encode($user),
                'provider' => $provider,
                'to' => env('APP_CLIENT')
            ]);
        }
    }

    public function getPolicy(Request $request, $type)
    {
        try {
            $policy = Policy::where('pol_type', $type)->where('pol_active', true)->orderBy('pol_id', 'DESC')->first();
            return response()->json(['status' => 'success', 'data' => $policy], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            //return response()->json($response['data'], $response['code']);
        }
    }
}
