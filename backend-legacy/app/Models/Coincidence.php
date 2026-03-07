<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coincidence extends Model
{
    protected $table = 'coincidences';
    protected $primaryKey = 'coin_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'skpcoin_id',
        'coin_entity'
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];
}
