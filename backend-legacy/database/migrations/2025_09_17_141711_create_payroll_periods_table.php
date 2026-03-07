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
        Schema::create('payroll_periods', function (Blueprint $table) {
            $table->id('payroll_period_id');
            $table->unsignedBigInteger('std_id');
            $table->date('payroll_period_start_date');
            $table->date('payroll_period_end_date');
            $table->enum('payroll_period_state', ['ABIERTO', 'CERRADO', 'LIQUIDADO'])->default('ABIERTO');
            $table->enum('payroll_period_interval', ['SEMANAL', 'QUINCENAL', 'MENSUAL'])->default('MENSUAL');
            $table->decimal('payroll_period_smmlv', 12, 2)->default(1400000); // Salario mínimo vigente Colombia 2025
            $table->timestamps();
            $table->softDeletes();

            // Foreign key
            $table->foreign('std_id')->references('std_id')->on('studios')->onDelete('cascade');

            // Indexes
            $table->index(['std_id', 'payroll_period_state']);
            $table->index('payroll_period_start_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_periods');
    }
};
