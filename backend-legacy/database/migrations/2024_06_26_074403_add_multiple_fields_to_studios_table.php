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
        Schema::table('studios', function (Blueprint $table) {
            $table->boolean('std_ally_master_pays')->default(false);
            $table->boolean('std_active')->default(true);
            $table->float('std_discountstudio_eur')->default(0);
            $table->float('std_discountstudio_usd')->default(0);
            $table->float('std_discountmodel_eur')->default(0);
            $table->float('std_discountmodel_usd')->default(0);
            $table->unsignedInteger('user_id_owner')->nullable();
            $table->boolean('std_rtefte')->default(false);
            $table->foreign('user_id_owner')->references('user_id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('studios', function (Blueprint $table) {
            $table->dropColumn('std_ally_master_pays');
            $table->dropColumn('std_active');
            $table->dropColumn('std_discountstudio_eur');
            $table->dropColumn('std_discountstudio_usd');
            $table->dropColumn('std_discountmodel_eur');
            $table->dropColumn('std_discountmodel_usd');
            $table->dropColumn('user_id_owner');
            $table->dropColumn('std_rtefte');
        });
    }
};
