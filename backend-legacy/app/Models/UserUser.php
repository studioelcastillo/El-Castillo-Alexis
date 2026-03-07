<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserUser extends Model
{
    protected $table = 'users_users';
    protected $primaryKey = 'usersusers_id';
    public $timestamps = true;

    protected $fillable = [
        'userparent_id',
        'userchild_id',
    ];

    // Relaciones con el modelo User
    public function parent()
    {
        return $this->belongsTo(User::class, 'userparent_id', 'user_id');
    }

    public function child()
    {
        return $this->belongsTo(User::class, 'userchild_id', 'user_id');
    }
}
