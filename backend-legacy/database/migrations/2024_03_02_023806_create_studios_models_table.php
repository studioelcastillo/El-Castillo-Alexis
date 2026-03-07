<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudiosModelsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('studios_models', function (Blueprint $table) {
            $table->increments('stdmod_id');
            $table->integer('std_id');
            $table->integer('stdroom_id')->nullable();
            $table->integer('user_id_model');
            $table->datetime('stdmod_start_at');
            $table->datetime('stdmod_finish_at')->nullable();
            $table->boolean('stdmod_active');
            $table->float('stdmod_percent')->nullable();
            $table->boolean('stdmod_rtefte')->nullable();
            $table->datetime('created_at')->nullable();
            $table->datetime('updated_at')->nullable();
            $table->datetime('deleted_at')->nullable();
            $table->foreign('std_id')->references('std_id')->on('studios');
            $table->foreign('stdroom_id')->references('stdroom_id')->on('studios_rooms');
            $table->foreign('user_id_model')->references('user_id')->on('users');
        });
    }
    
    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('studios_models');
    }
}
