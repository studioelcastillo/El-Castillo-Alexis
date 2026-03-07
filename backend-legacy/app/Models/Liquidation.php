<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Liquidation extends Model
{
    protected $table = 'liquidations';
    protected $primaryKey = 'liq_id';
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'liq_id',
        'modacc_id',
        'liq_date',
        'liq_period',
        'liq_start_at',
        'liq_finish_at',
        'liq_price',
        'liq_earnings_value',
        'liq_earnings_trm',
        'liq_earnings_percent',
        'liq_earnings_tokens',
        'liq_earnings_tokens_rate',
        'liq_earnings_usd',
        'liq_earnings_eur',
        'liq_earnings_cop',
        'liq_earnings_trm_studio',
        'liq_earnings_percent_studio',
        'liq_earnings_cop_studio',
        'liq_time',
        'modstrfile_id',
        'liq_source',
        'period_id',
        'stdmod_id',
        'std_id',
        'stdacc_id',
        'liq_addon',
        'liq_rtefte_model',
        'liq_rtefte_studio',
        'modstr_id',
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [];

    /**
     * Relationship: Liquidation belongs to ModelAccount
     */
    public function modelAccount()
    {
        return $this->belongsTo(ModelAccount::class, 'modacc_id', 'modacc_id');
    }

    /**
     * Relationship: Liquidation belongs to ModelStream (traceability)
     */
    public function modelStream()
    {
        return $this->belongsTo(ModelStream::class, 'modstr_id', 'modstr_id');
    }

    /**
     * Relationship: Liquidation belongs to ModelStreamFile
     */
    public function modelStreamFile()
    {
        return $this->belongsTo(ModelStreamFile::class, 'modstrfile_id', 'modstrfile_id');
    }

    /**
     * Relationship: Liquidation belongs to Period
     */
    public function period()
    {
        return $this->belongsTo(Period::class, 'period_id', 'period_id');
    }

    /**
     * Relationship: Liquidation belongs to Studio
     */
    public function studio()
    {
        return $this->belongsTo(Studio::class, 'std_id', 'std_id');
    }

    /**
     * Relationship: Liquidation belongs to StudioAccount
     */
    public function studioAccount()
    {
        return $this->belongsTo(StudioAccount::class, 'stdacc_id', 'stdacc_id');
    }

    /**
     * Relationship: Liquidation belongs to StudioModel
     */
    public function studioModel()
    {
        return $this->belongsTo(StudioModel::class, 'stdmod_id', 'stdmod_id');
    }
}

