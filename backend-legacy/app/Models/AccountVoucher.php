<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountVoucher extends Model
{
    protected $table = 'accounting_voucher';
    protected $primaryKey = 'accvou_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'accvou_description',
        'accvou_siigo_code',
        'accvou_consecutive'
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];
}