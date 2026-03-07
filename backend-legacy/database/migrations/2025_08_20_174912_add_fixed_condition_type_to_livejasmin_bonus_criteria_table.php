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
        Schema::table('livejasmin_bonus_criteria', function (Blueprint $table) {
            // Add field to identify fixed criteria (like hot_deals)
            $table->string('ljbc_fixed_type')->nullable()->after('ljbc_condition_type');
            // Make api_endpoint and json_path nullable for fixed criteria
            $table->string('ljbc_api_endpoint')->nullable()->change();
            $table->string('ljbc_json_path')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('livejasmin_bonus_criteria', function (Blueprint $table) {
            $table->dropColumn('ljbc_fixed_type');
            // Revert api_endpoint and json_path to not nullable
            $table->string('ljbc_api_endpoint')->nullable(false)->change();
            $table->string('ljbc_json_path')->nullable(false)->change();
        });
    }
};
