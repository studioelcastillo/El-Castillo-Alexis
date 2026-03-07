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
        Schema::create('petitions_states', function (Blueprint $table) {
            $table->increments('ptnstate_id');
            $table->unsignedInteger('ptn_id');
            $table->string('ptnstate_state', 40);
            $table->text('ptnstate_observation')->nullable();
            $table->unsignedInteger('user_id');
            $table->foreign('user_id')->references('user_id')->on('users');
            $table->foreign('ptn_id')->references('ptn_id')->on('petitions');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('petitions_states');
    }
};
