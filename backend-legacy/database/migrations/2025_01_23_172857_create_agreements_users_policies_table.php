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
        Schema::create('agreements_users_policies', function (Blueprint $table) {
            $table->increments('aggusrpol_id');
            $table->integer('pol_id');
            $table->foreign('pol_id')->references('pol_id')->on('policies');
            $table->integer('user_id');
            $table->foreign('user_id')->references('user_id')->on('users');
            $table->boolean('aggusrpol_agreement')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agreements_users_policies');
    }
};
