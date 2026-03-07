<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ModelAccount extends Model
{
    // use SoftDeletes;

    protected $table = 'models_accounts';
    protected $primaryKey = 'modacc_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'modacc_id',
        'stdmod_id',
        'modacc_app',
        'modacc_username',
        'modacc_password',
        'modacc_state',
        'modacc_active',
        'modacc_last_search_at',
        'modacc_last_result_at',
        'modacc_fail_message',
        'modacc_fail_count',
        'modacc_payment_username',
        'modacc_mail',
        'modacc_linkacc',
        'last_activation_at',
        'modacc_screen_name',
        'modacc_earnings_rtefte'
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];


    public function studioModel()
    {
        return $this->belongsTo(StudioModel::class, 'stdmod_id', 'stdmod_id');
    }

    public function modelsStreams()
    {
        return $this->hasMany(ModelStream::class, 'modacc_id', 'modacc_id')->whereNull('models_streams.deleted_at');
    }

    public function livejasminScores()
    {
        return $this->hasMany(ModelLivejasminScore::class, 'modacc_id', 'modacc_id')->whereNull('models_livejasmin_scores.deleted_at');
    }
}
