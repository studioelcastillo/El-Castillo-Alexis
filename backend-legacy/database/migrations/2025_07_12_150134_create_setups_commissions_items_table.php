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
        Schema::create('setups_commissions_items', function (Blueprint $table) {
            $table->increments('setcommitem_id');
            $table->unsignedInteger('setcomm_id')->nullable();
            $table->foreign('setcomm_id')->references('setcomm_id')->on('setups_commissions');
            $table->float('setcommitem_value');
            $table->float('setcommitem_limit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('setups_commissions_items');
    }
};
