<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $table = 'products';
    protected $primaryKey = 'prod_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'prod_id',
        'cate_id',
        'prod_code',
        'prod_name',
        'prod_purchase_price',
        'prod_wholesaler_price',
        'prod_sale_price',
        'prod_stock',
        'transtype_id'
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];


    public function category()
    {
        return $this->belongsTo(Category::class, 'cate_id', 'cate_id');
    }

    public function modelsTransactions()
    {
        return $this->hasMany(ModelTransaction::class, 'prod_id', 'prod_id')->whereNull('models_transactions.deleted_at');
    }
    public function transactionType()
    {
        return $this->belongsTo(TransactionType::class, 'transtype_id', 'transtype_id');
    }
}
