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
            $table->string('stdmod_position')->nullable();
            $table->string('stdmod_area')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('studios_models', function (Blueprint $table) {
            $table->dropColumn(['stdmod_position', 'stdmod_area']);
        });
    }
};

