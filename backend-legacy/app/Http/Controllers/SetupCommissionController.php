<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SetupCommission;
use App\Models\SetupCommissionItem;
use Illuminate\Support\Facades\Validator;
use App\Models\Profile;

class SetupCommissionController extends Controller{

    public function selectOptions(Request $request)
    {   
        $studios = $this->tenantStudioIds($request);
        $commissions = SetupCommission::when($this->isTenantRestricted($request) && empty($studios), function ($query) {
            return $query->whereRaw('1 = 0');
        })->when($studios, function ($query) use ($studios) {
            return $query->whereIn('studios.std_id', $studios);
        })
        ->leftJoin('studios', 'setups_commissions.std_id', '=', 'studios.std_id')
        ->orderByDesc('setups_commissions.created_at')
        ->get([
            'setups_commissions.setcomm_id as value',
            sizeof($studios) !== 1
            ? \DB::raw("setups_commissions.setcomm_title || ' (' || COALESCE(studios.std_name, 'Sin estudio') || ')' as label")
            : \DB::raw("setups_commissions.setcomm_title as label")
        ]);
        return response()->json(['data' => $commissions], 200);
    }

    public function index(Request $request) 
    {
        $studios = $request->input('studios');
        if (!is_array($studios)) {
          $studios = $studios ? explode(',', $studios) : null;
        }
        if ($this->isTenantRestricted($request)) {
          $allowedStudios = $this->tenantStudioIds($request);
          $studios = (isset($studios)) ? array_values(array_intersect($studios, $allowedStudios)) : $allowedStudios;
        }
        
        $commissions = SetupCommission::with('items', 'studio')
        ->when($this->isTenantRestricted($request) && empty($studios), function ($query) {
          return $query->whereRaw('1 = 0');
        })
        ->when(is_array($studios) && !empty($studios), function ($query) use ($studios) {
          if (in_array(-1, $studios, true)) {
             return $query->where(function ($q) use ($studios) {
               $q->whereIn('std_id', array_filter($studios, fn($s) => $s !== -1))
               ->orWhereNull('std_id');
            });
          } else {
            return $query->whereIn('std_id', $studios);
          }
        })
        ->orderByDesc('created_at')
        ->get();
        return response()->json(['data' => $commissions], 200);
    }

    public function show(Request $request, $id)
    {
        $query = SetupCommission::with('items', 'studio')->where('setcomm_id', $id);
        if ($this->isTenantRestricted($request)) {
            $query = $this->applyTenantScope($query, $request, 'setups_commissions.std_id');
        }
        $commission = $query->first();
        $items = [];
        //modificar metodo para calcular bien y arreglar edit y agrega de los items

        if ($commission && $commission->items && count($commission->items) > 0) {
            $total_items = count($commission->items);
            $max_limit = $commission->items->max('setcommitem_limit');
            $min_limit = $commission->items->min('setcommitem_limit');
            $diff_max_min = $max_limit - $min_limit;

            foreach ($commission->items as $index => $item) {
                $next_limit = isset($commission->items[$index + 1]) ? $commission->items[$index + 1]->setcommitem_limit : null;
                $calc_percentage = (isset($next_limit)) ? ($next_limit - $item->setcommitem_limit)/$diff_max_min : 0.1;
                $percentage = max(0.03, $calc_percentage); // Asegura que el porcentaje no sea menor a 0.03
                $items[] = [
                    'percentage' => $percentage,
                    'color' => ($index % 2 == 0) ? '#A4193D' : '#FFDFB9',
                    'label' => ($commission->setcomm_type == 'Porcentaje') ? $item->setcommitem_value.'%' : '$'.$item->setcommitem_value,
                    'labelLimitter' => '$'.$item->setcommitem_limit,
                ];
            }
        }
        if (!$commission) {
            return response()->json(['error' => 'Not found'], 404);
        }
        return response()->json(['data' => $commission, 'items' => $items], 200);
    }

