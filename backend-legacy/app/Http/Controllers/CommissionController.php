<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Models\Commission;
use App\Models\Profile;
use Exception;


class CommissionController extends Controller
{
    // Obtener la jerarquía principal de comisiones
    public function getCommissionsRelations(Request $request)
    {
        try {
            //$user_id = $request->user()->user_id;
            $user_owner_id = ($request->user()->prof_id == Profile::ESTUDIO) ? $request->user()->user_id : null;
            $records = $this->getCommissionRelations(null, $user_owner_id);
            $commissions = [];
            foreach ($records as $r => $row) {
                $tree_route = $this->pgArrayToPhpArray($row->routee);
                $commissions = $this->buildCommissionTree($commissions, $row, $tree_route);
            }
            $commissions = $this->treeToIndexedArray($commissions);
            return response()->json(['status' => 'success', 'data' => $commissions], 200);
        } catch (Exception $e) {
            return response()->json(['status' => 'fail', 'message' => $e->getMessage()], 500);
        }
    }

    // Crear relación de comisión
    public function storeCommissionsRelations(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'commparent_id' => 'nullable|integer|exists:commissions,comm_id',
                'stdmod_id' => 'nullable|integer|exists:studios_models,stdmod_id',
                'setcomm_id' => 'nullable|integer|exists:setups_commissions,setcomm_id',
                'std_id' => 'nullable|integer|exists:studios,std_id'
            ]);
            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $commission = Commission::create($request->all());
            return response()->json(['status' => 'success', 'data' => $commission], 201);
        } catch (Exception $e) {
            return response()->json(['status' => 'fail', 'message' => $e->getMessage()], 500);
        }
    }

    public function updateCommissionsRelations(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'commparent_id' => 'nullable|integer|exists:commissions,comm_id',
                'stdmod_id' => 'nullable|integer|exists:studios_models,stdmod_id',
                'setcomm_id' => 'nullable|integer|exists:setups_commissions,setcomm_id',
                'std_id' => 'nullable|integer|exists:studios,std_id'
            ]);
            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }
            $commission = Commission::findOrFail($id);
            $commission->update($request->all());
            
            return response()->json(['status' => 'success', 'data' => $commission], 201);
        } catch (Exception $e) {
            return response()->json(['status' => 'fail', 'message' => $e->getMessage()], 500);
        }
    }

    // Eliminar relación de comisión
    public function deleteCommissionsRelations(Request $request, $id)
    {
        try {
            $commissions = $this->getCommissionRelations($id);
            $comm_ids = array_map(fn($row) => $row->comm_id, $commissions);
            Commission::whereIn('comm_id', $comm_ids)->delete();
            return response()->json(['status' => 'success'], 200);
        } catch (Exception $e) {
            return response()->json(['status' => 'fail', 'message' => $e->getMessage()], 500);
        }
    }

    // Métodos auxiliares para árbol
    private function pgArrayToPhpArray(string $pgArray): array {
        $pgArray = trim($pgArray, '{}');
        if ($pgArray === '') {
            return [];
        }
        return explode(',', $pgArray);
    }

    private function buildCommissionTree($tree, $row, $tree_route)
    {
        if (!isset($tree[$tree_route[0]])) {
            $tree[$tree_route[0]] = array();
        }
        if (sizeof($tree_route) == 1) {
            // Procesar setcomm_items para armar el string de rangos
            $setcomm_str = '';
            if (isset($row->setcomm_items) && $row->setcomm_items) {
                $items = json_decode($row->setcomm_items, true);
                $count = count($items);
                if ($count > 0) {
                    $limits = array_column($items, 'limit');
                    $values = array_column($items, 'value');
                    $prev = 0;
                    for ($i = 0; $i < $count; $i++) {
                        $min = $prev;
                        $max = $limits[$i];
                        $val = $values[$i];
                        $val_symbol = ($row->setcomm_type === 'Porcentaje') ? $val.'%' : '$'.$val;
                        $next_limit = ($i + 1 < $count) ? $limits[$i + 1] : null;
                        $max_display = ($next_limit !== null) ? "$".$next_limit : '∞';
                        $setcomm_str .= "$$min - $max_display gana $val_symbol";
                        if ($i < $count - 1) {
                            $setcomm_str .= "\n";
                        }
                        $prev = $max;
                    }
                }
            }
            $tree[$tree_route[0]] = array(
                'stdmod_id' => $row->stdmod_id,
                'stdmod_contract_number' => $row->stdmod_contract_number,
                'std_id' => $row->std_id,
                'std_name' => $row->std_name,
                'std_id2' => $row->std_id2,
                'std_name2' => $row->std_name2,
                'setcomm_title' => $row->setcomm_title,
                'setcomm_id' => $row->setcomm_id,
                'setcomm_std_name' => $row->setcomm_std_name,
                'comm_id' => $row->comm_id,
                'commparent_id' => $row->commparent_id,
                'comm_track_beyond_childs' => $row->comm_track_beyond_childs,
                'comm_expire_date' => $row->comm_expire_date,
                'user_name' => $row->user_name,
                'user_id' => $row->user_id,
                'user_identification' => $row->user_identification,
                'prof_name' => $row->prof_name,
                'setcomm_str' => $setcomm_str,
                'childs' => array()
            );
        } else {
            $tree[$tree_route[0]]['childs'] = $this->buildCommissionTree($tree[$tree_route[0]]['childs'], $row, array_slice($tree_route, 1));
        }
        return $tree;
    }

    private function treeToIndexedArray($tree) {
        if (!empty($tree) && array_keys($tree) !== range(0, count($tree) - 1)) {
            $tree = array_values($tree);
        }
        foreach ($tree as &$node) {
            if (isset($node['childs'])) {
                $node['childs'] = $this->treeToIndexedArray($node['childs']);
            }
        }
        return $tree;
    }

    public function getCommissionRelations($comm_id = null, $user_owner_id = null)
    {
        $conditions = "WHERE c.commparent_id IS NULL";
        if (isset($comm_id)) {
            $conditions = "WHERE c.comm_id = $comm_id";
        }
        if ($user_owner_id) {
            $conditions .= " AND s2.user_id_owner = $user_owner_id";
        }
        $records = DB::select("WITH RECURSIVE hierarchy AS (
            SELECT
            TRIM(
                COALESCE(u.user_name, '') || ' ' ||
                COALESCE(u.user_name2, '') || ' ' ||
                COALESCE(u.user_surname, '') || ' ' ||
                COALESCE(u.user_surname2, '')
            ) AS user_name,
            u.user_id AS user_id,
            u.user_identification AS user_identification,
            p.prof_name AS prof_name,
            sm.stdmod_id AS stdmod_id,
            sm.stdmod_contract_number AS stdmod_contract_number,
            s.std_id AS std_id,
            s.std_name AS std_name,
            s2.std_id AS std_id2,
            s2.std_name AS std_name2,
            sc.setcomm_title AS setcomm_title,
            sc.setcomm_id AS setcomm_id,
            sc.setcomm_type AS setcomm_type,
            scs.std_name AS setcomm_std_name,
            c.comm_id AS comm_id,
            c.commparent_id AS commparent_id,
            c.comm_track_beyond_childs AS comm_track_beyond_childs,
            c.comm_expire_date AS comm_expire_date,
            ARRAY[c.comm_id]::int[] AS routee,
            (
                SELECT COALESCE(json_agg(json_build_object('value', sci.setcommitem_value, 'limit', sci.setcommitem_limit) ORDER BY sci.setcommitem_limit), '[]'::json)
                FROM setups_commissions_items sci
                WHERE sci.setcomm_id = sc.setcomm_id
            ) AS setcomm_items
            FROM commissions c
            LEFT JOIN studios s ON s.std_id = c.std_id
            LEFT JOIN studios_models sm ON sm.stdmod_id = c.stdmod_id
            INNER JOIN studios s2 ON s2.std_id = sm.std_id
            INNER JOIN users u ON sm.user_id_model = u.user_id
            INNER JOIN profiles p ON p.prof_id = u.prof_id
            LEFT JOIN setups_commissions sc ON c.setcomm_id = sc.setcomm_id
            LEFT JOIN studios scs ON sc.std_id = scs.std_id
            {$conditions}

            UNION ALL

            SELECT
            TRIM(
                COALESCE(u.user_name, '') || ' ' ||
                COALESCE(u.user_name2, '') || ' ' ||
                COALESCE(u.user_surname, '') || ' ' ||
                COALESCE(u.user_surname2, '')
            ) AS user_name,
            u.user_id AS user_id,
            u.user_identification AS user_identification,
            p.prof_name AS prof_name,
            sm.stdmod_id AS stdmod_id,
            sm.stdmod_contract_number AS stdmod_contract_number,
            s.std_id AS std_id,
            s.std_name AS std_name,
            s2.std_id AS std_id2,
            s2.std_name AS std_name2,
            sc.setcomm_title AS setcomm_title,
            sc.setcomm_id AS setcomm_id,
            sc.setcomm_type AS setcomm_type,
            scs.std_name AS setcomm_std_name,
            c.comm_id as comm_id,
            c.commparent_id AS commparent_id,
            c.comm_track_beyond_childs AS comm_track_beyond_childs,
            c.comm_expire_date AS comm_expire_date,
            h.routee || c.comm_id,
            (
                SELECT COALESCE(json_agg(json_build_object('value', sci.setcommitem_value, 'limit', sci.setcommitem_limit) ORDER BY sci.setcommitem_limit), '[]'::json)
                FROM setups_commissions_items sci
                WHERE sci.setcomm_id = sc.setcomm_id
            ) AS setcomm_items
            FROM commissions c
            INNER JOIN hierarchy h ON h.comm_id = c.commparent_id
            LEFT JOIN studios s ON s.std_id = c.std_id
            LEFT JOIN studios_models sm ON sm.stdmod_id = c.stdmod_id
            LEFT JOIN studios s2 ON s2.std_id = sm.std_id
            LEFT JOIN users u ON sm.user_id_model = u.user_id
            LEFT JOIN profiles p ON p.prof_id = u.prof_id
            LEFT JOIN setups_commissions sc ON c.setcomm_id = sc.setcomm_id
            LEFT JOIN studios scs ON sc.std_id = scs.std_id
        )
        SELECT * FROM hierarchy ORDER BY routee, std_name2, user_name");
        return $records;
    }

    public function getCommissionStudioModels($stdmod_ids)
    {
        $records = DB::select("WITH RECURSIVE hierarchy AS (
            SELECT
            c.stdmod_id AS stdmod_id,
            c.comm_id AS comm_id,
            c.commparent_id AS commparent_id
            FROM commissions c
            WHERE c.stdmod_id IN (".implode(',', $stdmod_ids).")

            UNION ALL

            SELECT
            c.stdmod_id AS stdmod_id,
            c.comm_id as comm_id,
            c.commparent_id AS commparent_id
            FROM commissions c
            INNER JOIN hierarchy h ON h.comm_id = c.commparent_id
        )
        SELECT * FROM hierarchy");

        $records = array_map(function($row) { return $row->stdmod_id; }, $records);
        return $records;
    }

    public function getCommissionStudioModelsByStudio($std_id)
    {
        // Obtener todos los nodos con commparent_id = null (padres) y sus setup_commissions
        $parents = DB::select("
            SELECT c.comm_id, c.stdmod_id, sc.setcomm_id, sc.setcomm_title, sc.setcomm_type, sm.user_id_model
            FROM commissions c
            INNER JOIN studios_models sm ON sm.stdmod_id = c.stdmod_id
            LEFT JOIN setups_commissions sc ON c.setcomm_id = sc.setcomm_id
            WHERE sm.std_id = ? 
            AND (c.comm_expire_date IS NULL OR c.comm_expire_date > CURRENT_DATE)
        ", [$std_id]);

        $result = [];
        $stdmod_ids = [];
        foreach ($parents as $parent) {
            // Obtener los items asociados al setup_commission
            $items = [];
            if ($parent->setcomm_id) {
                $items = DB::select("
                    SELECT setcommitem_id, setcommitem_value, setcommitem_limit
                    FROM setups_commissions_items
                    WHERE setcomm_id = ?
                    ORDER BY setcommitem_limit DESC
                ", [$parent->setcomm_id]);
            }

            // Obtener todos los descendientes (excluyendo el padre)
            $descendants = DB::select("
                WITH RECURSIVE tree AS (
                    SELECT c.stdmod_id, c.comm_id, c.commparent_id
                    FROM commissions c
                    WHERE c.comm_id = ?
                    UNION ALL
                    SELECT c2.stdmod_id, c2.comm_id, c2.commparent_id
                    FROM commissions c2
                    INNER JOIN tree t ON t.comm_id = c2.commparent_id
                )
                SELECT stdmod_id FROM tree WHERE comm_id != ?
            ", [$parent->comm_id, $parent->comm_id]);

            $result[] = [
                'stdmod_id' => $parent->stdmod_id,
                'user_id' => $parent->user_id_model,
                'setup_commission' => [
                    'setcomm_id' => $parent->setcomm_id,
                    'setcomm_title' => $parent->setcomm_title,
                    'setcomm_type' => $parent->setcomm_type,
                    'items' => $items
                ],
                'stdmod_ids' => array_map(function($row) { return $row->stdmod_id; }, $descendants)
            ];
            $stdmod_ids = array_merge($stdmod_ids, array_map(function($row) { return $row->stdmod_id; }, $descendants));
        }
        return [$result, $stdmod_ids];
    }
}
