<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDispenserFilesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('dispenser_files', function (Blueprint $table) {
            $table->increments('dispfile_id');
            $table->string('dispfile_filename');
            $table->string('dispfile_original_filename');
            $table->integer('dispfile_records_success')->default(0);
            $table->integer('dispfile_records_error')->default(0);
            $table->integer('created_by')->unsigned()->nullable();
            $table->timestamps();
            $table->datetime('deleted_at')->nullable();
            $table->foreign('created_by')->references('user_id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('dispenser_files');
    }
}
