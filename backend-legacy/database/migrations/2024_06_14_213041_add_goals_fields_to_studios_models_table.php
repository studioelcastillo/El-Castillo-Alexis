<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddGoalsFieldsToStudiosModelsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('studios_models', function (Blueprint $table) {
            $table->string('stdmod_commission_type')->nullable();
            $table->float('stdmod_goal')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('studios_models', function (Blueprint $table) {
            $table->dropColumn('stdmod_commission_type');
            $table->dropColumn('stdmod_goal');
        });
    }
}
