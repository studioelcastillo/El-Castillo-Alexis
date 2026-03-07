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
        Schema::table('models_livejasmin_scores', function (Blueprint $table) {
            $table->json('modlj_dynamic_bonus_data')->nullable()->after('modlj_earnings_my_content');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('models_livejasmin_scores', function (Blueprint $table) {
            $table->dropColumn('modlj_dynamic_bonus_data');
        });
    }
};
