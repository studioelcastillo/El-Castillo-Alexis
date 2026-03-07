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
        Schema::create('accounting_voucher', function (Blueprint $table) {
            $table->increments('accvou_id');
            $table->string('accvou_description')->nullable();
            $table->smallInteger('accvou_siigo_code');
            $table->integer('accvou_consecutive');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounting_voucher');
    }
};
