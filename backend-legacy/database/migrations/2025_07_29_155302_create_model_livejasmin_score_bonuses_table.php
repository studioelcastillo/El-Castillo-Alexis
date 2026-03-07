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
        Schema::create('model_livejasmin_score_bonuses', function (Blueprint $table) {
            $table->id('mlsb_id');
            $table->unsignedBigInteger('modlj_id');
            $table->unsignedBigInteger('ljbt_id');
            $table->boolean('mlsb_qualifies')->default(false);
            $table->decimal('mlsb_bonus_amount', 10, 2)->default(0);
            $table->json('mlsb_evaluation_details')->nullable(); // Detalles de evaluación
            $table->timestamps();
            
            $table->foreign('modlj_id')->references('modlj_id')->on('models_livejasmin_scores');
            $table->foreign('ljbt_id')->references('ljbt_id')->on('livejasmin_bonus_types');
            $table->unique(['modlj_id', 'ljbt_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('model_livejasmin_score_bonuses');
    }
};
