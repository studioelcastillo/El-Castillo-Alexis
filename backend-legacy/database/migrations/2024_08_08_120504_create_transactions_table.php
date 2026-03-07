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
        Schema::create('transactions', function (Blueprint $table) {
            $table->increments('trans_id');
            $table->integer('transtype_id');
            $table->integer('user_id');
            $table->integer('prod_id')->nullable();
            $table->date('trans_date');
            $table->string('trans_description')->nullable();
            $table->float('trans_amount');
            $table->float('trans_quantity')->nullable();
            $table->boolean('trans_rtefte')->default(false);
            $table->foreign('transtype_id')->references('transtype_id')->on('transactions_types');
            $table->foreign('prod_id')->references('prod_id')->on('products');
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
        Schema::dropIfExists('transactions');
    }
};
