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
        Schema::table('models_streams', function (Blueprint $table) {
            $table->integer('stdmod_id')->nullable();
            $table->integer('std_id')->nullable();
            $table->foreign('stdmod_id')->references('stdmod_id')->on('studios_models');
            $table->foreign('std_id')->references('std_id')->on('studios');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('models_streams', function (Blueprint $table) {
            $table->dropColumn('stdmod_id');
            $table->dropColumn('std_id');
        });
    }
};
