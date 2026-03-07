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
        Schema::create('transactions_commissions', function (Blueprint $table) {
            $table->increments('transmodstr_id');
            $table->unsignedInteger('trans_id');
            $table->unsignedInteger('stdmod_id');
            $table->float('transmodstr_str_value')->default(0);
            $table->float('transmodstr_comm_value')->default(0);
            $table->foreign('trans_id')->references('trans_id')->on('transactions');
            $table->foreign('stdmod_id')->references('stdmod_id')->on('studios_models');
            $table->enum('transmodstr_type', ['Porcentaje', 'Dolares', 'Tokens', 'Pesos colombianos'])->default('Porcentaje');
            $table->float('transmodstr_percentage')->default(0);
            $table->date('transmodstr_date');
            //$table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions_commissions');
    }
};
