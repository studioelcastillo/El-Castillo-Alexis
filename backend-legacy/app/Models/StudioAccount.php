<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudioAccount extends Model
{
    protected $table = 'studios_accounts';
    protected $primaryKey = 'stdacc_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'stdacc_id',
        'std_id',
        'stdacc_app',
        'stdacc_username',
        'stdacc_password',
        'stdacc_apikey',
        'stdacc_active',
        'stdacc_last_search_at',
        'stdacc_last_result_at',
        'stdacc_fail_message',
        'stdacc_fail_count',
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
}
