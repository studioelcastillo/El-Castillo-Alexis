<?php

namespace App\Requests\Auth;
use Spatie\DataTransferObject\DataTransferObject;
use Illuminate\Http\Request;
use Validator;

/**
 * @OA\Schema(title="RecoveryPasswordDto", type="object")
 */
class RecoveryPasswordDto extends DataTransferObject
{

  /**
   * @OA\Property(
   *    property="email",
   *    type="string",
   *    description="User email",
   *    example="example@gmail.com"
   * )
   *
   * @var string
   */
  public $email;

  public $requestIp;

  public function __construct(Request $request)
  {
    $request->validate([
      'email' => 'exists:users,user_email'
    ]);
    
    // everything OK, we set the attributes
    $this->email = $request['email'];
    $this->requestIp = (property_exists($request, 'ip')) ? $request->ip : '' ;
  }
}