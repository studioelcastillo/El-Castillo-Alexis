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
        Schema::table('models_streams', function (Blueprint $table) {
            $table->float('modstr_earnings_trm_studio')->nullable();
            $table->float('modstr_earnings_percent_studio')->nullable();
            $table->float('modstr_earnings_cop_studio')->nullable();
        });

        // default discount
        DB::statement("UPDATE studios SET std_discountstudio_eur = 60 WHERE (std_discountstudio_eur IS NULL OR std_discountstudio_eur = 0)");
        DB::statement("UPDATE studios SET std_discountstudio_usd = 60 WHERE (std_discountstudio_usd IS NULL OR std_discountstudio_usd = 0)");
        DB::statement("UPDATE studios SET std_discountmodel_eur = 160 WHERE (std_discountmodel_eur IS NULL OR std_discountmodel_eur = 0)");
        DB::statement("UPDATE studios SET std_discountmodel_usd = 160 WHERE (std_discountmodel_usd IS NULL OR std_discountmodel_usd = 0)");

        // default std_ally_master_pays
        DB::statement("UPDATE studios SET std_ally_master_pays = true");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('models_streams', function (Blueprint $table) {
            $table->dropColumn('modstr_earnings_trm_studio');
            $table->dropColumn('modstr_earnings_percent_studio');
            $table->dropColumn('modstr_earnings_cop_studio');
        });
    }
};
