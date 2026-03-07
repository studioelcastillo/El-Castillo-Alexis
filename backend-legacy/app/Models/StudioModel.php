<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudioModel extends Model
{
    // use SoftDeletes;

    protected $table = 'studios_models';
    protected $primaryKey = 'stdmod_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'stdmod_id',
        'std_id',
        'stdroom_id',
        'user_id_model',
        'stdmod_start_at',
        'stdmod_finish_at',
        'stdmod_active',
        'stdmod_percent',
        'stdmod_rtefte',
        'stdshift_id',
        'stdmod_commission_type',
        'stdmod_goal',
        'stdmod_contract_type',
        'stdmod_contract_number',
        'stdmod_position',
        'stdmod_area',
        'city_id',
        // Campos de nómina
        'stdmod_monthly_salary',
        'stdmod_biweekly_salary',
        'stdmod_daily_salary',
        'stdmod_dotacion_amount',
        'stdmod_has_sena',
        'stdmod_has_caja_compensacion',
        'stdmod_has_icbf',
        'stdmod_arl_risk_level',
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];


    public function studio()
    {
        return $this->belongsTo(Studio::class, 'std_id', 'std_id');
    }

    public function studioRoom()
    {
        return $this->belongsTo(StudioRoom::class, 'stdroom_id', 'stdroom_id');
    }

    public function userModel()
    {
        return $this->belongsTo(User::class, 'user_id_model', 'user_id');
    }

    // Alias para compatibilidad con el controlador de nómina
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id_model', 'user_id');
    }

    public function studioShift()
    {
        return $this->belongsTo(StudioShift::class, 'stdshift_id', 'stdshift_id');
    }

    public function modelsAccounts()
    {
        return $this->hasMany(ModelAccount::class, 'stdmod_id', 'stdmod_id')->whereNull('models_accounts.deleted_at');
    }

    public function modelsGoals()
    {
        return $this->hasMany(ModelGoal::class, 'stdmod_id', 'stdmod_id')->whereNull('models_goals.deleted_at');
    }

    public function modelsTransactions()
    {
        return $this->hasMany(ModelTransaction::class, 'stdmod_id', 'stdmod_id')->whereNull('models_transactions.deleted_at');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'stdmod_id', 'stdmod_id')->whereNull('payments.deleted_at');
    }

    public function city()
    {
        return $this->belongsTo(City::class, 'city_id', 'city_id');
    }

    // Relación con transacciones de nómina
    public function payrollTransactions()
    {
        return $this->hasMany(PayrollTransaction::class, 'stdmod_id', 'stdmod_id');
    }

    // Casts para campos de nómina
    protected $casts = [
        'stdmod_monthly_salary' => 'decimal:2',
        'stdmod_biweekly_salary' => 'decimal:2',
        'stdmod_daily_salary' => 'decimal:2',
        'stdmod_dotacion_amount' => 'decimal:2',
        'stdmod_has_sena' => 'boolean',
        'stdmod_has_caja_compensacion' => 'boolean',
        'stdmod_has_icbf' => 'boolean',
        'stdmod_start_at' => 'date',
        'stdmod_finish_at' => 'date',
        'stdmod_active' => 'boolean',
        'stdmod_rtefte' => 'boolean',
    ];

    // Métodos helper para tipos de contrato
    public function isModel()
    {
        return $this->stdmod_contract_type === 'MANDANTE - MODELO';
    }

    public function isEmployee()
    {
        return $this->stdmod_contract_type !== 'MANDANTE - MODELO';
    }

    // Cálculo de salario diario basado en el mes
    public function calculateDailySalary($month = null, $year = null)
    {
        if (!$this->stdmod_monthly_salary) {
            return 0;
        }

        $month = $month ?? date('m');
        $year = $year ?? date('Y');

        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);
        return round($this->stdmod_monthly_salary / $daysInMonth, 2);
    }

    // Obtener porcentaje ARL según nivel de riesgo
    public function getArlPercentage()
    {
        $rates = [
            'I' => 0.522,
            'II' => 1.044,
            'III' => 2.436,
            'IV' => 4.350,
            'V' => 6.960
        ];

        return $rates[$this->stdmod_arl_risk_level] ?? 0.522;
    }

    // Verificar si requiere parafiscales (según salario)
    public function requiresParafiscales($smmlv = 1400000)
    {
        if (!$this->stdmod_monthly_salary) {
            return false;
        }

        return $this->stdmod_monthly_salary < (2 * $smmlv);
    }

    // Scopes para consultas
    public function scopeModels($query)
    {
        return $query->where('stdmod_contract_type', 'MANDANTE - MODELO');
    }

    public function scopeEmployees($query)
    {
        return $query->where('stdmod_contract_type', '!=', 'MANDANTE - MODELO');
    }

    public function scopeActive($query)
    {
        return $query->where('stdmod_active', true);
    }

    public function scopeForStudio($query, $studioId)
    {
        return $query->where('std_id', $studioId);
    }

    public function scopeWithPayrollData($query)
    {
        return $query->whereNotNull('stdmod_monthly_salary');
    }

    public function documentSignatures()
    {
        return $this->hasMany(DocumentSignature::class, 'stdmod_id', 'stdmod_id');
    }

    public function getSignatureStatus($documentType)
    {
        $signatures = $this->documentSignatures()
            ->where('docsig_document_type', $documentType)
            ->get();
        
        $requiresModel = DocumentSignature::requiresModelSignature($documentType);
        //se quita que dependa del duenio a peticion de alexis feb 24 2026
        $requiresOwner = false;//DocumentSignature::requiresOwnerSignature($documentType);
        
        $modelSigned = $requiresModel ? $signatures->where('docsig_role', 'model')->isNotEmpty() : true;
        $ownerSigned = true;//$requiresOwner ? $signatures->where('docsig_role', 'owner')->isNotEmpty() : true;
        
        return [
            'model_signed' => $modelSigned,
            'owner_signed' => $ownerSigned,
            'fully_signed' => $modelSigned && $ownerSigned,
            'requires_model' => $requiresModel,
            'requires_owner' => $requiresOwner,
        ];
    }
}
