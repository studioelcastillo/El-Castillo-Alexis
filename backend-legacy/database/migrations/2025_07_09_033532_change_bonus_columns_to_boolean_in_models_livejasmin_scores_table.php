<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Convert decimal bonus columns to boolean using raw SQL
        // First, create temporary boolean columns
        Schema::table('models_livejasmin_scores', function (Blueprint $table) {
            $table->boolean('modlj_bonus_5_percent_temp')->default(false);
            $table->boolean('modlj_bonus_10_percent_temp')->default(false);
        });

        // Update the temporary columns based on the original values
        // Set to true if the decimal value is greater than 0
        DB::statement("UPDATE models_livejasmin_scores SET modlj_bonus_5_percent_temp = (modlj_bonus_5_percent > 0)");
        DB::statement("UPDATE models_livejasmin_scores SET modlj_bonus_10_percent_temp = (modlj_bonus_10_percent > 0)");

        // Drop the original decimal columns
        Schema::table('models_livejasmin_scores', function (Blueprint $table) {
            $table->dropColumn(['modlj_bonus_5_percent', 'modlj_bonus_10_percent']);
        });

        // Rename the temporary columns to the original names
        Schema::table('models_livejasmin_scores', function (Blueprint $table) {
            $table->renameColumn('modlj_bonus_5_percent_temp', 'modlj_bonus_5_percent');
            $table->renameColumn('modlj_bonus_10_percent_temp', 'modlj_bonus_10_percent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to decimal columns
        // First, create temporary decimal columns
        Schema::table('models_livejasmin_scores', function (Blueprint $table) {
            $table->decimal('modlj_bonus_5_percent_temp', 10, 2)->default(0.00);
            $table->decimal('modlj_bonus_10_percent_temp', 10, 2)->default(0.00);
        });

        // Update the temporary columns - this is a lossy conversion
        // We can't know the original decimal values, so we'll just set to 0
        DB::statement("UPDATE models_livejasmin_scores SET modlj_bonus_5_percent_temp = 0.00");
        DB::statement("UPDATE models_livejasmin_scores SET modlj_bonus_10_percent_temp = 0.00");

        // Drop the boolean columns
        Schema::table('models_livejasmin_scores', function (Blueprint $table) {
            $table->dropColumn(['modlj_bonus_5_percent', 'modlj_bonus_10_percent']);
        });

        // Rename the temporary columns to the original names
        Schema::table('models_livejasmin_scores', function (Blueprint $table) {
            $table->renameColumn('modlj_bonus_5_percent_temp', 'modlj_bonus_5_percent');
            $table->renameColumn('modlj_bonus_10_percent_temp', 'modlj_bonus_10_percent');
        });
    }
};
