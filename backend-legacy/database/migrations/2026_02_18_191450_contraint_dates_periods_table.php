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
        // 1. Encontrar periodos duplicados y obtener el ID mínimo y máximo de cada grupo
        $duplicates = DB::select("
            SELECT 
                period_start_date,
                period_end_date,
                MIN(period_id) as min_id,
                array_agg(period_id) as all_ids
            FROM periods
            GROUP BY period_start_date, period_end_date
            HAVING COUNT(*) > 1
        ");

        foreach ($duplicates as $duplicate) {
            $minId = $duplicate->min_id;
            $allIds = trim($duplicate->all_ids, '{}'); // PostgreSQL array format: {1,2,3}
            $idsToMerge = explode(',', $allIds);
            
            // Filtrar IDs mayores al mínimo
            $idsToDelete = array_filter($idsToMerge, function($id) use ($minId) {
                return intval($id) > intval($minId);
            });

            if (empty($idsToDelete)) {
                continue;
            }

            $idsToDeleteStr = implode(',', $idsToDelete);

            echo "Merging periods with dates {$duplicate->period_start_date} to {$duplicate->period_end_date}\n";
            echo "  Keeping period_id: {$minId}\n";
            echo "  Deleting period_ids: {$idsToDeleteStr}\n";

            // 2. Actualizar liquidations
            DB::update("
                UPDATE liquidations 
                SET period_id = ? 
                WHERE period_id IN ({$idsToDeleteStr})
            ", [$minId]);

            // 3. Actualizar models_streams
            DB::update("
                UPDATE models_streams 
                SET period_id = ? 
                WHERE period_id IN ({$idsToDeleteStr})
            ", [$minId]);

            // 4. Actualizar transactions
            DB::update("
                UPDATE transactions 
                SET period_id = ? 
                WHERE period_id IN ({$idsToDeleteStr})
            ", [$minId]);

            // 5. Eliminar los periodos duplicados (IDs mayores)
            DB::delete("
                DELETE FROM periods 
                WHERE period_id IN ({$idsToDeleteStr})
            ");

            echo "  ✓ Merged successfully\n";
        }

        echo "Total duplicate groups processed: " . count($duplicates) . "\n";
        Schema::table('periods', function (Blueprint $table) {
            $table->unique(['period_start_date', 'period_end_date'], 'unique_period_dates');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('periods', function (Blueprint $table) {
            $table->dropUnique('unique_period_dates');
        });
    }
};
