<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSocialAccountsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('social_accounts', function (Blueprint $table) {
            $table->increments('soac_id');
            $table->string('provider_id');
            $table->string('provider_name');
            $table->integer('user_id')->unsigned()->nullable();
            $table->string('soac_name');
            $table->string('soac_email');
            $table->string('soac_avatar')->nullable();
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
        Schema::dropIfExists('social_accounts');
    }
}
