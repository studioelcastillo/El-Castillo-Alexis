<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudioRoom extends Model
{
    protected $table = 'studios_rooms';
    protected $primaryKey = 'stdroom_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'stdroom_id',
        'std_id',
        'stdroom_name',
        'stdroom_consecutive',
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
        return $this->hasMany(StudioModel::class, 'stdroom_id', 'stdroom_id')->whereNull('studios_models.deleted_at');
    }
}
