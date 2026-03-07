<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModelStreamFile extends Model
{
    protected $table = 'models_streams_files';
    protected $primaryKey = 'modstrfile_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'modstrfile_id',
        'modstrfile_description',
        'modstrfile_filename',
        'modstrfile_template',
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

    public function modelsStreams()
    {
        return $this->hasMany(ModelStream::class, 'modstrfile_id', 'modstrfile_id')->whereNull('models_streams.deleted_at');
    }
}
