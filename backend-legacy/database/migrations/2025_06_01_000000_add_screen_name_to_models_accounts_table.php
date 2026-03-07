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
        Schema::table('models_accounts', function (Blueprint $table) {
            $table->string('modacc_screen_name')->nullable()->after('modacc_linkacc');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('models_accounts', function (Blueprint $table) {
            $table->dropColumn('modacc_screen_name');
        });
    }
};
