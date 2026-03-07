<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankAccount extends Model
{
    protected $table = 'banks_accounts';
    protected $primaryKey = 'bankacc_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'bankacc_id',
        'std_id',
        'bankacc_entity',
        'bankacc_number',
        'bankacc_type',
        'bankacc_main',
        'bankacc_beneficiary_name',
        'bankacc_beneficiary_document',
        'bankacc_beneficiary_document_type',
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
