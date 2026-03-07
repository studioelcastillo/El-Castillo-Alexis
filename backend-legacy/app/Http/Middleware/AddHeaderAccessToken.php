<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AddHeaderAccessToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        if (!$request->headers->has('Authorization') && $request->has('access_token') && in_array($request->method(), ['GET', 'HEAD'], true)) {
            $request->headers->set('Authorization', 'Bearer ' . $request->get('access_token'));
            unset($request['access_token']);
        }
        return $next($request);
    }
}
