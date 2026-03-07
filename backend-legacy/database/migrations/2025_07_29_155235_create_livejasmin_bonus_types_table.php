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
        Schema::create('livejasmin_bonus_types', function (Blueprint $table) {
            $table->id('ljbt_id');
            $table->string('ljbt_name'); // "Bono 5%", "Bono 10%"
            $table->string('ljbt_code')->unique(); // "BONUS_5_PERCENT"
            $table->decimal('ljbt_percentage', 5, 2); // 5.00, 10.00
            $table->text('ljbt_description')->nullable();
            $table->json('ljbt_target_profiles')->nullable(); // ["MODELO", "MODELO_SATELITE"]
            $table->boolean('ljbt_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('livejasmin_bonus_types');
    }
};
