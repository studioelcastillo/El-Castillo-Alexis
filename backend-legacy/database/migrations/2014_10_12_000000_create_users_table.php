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
        Schema::create('users', function (Blueprint $table) {
            $table->increments('user_id');
            $table->string('user_identification')->nullable();
            $table->string('user_name');
            $table->string('user_surname')->nullable();
            $table->string('user_email')->unique()->nullable();
            $table->string('user_password')->nullable();
            $table->text('user_token_recovery_password')->nullable();
            $table->integer('prof_id')->nullable();
            $table->string('user_sex')->nullable();
            $table->string('user_telephone')->nullable();
            $table->string('user_address')->nullable();
            $table->string('user_image')->nullable();
            $table->date('user_birthdate')->nullable();
            $table->string('user_bank_entity')->nullable();
            $table->string('user_bank_account')->nullable();
            $table->boolean('user_active')->default(true);
            $table->datetime('user_last_login')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->datetime('deleted_at')->nullable();
            $table->foreign('prof_id')->references('prof_id')->on('profiles');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
