<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LivejasminBonusType;
use App\Models\LivejasminBonusCriteria;
use App\Services\LivejasminBonusService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class LivejasminBonusController extends Controller
{
    protected $bonusService;

    public function __construct(LivejasminBonusService $bonusService)
    {
        $this->bonusService = $bonusService;
    }

    /**
     * Display a listing of bonus types.
     */
    public function index(Request $request)
    {
        try {
            $profile = $request->input('profile');
            $modelId = $request->input('model_id');
            $periodStart = $request->input('period_start');
            $periodEnd = $request->input('period_end');
            $withCriteria = $request->input('with_criteria', false);

            \Log::info('LivejasminBonusController index params:', [
                'model_id' => $modelId,
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'with_criteria' => $withCriteria
            ]);

            $bonusTypes = $this->bonusService->getActiveBonusTypes($profile);

            // Get model performance data if model_id and period are provided
            $modelPerformance = null;
            if ($modelId && $periodStart && $periodEnd) {
                $modelPerformance = $this->bonusService->getModelPerformanceData($modelId, $periodStart, $periodEnd);
                \Log::info('Model performance data:', [
                    'model_performance' => $modelPerformance ? $modelPerformance->toArray() : null
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $bonusTypes->map(function ($bonusType) use ($modelPerformance, $withCriteria) {
                    $bonusData = [
                        'ljbt_id' => $bonusType->ljbt_id,
                        'ljbt_name' => $bonusType->ljbt_name,
                        'ljbt_description' => $bonusType->ljbt_description,
                        'ljbt_percentage' => $bonusType->ljbt_percentage,
                        'ljbt_code' => $bonusType->ljbt_code ?? 'default',
                        'formatted_percentage' => $bonusType->formatted_percentage,
                        'target_profile' => $bonusType->ljbt_target_profiles,
                        'active' => $bonusType->ljbt_active,
                        'criteria_count' => $bonusType->criteria->count()
                    ];

                    if ($withCriteria) {
                        $bonusData['criteria'] = $bonusType->criteria->map(function ($criteria) use ($modelPerformance) {
                            $criteriaData = [
                                'ljbc_id' => $criteria->ljbc_id,
                                'condition_name' => $criteria->ljbc_condition_name,
                                'api_endpoint' => $criteria->ljbc_api_endpoint,
                                'json_path' => $criteria->ljbc_json_path,
                                'operator' => $criteria->ljbc_operator,
                                'operator_symbol' => $criteria->operator_symbol,
                                'target_value' => $criteria->ljbc_target_value,
                                'ljbc_target_value' => $criteria->ljbc_target_value,
                                'condition_type' => $criteria->ljbc_condition_type,
                                'fixed_type' => $criteria->ljbc_fixed_type,
                                'order' => $criteria->ljbc_order,
                                'description' => $criteria->description
                            ];

                            // Add model's current value for this criteria if available
                            if ($modelPerformance) {
                                $currentValue = $this->bonusService->getModelValueForCriteria($modelPerformance, $criteria);
                                $criteriaData['model_current_value'] = $currentValue;
                                $criteriaData['criteria_met'] = $this->bonusService->evaluateCriteria($currentValue, $criteria->ljbc_operator, $criteria->ljbc_target_value);
                            }

                            return $criteriaData;
                        });
                    }

                    return $bonusData;
                })
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching bonus types: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching bonus types'
            ], 500);
        }
    }

    /**
     * Store a newly created bonus type.
     */
    public function store(Request $request)
    {
        // Base validation rules
        $validationRules = [
            'name' => 'required|string|max:100|unique:livejasmin_bonus_types,ljbt_name',
            'description' => 'nullable|string|max:500',
            'percentage' => 'required|numeric|min:0|max:100',
            'target_profile' => 'nullable|array',
            'target_profile.*' => 'string|in:MODELO,SATELITE,all',
            'active' => 'boolean',
            'criteria' => 'required|array|min:1',
            'criteria.*.operator' => 'required|string|in:>=,<=,>,<,=,==,!=,neq',
            'criteria.*.target_value' => 'required|numeric',
            'criteria.*.condition_type' => 'required|string|in:performance,score,time,earnings,static',
            'criteria.*.order' => 'integer|min:1'
        ];

        // Add conditional validation for API fields based on condition_type
        foreach ($request->input('criteria', []) as $index => $criteria) {
            if (isset($criteria['condition_type']) && $criteria['condition_type'] !== 'static') {
                $validationRules["criteria.{$index}.api_endpoint"] = 'required|string|max:100';
                $validationRules["criteria.{$index}.json_path"] = 'required|string|max:100';
            }
        }

        $validator = Validator::make($request->all(), $validationRules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Generate unique code for bonus type
            $baseCode = strtoupper(str_replace(' ', '_', $request->name));
            $code = $baseCode;
            $counter = 1;

            // Ensure code is unique
            while (LivejasminBonusType::where('ljbt_code', $code)->exists()) {
                $code = $baseCode . '_' . $counter;
                $counter++;
            }

            // Create bonus type
            $bonusType = LivejasminBonusType::create([
                'ljbt_name' => $request->name,
                'ljbt_code' => $code,
                'ljbt_description' => $request->description,
                'ljbt_percentage' => $request->percentage,
                'ljbt_target_profiles' => $request->target_profile,
                'ljbt_active' => $request->input('active', true)
            ]);

            // Create criteria
            foreach ($request->criteria as $index => $criteriaData) {
                $criteriaCreateData = [
                    'ljbt_id' => $bonusType->ljbt_id,
                    'ljbc_condition_name' => $criteriaData['condition_name'],
                    'ljbc_operator' => $criteriaData['operator'],
                    'ljbc_target_value' => $criteriaData['target_value'],
                    'ljbc_condition_type' => $criteriaData['condition_type'],
                    'ljbc_order' => $criteriaData['order'] ?? ($index + 1)
                ];

                // Handle API fields based on condition type
                if ($criteriaData['condition_type'] === 'static') {
                    $criteriaCreateData['ljbc_api_endpoint'] = null;
                    $criteriaCreateData['ljbc_json_path'] = null;
                } else {
                    $criteriaCreateData['ljbc_api_endpoint'] = $criteriaData['api_endpoint'];
                    $criteriaCreateData['ljbc_json_path'] = $criteriaData['json_path'];
                }

                LivejasminBonusCriteria::create($criteriaCreateData);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Bonus type created successfully',
                'data' => $bonusType->load('criteria')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating bonus type: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating bonus type'
            ], 500);
        }
    }

    /**
     * Display the specified bonus type.
     */
    public function show(string $id)
    {
        try {
            $bonusType = LivejasminBonusType::with('criteria')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'ljbt_id' => $bonusType->ljbt_id,
                    'ljbt_name' => $bonusType->ljbt_name,
                    'ljbt_description' => $bonusType->ljbt_description,
                    'ljbt_percentage' => $bonusType->ljbt_percentage,
                    'formatted_percentage' => $bonusType->formatted_percentage,
                    'ljbt_target_profiles' => $bonusType->ljbt_target_profiles,
                    'ljbt_active' => $bonusType->ljbt_active,
                    'criteria' => $bonusType->criteria->map(function ($criteria) {
                        return [
                            'id' => $criteria->ljbc_id,
                            'condition_name' => $criteria->ljbc_condition_name,
                            'api_endpoint' => $criteria->ljbc_api_endpoint,
                            'json_path' => $criteria->ljbc_json_path,
                            'operator' => $criteria->ljbc_operator,
                            'operator_symbol' => $criteria->operator_symbol,
                            'target_value' => $criteria->ljbc_target_value,
                            'condition_type' => $criteria->ljbc_condition_type,
                            'order' => $criteria->ljbc_order,
                            'description' => $criteria->description
                        ];
                    })
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bonus type not found'
            ], 404);
        }
    }

    /**
     * Update the specified bonus type.
     */
    public function update(Request $request, string $id)
    {
        // Base validation rules
        $validationRules = [
            'name' => 'required|string|max:100|unique:livejasmin_bonus_types,ljbt_name,' . $id . ',ljbt_id',
            'description' => 'nullable|string|max:500',
            'percentage' => 'required|numeric|min:0|max:100',
            'target_profile' => 'nullable|array',
            'target_profile.*' => 'string|in:MODELO,SATELITE,all',
            'active' => 'boolean',
            'criteria' => 'required|array|min:1',
            'criteria.*.operator' => 'required|string|in:>=,<=,>,<,=,==,!=,neq',
            'criteria.*.target_value' => 'required|numeric',
            'criteria.*.condition_type' => 'required|string|in:performance,score,time,earnings,static',
            'criteria.*.order' => 'integer|min:1'
        ];

        // Add conditional validation for API fields based on condition_type
        foreach ($request->input('criteria', []) as $index => $criteria) {
            if (isset($criteria['condition_type']) && $criteria['condition_type'] !== 'static') {
                $validationRules["criteria.{$index}.api_endpoint"] = 'required|string|max:100';
                $validationRules["criteria.{$index}.json_path"] = 'required|string|max:100';
            }
        }

        $validator = Validator::make($request->all(), $validationRules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $bonusType = LivejasminBonusType::findOrFail($id);

            // Generate unique code if name changed
            $updateData = [
                'ljbt_name' => $request->name,
                'ljbt_description' => $request->description,
                'ljbt_percentage' => $request->percentage,
                'ljbt_target_profiles' => $request->target_profile,
                'ljbt_active' => $request->input('active', true)
            ];

            // If name changed, update the code
            if ($bonusType->ljbt_name !== $request->name) {
                $baseCode = strtoupper(str_replace(' ', '_', $request->name));
                $code = $baseCode;
                $counter = 1;

                // Ensure code is unique (excluding current record)
                while (LivejasminBonusType::where('ljbt_code', $code)->where('ljbt_id', '!=', $id)->exists()) {
                    $code = $baseCode . '_' . $counter;
                    $counter++;
                }

                $updateData['ljbt_code'] = $code;
            }

            // Update bonus type
            $bonusType->update($updateData);

            // Delete existing criteria and create new ones
            $bonusType->criteria()->delete();

            foreach ($request->criteria as $index => $criteriaData) {
                $criteriaCreateData = [
                    'ljbt_id' => $bonusType->ljbt_id,
                    'ljbc_condition_name' => $criteriaData['condition_name'] ?? null,
                    'ljbc_operator' => $criteriaData['operator'],
                    'ljbc_target_value' => $criteriaData['target_value'],
                    'ljbc_condition_type' => $criteriaData['condition_type'],
                    'ljbc_order' => $criteriaData['order'] ?? ($index + 1)
                ];

                // Handle API fields based on condition type
                if ($criteriaData['condition_type'] === 'static') {
                    $criteriaCreateData['ljbc_api_endpoint'] = null;
                    $criteriaCreateData['ljbc_json_path'] = null;
                } else {
                    $criteriaCreateData['ljbc_api_endpoint'] = $criteriaData['api_endpoint'];
                    $criteriaCreateData['ljbc_json_path'] = $criteriaData['json_path'];
                }

                LivejasminBonusCriteria::create($criteriaCreateData);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Bonus type updated successfully',
                'data' => $bonusType->load('criteria')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating bonus type: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating bonus type'
            ], 500);
        }
    }

    /**
     * Remove the specified bonus type.
     */
    public function destroy(string $id)
    {
        try {
            DB::beginTransaction();

            $bonusType = LivejasminBonusType::findOrFail($id);

            // Delete criteria first (foreign key constraint)
            $bonusType->criteria()->delete();

            // Delete bonus type
            $bonusType->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Bonus type deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting bonus type: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting bonus type'
            ], 500);
        }
    }

    /**
     * Get available API structure for creating criteria
     */
    public function getApiStructure()
    {
        try {
            $structureFile = base_path('../client/src/assets/livejasmin-api-structure.json');

            if (!file_exists($structureFile)) {
                return response()->json([
                    'success' => false,
                    'message' => 'API structure file not found'
                ], 404);
            }

            $structure = json_decode(file_get_contents($structureFile), true);

            return response()->json([
                'success' => true,
                'data' => $structure
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching API structure: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching API structure'
            ], 500);
        }
    }

    /**
     * Sync bonuses for a specific period
     */
    public function syncBonusesForPeriod(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $result = $this->bonusService->syncBonusesForPeriod(
                $request->period_start,
                $request->period_end
            );

            return response()->json([
                'success' => true,
                'message' => 'Bonuses synced successfully',
                'data' => $result
            ]);
        } catch (\Exception $e) {
            Log::error('Error syncing bonuses: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error syncing bonuses'
            ], 500);
        }
    }

    /**
     * Add a new criteria to an existing bonus type
     */
    public function addCriteria(Request $request, string $bonusId)
    {
        $validationRules = [
            'condition_name' => 'required|string|max:100',
            'operator' => 'required|string|in:>=,<=,>,<,=,==,!=,neq',
            'target_value' => 'required|numeric',
            'condition_type' => 'required|string|in:performance,score,time,earnings,static',
            'order' => 'integer|min:1'
        ];

        // Add conditional validation for static type
        if ($request->input('condition_type') !== 'static') {
            $validationRules['api_endpoint'] = 'required|string|max:100';
            $validationRules['json_path'] = 'required|string|max:100';
        }

        $validator = Validator::make($request->all(), $validationRules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $bonusType = LivejasminBonusType::findOrFail($bonusId);

            // Get the next order number if not provided
            $order = $request->input('order', $bonusType->criteria()->max('ljbc_order') + 1);

            $criteriaData = [
                'ljbt_id' => $bonusType->ljbt_id,
                'ljbc_condition_name' => $request->condition_name,
                'ljbc_operator' => $request->operator,
                'ljbc_target_value' => $request->target_value,
                'ljbc_condition_type' => $request->condition_type,
                'ljbc_order' => $order
            ];

            // Add fields based on condition type
            if ($request->condition_type === 'static') {
                $criteriaData['ljbc_api_endpoint'] = null;
                $criteriaData['ljbc_json_path'] = null;
                $criteriaData['ljbc_fixed_type'] = null;
            } else {
                $criteriaData['ljbc_api_endpoint'] = $request->api_endpoint;
                $criteriaData['ljbc_json_path'] = $request->json_path;
                $criteriaData['ljbc_fixed_type'] = null;
            }

            $criteria = LivejasminBonusCriteria::create($criteriaData);

            return response()->json([
                'success' => true,
                'message' => 'Criteria added successfully',
                'data' => [
                    'id' => $criteria->ljbc_id,
                    'condition_name' => $criteria->ljbc_condition_name,
                    'api_endpoint' => $criteria->ljbc_api_endpoint,
                    'json_path' => $criteria->ljbc_json_path,
                    'operator' => $criteria->ljbc_operator,
                    'operator_symbol' => $criteria->operator_symbol,
                    'target_value' => $criteria->ljbc_target_value,
                    'condition_type' => $criteria->ljbc_condition_type,
                    'fixed_type' => $criteria->ljbc_fixed_type,
                    'order' => $criteria->ljbc_order,
                    'description' => $criteria->description
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error adding criteria: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error adding criteria'
            ], 500);
        }
    }

    /**
     * Update a specific criteria
     */
    public function updateCriteria(Request $request, string $bonusId, string $criteriaId)
    {
        $validationRules = [
            'condition_name' => 'required|string|max:100',
            'operator' => 'required|string|in:>=,<=,>,<,=,==,!=,neq',
            'target_value' => 'required|numeric',
            'condition_type' => 'required|string|in:performance,score,time,earnings,static',
            'order' => 'integer|min:1'
        ];

        // Add conditional validation for static type
        if ($request->input('condition_type') !== 'static') {
            $validationRules['api_endpoint'] = 'required|string|max:100';
            $validationRules['json_path'] = 'required|string|max:100';
        }

        $validator = Validator::make($request->all(), $validationRules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $bonusType = LivejasminBonusType::findOrFail($bonusId);
            $criteria = $bonusType->criteria()->where('ljbc_id', $criteriaId)->firstOrFail();

            $updateData = [
                'ljbc_condition_name' => $request->condition_name,
                'ljbc_operator' => $request->operator,
                'ljbc_target_value' => $request->target_value,
                'ljbc_condition_type' => $request->condition_type,
                'ljbc_order' => $request->input('order', $criteria->ljbc_order)
            ];

            // Add fields based on condition type
            if ($request->condition_type === 'static') {
                $updateData['ljbc_api_endpoint'] = null;
                $updateData['ljbc_json_path'] = null;
                $updateData['ljbc_fixed_type'] = null;
            } else {
                $updateData['ljbc_api_endpoint'] = $request->api_endpoint;
                $updateData['ljbc_json_path'] = $request->json_path;
                $updateData['ljbc_fixed_type'] = null;
            }

            $criteria->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Criteria updated successfully',
                'data' => [
                    'id' => $criteria->ljbc_id,
                    'condition_name' => $criteria->ljbc_condition_name,
                    'api_endpoint' => $criteria->ljbc_api_endpoint,
                    'json_path' => $criteria->ljbc_json_path,
                    'operator' => $criteria->ljbc_operator,
                    'operator_symbol' => $criteria->operator_symbol,
                    'target_value' => $criteria->ljbc_target_value,
                    'condition_type' => $criteria->ljbc_condition_type,
                    'fixed_type' => $criteria->ljbc_fixed_type,
                    'order' => $criteria->ljbc_order,
                    'description' => $criteria->description
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating criteria: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating criteria'
            ], 500);
        }
    }

    /**
     * Delete a specific criteria
     */
    public function deleteCriteria(string $bonusId, string $criteriaId)
    {
        try {
            $bonusType = LivejasminBonusType::findOrFail($bonusId);
            $criteria = $bonusType->criteria()->where('ljbc_id', $criteriaId)->firstOrFail();

            $criteria->delete();

            return response()->json([
                'success' => true,
                'message' => 'Criteria deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting criteria: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting criteria'
            ], 500);
        }
    }

    /**
     * Get all criteria for a specific bonus type
     */
    public function getCriteria(string $bonusId)
    {
        try {
            $bonusType = LivejasminBonusType::findOrFail($bonusId);
            $criteria = $bonusType->criteria()->ordered()->get();

            return response()->json([
                'success' => true,
                'data' => $criteria->map(function ($criteria) {
                    return [
                        'id' => $criteria->ljbc_id,
                        'condition_name' => $criteria->ljbc_condition_name,
                        'api_endpoint' => $criteria->ljbc_api_endpoint,
                        'json_path' => $criteria->ljbc_json_path,
                        'operator' => $criteria->ljbc_operator,
                        'operator_symbol' => $criteria->operator_symbol,
                        'target_value' => $criteria->ljbc_target_value,
                        'condition_type' => $criteria->ljbc_condition_type,
                        'order' => $criteria->ljbc_order,
                        'description' => $criteria->description
                    ];
                })
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching criteria: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching criteria'
            ], 500);
        }
    }

    /**
     * Reorder criteria for a bonus type
     */
    public function reorderCriteria(Request $request, string $bonusId)
    {
        $validator = Validator::make($request->all(), [
            'criteria_order' => 'required|array',
            'criteria_order.*.id' => 'required|integer|exists:livejasmin_bonus_criteria,ljbc_id',
            'criteria_order.*.order' => 'required|integer|min:1'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $bonusType = LivejasminBonusType::findOrFail($bonusId);

            foreach ($request->criteria_order as $criteriaOrder) {
                $criteria = $bonusType->criteria()->where('ljbc_id', $criteriaOrder['id'])->first();
                if ($criteria) {
                    $criteria->update(['ljbc_order' => $criteriaOrder['order']]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Criteria reordered successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error reordering criteria: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error reordering criteria'
            ], 500);
        }
    }
}
