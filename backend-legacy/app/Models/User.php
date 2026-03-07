<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;
use Illuminate\Support\Facades\DB;
// use Laravel\Sanctum\HasApiTokens; // Otra version de auth, pero se usa passport

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $primaryKey = 'user_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_identification',
        'user_identification_type',
        'user_issued_in',
        'user_name',
        'user_name2',
        'user_surname',
        'user_surname2',
        'user_email',
        'user_password',
        'user_token_recovery_password',
        'prof_id',
        'user_sex',
        'user_telephone',
        'user_address',
        'user_active',
        'user_image',
        'user_birthdate',
        'user_bank_entity',
        'user_bank_account',
        'user_bank_account_type',
        'user_last_login',
        'std_id',
        'user_beneficiary_name',
        'user_beneficiary_document',
        'user_beneficiary_document_type',
        'city_id',
        'user_rh',
        'user_model_category',
        'created_at',
        'updated_at',
        'deleted_at',
        'user_personal_email'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'user_password',
        // 'remember_token',
    ];

    public function getAuthPassword()
    {
        return $this->user_password;
    }

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        // 'email_verified_at' => 'datetime',
        // 'password' => 'hashed',
    ];

    public function profile()
    {
        return $this->belongsTo(Profile::class, 'prof_id', 'prof_id');
    }

    public function linkedSocialAccounts()
    {
        return $this->hasMany(SocialAccount::class, 'user_id', 'user_id');
    }

    public function permissions()
    {
        return $this->hasMany(UserPermission::class, 'user_id', 'user_id');
    }

    public function studioModel()
    {
        return $this->hasMany(StudioModel::class, 'user_id_model', 'user_id');
    }

    public function studio()
    {
        return $this->belongsTo(Studio::class, 'std_id', 'std_id');
    }

    public function studiosOwned()
    {
        return $this->hasMany(Studio::class, 'user_id_owner', 'user_id')
                    ->select(['std_id', 'std_name', 'std_dispenser', 'user_id_owner'])
                    ->whereNull('deleted_at');
    }

    public function city()
    {
        return $this->belongsTo(City::class, 'city_id', 'city_id');
    }

    public function additional_models()
    {
        return $this->hasMany(UserAdditionalModel::class, 'user_id', 'user_id');
    }

    public function latest_documents()
    {
        return $this->hasMany(Document::class, 'user_id', 'user_id')->whereNull('usraddmod_id');
    }

    public function profile_picture_document()
    {
        return $this->hasOne(Document::class, 'user_id', 'user_id')->whereNull('usraddmod_id')->where('doc_label', 'IMG_PROFILE');
    }

    public function signatures()
    {
        return $this->hasMany(UserSignature::class, 'user_id', 'user_id');
    }

    public function activeSignature()
    {
        return $this->hasOne(UserSignature::class, 'user_id', 'user_id')->where('usrsig_active', true)->latest();
    }

    public function documentSignatures()
    {
        return $this->hasMany(DocumentSignature::class, 'docsig_signed_by_user_id', 'user_id');
    }

    /**
     * Retorna el nombre completo del usuario concatenando todos los campos de nombre.
     * Incluye: primer nombre, segundo nombre, primer apellido y segundo apellido.
     *
     * @return string
     */
    public function fullName()
    {
        return trim(
            ($this->user_name ?? '') . ' ' .
            ($this->user_name2 ?? '') . ' ' .
            ($this->user_surname ?? '') . ' ' .
            ($this->user_surname2 ?? '')
        );
    }

    /**
     * Accessor para obtener el nombre completo como atributo.
     * Permite acceder como: $user->full_name
     *
     * @return string
     */
    public function getFullNameAttribute()
    {
        return $this->fullName();
    }

    // Relación a través de StudioModel -> ModelAccount -> ModelLivejasminScore
    public function livejasminScores()
    {
        return $this->hasManyThrough(
            ModelLivejasminScore::class,
            ModelAccount::class,
            'stdmod_id', // Foreign key en ModelAccount
            'modacc_id', // Foreign key en ModelLivejasminScore
            'user_id', // Local key en User
            'modacc_id' // Local key en ModelAccount
        )->whereHas('studioModel', function($query) {
            $query->where('user_id_model', $this->user_id);
        });
    }

    // Accessor para username (compatibilidad)
    public function getUsernameAttribute()
    {
        return $this->attributes['user_name'] ?? $this->user_identification ?? 'N/A';
    }
}
