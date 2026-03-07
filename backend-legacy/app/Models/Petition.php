<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Petition extends Model
{
    protected $table = 'petitions';
    protected $primaryKey = 'ptn_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'ptn_consecutive',
        'ptn_type',
        'ptn_mail',
        'ptn_mail_final',
        'ptn_nick',
        'ptn_nick_final',
        'ptn_password',
        'ptn_password_final',
        'ptn_page',
        'ptn_payment_pseudonym',
        'user_id',
        'stdmod_id',
        'ptn_linkacc'
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

    public function petition_state()
    {
        return $this->hasMany(PetitionState::class, 'ptn_id', 'ptn_id')->orderBy('created_at', 'asc');
    }

    public function studio_model()
    {
        return $this->belongsTo(StudioModel::class, 'stdmod_id', 'stdmod_id');
    }
}
