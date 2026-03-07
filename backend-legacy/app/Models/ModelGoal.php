<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModelGoal extends Model
{
    protected $table = 'models_goals';
    protected $primaryKey = 'modgoal_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'modgoal_id',
        'stdmod_id',
        'modgoal_type',
        'modgoal_amount',
        'modgoal_percent',
        'modgoal_auto',
        'modgoal_date',
        'modgoal_reach_goal',
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];


    public function studioModel()
    {
        return $this->belongsTo(StudioModel::class, 'stdmod_id', 'stdmod_id');
    }
}
