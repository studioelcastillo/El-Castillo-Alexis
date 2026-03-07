<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddCommissionAutoAndDateToModelsGoalsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('models_goals', function (Blueprint $table) {
            $table->float('modgoal_percent')->nullable();
            $table->boolean('modgoal_auto')->nullable();
            $table->date('modgoal_date')->nullable();
            $table->boolean('modgoal_reach_goal')->default(false);
            $table->dropColumn('modgoal_year');
            $table->dropColumn('modgoal_month');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('models_goals', function (Blueprint $table) {
            $table->dropColumn('modgoal_percent');
            $table->dropColumn('modgoal_auto');
            $table->dropColumn('modgoal_date');
            $table->dropColumn('modgoal_reach_goal');
            $table->integer('modgoal_year')->nullable();
            $table->integer('modgoal_month')->nullable();
        });
    }
}
