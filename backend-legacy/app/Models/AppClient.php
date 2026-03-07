<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppClient extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'app_clients';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'app_name',
        'app_version',
        'ip_address',
        'hostname',
        'os_name',
        'os_version',
        'os_arch',
        'cpu_model',
        'cpu_cores',
        'total_memory',
        'screen_resolution',
        'user_agent',
        'last_reported_at'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'last_reported_at' => 'datetime',
        'cpu_cores' => 'integer',
        'total_memory' => 'integer'
    ];
}
