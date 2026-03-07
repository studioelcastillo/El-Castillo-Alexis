<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Commission extends Model
{
    protected $table = 'commissions';
    protected $primaryKey = 'comm_id';
    public $timestamps = false;

    protected $fillable = [
        'commparent_id',
        'stdmod_id',
        'setcomm_id',
        'std_id',
        'comm_track_beyond_childs',
        'comm_expire_date'
    ];

    public function parent()
    {
        return $this->belongsTo(Commission::class, 'commparent_id', 'comm_id');
    }

    public function children()
    {
        return $this->hasMany(Commission::class, 'commparent_id', 'comm_id');
    }

    public function stdmod()
    {
        return $this->belongsTo(StudioModel::class, 'stdmod_id', 'stdmod_id');
    }

    public function setupCommission()
    {
        return $this->belongsTo(SetupCommission::class, 'setcomm_id', 'setcomm_id');
    }
    
    public function studio()
    {
        return $this->belongsTo(Studio::class, 'std_id', 'std_id');
    }
}
