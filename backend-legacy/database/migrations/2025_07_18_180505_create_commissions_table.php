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
        Schema::create('commissions', function (Blueprint $table) {
            $table->increments('comm_id');
            $table->integer('commparent_id')->nullable();
            $table->integer('stdmod_id')->nullable();
            $table->integer('std_id')->nullable();
            $table->integer('setcomm_id')->nullable();
            $table->boolean('comm_track_beyond_childs')->default(false);
            $table->date('comm_expire_date')->nullable();
            $table->foreign('commparent_id')->references('comm_id')->on('commissions');
            $table->foreign('stdmod_id')->references('stdmod_id')->on('studios_models');
            $table->foreign('std_id')->references('std_id')->on('studios');
            $table->foreign('setcomm_id')->references('setcomm_id')->on('setups_commissions');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commissions');
    }
};
