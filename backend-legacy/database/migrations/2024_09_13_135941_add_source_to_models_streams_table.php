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
            $table->string('modstr_source')->nullable();
        });

        // default discount
        DB::statement("UPDATE models_streams SET modstr_source = 'CARGUE_ARCHIVO' WHERE modstr_source IS NULL AND modstrfile_id IS NOT NULL");
        DB::statement("UPDATE models_streams SET modstr_source = 'WEBSCRAPER_MODELO' WHERE modstr_source IS NULL AND modstrfile_id IS NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('models_streams', function (Blueprint $table) {
            $table->dropColumn('modstr_source');
        });
    }
};
