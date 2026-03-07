<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Agrega payroll_period_id a transactions para soportar cargues de dispensadora
     * tanto para modelos (period_id) como para personal administrativo (payroll_period_id)
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->unsignedBigInteger('payroll_period_id')->nullable()->after('period_id');
            $table->foreign('payroll_period_id')
                ->references('payroll_period_id')
                ->on('payroll_periods')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['payroll_period_id']);
            $table->dropColumn('payroll_period_id');
        });
    }
};
