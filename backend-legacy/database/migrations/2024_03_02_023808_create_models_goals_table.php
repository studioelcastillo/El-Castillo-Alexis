<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateModelsGoalsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('models_goals', function (Blueprint $table) {
            $table->increments('modgoal_id');
            $table->integer('stdmod_id');
            $table->string('modgoal_type')->nullable();
            $table->integer('modgoal_year');
            $table->integer('modgoal_month');
            $table->float('modgoal_amount');
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
        Schema::dropIfExists('models_goals');
    }
}
