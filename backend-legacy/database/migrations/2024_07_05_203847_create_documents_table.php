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
        Schema::create('documents', function (Blueprint $table) {
            $table->increments('doc_id');
            $table->string('doc_label', 150);
            $table->string('doc_url');
            $table->string('doc_type', 50);
            $table->unsignedInteger('user_id')->nullable();
            $table->foreign('user_id')->references('user_id')->on('users');
            $table->unsignedInteger('usraddmod_id')->nullable();
            $table->foreign('usraddmod_id')->references('usraddmod_id')->on('users_additional_models');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
