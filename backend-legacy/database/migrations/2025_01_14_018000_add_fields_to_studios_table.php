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
            $table->char('std_verification_digit', 1)->nullable();
            $table->string('std_manager_name', 255)->nullable();
            $table->string('std_manager_id', 50)->nullable();
            $table->string('std_manager_phone', 20)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('studios', function (Blueprint $table) {
            $table->dropColumn('std_verification_digit');
            $table->dropColumn('std_manager_name');
            $table->dropColumn('std_manager_id');
            $table->dropColumn('std_manager_phone');
        });
    }
};
