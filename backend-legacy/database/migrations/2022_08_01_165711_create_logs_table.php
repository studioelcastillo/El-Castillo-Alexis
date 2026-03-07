<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateLogsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('logs', function (Blueprint $table) {
            $table->increments('log_id');
            $table->integer('user_id')->unsigned()->nullable();
            $table->string('log_table');
            $table->integer('log_table_id')->nullable();
            $table->string('log_action');
            $table->string('log_ip');
            $table->text('log_before')->nullable();
            $table->text('log_after')->nullable();
            $table->timestamps();
            $table->datetime('deleted_at')->nullable();
            $table->foreign('user_id')->references('user_id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('logs');
    }
}
