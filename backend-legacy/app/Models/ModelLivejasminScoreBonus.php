<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ModelLivejasminScoreBonus extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     */
    protected $table = 'model_livejasmin_score_bonuses';

    /**
     * The primary key associated with the table.
     */
    protected $primaryKey = 'mlsb_id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'modlj_id',
        'modacc_id',
        'mlsb_period',
        'mlsb_period_start',
        'mlsb_period_end',
        'mlsb_evaluation_details'
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'modlj_id' => 'integer',
        'modacc_id' => 'integer',
        'mlsb_period' => 'string',
        'mlsb_period_start' => 'datetime',
        'mlsb_period_end' => 'datetime',
        'mlsb_evaluation_details' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    /**
     * Get the model livejasmin score that owns this bonus.
     */
    public function modelLivejasminScore()
    {
        return $this->belongsTo(ModelLivejasminScore::class, 'modlj_id', 'modlj_id');
    }

    /**
     * Get the model account that owns this bonus.
     */
    public function modelAccount()
    {
        return $this->belongsTo(ModelAccount::class, 'modacc_id', 'modacc_id');
    }

    /**
     * Scope a query to filter by period.
     */
    public function scopeByPeriod($query, $period)
    {
        return $query->where('mlsb_period', $period);
    }

    /**
     * Scope a query to filter by model account.
     */
    public function scopeByModelAccount($query, $modaccId)
    {
        return $query->where('modacc_id', $modaccId);
    }



    /**
     * Get evaluation summary from details.
     */
    public function getEvaluationSummaryAttribute()
    {
        if (!$this->mlsb_evaluation_details) {
            return 'Sin detalles de evaluación';
        }

        $details = $this->mlsb_evaluation_details;
        $summary = [];

        if (isset($details['criterias'])) {
            foreach ($details['criterias'] as $criteria) {
                $status = $criteria['is_achieved'] ? '✓' : '✗';
                $summary[] = $status . ' Criterio ' . $criteria['ljbc_id'];
            }
        }

        return implode(', ', $summary);
    }

    /**
     * Check if all criteria were met for a specific bonus type.
     */
    public function allCriteriaMet($bonusTypeId)
    {
        if (!$this->mlsb_evaluation_details || !isset($this->mlsb_evaluation_details['bonuses'])) {
            return false;
        }

        foreach ($this->mlsb_evaluation_details['bonuses'] as $bonus) {
            if ($bonus['ljbt_id'] == $bonusTypeId) {
                return $bonus['won_bonus'];
            }
        }

        return false;
    }

    /**
     * Get the number of criteria that were met for a specific bonus type.
     */
    public function getCriteriaMetCount($bonusTypeId)
    {
        if (!$this->mlsb_evaluation_details || !isset($this->mlsb_evaluation_details['bonuses'])) {
            return 0;
        }

        foreach ($this->mlsb_evaluation_details['bonuses'] as $bonus) {
            if ($bonus['ljbt_id'] == $bonusTypeId) {
                return $bonus['criterias_achieved'];
            }
        }

        return 0;
    }

    /**
     * Get the total number of criteria for a specific bonus type.
     */
    public function getTotalCriteriaCount($bonusTypeId)
    {
        if (!$this->mlsb_evaluation_details || !isset($this->mlsb_evaluation_details['bonuses'])) {
            return 0;
        }

        foreach ($this->mlsb_evaluation_details['bonuses'] as $bonus) {
            if ($bonus['ljbt_id'] == $bonusTypeId) {
                return $bonus['criterias_total'];
            }
        }

        return 0;
    }
    
    /**
     * Get all bonus types with their status.
     */
    public function getBonusesAttribute()
    {
        if (!$this->mlsb_evaluation_details || !isset($this->mlsb_evaluation_details['bonuses'])) {
            return [];
        }
        
        return $this->mlsb_evaluation_details['bonuses'];
    }
    
    /**
     * Get all criteria with their details.
     */
    public function getCriteriasAttribute()
    {
        if (!$this->mlsb_evaluation_details || !isset($this->mlsb_evaluation_details['criterias'])) {
            return [];
        }
        
        return $this->mlsb_evaluation_details['criterias'];
    }
}
