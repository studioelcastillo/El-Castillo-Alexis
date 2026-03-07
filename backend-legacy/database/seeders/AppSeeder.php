<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\App;

class AppSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        App::create([
            'app_name' => 'el-castillo-desktop',
            'app_description' => 'El Castillo Desktop Application',
            'app_version' => '1.1.0',
            'app_ip' => '45.140.143.77',
            'app_port' => '18080',
            'app_dwnl_link' => env('APP_URL') . '/apps/el-castillo-1.1.0-windows-x86.exe',
        ]);
    }
}
