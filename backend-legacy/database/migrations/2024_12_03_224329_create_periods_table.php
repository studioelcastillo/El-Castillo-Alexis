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
        Schema::create('periods', function (Blueprint $table) {
            $table->increments('period_id');
            $table->date('period_start_date');
            $table->date('period_end_date');
            $table->timestamp('period_closed_date')->nullable();
            $table->timestamps();
            $table->string('period_state', 20);
            $table->integer('user_id')->nullable();
            $table->foreign('user_id')->references('user_id')->on('users');
            $table->text('period_observation')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('periods');
    }
};