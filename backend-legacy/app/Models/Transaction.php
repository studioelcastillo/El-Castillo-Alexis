<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $table = 'transactions';
    protected $primaryKey = 'trans_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'trans_id',
        'period_id',
        'payroll_period_id',
        'transtype_id',
        'user_id',
        'trans_date',
        'trans_description',
        'trans_amount',
        'prod_id',
        'trans_quantity',
        'trans_rtefte',
        'stdmod_id',
        'trans_pendingbalance',
        'trans_pendingbalance_unchanged_times'
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];


    public function product()
    {
        return $this->belongsTo(Product::class, 'prod_id', 'prod_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function transactionType()
    {
        return $this->belongsTo(TransactionType::class, 'transtype_id', 'transtype_id');
    }

    public function period()
    {
        return $this->belongsTo(Period::class, 'period_id', 'period_id');
    }

    public function payrollPeriod()
    {
        return $this->belongsTo(PayrollPeriod::class, 'payroll_period_id', 'payroll_period_id');
    }
}
