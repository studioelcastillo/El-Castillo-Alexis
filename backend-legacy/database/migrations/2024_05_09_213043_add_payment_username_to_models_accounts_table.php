<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPaymentUsernameToModelsAccountsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // models_accounts
        Schema::table('models_accounts', function (Blueprint $table) {
            $table->string('modacc_payment_username')->nullable();
        });

        // users
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('user_payment_code');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // models_accounts
        Schema::table('models_accounts', function (Blueprint $table) {
            $table->dropColumn('modacc_payment_username');
        });

        // users
        Schema::table('users', function (Blueprint $table) {
            $table->string('user_payment_code')->nullable();
        });
    }
}
