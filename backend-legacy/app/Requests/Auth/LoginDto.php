<?php

namespace App\Requests\Auth;
use Spatie\DataTransferObject\DataTransferObject;
use Illuminate\Http\Request;
use Validator;

/**
 * @OA\Schema(title="LoginDto", type="object")
 */
class LoginDto extends DataTransferObject
{

  /**
   * @OA\Property(
   *    property="email",
   *    type="string",
   *    example="example@gmail.com"
   * )
   *
   * @var string
   */
  public $email;

  /**
   * @OA\Property(
   *    property="password",
   *    type="string",
   *    example=""
   * )
   *
   * @var string
   */
  public $password;

  public $policy_id;
  public $policy_answer;

  public function __construct(Request $request)
  {
    $request->validate([
      'email' => 'required',
      'password' => 'required',
      'policyId' => 'required',
      'policyAnswer' => 'required',
    ]);

    // everything OK, we set the attributes
    $this->email = $request['email'];
    $this->password = $request['password'];
    $this->policy_id = $request['policyId'];
    $this->policy_answer = $request['policyAnswer'];
  }
}