<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateNotificationsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->increments('noti_id');
            $table->integer('user_id')->unsigned()->nullable();
            $table->integer('user_id_to_notify')->unsigned()->nullable();
            $table->string('noti_type')->nullable();
            $table->string('noti_title');
            $table->string('noti_data');
            $table->string('noti_menu'); // icon from module
            $table->boolean('noti_read')->default(false);
            $table->timestamps();
            $table->datetime('deleted_at')->nullable();
            $table->foreign('user_id')->references('user_id')->on('users');
            $table->foreign('user_id_to_notify')->references('user_id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('notifications');
    }
}
