<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateModelsTransactionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('models_transactions', function (Blueprint $table) {
            $table->increments('modtrans_id');
            $table->integer('stdmod_id');
            $table->integer('transtype_id');
            $table->date('modtrans_date');
            $table->string('modtrans_description')->nullable();
            $table->float('modtrans_amount');
            $table->integer('prod_id')->nullable();
            $table->datetime('created_at')->nullable();
            $table->datetime('updated_at')->nullable();
            $table->datetime('deleted_at')->nullable();
            $table->foreign('prod_id')->references('prod_id')->on('products');
            $table->foreign('stdmod_id')->references('stdmod_id')->on('studios_models');
            $table->foreign('transtype_id')->references('transtype_id')->on('transactions_types');
        });
    }
    
    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('models_transactions');
    }
}
