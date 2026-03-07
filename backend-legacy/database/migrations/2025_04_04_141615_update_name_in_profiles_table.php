<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Profile;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Profile::upsert([
                ['prof_id' => '1', 'prof_name' => 'SUPER ADMINISTRADOR'],
                ['prof_id' => '2', 'prof_name' => 'PROPIETARIO'],
                ['prof_id' => '3', 'prof_name' => 'ADMINISTRADOR'],
                ['prof_id' => '4', 'prof_name' => 'MODELO'],
                ['prof_id' => '5', 'prof_name' => 'MODELO SATELITE'],
                ['prof_id' => '6', 'prof_name' => 'CREADOR CUENTAS'],
                ['prof_id' => '7', 'prof_name' => 'JEFE MONITOR'],
                ['prof_id' => '8', 'prof_name' => 'MONITOR'],
                ['prof_id' => '9', 'prof_name' => 'JEFE FOTOGRAFO'],
                ['prof_id' => '10', 'prof_name' => 'FOTOGRAFO'],
                ['prof_id' => '11', 'prof_name' => 'CONTABILIDAD'],
                ['prof_id' => '12', 'prof_name' => 'AUDIOVISUALES'],
                ['prof_id' => '13', 'prof_name' => 'ENTREVISTAS']
            ], 
            ['prof_id'],
            ['prof_name']
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Profile::upsert([
                ['prof_id' => '2', 'prof_name' => 'ESTUDIO'],
                ['prof_id' => '3', 'prof_name' => 'GESTOR'],
                ['prof_id' => '4', 'prof_name' => 'MODELO'],
                ['prof_id' => '5', 'prof_name' => 'MODELO SATELITE'],
                ['prof_id' => '6', 'prof_name' => 'CREADOR CUENTAS'],
                ['prof_id' => '7', 'prof_name' => 'JEFE MONITOR'],
                ['prof_id' => '8', 'prof_name' => 'MONITOR'],
                ['prof_id' => '9', 'prof_name' => 'JEFE FOTOGRAFO'],
                ['prof_id' => '10', 'prof_name' => 'FOTOGRAFO'],
                ['prof_id' => '11', 'prof_name' => 'CONTABILIDAD'],
                ['prof_id' => '12', 'prof_name' => 'AUDIOVISUALES'],
                ['prof_id' => '13', 'prof_name' => 'ENTREVISTAS'],
                ['prof_id' => '1', 'prof_name' => 'ADMINISTRADOR']
            ], 
            ['prof_id'],
            ['prof_name']
        );
    }
};
