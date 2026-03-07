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
        Schema::table('apps', function (Blueprint $table) {
            $table->string('bright_data_proxy')->nullable()->after('app_port');
            $table->string('bright_data_username')->nullable()->after('bright_data_proxy');
            $table->string('bright_data_password')->nullable()->after('bright_data_username');
            $table->boolean('force_update')->default(false)->after('app_dwnl_link');
            $table->text('release_notes')->nullable()->after('force_update');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('apps', function (Blueprint $table) {
            $table->dropColumn([
                'bright_data_proxy',
                'bright_data_username',
                'bright_data_password',
                'force_update',
                'release_notes'
            ]);
        });
    }
};
