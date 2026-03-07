<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollAdditionalConcept extends Model
{
    use HasFactory;

    protected $table = 'payroll_additional_concepts';
    protected $primaryKey = 'payroll_concept_id';

    protected $fillable = [
        'payroll_period_id',
        'user_id',
        'concept_type',
        'description',
        'hours',
        'hourly_rate',
        'surcharge_percentage',
        'total_amount',
    ];

    protected $casts = [
        'hours' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
        'surcharge_percentage' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    // Relaciones
    public function payrollPeriod()
    {
        return $this->belongsTo(PayrollPeriod::class, 'payroll_period_id', 'payroll_period_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
