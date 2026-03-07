<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class ModelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // studios
        $records = DB::select("SELECT std_id, std_nit FROM studios");
        $studiosList = array();
        foreach ($records as $key => $row) {
            $studiosList[$row->std_nit] = $row;
        }
        // profiles
        $records = DB::select("SELECT prof_id, prof_name FROM profiles");
        $profilesList = array();
        foreach ($records as $key => $row) {
            $profilesList[$row->prof_name] = $row;
        }
        $prof_id_model = $profilesList['MODELO']->prof_id;
        // users
        $records = DB::select("SELECT COUNT(*) as n_rows FROM users WHERE prof_id = '$prof_id_model'");
        if ($records[0]->n_rows == 0) {
            DB::table('users')->insert([
                // users
                ['user_email' => 'malubaker@studioelcastillo.com', 'user_name' => 'malubaker', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'gisellemina@studioelcastillo.com', 'user_name' => 'gisellemina', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'candycexxx@studioelcastillo.com', 'user_name' => 'candycexxx', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'martinavergara@studioelcastillo.com', 'user_name' => 'martinavergara', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'emilyleah@studioelcastillo.com', 'user_name' => 'emilyleah', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'christiewilde01@studioelcastillo.com', 'user_name' => 'christiewilde01', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'canddy_love69@studioelcastillo.com', 'user_name' => 'canddy_love69', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'margaretrogers@studioelcastillo.com', 'user_name' => 'margaretrogers', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'redbelbethenyel@studioelcastillo.com', 'user_name' => 'redbelbethenyel', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'evaaandmike@studioelcastillo.com', 'user_name' => 'evaaandmike', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'valentinagil@studioelcastillo.com', 'user_name' => 'valentinagil', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'simonaevan@studioelcastillo.com', 'user_name' => 'simonaevan', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'taylor_brown@studioelcastillo.com', 'user_name' => 'taylor_brown', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'rileyrhoades@studioelcastillo.com', 'user_name' => 'rileyrhoades', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'meiiling@studioelcastillo.com', 'user_name' => 'meiiling', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'kristaljhons@studioelcastillo.com', 'user_name' => 'kristaljhons', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'sharon_angels@studioelcastillo.com', 'user_name' => 'sharon_angels', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                // new
                ['user_email' => 'scarlettandclark@studioelcastillo.com', 'user_name' => 'scarlettandclark', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'clarkkent@studioelcastillo.com', 'user_name' => 'clarkkent', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['user_email' => 'scarletkent@studioelcastillo.com', 'user_name' => 'scarletkent', 'user_password' => bcrypt('GK123'), 'prof_id' => $profilesList['MODELO']->prof_id, 'user_active' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
            ]);
        }
        // studios_models
        $records = DB::select("SELECT COUNT(*) as n_rows FROM studios_models");
        if ($records[0]->n_rows == 0) {
            DB::select("
                INSERT INTO studios_models (std_id, user_id_model, stdmod_start_at, stdmod_active, created_at, updated_at) 
                SELECT ".$studiosList['901147097']->std_id.", user_id, '2024-02-16', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                FROM users WHERE prof_id = '$prof_id_model' 
            ");
        }
    }
}
