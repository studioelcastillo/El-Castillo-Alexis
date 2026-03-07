<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddBeneficiaryFieldsToUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('user_document_type')->nullable();
            $table->string('user_beneficiary_name')->nullable();
            $table->string('user_beneficiary_document')->nullable();
            $table->string('user_beneficiary_document_type')->nullable();
            $table->string('user_payment_code')->nullable();
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
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('user_document_type');
            $table->dropColumn('user_beneficiary_name');
            $table->dropColumn('user_beneficiary_document');
            $table->dropColumn('user_beneficiary_document_type');
            $table->dropColumn('user_payment_code');
        });
    }
}
