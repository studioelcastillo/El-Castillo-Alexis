<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentSignature extends Model
{
    use SoftDeletes;

    protected $table = 'document_signatures';
    protected $primaryKey = 'docsig_id';
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'docsig_id',
        'stdmod_id',
        'docsig_document_type',
        'docsig_signed_by_user_id',
        'docsig_role',
        'usrsig_id',
        'docsig_ip_address',
        'docsig_user_agent',
        'docsig_signed_at',
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
        'docsig_signed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the studio model associated with this signature.
     */
    public function studioModel()
    {
        return $this->belongsTo(StudioModel::class, 'stdmod_id', 'stdmod_id');
    }

    /**
     * Get the user who signed the document.
     */
    public function signedByUser()
    {
        return $this->belongsTo(User::class, 'docsig_signed_by_user_id', 'user_id');
    }

    /**
     * Get the signature used for this document.
     */
    public function userSignature()
    {
        return $this->belongsTo(UserSignature::class, 'usrsig_id', 'usrsig_id');
    }

    /**
     * Scope to get signatures for a specific document.
     */
    public function scopeForDocument($query, $stdmodId, $documentType)
    {
        return $query->where('stdmod_id', $stdmodId)
                    ->where('docsig_document_type', $documentType);
    }

    /**
     * Scope to get signatures by role.
     */
    public function scopeByRole($query, $role)
    {
        return $query->where('docsig_role', $role);
    }

    /**
     * Scope to get model signatures.
     */
    public function scopeModelSignatures($query)
    {
        return $query->where('docsig_role', 'model');
    }

    /**
     * Scope to get owner signatures.
     */
    public function scopeOwnerSignatures($query)
    {
        return $query->where('docsig_role', 'owner');
    }

    /**
     * Check if document type requires model signature.
     */
    public static function requiresModelSignature($documentType)
    {
        return in_array($documentType, ['contract', 'code_conduct', 'habeas_data']);
    }

    /**
     * Check if document type requires owner signature.
     */
    public static function requiresOwnerSignature($documentType)
    {
        return in_array($documentType, ['contract', 'certification', 'bank_letter', 'code_conduct', 'habeas_data']);
    }

    /**
     * Get document types that require both signatures.
     */
    public static function getBothSignatureDocuments()
    {
        return ['contract', 'code_conduct', 'habeas_data'];
    }

    /**
     * Get document types that only require owner signature.
     */
    public static function getOwnerOnlyDocuments()
    {
        return ['certification', 'bank_letter'];
    }
}

