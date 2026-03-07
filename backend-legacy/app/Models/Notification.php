<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $table = 'notifications';
    protected $primaryKey = 'noti_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
      'user_id', 'user_id_to_notify', 'noti_type', 'noti_title', 'noti_data', 'noti_menu', 'noti_read', 'deleted_at'
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];

    public function from()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id')->select('user_id', 'user_name', 'user_email');
    }

    public function to()
    {
        return $this->belongsTo(User::class, 'user_id_to_notify', 'user_id')->select('user_id', 'user_name', 'user_email');
    }
}
