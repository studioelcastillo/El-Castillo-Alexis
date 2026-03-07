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
            // Campos de salario para empleados no-modelo
            $table->decimal('stdmod_monthly_salary', 12, 2)->nullable()->after('stdmod_contract_number');
            $table->decimal('stdmod_biweekly_salary', 12, 2)->nullable()->after('stdmod_monthly_salary');
            $table->decimal('stdmod_daily_salary', 12, 2)->nullable()->after('stdmod_biweekly_salary');

            // Campo fijo de dotación
            $table->decimal('stdmod_dotacion_amount', 12, 2)->default(100000)->after('stdmod_daily_salary');

            // Checkboxes para parafiscales
            $table->boolean('stdmod_has_sena')->default(false)->after('stdmod_dotacion_amount');
            $table->boolean('stdmod_has_caja_compensacion')->default(false)->after('stdmod_has_sena');
            $table->boolean('stdmod_has_icbf')->default(false)->after('stdmod_has_caja_compensacion');

            // Nivel de riesgo ARL
            $table->enum('stdmod_arl_risk_level', ['I', 'II', 'III', 'IV', 'V'])->default('I')->after('stdmod_has_icbf');

            // Índices para optimizar consultas
            $table->index('stdmod_contract_type');
            $table->index(['std_id', 'stdmod_contract_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('studios_models', function (Blueprint $table) {
            // Eliminar índices
            $table->dropIndex(['stdmod_contract_type']);
            $table->dropIndex(['std_id', 'stdmod_contract_type']);

            // Eliminar campos
            $table->dropColumn([
                'stdmod_monthly_salary',
                'stdmod_biweekly_salary',
                'stdmod_daily_salary',
                'stdmod_dotacion_amount',
                'stdmod_has_sena',
                'stdmod_has_caja_compensacion',
                'stdmod_has_icbf',
                'stdmod_arl_risk_level'
            ]);
        });
    }
};
