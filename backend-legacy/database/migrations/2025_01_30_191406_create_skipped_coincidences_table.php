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
        Schema::create('skipped_coincidences', function (Blueprint $table) {
            $table->increments('skpcoin_id');
            $table->integer('user_id_new');
            $table->foreign('user_id_new')->references('user_id')->on('users');
            $table->integer('user_id_created_by');
            $table->foreign('user_id_created_by')->references('user_id')->on('users');
            $table->text('skpcoin_observation')->nullable();
            $table->string('skpcoin_type', 50)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('skipped_coincidences');
    }
};
