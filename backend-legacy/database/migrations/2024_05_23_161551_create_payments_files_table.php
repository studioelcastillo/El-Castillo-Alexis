<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePaymentsFilesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // payments_files
        Schema::create('payments_files', function (Blueprint $table) {
            $table->increments('payfile_id');
            $table->string('payfile_description');
            $table->string('payfile_filename');
            $table->string('payfile_template');
            $table->float('payfile_total');
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
        // payments_files
        Schema::dropIfExists('payments_files');
    }
}
