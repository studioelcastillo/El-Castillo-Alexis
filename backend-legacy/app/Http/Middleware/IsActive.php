<?php

namespace App\Http\Middleware;

use Closure;
use Log;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class IsActive
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
        $uAuth = $request->user();
        
        // Skip DB check for mock user in local development
        if (env('APP_ENV') === 'local' && $uAuth && $uAuth->user_id === 4243) {
            return $next($request);
        }

        $u = User::where('user_id', $uAuth->user_id)->first();

        if (!$u->user_active) {
            abort(403, 'Access denied');
        }
        return $next($request);
    }
}
