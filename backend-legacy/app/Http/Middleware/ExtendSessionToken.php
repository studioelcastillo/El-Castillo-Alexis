<?php

namespace App\Http\Middleware;

use Closure;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\LoginHistory;

class ExtendSessionToken
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check() && Auth::user()->token()) {
            $token = Auth::user()->token();
            $expires_at = Carbon::parse($token->expires_at);
            $loghist = LoginHistory::where('user_id', Auth::user()->user_id)
            ->orderBy('lgnhist_id', 'DESC')
            ->first();
            if ($expires_at->isPast()) {
                $loghist->lgnhist_logout = $token->expires_at;
                $token->revoke();
            } else {
                $token->expires_at = now()->addHour(1);
                //$token->expires_at = now()->addMinutes(1);
                $loghist->lgnhist_expire_at = $token->expires_at;
                $token->save();
            }
            $loghist->save();
        }

        return $next($request);
    }
}