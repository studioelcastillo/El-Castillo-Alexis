<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransactionCommission extends Model
{
    protected $table = 'transactions_commissions';
    protected $primaryKey = 'transmodstr_id';
    public $timestamps = false;

    protected $fillable = [
        'trans_id',
        'stdmod_id',
        'transmodstr_str_value',
        'transmodstr_comm_value',
        'transmodstr_type',
        'transmodstr_percentage',
        'transmodstr_date'
    ];

    // Relaciones
    public function transaction()
    {
        return $this->belongsTo(Transaction::class, 'trans_id', 'trans_id');
    }

    public function studioModel()
    {
        return $this->belongsTo(StudioModel::class, 'stdmod_id', 'stdmod_id');
    }
}