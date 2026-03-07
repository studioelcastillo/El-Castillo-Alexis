<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DispenserFile extends Model
{
    protected $table = 'dispenser_files';
    protected $primaryKey = 'dispfile_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'dispfile_id',
        'dispfile_filename',
        'dispfile_original_filename',
        'dispfile_records_success',
        'dispfile_records_error',
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
}
