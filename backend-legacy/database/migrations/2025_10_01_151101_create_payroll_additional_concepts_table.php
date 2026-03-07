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
        Schema::create('payroll_additional_concepts', function (Blueprint $table) {
            $table->id('payroll_concept_id');
            $table->unsignedBigInteger('payroll_period_id');
            $table->unsignedBigInteger('user_id');

            // Tipo de concepto
            $table->string('concept_type', 50); // EXTRA_HOUR_DIURNA, EXTRA_HOUR_NOCTURNA, etc.
            $table->text('description')->nullable();

            // Campos para horas extras
            $table->decimal('hours', 10, 2)->nullable();
            $table->decimal('hourly_rate', 12, 2)->nullable();
            $table->decimal('surcharge_percentage', 5, 2)->nullable(); // 25%, 75%, 100%, etc.

            // Monto total calculado
            $table->decimal('total_amount', 12, 2);

            $table->timestamps();

            // Foreign keys
            $table->foreign('payroll_period_id')->references('payroll_period_id')->on('payroll_periods')->onDelete('cascade');
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');

            // Indexes
            $table->index(['payroll_period_id', 'user_id']);
            $table->index('concept_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_additional_concepts');
    }
};
