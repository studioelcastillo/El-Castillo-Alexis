<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudiosAccountsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('studios_accounts', function (Blueprint $table) {
            $table->increments('stdacc_id');
            $table->integer('std_id');
            $table->string('stdacc_app');
            $table->string('stdacc_username');
            $table->string('stdacc_password')->nullable();
            $table->string('stdacc_apikey')->nullable();
            $table->boolean('stdacc_active');
            $table->datetime('stdacc_last_search_at')->nullable();
            $table->datetime('stdacc_last_result_at')->nullable();
            $table->text('stdacc_fail_message')->nullable();
            $table->integer('stdacc_fail_count')->nullable();
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
        Schema::dropIfExists('studios_accounts');
    }
}
