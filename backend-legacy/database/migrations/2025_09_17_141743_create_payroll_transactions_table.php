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
        Schema::create('payroll_transactions', function (Blueprint $table) {
            $table->id('payroll_trans_id');
            $table->unsignedBigInteger('payroll_period_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('stdmod_id');

            // Conceptos de nómina
            $table->decimal('base_salary', 12, 2);
            $table->decimal('commission_amount', 12, 2)->default(0);
            $table->decimal('extra_hours_amount', 12, 2)->default(0);
            $table->decimal('transport_allowance', 12, 2)->default(0);
            $table->decimal('food_allowance', 12, 2)->default(0);

            // Prestaciones sociales
            $table->decimal('cesantias', 12, 2)->default(0);
            $table->decimal('prima', 12, 2)->default(0);
            $table->decimal('vacaciones', 12, 2)->default(0);

            // Seguridad social
            $table->decimal('eps_employee', 12, 2)->default(0);
            $table->decimal('pension_employee', 12, 2)->default(0);
            $table->decimal('eps_employer', 12, 2)->default(0);
            $table->decimal('pension_employer', 12, 2)->default(0);
            $table->decimal('arl', 12, 2)->default(0);

            // Parafiscales
            $table->decimal('sena', 12, 2)->default(0);
            $table->decimal('icbf', 12, 2)->default(0);
            $table->decimal('caja_compensacion', 12, 2)->default(0);

            // Totales
            $table->decimal('total_devengado', 12, 2);
            $table->decimal('total_deducciones', 12, 2);
            $table->decimal('total_neto', 12, 2);

            // Períodos de comisiones incluidos
            $table->json('commission_periods');

            $table->timestamps();

            // Foreign keys
            $table->foreign('payroll_period_id')->references('payroll_period_id')->on('payroll_periods')->onDelete('cascade');
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('stdmod_id')->references('stdmod_id')->on('studios_models')->onDelete('cascade');

            // Indexes
            $table->index(['payroll_period_id', 'user_id']);
            $table->index('stdmod_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_transactions');
    }
};
