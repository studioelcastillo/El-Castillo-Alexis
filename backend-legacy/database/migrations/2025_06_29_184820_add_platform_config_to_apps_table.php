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
        Schema::table('apps', function (Blueprint $table) {
            // Add platform configuration columns
            $table->boolean('platform_sex_enabled')->default(true)->after('release_notes');
            $table->boolean('platform_kwiky_enabled')->default(false)->after('platform_sex_enabled');
            $table->string('platform_mode', 10)->default('sex')->after('platform_kwiky_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('apps', function (Blueprint $table) {
            // Remove platform configuration columns
            $table->dropColumn([
                'platform_sex_enabled',
                'platform_kwiky_enabled',
                'platform_mode'
            ]);
        });
    }
};
