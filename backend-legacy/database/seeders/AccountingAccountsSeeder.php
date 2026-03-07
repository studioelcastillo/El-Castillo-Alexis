<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class AccountingAccountsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $records = DB::select("SELECT COUNT(*) as n_rows FROM accounting_accounts");
        if ($records[0]->n_rows == 0) {
            DB::table('accounting_accounts')->insert([
                ['accacc_code' => 'TRO', 'accacc_name' => 'TERCERO', 'accacc_number' => 0],
                ['accacc_code' => 'VRT', 'accacc_name' => 'VALORES RECIBIDOS TERCEROS', 'accacc_number' => 0],
                ['accacc_code' => 'DESC', 'accacc_name' => 'DESCUENTOS', 'accacc_number' => 0],
                ['accacc_code' => 'RETE', 'accacc_name' => 'RETE FUENTE 4%', 'accacc_number' => 0],
                ['accacc_code' => 'PMOD', 'accacc_name' => 'PAGO MODELO', 'accacc_number' => 0],
                ['accacc_code' => 'PALD', 'accacc_name' => 'PAGO ALIADOS', 'accacc_number' => 0],
                ['accacc_code' => 'BBCOL', 'accacc_name' => 'BANCOLOMBIA CUENTA CORRIENTE', 'accacc_number' => 0],
                ['accacc_code' => 'BCOL', 'accacc_name' => 'COLPATRIA CUENTA CORRIENTE', 'accacc_number' => 0],
                ['accacc_code' => 'BBVA', 'accacc_name' => 'BBVA', 'accacc_number' => 0],
                ['accacc_code' => 'AVV', 'accacc_name' => 'AV VILLAS', 'accacc_number' => 0],
                ['accacc_code' => 'SCOT', 'accacc_name' => 'SCOTIABANK', 'accacc_number' => 0]
            ]);
        }
    }
}
