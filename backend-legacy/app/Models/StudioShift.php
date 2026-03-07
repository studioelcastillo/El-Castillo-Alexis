<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudioShift extends Model
{
    protected $table = 'studios_shifts';
    protected $primaryKey = 'stdshift_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'stdshift_id',
        'std_id',
        'stdshift_name',
        'stdshift_begin_time',
        'stdshift_finish_time',
        'stdshift_capacity',
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

    public function studiosModels()
    {
        return $this->hasMany(StudioModel::class, 'stdshift_id', 'stdshift_id')->whereNull('studios_models.deleted_at');
    }
}
