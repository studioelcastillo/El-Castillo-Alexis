<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBanksAccountsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('banks_accounts', function (Blueprint $table) {
            $table->increments('bankacc_id');
            $table->integer('std_id');
            $table->string('bankacc_entity');
            $table->string('bankacc_number');
            $table->string('bankacc_type');
            $table->boolean('bankacc_main')->default(false);
            $table->datetime('created_at')->nullable();
            $table->datetime('updated_at')->nullable();
            $table->datetime('deleted_at')->nullable();
            $table->foreign('std_id')->references('std_id')->on('studios');
        });
    }
    
    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('banks_accounts');
    }
}
