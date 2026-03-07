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
            // Add hot deals field - represents the target number from hot deals section
            $table->integer('modlj_hot_deals')->default(0)->after('modlj_new_members');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('models_livejasmin_scores', function (Blueprint $table) {
            $table->dropColumn('modlj_hot_deals');
        });
    }
};
