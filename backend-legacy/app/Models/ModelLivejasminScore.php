<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ModelLivejasminScore extends Model
{
    use SoftDeletes;

    protected $table = 'models_livejasmin_scores';
    protected $primaryKey = 'modlj_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'modlj_id',
        'modacc_id',
        'modlj_screen_name',
        'modlj_period_start',
        'modlj_period_end',
        'modlj_hours_connection',
        'modlj_hours_preview',
        'modlj_hours_total_connection',
        'modlj_hours_member_other',
        'modlj_score_traffic',
        'modlj_score_conversion',
        'modlj_score_engagement',
        'modlj_offers_initiated',
        'modlj_new_members',
        'modlj_hot_deals',
        'modlj_average_hour',
        'modlj_earnings_usd',
        'modlj_bonus_5_percent',
        'modlj_bonus_10_percent',
        'modlj_earnings_private',
        'modlj_earnings_vip_show',
        'modlj_earnings_video_voice_call',
        'modlj_earnings_cam2cam',
        'modlj_earnings_surprise',
        'modlj_earnings_message',
        'modlj_earnings_interactive_toy',
        'modlj_earnings_bonus',
        'modlj_earnings_other',
        'modlj_earnings_my_content',
        'modlj_dynamic_bonus_data',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'modlj_bonus_5_percent' => 'boolean',
        'modlj_bonus_10_percent' => 'boolean',
        'modlj_hours_connection' => 'decimal:1',
        'modlj_hours_preview' => 'decimal:1',
        'modlj_hours_total_connection' => 'decimal:1',
        'modlj_hours_member_other' => 'decimal:1',
        'modlj_average_hour' => 'decimal:2',
        'modlj_earnings_usd' => 'decimal:2',
        'modlj_earnings_private' => 'decimal:2',
        'modlj_earnings_vip_show' => 'decimal:2',
        'modlj_earnings_video_voice_call' => 'decimal:2',
        'modlj_earnings_cam2cam' => 'decimal:2',
        'modlj_earnings_surprise' => 'decimal:2',
        'modlj_earnings_message' => 'decimal:2',
        'modlj_earnings_interactive_toy' => 'decimal:2',
        'modlj_earnings_bonus' => 'decimal:2',
        'modlj_earnings_other' => 'decimal:2',
        'modlj_earnings_my_content' => 'decimal:2',
        'modlj_dynamic_bonus_data' => 'array',
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [];

    /**
     * Get the model account that owns the LiveJasmin score.
     */
    public function modelAccount()
    {
        return $this->belongsTo(ModelAccount::class, 'modacc_id', 'modacc_id');
    }

    /**
     * Get the total bonus amount for this score.
     */
    public function getTotalBonusAmountAttribute()
    {
        return $this->dynamic_bonus_amount;
    }

    /**
     * Check if this score qualifies for any bonuses.
     */
    public function hasQualifyingBonuses()
    {
        return $this->hasQualifyingDynamicBonuses();
    }

    /**
     * Get bonus qualification summary.
     */
    public function getBonusQualificationSummaryAttribute()
    {
        $dynamicData = $this->dynamic_bonuses;
        
        if (!$dynamicData) {
            return [
                'total_bonuses_evaluated' => 0,
                'qualifying_bonuses' => 0,
                'total_bonus_amount' => 0,
                'qualification_rate' => 0
            ];
        }
        
        $total = $dynamicData['total_bonuses_evaluated'] ?? 0;
        $qualifying = $dynamicData['qualifying_bonuses_count'] ?? 0;
        
        return [
            'total_bonuses_evaluated' => $total,
            'qualifying_bonuses' => $qualifying,
            'total_bonus_amount' => $this->total_bonus_amount,
            'qualification_rate' => $total > 0 ? round(($qualifying / $total) * 100, 2) : 0
        ];
    }

    /**
     * Get dynamic bonuses data.
     */
    public function getDynamicBonusesAttribute()
    {
        if (!$this->modlj_dynamic_bonus_data) {
            return null;
        }

        return $this->modlj_dynamic_bonus_data;
    }

    /**
     * Get total dynamic bonus amount.
     */
    public function getDynamicBonusAmountAttribute()
    {
        $dynamicData = $this->dynamic_bonuses;
        
        if (!$dynamicData || !isset($dynamicData['total_bonus_amount'])) {
            return 0;
        }

        return $dynamicData['total_bonus_amount'];
    }

    /**
     * Get dynamic bonus percentage.
     */
    public function getDynamicBonusPercentageAttribute()
    {
        $dynamicData = $this->dynamic_bonuses;
        
        if (!$dynamicData || !isset($dynamicData['total_bonus_percentage'])) {
            return 0;
        }

        return $dynamicData['total_bonus_percentage'];
    }

    /**
     * Check if has qualifying dynamic bonuses.
     */
    public function hasQualifyingDynamicBonuses()
    {
        $dynamicData = $this->dynamic_bonuses;
        
        if (!$dynamicData || !isset($dynamicData['qualifying_bonuses_count'])) {
            return false;
        }

        return $dynamicData['qualifying_bonuses_count'] > 0;
    }

    /**
     * Get combined bonus summary (legacy + dynamic).
     */
    public function getCombinedBonusSummaryAttribute()
    {
        $legacyBonus = 0;
        if ($this->modlj_bonus_5_percent) $legacyBonus += 5;
        if ($this->modlj_bonus_10_percent) $legacyBonus += 10;

        $dynamicBonus = $this->dynamic_bonus_percentage;
        $dynamicAmount = $this->dynamic_bonus_amount;

        return [
            'legacy_bonus_percentage' => $legacyBonus,
            'dynamic_bonus_percentage' => $dynamicBonus,
            'total_bonus_percentage' => $legacyBonus + $dynamicBonus,
            'dynamic_bonus_amount' => $dynamicAmount,
            'has_legacy_bonuses' => $legacyBonus > 0,
            'has_dynamic_bonuses' => $this->hasQualifyingDynamicBonuses(),
            'dynamic_data' => $this->dynamic_bonuses
        ];
    }
}
