<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class StudioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // studios
        $records = DB::select("SELECT COUNT(*) as n_rows FROM studios");
        if ($records[0]->n_rows == 0) {
            DB::table('studios')->insert([
                ['std_nit' => '901147097', 'std_name' => 'EL CASTILLO GROUP SAS', 'std_shifts' => 'MANANA_TARDE_NOCHE', 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
            ]);
        }
    }
}
