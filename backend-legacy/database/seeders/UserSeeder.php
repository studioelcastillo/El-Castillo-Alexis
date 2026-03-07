<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // admin@geckode.la
        $records = DB::select("SELECT COUNT(*) as n_rows FROM users WHERE user_email='admin@geckode.la'");
        if ($records[0]->n_rows == 0) {
            DB::table('users')->insert([
                ['user_name' => 'admin', 'user_email' => 'admin@geckode.la', 'user_password' => bcrypt('GK123'), 'user_active' => true, 'prof_id' => 1, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
            ]);
        }
        // others
        $records = DB::select("SELECT COUNT(*) as n_rows FROM users");
        if ($records[0]->n_rows == 1) {
            DB::table('users')->insert([
                // administrador
                ['user_name' => 'another', 'user_email' => 'another@geckode.la', 'user_password' => bcrypt('GK123'), 'user_active' => true, 'prof_id' => 1, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
            ]);
        }
    }
}
