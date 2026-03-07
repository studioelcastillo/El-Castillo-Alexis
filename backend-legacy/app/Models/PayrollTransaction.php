<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollTransaction extends Model
{
    use HasFactory;

    protected $table = 'payroll_transactions';
    protected $primaryKey = 'payroll_trans_id';

    protected $fillable = [
        'payroll_period_id',
        'user_id',
        'stdmod_id',
        'base_salary',
        'dotacion_amount',
        'commission_amount',
        'extra_hours_amount',
        'transport_allowance',
        'food_allowance',
        'cesantias',
        'prima',
        'vacaciones',
        'eps_employee',
        'pension_employee',
        'eps_employer',
        'pension_employer',
        'arl',
        'sena',
        'icbf',
        'caja_compensacion',
        'total_devengado',
        'total_deducciones',
        'total_neto',
        'commission_periods'
    ];

    protected $casts = [
        'commission_periods' => 'array',
        'base_salary' => 'decimal:2',
        'dotacion_amount' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'extra_hours_amount' => 'decimal:2',
        'transport_allowance' => 'decimal:2',
        'food_allowance' => 'decimal:2',
        'cesantias' => 'decimal:2',
        'prima' => 'decimal:2',
        'vacaciones' => 'decimal:2',
        'eps_employee' => 'decimal:2',
        'pension_employee' => 'decimal:2',
        'eps_employer' => 'decimal:2',
        'pension_employer' => 'decimal:2',
        'arl' => 'decimal:2',
        'sena' => 'decimal:2',
        'icbf' => 'decimal:2',
        'caja_compensacion' => 'decimal:2',
        'total_devengado' => 'decimal:2',
        'total_deducciones' => 'decimal:2',
        'total_neto' => 'decimal:2'
    ];

    // Relationships
    public function period()
    {
        return $this->belongsTo(PayrollPeriod::class, 'payroll_period_id', 'payroll_period_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function studioModel()
    {
        return $this->belongsTo(StudioModel::class, 'stdmod_id', 'stdmod_id');
    }

    // Calculation methods
    public function calculateTotalDevengado()
    {
        return $this->base_salary +
               $this->commission_amount +
               $this->extra_hours_amount +
               $this->transport_allowance +
               $this->food_allowance +
               $this->cesantias +
               $this->prima +
               $this->vacaciones;
    }

    public function calculateTotalDeducciones()
    {
        return $this->eps_employee + $this->pension_employee;
    }

    public function calculateTotalNeto()
    {
        return $this->calculateTotalDevengado() - $this->calculateTotalDeducciones();
    }

    // Helper methods
    public function getTotalPrestaciones()
    {
        return $this->cesantias + $this->prima + $this->vacaciones;
    }

    public function getTotalParafiscales()
    {
        return $this->sena + $this->icbf + $this->caja_compensacion;
    }

    public function getTotalSeguridadSocial()
    {
        return $this->eps_employee + $this->pension_employee +
               $this->eps_employer + $this->pension_employer + $this->arl;
    }

    // Scopes
    public function scopeForPeriod($query, $periodId)
    {
        return $query->where('payroll_period_id', $periodId);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeWithRelations($query)
    {
        return $query->with(['period', 'user', 'studioModel']);
    }
}
