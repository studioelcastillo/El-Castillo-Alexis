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
        Schema::table('models_transactions', function (Blueprint $table) {
            $table->float('modtrans_quantity')->nullable();
            $table->boolean('modtrans_rtefte')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('models_transactions', function (Blueprint $table) {
            $table->dropColumn('modtrans_quantity');
            $table->dropColumn('modtrans_rtefte');
        });
    }
};
