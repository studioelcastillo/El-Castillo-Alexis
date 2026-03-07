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
        Schema::table('petitions', function (Blueprint $table) {
            $table->dropColumn('ptn_mail_final');
            $table->string('ptn_mail', 150)->nullable()->change();
            $table->unsignedInteger('std_id')->nullable();
            $table->foreign('std_id')->references('std_id')->on('studios');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('petitions', function (Blueprint $table) {
            $table->string('ptn_mail', 150)->change();
            $table->string('ptn_mail_final', 150)->nullable();
            $table->dropColumn('std_id');
        });
    }
};
