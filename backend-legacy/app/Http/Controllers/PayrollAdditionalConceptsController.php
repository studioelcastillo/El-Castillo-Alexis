<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\PayrollAdditionalConcept;
use Exception;

class PayrollAdditionalConceptsController extends Controller
{
    /**
     * Listar conceptos adicionales de un período de nómina
     */
    public function index(Request $request, $periodId)
    {
        try {
            $concepts = PayrollAdditionalConcept::where('payroll_period_id', $periodId)
                ->with('user:user_id,user_name,user_surname')
                ->orderBy('user_id')
                ->orderBy('created_at')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $concepts
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'fail',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nuevo concepto adicional
     */
    public function store(Request $request, $periodId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|integer|exists:users,user_id',
                'concept_type' => 'required|string|max:50',
                'description' => 'nullable|string',
                'hours' => 'nullable|numeric|min:0',
                'hourly_rate' => 'nullable|numeric|min:0',
                'surcharge_percentage' => 'nullable|numeric|min:0',
                'total_amount' => 'required|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'fail',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->all();
            $data['payroll_period_id'] = $periodId;

            // Si es hora extra, calcular el total_amount automáticamente
            if (strpos($data['concept_type'], 'EXTRA_HOUR_') === 0) {
                $baseAmount = $data['hourly_rate'] * $data['hours'];
                $surchargeAmount = $baseAmount * ($data['surcharge_percentage'] / 100);
                $data['total_amount'] = $baseAmount + $surchargeAmount;
            }

            $concept = PayrollAdditionalConcept::create($data);

            return response()->json([
                'status' => 'success',
                'data' => $concept
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'fail',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar concepto adicional
     */
    public function update(Request $request, $id)
    {
        try {
            $concept = PayrollAdditionalConcept::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'concept_type' => 'sometimes|string|max:50',
                'description' => 'nullable|string',
                'hours' => 'nullable|numeric|min:0',
                'hourly_rate' => 'nullable|numeric|min:0',
                'surcharge_percentage' => 'nullable|numeric|min:0',
                'total_amount' => 'sometimes|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'fail',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->all();

            // Recalcular total_amount si es hora extra y se modificaron los valores
            if (isset($data['concept_type']) && strpos($data['concept_type'], 'EXTRA_HOUR_') === 0) {
                $hours = $data['hours'] ?? $concept->hours;
                $hourlyRate = $data['hourly_rate'] ?? $concept->hourly_rate;
                $surchargePercentage = $data['surcharge_percentage'] ?? $concept->surcharge_percentage;

                $baseAmount = $hourlyRate * $hours;
                $surchargeAmount = $baseAmount * ($surchargePercentage / 100);
                $data['total_amount'] = $baseAmount + $surchargeAmount;
            }

            $concept->update($data);

            return response()->json([
                'status' => 'success',
                'data' => $concept
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'fail',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar concepto adicional
     */
    public function destroy($id)
    {
        try {
            $concept = PayrollAdditionalConcept::findOrFail($id);
            $concept->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Concepto eliminado correctamente'
            ], 200);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'fail',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
