<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LivejasminBonusType extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     */
    protected $table = 'livejasmin_bonus_types';

    /**
     * The primary key associated with the table.
     */
    protected $primaryKey = 'ljbt_id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'ljbt_name',
        'ljbt_code',
        'ljbt_percentage',
        'ljbt_description',
        'ljbt_target_profiles',
        'ljbt_active'
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'ljbt_percentage' => 'decimal:2',
        'ljbt_target_profiles' => 'array',
        'ljbt_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    /**
     * Get the criteria for this bonus type.
     */
    public function criteria()
    {
        return $this->hasMany(LivejasminBonusCriteria::class, 'ljbt_id', 'ljbt_id')
                    ->orderBy('ljbc_order');
    }

    /**
     * Get the model score bonuses for this bonus type.
     */
    public function modelScoreBonuses()
    {
        return $this->hasMany(ModelLivejasminScoreBonus::class, 'ljbt_id', 'ljbt_id');
    }

    /**
     * Scope a query to only include active bonus types.
     */
    public function scopeActive($query)
    {
        return $query->where('ljbt_active', true);
    }

    /**
     * Scope a query to filter by target profile.
     */
    public function scopeForProfile($query, $profile)
    {
        return $query->where(function ($q) use ($profile) {
            $q->whereJsonContains('ljbt_target_profiles', $profile)
              ->orWhereJsonContains('ljbt_target_profiles', 'all');
        });
    }

    /**
     * Get formatted percentage for display.
     */
    public function getFormattedPercentageAttribute()
    {
        return number_format($this->ljbt_percentage, 2) . '%';
    }

    /**
     * Check if this bonus type applies to a specific profile.
     */
    public function appliesToProfile($profile)
    {
        $targets = $this->ljbt_target_profiles ?? [];
        return in_array('all', $targets) || in_array($profile, $targets);
    }
}
