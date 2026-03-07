<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class AccountingVoucherSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $records = DB::select("SELECT COUNT(*) as n_rows FROM accounting_voucher");
        if ($records[0]->n_rows == 0) {
            DB::table('accounting_voucher')->insert([
                ['accvou_id' => 1, 'accvou_description' => 'Comprobante de pago', 'accvou_siigo_code' => 18, 'accvou_consecutive' => 1]
            ]);
        }
        $records = DB::select("SELECT COUNT(*) as n_rows FROM accounting_voucher");
        if ($records[0]->n_rows == 1) {
            DB::table('accounting_voucher')->insert([
                ['accvou_id' => 2, 'accvou_description' => 'Comprobante de retefuente modelos', 'accvou_siigo_code' => 9, 'accvou_consecutive' => 1]
            ]);
        }
        $records = DB::select("SELECT COUNT(*) as n_rows FROM accounting_voucher");
        if ($records[0]->n_rows == 2) {
            DB::table('accounting_voucher')->insert([
                ['accvou_id' => 3, 'accvou_description' => 'Comprobante de retefuente estudios', 'accvou_siigo_code' => 14, 'accvou_consecutive' => 1]
            ]);
        }
    }
}
