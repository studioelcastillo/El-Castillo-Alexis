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
        Schema::create('users_users', function (Blueprint $table) {
            $table->increments('usersusers_id');
            $table->integer('userparent_id');
            $table->integer('userchild_id');
            $table->foreign('userparent_id')->references('user_id')->on('users');
            $table->foreign('userchild_id')->references('user_id')->on('users');
            $table->timestamps();
        });
        //usado para evitar que el padre sea tambien hijo de su hijo
        DB::statement('CREATE UNIQUE INDEX unique_combination_id ON users_users (LEAST(userparent_id, userchild_id), GREATEST(userparent_id, userchild_id));');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS unique_combination_id;');
        Schema::dropIfExists('users_users');
    }
};
