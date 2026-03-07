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
        Schema::table('studios', function (Blueprint $table) {
            $table->enum('payroll_liquidation_interval', ['SEMANAL', 'QUINCENAL', 'MENSUAL'])->default('MENSUAL')->after('std_liquidation_interval');
            $table->boolean('payroll_auto_generate')->default(true)->after('payroll_liquidation_interval');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('studios', function (Blueprint $table) {
            $table->dropColumn(['payroll_liquidation_interval', 'payroll_auto_generate']);
        });
    }
};
