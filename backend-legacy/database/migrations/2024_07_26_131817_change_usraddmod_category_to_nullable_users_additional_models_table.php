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
        Schema::table('users_additional_models', function (Blueprint $table) {
            $table->string('usraddmod_category', 40)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users_additional_models', function (Blueprint $table) {
            $table->string('usraddmod_category', 40)->change();
        });
    }
};
