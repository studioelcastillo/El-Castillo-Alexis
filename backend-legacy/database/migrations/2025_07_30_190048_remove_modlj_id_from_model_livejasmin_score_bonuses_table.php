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
        Schema::table('model_livejasmin_score_bonuses', function (Blueprint $table) {
            $table->dropColumn('modlj_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('model_livejasmin_score_bonuses', function (Blueprint $table) {
            $table->bigInteger('modlj_id')->after('mlsb_id');
        });
    }
};
