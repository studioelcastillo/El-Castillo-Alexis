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
        Schema::table('models_streams', function (Blueprint $table) {
            $table->float('modstr_rtefte_model')->nullable();
            $table->float('modstr_rtefte_studio')->nullable();
        });

        // Actualizar campos NULL a true para std_rtefte en studios
        \DB::statement('UPDATE studios SET std_rtefte = true WHERE std_rtefte IS NULL');
        
        // Actualizar campos NULL a true para stdmod_rtefte en studios_models
        \DB::statement('UPDATE studios_models SET stdmod_rtefte = true WHERE stdmod_rtefte IS NULL');

        // Calcular retenciones para registros existentes para conservar trazabilidad
        \DB::statement("
            UPDATE models_streams ms
            SET modstr_rtefte_model = (
                CASE
                    WHEN sm.stdmod_rtefte = true THEN CEIL(COALESCE(modstr_earnings_cop, 0) * 0.04)
                    ELSE 0
                END),
                modstr_rtefte_studio = (
                CASE
                    WHEN st.std_rtefte = true THEN CEIL(COALESCE(modstr_earnings_cop_studio, 0) * 0.04)
                    ELSE 0
                END)
            FROM studios_models sm
            INNER JOIN studios st ON st.std_id = sm.std_id
            WHERE sm.stdmod_id = ms.stdmod_id
                AND (modstr_rtefte_model IS NULL OR modstr_rtefte_studio IS NULL)
                AND modstr_earnings_cop IS NOT NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('models_streams', function (Blueprint $table) {
            $table->dropColumn(['modstr_rtefte_model', 'modstr_rtefte_studio']);
        });
    }
};
