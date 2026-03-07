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
            $table->boolean('std_ally')->default(true)->change();
        });
        DB::table('studios')->update(['std_ally' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('studios', function (Blueprint $table) {
            $table->boolean('std_ally')->default(false)->change();
        });
        //DB::table('studios')->update(['std_ally' => false]);
    }
};
