<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bot extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'website',
        'email',
        'password',
        'likes',
        'follows',
        'verified',
        'bot_created_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'likes' => 'array',
        'follows' => 'array',
        'verified' => 'boolean',
        'bot_created_at' => 'datetime',
    ];

    protected $hidden = [
        'password',
    ];
}
