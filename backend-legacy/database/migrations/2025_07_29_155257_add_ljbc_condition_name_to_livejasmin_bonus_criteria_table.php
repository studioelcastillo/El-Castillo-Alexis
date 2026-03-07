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
        if (
            Schema::hasTable('livejasmin_bonus_criteria') &&
            !Schema::hasColumn('livejasmin_bonus_criteria', 'ljbc_condition_name')
        ) {
            Schema::table('livejasmin_bonus_criteria', function (Blueprint $table) {
                $table->string('ljbc_condition_name')->after('ljbc_id')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (
            Schema::hasTable('livejasmin_bonus_criteria') &&
            Schema::hasColumn('livejasmin_bonus_criteria', 'ljbc_condition_name')
        ) {
            Schema::table('livejasmin_bonus_criteria', function (Blueprint $table) {
                $table->dropColumn('ljbc_condition_name');
            });
        }
    }
};
