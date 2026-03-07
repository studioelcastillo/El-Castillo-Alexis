<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModelStream extends Model
{
    protected $table = 'models_streams';
    protected $primaryKey = 'modstr_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'modstr_id',
        'modacc_id',
        'modstr_date',
        'modstr_period',
        'modstr_start_at',
        'modstr_finish_at',
        'modstr_price',
        'modstr_earnings_value',
        'modstr_earnings_trm',
        'modstr_earnings_percent',
        'modstr_earnings_tokens',
        'modstr_earnings_tokens_rate',
        'modstr_earnings_usd',
        'modstr_earnings_eur',
        'modstr_earnings_cop',
        'modstr_earnings_trm_studio',
        'modstr_earnings_percent_studio',
        'modstr_earnings_cop_studio',
        'modstr_time',
        'modstrfile_id',
        'modstr_source',
        'period_id',
        'stdacc_id',
        'modstr_addon',
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];


    public function modelAccount()
    {
        return $this->belongsTo(ModelAccount::class, 'modacc_id', 'modacc_id');
    }

    public function modelStreamFile()
    {
        return $this->belongsTo(ModelStreamFile::class, 'modstrfile_id', 'modstrfile_id');
    }

    public function modelsStreamsCustomers()
    {
        return $this->hasMany(ModelStreamCustomer::class, 'modstr_id', 'modstr_id')->whereNull('models_streams_customers.deleted_at');
    }
}
