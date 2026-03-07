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
        Schema::table('payroll_transactions', function (Blueprint $table) {
            $table->decimal('dotacion_amount', 15, 2)->default(0)->after('base_salary');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payroll_transactions', function (Blueprint $table) {
            $table->dropColumn('dotacion_amount');
        });
    }
};
