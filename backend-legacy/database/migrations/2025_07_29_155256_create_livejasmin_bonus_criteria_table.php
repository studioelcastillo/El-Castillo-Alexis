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
        Schema::create('livejasmin_bonus_criteria', function (Blueprint $table) {
            $table->id('ljbc_id');
            $table->unsignedBigInteger('ljbt_id');
            $table->string('ljbc_api_endpoint'); // "/models/{id}/stats"
            $table->string('ljbc_json_path'); // "data.performance.hours_preview"
            $table->string('ljbc_operator'); // ">=", "<=", "=", ">", "<"
            $table->decimal('ljbc_target_value', 10, 2);
            $table->string('ljbc_condition_type')->default('AND'); // "AND", "OR"
            $table->integer('ljbc_order')->default(0);
            $table->timestamps();
            
            $table->foreign('ljbt_id')->references('ljbt_id')->on('livejasmin_bonus_types');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('livejasmin_bonus_criteria');
    }
};
