<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $profiles = [
            'MODELO SATELITE',
            'CREADOR CUENTAS',
            'JEFE MONITOR',
            'MONITOR',
            'JEFE FOTOGRAFO',
            'FOTOGRAFO',
            'CONTABILIDAD',
            'AUDIOVISUALES',
            'ENTREVISTAS'
        ];

        foreach ($profiles as $p => $profile) {
            DB::table('profiles')->insert([
                'prof_name' => $profile,
                'created_at' => date('Y-m-d'),
                'updated_at' => date('Y-m-d'),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //DB::table('profiles')->where('prof_id', '>', 4)->delete();
    }
};
