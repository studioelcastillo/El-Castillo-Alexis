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
        Schema::table('petitions', function (Blueprint $table) {
            $table->dropForeign(['std_id']);
            $table->dropColumn('std_id');
            $table->unsignedInteger('stdmod_id')->nullable();
            $table->foreign('stdmod_id')->references('stdmod_id')->on('studios_models');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('petitions', function (Blueprint $table) {
            $table->unsignedInteger('std_id')->nullable();
            $table->foreign('std_id')->references('std_id')->on('studios');
            $table->dropForeign(['stdmod_id']);
            $table->dropColumn('stdmod_id');
        });
    }
};
