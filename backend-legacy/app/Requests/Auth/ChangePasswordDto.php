<?php

namespace App\Requests\Auth;
use Spatie\DataTransferObject\DataTransferObject;
use Illuminate\Http\Request;
use Validator;

/**
 * @OA\Schema(title="ChangePasswordDto", type="object")
 */
class ChangePasswordDto extends DataTransferObject
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
   *    property="i",
   *    type="integer",
   *    description="id del usuario",
   *    example=0
   * )
   *
   * @var integer
   */
  public $i;
  
  /**
   * @OA\Property(
   *    property="opassword",
   *    type="string",
   *    description="old password",
   *    example=""
   * )
   *
   * @var string
   */
  public $opassword;

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

  public function __construct(Request $request)
  {
    $request->validate([
      'u' => 'required|exists:users,user_email',
      'i' => 'required',
      'opassword' => 'required',
      'password' => 'required',
    ]);

    // everything OK, we set the attributes
    $this->u = $request['u'];
    $this->i = $request['i'];
    $this->opassword = $request['opassword'];
    $this->password = $request['password'];
  }
}