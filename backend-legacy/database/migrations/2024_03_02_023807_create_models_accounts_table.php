<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateModelsAccountsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('models_accounts', function (Blueprint $table) {
            $table->increments('modacc_id');
            $table->integer('stdmod_id');
            $table->string('modacc_app');
            $table->string('modacc_username');
            $table->string('modacc_password');
            $table->string('modacc_state');
            $table->boolean('modacc_active');
            $table->datetime('created_at')->nullable();
            $table->datetime('updated_at')->nullable();
            $table->datetime('deleted_at')->nullable();
            $table->foreign('stdmod_id')->references('stdmod_id')->on('studios_models');
        });
    }
    
    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('models_accounts');
    }
}
