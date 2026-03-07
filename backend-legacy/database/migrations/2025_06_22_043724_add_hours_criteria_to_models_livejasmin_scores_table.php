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
            // Add hours total connection field - total work time in hours for 100h criterion
            $table->float('modlj_hours_total_connection', 8, 2)->default(0)->after('modlj_hours_preview');

            // Add hours member + other field - sum of member and other time for 3h max criterion
            $table->float('modlj_hours_member_other', 8, 2)->default(0)->after('modlj_hours_total_connection');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('models_livejasmin_scores', function (Blueprint $table) {
            $table->dropColumn(['modlj_hours_total_connection', 'modlj_hours_member_other']);
        });
    }
};
