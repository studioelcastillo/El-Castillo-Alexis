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
        Schema::create('models_livejasmin_scores', function (Blueprint $table) {
            $table->id('modlj_id');
            $table->unsignedBigInteger('modacc_id');
            $table->string('modlj_screen_name');
            $table->date('modlj_period_start');
            $table->date('modlj_period_end');
            $table->float('modlj_hours_connection', 8, 2)->default(0);
            $table->float('modlj_hours_preview', 8, 2)->default(0);
            $table->float('modlj_score_traffic', 8, 2)->default(0);
            $table->float('modlj_score_conversion', 8, 2)->default(0);
            $table->float('modlj_score_engagement', 8, 2)->default(0);
            $table->integer('modlj_offers_initiated')->default(0);
            $table->integer('modlj_new_members')->default(0);
            $table->float('modlj_average_hour', 8, 2)->default(0);
            $table->float('modlj_earnings_usd', 8, 2)->default(0);
            $table->float('modlj_bonus_5_percent', 8, 2)->default(0);
            $table->float('modlj_bonus_10_percent', 8, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('modacc_id')->references('modacc_id')->on('models_accounts');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('models_livejasmin_scores');
    }
};
