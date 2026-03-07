<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class PopulateProfilesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $profiles = [
            'ADMINISTRADOR', // Administrador
            'ESTUDIO', // Estudio
            'GESTOR', // Gestor
            'MODELO', // Modelo
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
     *
     * @return void
     */
    public function down()
    {
        DB::table('profiles')->delete();
    }
}
