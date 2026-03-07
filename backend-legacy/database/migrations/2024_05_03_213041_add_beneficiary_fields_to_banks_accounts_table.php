<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddBeneficiaryFieldsToBanksAccountsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('banks_accounts', function (Blueprint $table) {
            $table->string('bankacc_beneficiary_name')->nullable();
            $table->string('bankacc_beneficiary_document')->nullable();
            $table->string('bankacc_beneficiary_document_type')->nullable();
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
        Schema::table('banks_accounts', function (Blueprint $table) {
            $table->dropColumn('bankacc_beneficiary_name');
            $table->dropColumn('bankacc_beneficiary_document');
            $table->dropColumn('bankacc_beneficiary_document_type');
        });
    }
}
