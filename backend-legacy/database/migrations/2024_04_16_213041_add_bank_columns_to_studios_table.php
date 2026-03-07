<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddBankColumnsToStudiosTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('studios', function (Blueprint $table) {
            $table->string('std_bank_entity')->nullable();
            $table->string('std_bank_account')->nullable();
            $table->string('std_bank_account_type')->nullable();
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
        Schema::table('studios', function (Blueprint $table) {
            $table->dropColumn('std_bank_entity');
            $table->dropColumn('std_bank_account');
            $table->dropColumn('std_bank_account_type');
        });
    }
}
