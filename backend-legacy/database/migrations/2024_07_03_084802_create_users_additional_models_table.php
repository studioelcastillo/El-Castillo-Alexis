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
        Schema::create('users_additional_models', function (Blueprint $table) {
            $table->increments('usraddmod_id');
            $table->string('usraddmod_identification', 40);
            $table->string('usraddmod_category', 40);
            $table->string('usraddmod_name', 150);
            $table->date('usraddmod_birthdate');
            $table->unsignedInteger('user_id');
            $table->foreign('user_id')->references('user_id')->on('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users_additional_models');
    }
};
