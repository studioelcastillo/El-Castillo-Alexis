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
        Schema::table('products', function (Blueprint $table) {
            $table->float('prod_purchase_price')->nullable();
            $table->float('prod_wholesaler_price')->nullable();
            $table->float('prod_sale_price')->nullable();
            $table->float('prod_stock')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('prod_purchase_price');
            $table->dropColumn('prod_wholesaler_price');
            $table->dropColumn('prod_sale_price');
            $table->dropColumn('prod_stock');
        });
    }
};
