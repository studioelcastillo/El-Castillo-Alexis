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
        Schema::table('model_livejasmin_score_bonuses', function (Blueprint $table) {
            // Drop foreign key constraints first if they exist
            $table->dropForeign(['ljbt_id']);
            
            // Drop old columns
            $table->dropColumn(['ljbt_id', 'mlsb_qualifies', 'mlsb_bonus_amount']);
            
            // Add new columns
            $table->unsignedBigInteger('modacc_id')->after('modlj_id');
            $table->string('mlsb_period')->after('modacc_id');
            $table->timestamp('mlsb_period_start')->after('mlsb_period');
            $table->timestamp('mlsb_period_end')->after('mlsb_period_start');
            
            // Add soft deletes
            $table->softDeletes();
            
            // Add foreign key constraint
            $table->foreign('modacc_id')->references('modacc_id')->on('models_accounts')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('model_livejasmin_score_bonuses', function (Blueprint $table) {
            // Drop foreign key constraint
            $table->dropForeign(['modacc_id']);
            
            // Drop new columns
            $table->dropColumn(['modacc_id', 'mlsb_period', 'mlsb_period_start', 'mlsb_period_end']);
            $table->dropSoftDeletes();
            
            // Add back old columns
            $table->unsignedBigInteger('ljbt_id')->after('modlj_id');
            $table->boolean('mlsb_qualifies')->default(false)->after('ljbt_id');
            $table->decimal('mlsb_bonus_amount', 10, 2)->default(0)->after('mlsb_qualifies');
            
            // Add back foreign key constraint
            $table->foreign('ljbt_id')->references('ljbt_id')->on('livejasmin_bonus_types')->onDelete('cascade');
        });
    }
};