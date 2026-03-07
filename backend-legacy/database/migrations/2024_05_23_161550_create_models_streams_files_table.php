<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateModelsStreamsFilesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // models_streams_files
        Schema::create('models_streams_files', function (Blueprint $table) {
            $table->increments('modstrfile_id');
            $table->string('modstrfile_description');
            $table->string('modstrfile_filename');
            $table->string('modstrfile_template');
            $table->integer('created_by')->unsigned()->nullable();
            $table->timestamps();
            $table->datetime('deleted_at')->nullable();
            $table->foreign('created_by')->references('user_id')->on('users');
        });

        // models_streams
        Schema::table('models_streams', function (Blueprint $table) {
            $table->integer('modstrfile_id')->nullable();
            $table->foreign('modstrfile_id')->references('modstrfile_id')->on('models_streams_files');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // models_streams
        Schema::table('models_streams', function (Blueprint $table) {
            $table->dropColumn('modstrfile_id');
        });

        // models_streams_files
        Schema::dropIfExists('models_streams_files');
    }
}
