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
        Schema::create('coincidences', function (Blueprint $table) {
            $table->increments('coin_id');
            $table->integer('skpcoin_id');
            $table->foreign('skpcoin_id')->references('skpcoin_id')->on('skipped_coincidences');
            $table->json('coin_entity');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coincidences');
    }
};
