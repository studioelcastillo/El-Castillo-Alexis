<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentFile extends Model
{
    protected $table = 'payments_files';
    protected $primaryKey = 'payfile_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'payfile_id',
        'payfile_description',
        'payfile_filename',
        'payfile_template',
        'payfile_total',
        'created_by',
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];


    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'payfile_id', 'payfile_id')->whereNull('payments.deleted_at');
    }
}
