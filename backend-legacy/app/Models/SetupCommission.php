<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SetupCommission extends Model
{
    protected $table = 'setups_commissions';
    protected $primaryKey = 'setcomm_id';
    public $timestamps = true;

    protected $fillable = [
        'std_id',
        'setcomm_title',
        'setcomm_description',
        'setcomm_type',
    ];

    // Relaciones
    public function studio()
    {
        return $this->belongsTo(Studio::class, 'std_id', 'std_id');
    }

    public function items()
    {
        return $this->hasMany(SetupCommissionItem::class, 'setcomm_id', 'setcomm_id')->orderBy('setcommitem_limit', 'asc');
    }
}
