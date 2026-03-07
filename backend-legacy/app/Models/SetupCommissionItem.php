<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SetupCommissionItem extends Model
{
    protected $table = 'setups_commissions_items';
    protected $primaryKey = 'setcommitem_id';
    public $timestamps = false;

    protected $fillable = [
        'setcomm_id',
        'setcommitem_value',
        'setcommitem_limit',
    ];

    public function commission()
    {
        return $this->belongsTo(SetupCommission::class, 'setcomm_id', 'setcomm_id');
    }
}
