<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateModelsStreamsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('models_streams', function (Blueprint $table) {
            $table->increments('modstr_id');
            $table->integer('modacc_id');
            $table->date('modstr_date');
            $table->string('modstr_period');
            $table->datetime('modstr_start_at')->nullable();
            $table->datetime('modstr_finish_at')->nullable();
            $table->float('modstr_price')->nullable();
            $table->float('modstr_earnings_value');
            $table->float('modstr_earnings_trm')->nullable();
            $table->float('modstr_earnings_percent')->nullable();
            $table->float('modstr_earnings_tokens')->nullable();
            $table->float('modstr_earnings_tokens_rate')->nullable();
            $table->float('modstr_earnings_usd')->nullable();
            $table->float('modstr_earnings_eur')->nullable();
            $table->float('modstr_earnings_cop')->nullable();
            $table->float('modstr_time')->nullable();
            $table->datetime('created_at')->nullable();
            $table->datetime('updated_at')->nullable();
            $table->datetime('deleted_at')->nullable();
            $table->foreign('modacc_id')->references('modacc_id')->on('models_accounts');
        });
    }
    
    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('models_streams');
    }
}
