<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModelStreamCustomer extends Model
{
    protected $table = 'models_streams_customers';
    protected $primaryKey = 'modstrcus_id';
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'modstrcus_id',
        'modstr_id',
        'modstrcus_name',
        'modstrcus_account',
        'modstrcus_website',
        'modstrcus_product',
        'modstrcus_price',
        'modstrcus_earnings',
        'modstrcus_received_at',
        'modstrcus_chat_duration',
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];


    public function modelStream()
    {
        return $this->belongsTo(ModelStream::class, 'modstr_id', 'modstr_id');
    }
}
