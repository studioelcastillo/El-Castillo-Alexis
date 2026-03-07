<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSearchControlColumnsToModelsAccountsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('models_accounts', function (Blueprint $table) {
            $table->datetime('modacc_last_search_at')->nullable();
            $table->datetime('modacc_last_result_at')->nullable();
            $table->text('modacc_fail_message')->nullable();
            $table->integer('modacc_fail_count')->nullable()->default(0);
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
        Schema::table('models_accounts', function (Blueprint $table) {
            $table->dropColumn('modacc_last_search_at');
            $table->dropColumn('modacc_last_result_at');
            $table->dropColumn('modacc_fail_message');
            $table->dropColumn('modacc_fail_count');
        });
    }
}
