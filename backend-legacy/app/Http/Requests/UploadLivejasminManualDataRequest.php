<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadLivejasminManualDataRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization is handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // Max 10MB
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'file.required' => 'El archivo es requerido',
            'file.file' => 'Debe subir un archivo válido',
            'file.mimes' => 'El archivo debe ser de tipo: xlsx, xls o csv',
            'file.max' => 'El archivo no debe exceder los 10MB',
            'period_start.required' => 'La fecha de inicio del período es requerida',
            'period_start.date' => 'La fecha de inicio debe ser una fecha válida',
            'period_end.required' => 'La fecha de fin del período es requerida',
            'period_end.date' => 'La fecha de fin debe ser una fecha válida',
            'period_end.after_or_equal' => 'La fecha de fin debe ser igual o posterior a la fecha de inicio',
        ];
    }
}
