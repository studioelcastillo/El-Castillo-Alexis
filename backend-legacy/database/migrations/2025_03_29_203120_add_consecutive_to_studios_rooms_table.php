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
        Schema::table('studios_rooms', function (Blueprint $table) {
            $table->integer('stdroom_consecutive')->nullable();
        });
        DB::statement("
            UPDATE studios_rooms t
            SET stdroom_consecutive = sub.rn
            FROM (
                SELECT stdroom_id, std_id, 
                       ROW_NUMBER() OVER (PARTITION BY std_id ORDER BY stdroom_id) AS rn
                FROM studios_rooms
            ) sub
            WHERE t.stdroom_id = sub.stdroom_id;
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('studios_rooms', function (Blueprint $table) {
            $table->dropColumn('stdroom_consecutive');
        });
    }
};
