<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class App extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'app_name',
        'app_description',
        'app_version',
        'app_ip',
        'app_port',
        'app_dwnl_link',
        'bright_data_proxy',
        'bright_data_username',
        'bright_data_password',
        'force_update',
        'release_notes',
        'platform_sex_enabled',
        'platform_kwiky_enabled',
        'platform_mode'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'platform_sex_enabled' => 'boolean',
        'platform_kwiky_enabled' => 'boolean',
        'force_update' => 'boolean'
    ];
}
