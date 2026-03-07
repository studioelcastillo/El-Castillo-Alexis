<?php

namespace App\Requests\Auth;
use Spatie\DataTransferObject\DataTransferObject;
use Illuminate\Http\Request;
use Validator;

/**
 * @OA\Schema(title="NewPasswordDto", type="object")
 */
class NewPasswordDto extends DataTransferObject
{

  /**
   * @OA\Property(
   *    property="u",
   *    type="string",
   *    description="user email",
   *    example="example@gmail.com"
   * )
   *
   * @var string
   */
  public $u;
  
  /**
   * @OA\Property(
   *    property="t",
   *    type="string",
   *    description="generated token to update password",
   *    example=""
   * )
   *
   * @var string
   */
  public $t;

  /**
   * @OA\Property(
   *    property="password",
   *    type="string",
   *    description="new password",
   *    example=""
   * )
   *
   * @var string
   */
  public $password;

  public $requestIp;

  public function __construct(Request $request)
  {
    $request->validate([
      'u' => 'required|exists:users,user_email',
      't' => 'required',
      'password' => 'required',
    ]);

    // everything OK, we set the attributes
    $this->u = $request['u'];
    $this->t = $request['t'];
    $this->password = $request['password'];
    $this->requestIp = (property_exists($request, 'ip')) ? $request->ip : '' ;
  }
}