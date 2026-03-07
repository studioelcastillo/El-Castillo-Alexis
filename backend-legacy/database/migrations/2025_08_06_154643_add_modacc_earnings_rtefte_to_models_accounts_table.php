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
        Schema::table('models_accounts', function (Blueprint $table) {
            $table->decimal('modacc_earnings_rtefte', 5, 2)->nullable()->default(4.00)->comment('Porcentaje de retención en la fuente');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('models_accounts', function (Blueprint $table) {
            $table->dropColumn('modacc_earnings_rtefte');
        });
    }
};
