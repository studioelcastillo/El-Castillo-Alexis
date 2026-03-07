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
        Schema::create('setups_commissions', function (Blueprint $table) {
            $table->increments('setcomm_id');
            $table->unsignedInteger('std_id')->nullable();
            $table->foreign('std_id')->references('std_id')->on('studios');
            $table->string('setcomm_title');
            $table->text('setcomm_description')->nullable();
            $table->enum('setcomm_type', ['Porcentaje', 'Dolares', 'Tokens', 'Pesos colombianos'])->default('Porcentaje');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('setups_commissions');
    }
};
