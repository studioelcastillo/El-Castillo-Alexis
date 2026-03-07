<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('app_clients', function (Blueprint $table) {
            $table->id();
            $table->string('app_name');
            $table->string('app_version');
            $table->string('ip_address');
            $table->string('hostname')->nullable();
            $table->string('os_name')->nullable();
            $table->string('os_version')->nullable();
            $table->string('os_arch')->nullable();
            $table->string('cpu_model')->nullable();
            $table->integer('cpu_cores')->nullable();
            $table->bigInteger('total_memory')->nullable();
            $table->string('screen_resolution')->nullable();
            $table->text('user_agent')->nullable();
            $table->datetime('last_reported_at');
            $table->timestamps();

            // Add index on IP address and app name for faster lookups
            $table->index(['ip_address', 'app_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('app_clients');
    }
};
