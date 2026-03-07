<?php

namespace App\Requests\Auth;
use Spatie\DataTransferObject\DataTransferObject;
use Illuminate\Http\Request;

class AuthSession extends DataTransferObject
{

  public $user;

  public $ip;

  public function __construct(Request $request)
  {
    // everything OK, we set the attributes
    $this->user = $request->user();
    $this->requestIp = (property_exists($request, 'ip')) ? $request->ip : '' ;
  }
}