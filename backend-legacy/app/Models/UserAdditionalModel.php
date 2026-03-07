<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserAdditionalModel extends Model
{
	// use SoftDeletes;

    protected $table = 'users_additional_models';
    protected $primaryKey = 'usraddmod_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'usraddmod_name',
        'usraddmod_identification',
        'usraddmod_birthdate',
        'usraddmod_category',
        'user_id'
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];

    public function latest_documents()
    {
        return $this->hasMany(Document::class, 'usraddmod_id', 'usraddmod_id');
    }
}
