<?php

namespace App\Http\Controllers;

use App\Support\TenantContext;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;
use App\Traits\ApiResponser;

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests, ApiResponser;

    protected function tenantStudioIds(Request $request): array
    {
        return TenantContext::allowedStudioIds($request->user());
    }

    protected function tenantStudioId(Request $request): ?int
    {
        return TenantContext::resolvedStudioId($request);
    }

    protected function isTenantRestricted(Request $request): bool
    {
        return !TenantContext::isPrivileged($request->user());
    }

    protected function applyTenantScope($query, Request $request, string $column = 'std_id')
    {
        if (!$this->isTenantRestricted($request)) {
            return $query;
        }

        $studioIds = $this->tenantStudioIds($request);
        if (empty($studioIds)) {
            return $query->whereRaw('1 = 0');
        }

        $resolvedStudioId = $this->tenantStudioId($request);
        if ($resolvedStudioId) {
            return $query->where($column, $resolvedStudioId);
        }

        return $query->whereIn($column, $studioIds);
    }

    protected function applyTenantRelationScope($query, Request $request, string $relation, string $column = 'std_id')
    {
        if (!$this->isTenantRestricted($request)) {
            return $query;
        }

        $studioIds = $this->tenantStudioIds($request);
        if (empty($studioIds)) {
            return $query->whereRaw('1 = 0');
        }

        $resolvedStudioId = $this->tenantStudioId($request);

        return $query->whereHas($relation, function ($builder) use ($studioIds, $resolvedStudioId, $column) {
            if ($resolvedStudioId) {
                $builder->where($column, $resolvedStudioId);
                return;
            }

            $builder->whereIn($column, $studioIds);
        });
    }

    protected function ensureTenantStudio(Request $request, ?int $studioId = null): ?int
    {
        return TenantContext::ensureAccessibleStudioId($request, $studioId);
    }

    protected function resolveTenantStudioInput(Request $request, ?int $studioId = null): ?int
    {
        if (!$this->isTenantRestricted($request)) {
            return $studioId;
        }

        if ($studioId !== null) {
            return $this->ensureTenantStudio($request, $studioId);
        }

        $resolvedStudioId = $this->tenantStudioId($request);
        if ($resolvedStudioId) {
            return $resolvedStudioId;
        }

        $studioIds = $this->tenantStudioIds($request);
        if (count($studioIds) === 1) {
            return (int) $studioIds[0];
        }

        throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException('No studio tenant context available for this action.');
    }

    protected function findTenantScopedOrFail($query, Request $request, string $column = 'std_id')
    {
        return $this->applyTenantScope($query, $request, $column)->firstOrFail();
    }

    protected function findTenantRelationScopedOrFail($query, Request $request, string $relation, string $column = 'std_id')
    {
        return $this->applyTenantRelationScope($query, $request, $relation, $column)->firstOrFail();
    }
}
