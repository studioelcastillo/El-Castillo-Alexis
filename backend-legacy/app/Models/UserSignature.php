<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserSignature extends Model
{
    use SoftDeletes;

    protected $table = 'user_signatures';
    protected $primaryKey = 'usrsig_id';
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'usrsig_id',
        'user_id',
        'usrsig_image_path',
        'usrsig_type',
        'usrsig_active',
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'usrsig_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the user that owns the signature.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    /**
     * Get all document signatures using this signature.
     */
    public function documentSignatures()
    {
        return $this->hasMany(DocumentSignature::class, 'usrsig_id', 'usrsig_id');
    }

    /**
     * Scope to get only active signatures.
     */
    public function scopeActive($query)
    {
        return $query->where('usrsig_active', true);
    }

    /**
     * Scope to get signatures by user.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Get the full path to the signature image.
     */
    public function getFullPathAttribute()
    {
        return storage_path('app/public/signatures/' . $this->usrsig_image_path);
    }

    /**
     * Get the public URL to the signature image.
     */
    public function getPublicUrlAttribute()
    {
        return url('storage/signatures/' . $this->usrsig_image_path);
    }
}

