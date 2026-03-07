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
        Schema::table('studios_models', function (Blueprint $table) {
            $table->date('stdmod_start_at')->change();
            $table->date('stdmod_finish_at')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('studios_models', function (Blueprint $table) {
            $table->datetime('stdmod_start_at')->change();
            $table->datetime('stdmod_finish_at')->nullable()->change();
        });
    }
};
