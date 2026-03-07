<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePaymentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->increments('pay_id');
            $table->integer('payfile_id');
            $table->integer('std_id')->nullable();
            $table->integer('stdmod_id')->nullable();
            $table->float('pay_amount');
            $table->date('pay_period_since');
            $table->date('pay_period_until');
            $table->datetime('created_at')->nullable();
            $table->datetime('updated_at')->nullable();
            $table->datetime('deleted_at')->nullable();
            $table->foreign('std_id')->references('std_id')->on('studios');
            $table->foreign('stdmod_id')->references('stdmod_id')->on('studios_models');
            $table->foreign('payfile_id')->references('payfile_id')->on('payments_files');
        });
    }
    
    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('payments');
    }
}
