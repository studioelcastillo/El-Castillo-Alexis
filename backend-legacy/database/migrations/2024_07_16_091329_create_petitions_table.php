<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('petitions', function (Blueprint $table) {
            $table->increments('ptn_id');
            $table->unsignedInteger('ptn_consecutive');
            $table->string('ptn_type', 50);
            $table->string('ptn_nick', 150);
            $table->string('ptn_nick_final', 150);
            $table->string('ptn_password', 150);
            $table->string('ptn_password_final', 150);
            $table->string('ptn_mail', 150);
            $table->string('ptn_mail_final', 150);
            $table->string('ptn_payment_pseudonym', 150)->nullable();
            $table->string('ptn_page', 120);
            $table->unsignedInteger('user_id');
            $table->foreign('user_id')->references('user_id')->on('users');
            $table->unsignedInteger('modacc_id')->nullable();
            $table->foreign('modacc_id')->references('modacc_id')->on('models_accounts');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('petitions');
    }
};
