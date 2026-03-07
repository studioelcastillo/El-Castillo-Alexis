<?php

namespace App\Support;

use App\Models\Profile;
use App\Models\Studio;
use App\Models\StudioModel;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantContext
{
    public static function isPrivileged(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        return in_array((int) $user->prof_id, [Profile::ADMIN, Profile::CONTABILIDAD], true);
    }

    public static function allowedStudioIds(?User $user): array
    {
        if (!$user) {
            return [];
        }

        if (self::isPrivileged($user)) {
            return [];
        }

        $studioIds = [];

        if (!empty($user->std_id)) {
            $studioIds[] = (int) $user->std_id;
        }

        $ownedStudios = Studio::query()
            ->where('user_id_owner', $user->user_id)
            ->whereNull('deleted_at')
            ->pluck('std_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $studioModelIds = StudioModel::query()
            ->where('user_id_model', $user->user_id)
            ->whereNull('deleted_at')
            ->pluck('std_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $studioIds = array_values(array_unique(array_filter(array_merge($studioIds, $ownedStudios, $studioModelIds))));
        sort($studioIds);

        return $studioIds;
    }

    public static function requestedStudioId(Request $request): ?int
    {
        $headerStudioId = $request->header('X-Studio-Id');
        $value = $headerStudioId ?? $request->query('std_id', $request->input('std_id'));

        if ($value === null || $value === '') {
            return null;
        }

        $studioId = (int) $value;
        return $studioId > 0 ? $studioId : null;
    }

    public static function resolvedStudioId(Request $request): ?int
    {
        $attributeStudioId = $request->attributes->get('tenant_std_id');
        if ($attributeStudioId) {
            return (int) $attributeStudioId;
        }

        return self::requestedStudioId($request);
    }

    public static function forbiddenResponse(string $message = 'No tienes acceso a la sede solicitada.'): JsonResponse
    {
        return \response()->json([
            'status' => 'fail',
            'code' => 'TENANT_FORBIDDEN',
            'message' => $message,
        ], 403);
    }

    public static function ensureAccessibleStudioId(Request $request, ?int $studioId = null): ?int
    {
        $user = $request->user();
        if (!$user || self::isPrivileged($user)) {
            return $studioId;
        }

        $studioId = $studioId ?: self::resolvedStudioId($request);
        if (!$studioId) {
            return null;
        }

        $allowedStudios = self::allowedStudioIds($user);
        if (!in_array((int) $studioId, $allowedStudios, true)) {
            \abort(403, 'No tienes acceso a la sede solicitada.');
        }

        return (int) $studioId;
    }
}
