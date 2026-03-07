<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SkippedCoincidence extends Model
{
    protected $table = 'skipped_coincidences';
    protected $primaryKey = 'skpcoin_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id_new',
        'user_id_created_by',
        'skpcoin_observation',
        'skpcoin_type'
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];
}
