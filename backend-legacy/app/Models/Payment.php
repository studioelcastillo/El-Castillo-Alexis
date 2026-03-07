<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $table = 'payments';
    protected $primaryKey = 'pay_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'pay_id',
        'payfile_id',
        'std_id',
        'stdmod_id',
        'pay_amount',
        'pay_period_since',
        'pay_period_until',
        'pay_models_report_generated',
        'pay_models_retefuente_generated'
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];


    public function studio()
    {
        return $this->belongsTo(Studio::class, 'std_id', 'std_id');
    }

    public function studioModel()
    {
        return $this->belongsTo(StudioModel::class, 'stdmod_id', 'stdmod_id');
    }

    public function paymentFile()
    {
        return $this->belongsTo(PaymentFile::class, 'payfile_id', 'payfile_id');
    }

    public function modelsAccounts()
    {
        return $this->hasMany(ModelAccount::class, 'stdmod_id', 'stdmod_id');
    }
}
