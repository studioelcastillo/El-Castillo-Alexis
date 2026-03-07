<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateModelsStreamsCustomersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('models_streams_customers', function (Blueprint $table) {
            $table->increments('modstrcus_id');
            $table->integer('modstr_id');
            $table->string('modstrcus_name');
            $table->string('modstrcus_account')->nullable();
            $table->string('modstrcus_website')->nullable();
            $table->string('modstrcus_product')->nullable();
            $table->float('modstrcus_price')->nullable();
            $table->float('modstrcus_earnings');
            $table->datetime('modstrcus_received_at');
            $table->float('modstrcus_chat_duration')->nullable();
            $table->datetime('created_at')->nullable();
            $table->datetime('updated_at')->nullable();
            $table->datetime('deleted_at')->nullable();
            $table->foreign('modstr_id')->references('modstr_id')->on('models_streams');
        });
    }
    
    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('models_streams_customers');
    }
}
