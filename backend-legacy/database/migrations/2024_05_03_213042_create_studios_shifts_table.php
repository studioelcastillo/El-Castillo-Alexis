<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudiosShiftsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('studios_shifts', function (Blueprint $table) {
            $table->increments('stdshift_id');
            $table->integer('std_id');
            $table->string('stdshift_name');
            $table->time('stdshift_begin_time');
            $table->time('stdshift_finish_time');
            $table->integer('stdshift_capacity')->nullable();
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
        Schema::dropIfExists('studios_shifts');
    }
}
