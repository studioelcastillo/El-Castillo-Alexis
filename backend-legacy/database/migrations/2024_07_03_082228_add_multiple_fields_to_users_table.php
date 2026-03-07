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
        Schema::table('users', function (Blueprint $table) {
            $table->string('user_name2')->nullable();
            $table->string('user_surname2')->nullable();
            $table->unsignedInteger('city_id')->nullable();
            $table->string('user_rh', 20)->nullable();
            $table->string('user_model_category', 40)->nullable();
            $table->foreign('city_id')->references('city_id')->on('cities');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('user_name2');
            $table->dropColumn('user_surname2');
            $table->dropColumn('city_id');
            $table->dropColumn('user_rh');
            $table->dropColumn('user_model_category');
        });
    }
};
