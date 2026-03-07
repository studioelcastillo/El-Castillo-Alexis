<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransactionType extends Model
{
    protected $table = 'transactions_types';
    protected $primaryKey = 'transtype_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'transtype_id',
        'transtype_group',
        'transtype_name',
        'transtype_behavior',
        'transtype_rtefte',
        'transtype_value'
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];


    public function modelsTransactions()
    {
        return $this->hasMany(ModelTransaction::class, 'transtype_id', 'transtype_id')->whereNull('models_transactions.deleted_at');
    }
}
