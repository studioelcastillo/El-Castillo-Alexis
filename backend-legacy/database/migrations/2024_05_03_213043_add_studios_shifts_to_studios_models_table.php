<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddStudiosShiftsToStudiosModelsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('studios_models', function (Blueprint $table) {
            $table->integer('stdshift_id')->nullable();
            $table->foreign('stdshift_id')->references('stdshift_id')->on('studios_shifts');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // payrolls
        Schema::table('studios_models', function (Blueprint $table) {
            $table->dropColumn('stdshift_id');
        });
    }
}
