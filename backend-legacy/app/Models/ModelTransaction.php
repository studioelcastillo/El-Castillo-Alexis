<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModelTransaction extends Model
{
    protected $table = 'models_transactions';
    protected $primaryKey = 'modtrans_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'modtrans_id',
        'stdmod_id',
        'transtype_id',
        'modtrans_date',
        'modtrans_description',
        'modtrans_amount',
        'prod_id',
        'modtrans_quantity',
        'modtrans_rtefte'
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

    public function studioModel()
    {
        return $this->belongsTo(StudioModel::class, 'stdmod_id', 'stdmod_id');
    }

    public function transactionType()
    {
        return $this->belongsTo(TransactionType::class, 'transtype_id', 'transtype_id');
    }
}
