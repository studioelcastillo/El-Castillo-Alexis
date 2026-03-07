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
            // Earnings distribution fields based on LiveJasmin API response
            $table->float('modlj_earnings_private', 8, 2)->default(0);
            $table->float('modlj_earnings_vip_show', 8, 2)->default(0);
            $table->float('modlj_earnings_video_voice_call', 8, 2)->default(0);
            $table->float('modlj_earnings_cam2cam', 8, 2)->default(0);
            $table->float('modlj_earnings_surprise', 8, 2)->default(0);
            $table->float('modlj_earnings_message', 8, 2)->default(0);
            $table->float('modlj_earnings_interactive_toy', 8, 2)->default(0);
            $table->float('modlj_earnings_bonus', 8, 2)->default(0);
            $table->float('modlj_earnings_other', 8, 2)->default(0);
            $table->float('modlj_earnings_my_content', 8, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('models_livejasmin_scores', function (Blueprint $table) {
            $table->dropColumn([
                'modlj_earnings_private',
                'modlj_earnings_vip_show',
                'modlj_earnings_video_voice_call',
                'modlj_earnings_cam2cam',
                'modlj_earnings_surprise',
                'modlj_earnings_message',
                'modlj_earnings_interactive_toy',
                'modlj_earnings_bonus',
                'modlj_earnings_other',
                'modlj_earnings_my_content'
            ]);
        });
    }
};
