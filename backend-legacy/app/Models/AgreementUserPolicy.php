<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgreementUserPolicy extends Model
{
    public $timestamps = true;

    protected $table = 'agreements_users_policies';
    protected $primaryKey = 'aggusrpol_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'pol_id',
        'user_id',
        'aggusrpol_agreement'
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];
}
