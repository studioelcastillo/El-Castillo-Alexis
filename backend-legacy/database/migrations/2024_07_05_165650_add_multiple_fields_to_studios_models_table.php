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
            $table->string('stdmod_contract_type')->nullable();
            $table->unsignedInteger('stdmod_contract_number')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->foreign('city_id')->references('city_id')->on('cities');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('studios_models', function (Blueprint $table) {
            $table->dropColumn('stdmod_contract_type');
            $table->dropColumn('stdmod_contract_number');
            $table->dropColumn('city_id');
        });
    }
};
