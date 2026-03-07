<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PetitionState extends Model
{
    protected $table = 'petitions_states';
    protected $primaryKey = 'ptnstate_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'ptn_id',
        'ptnstate_state',
        'ptnstate_observation',
        'user_id',
        'created_at'
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
