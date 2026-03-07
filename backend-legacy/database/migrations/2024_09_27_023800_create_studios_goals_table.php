<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('studios_goals', function (Blueprint $table) {
            $table->increments('stdgoal_id');
            $table->integer('std_id');
            $table->string('stdgoal_type')->nullable();
            $table->float('stdgoal_amount');
            $table->float('stdgoal_percent');
            $table->boolean('stdgoal_auto');
            $table->date('stdgoal_date');
            $table->boolean('stdgoal_reach_goal')->nullable();
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
        Schema::dropIfExists('studios_goals');
    }
};
