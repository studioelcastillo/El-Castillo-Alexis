<?php

namespace App\Http\Middleware;

use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;

class ResolveTenantContext
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || TenantContext::isPrivileged($user)) {
            return $next($request);
        }

        $allowedStudios = TenantContext::allowedStudioIds($user);
        $requestedStudioId = TenantContext::requestedStudioId($request);

        if ($requestedStudioId && !in_array($requestedStudioId, $allowedStudios, true)) {
            return TenantContext::forbiddenResponse();
        }

        $resolvedStudioId = $requestedStudioId;
        if (!$resolvedStudioId && count($allowedStudios) === 1) {
            $resolvedStudioId = $allowedStudios[0];
        }

        if ($resolvedStudioId) {
            $request->attributes->set('tenant_std_id', $resolvedStudioId);
            $request->query->set('std_id', $resolvedStudioId);

            if (in_array($request->method(), ['POST', 'PUT', 'PATCH'], true) && !$request->filled('std_id')) {
                $request->merge(['std_id' => $resolvedStudioId]);
            }
        }

        $request->attributes->set('tenant_accessible_std_ids', $allowedStudios);
        $request->attributes->set('tenant_is_restricted', true);

        return $next($request);
    }
}