    public function store(Request $request)
    {
        if ($this->isTenantRestricted($request)) {
            $request->merge([
                'std_id' => $this->resolveTenantStudioInput($request, $request->filled('std_id') ? (int) $request->input('std_id') : null),
            ]);
        }
        $validator = Validator::make($request->all(), [
            'std_id' => 'nullable|integer|exists:studios,std_id',
            'setcomm_title' => 'required|string|max:255',
            'setcomm_description' => 'nullable|string',
            'setcomm_type' => 'required|in:Porcentaje,Dolares,Tokens,Pesos colombianos',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $commission = SetupCommission::create($request->all());
        return response()->json(['data' => $commission], 201);
    }

    public function update(Request $request, $id)
    {
        if ($this->isTenantRestricted($request)) {
            $request->merge([
                'std_id' => $this->resolveTenantStudioInput($request, $request->filled('std_id') ? (int) $request->input('std_id') : null),
            ]);
        }
        $query = SetupCommission::query()->where('setcomm_id', $id);
        if ($this->isTenantRestricted($request)) {
            $query = $this->applyTenantScope($query, $request, 'setups_commissions.std_id');
        }
        $commission = $query->first();
        if (!$commission) {
            return response()->json(['error' => 'Not found'], 404);
        }
        $validator = Validator::make($request->all(), [
            'std_id' => 'nullable|integer|exists:studios,std_id',
            'setcomm_title' => 'required|string|max:255',
            'setcomm_description' => 'nullable|string',
            'setcomm_type' => 'required|in:Porcentaje,Dolares,Tokens,Pesos colombianos',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $commission->update($request->all());
        return response()->json(['data' => $commission], 200);
    }

    public function destroy(Request $request, $id)
    {
        $query = SetupCommission::query()->where('setcomm_id', $id);
        if ($this->isTenantRestricted($request)) {
            $query = $this->applyTenantScope($query, $request, 'setups_commissions.std_id');
        }
        $commission = $query->first();
        if (!$commission) {
            return response()->json(['error' => 'Not found'], 404);
        }
        SetupCommissionItem::where('setcomm_id', $commission->setcomm_id)->delete();
        $commission->delete();
        return response()->json(['status' => 'success'], 200);
    }

    // Métodos para items de comisión
    public function storeItem(Request $request)
    {
        if ($this->isTenantRestricted($request)) {
            $commission = $this->findTenantScopedOrFail(SetupCommission::query()->where('setcomm_id', $request->input('setcomm_id')), $request, 'setups_commissions.std_id');
            $request->merge(['setcomm_id' => $commission->setcomm_id]);
        }
        $validator = Validator::make($request->all(), [
            'setcomm_id' => 'required|integer|exists:setups_commissions,setcomm_id',
            'setcommitem_value' => 'required|numeric',
            'setcommitem_limit' => 'required|numeric',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $item = SetupCommissionItem::create($request->all());
        return response()->json(['data' => $item], 201);
    }

    public function updateItem(Request $request, $id)
    {
        $query = SetupCommissionItem::query()->where('setcommitem_id', $id);
        if ($this->isTenantRestricted($request)) {
            $query = $this->applyTenantRelationScope($query, $request, 'commission', 'std_id');
        }
        $item = $query->first();
        if (!$item) {
            return response()->json(['error' => 'Not found'], 404);
        }
        $validator = Validator::make($request->all(), [
            'setcommitem_value' => 'required|numeric',
            'setcommitem_limit' => 'required|numeric',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $item->update($request->all());
        return response()->json(['data' => $item], 200);
    }

    public function destroyItem(Request $request, $id)
    {
        $query = SetupCommissionItem::query()->where('setcommitem_id', $id);
        if ($this->isTenantRestricted($request)) {
            $query = $this->applyTenantRelationScope($query, $request, 'commission', 'std_id');
        }
        $item = $query->first();
        if (!$item) {
            return response()->json(['error' => 'Not found'], 404);
        }
        $item->delete();
        return response()->json(['status' => 'success'], 200);
    }
}
