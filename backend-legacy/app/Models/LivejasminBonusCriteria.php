<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LivejasminBonusCriteria extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     */
    protected $table = 'livejasmin_bonus_criteria';

    /**
     * The primary key associated with the table.
     */
    protected $primaryKey = 'ljbc_id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'ljbt_id',
        'ljbc_condition_name',
        'ljbc_api_endpoint',
        'ljbc_json_path',
        'ljbc_operator',
        'ljbc_target_value',
        'ljbc_condition_type',
        'ljbc_fixed_type',
        'ljbc_order'
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'ljbt_id' => 'integer',
        'ljbc_target_value' => 'decimal:2',
        'ljbc_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    /**
     * Get the bonus type that owns this criteria.
     */
    public function bonusType()
    {
        return $this->belongsTo(LivejasminBonusType::class, 'ljbt_id', 'ljbt_id');
    }

    /**
     * Scope a query to order by criteria order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('ljbc_order');
    }

    /**
     * Scope a query to filter by condition type.
     */
    public function scopeByConditionType($query, $type)
    {
        return $query->where('ljbc_condition_type', $type);
    }

    /**
     * Get the operator symbol for display.
     */
    public function getOperatorSymbolAttribute()
    {
        $operators = [
            'gte' => '≥',
            'lte' => '≤',
            'gt' => '>',
            'lt' => '<',
            'eq' => '=',
            'neq' => '≠'
        ];

        return $operators[$this->ljbc_operator] ?? $this->ljbc_operator;
    }

    /**
     * Get a human-readable description of this criteria.
     */
    public function getDescriptionAttribute()
    {
        $endpoint = str_replace(['/models/{id}/', '/'], '', $this->ljbc_api_endpoint);
        $field = str_replace(['data.', '.'], [' ', ' '], $this->ljbc_json_path);
        
        return ucfirst($field) . ' ' . $this->operator_symbol . ' ' . $this->ljbc_target_value;
    }

    /**
     * Evaluate this criteria against provided data.
     */
    public function evaluate($value)
    {
        $targetValue = (float) $this->ljbc_target_value;
        $actualValue = (float) $value;

        switch ($this->ljbc_operator) {
            case 'gte':
                return $actualValue >= $targetValue;
            case 'lte':
                return $actualValue <= $targetValue;
            case 'gt':
                return $actualValue > $targetValue;
            case 'lt':
                return $actualValue < $targetValue;
            case 'eq':
                return abs($actualValue - $targetValue) < 0.01; // Float comparison
            case 'neq':
                return abs($actualValue - $targetValue) >= 0.01;
            default:
                return false;
        }
    }

    /**
     * Get the field name from JSON path for display.
     */
    public function getFieldNameAttribute()
    {
        $parts = explode('.', $this->ljbc_json_path);
        return end($parts);
    }
}
