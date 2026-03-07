<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class ModelAccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $placeholderPassword = env('LEGACY_PLATFORM_PASSWORD_PLACEHOLDER', 'REDACTED_CHANGE_IN_PANEL');

        // profiles
        $records = DB::select("SELECT prof_id, prof_name FROM profiles");
        $profilesList = array();
        foreach ($records as $key => $row) {
            $profilesList[$row->prof_name] = $row;
        }
        $prof_id_model = $profilesList['MODELO']->prof_id;
        // studios
        $records = DB::select("SELECT std_id, std_nit FROM studios");
        $studiosList = array();
        foreach ($records as $key => $row) {
            $studiosList[$row->std_nit] = $row;
        }
        // studios_models
        $records = DB::select("
            SELECT user_id, user_email, stdmod_id
            FROM users us
            INNER JOIN studios_models sm ON sm.user_id_model = us.user_id
            WHERE prof_id = '$prof_id_model' AND std_id = '".$studiosList['901147097']->std_id."'
        ");
        $usersModelsList = array();
        foreach ($records as $key => $row) {
            $usersModelsList[$row->user_email] = $row;
        }
        // models_accounts
        $records = DB::select("SELECT COUNT(*) as n_rows FROM models_accounts");
        if ($records[0]->n_rows == 0) {
            DB::table('models_accounts')->insert([
                // models_accounts
                ['modacc_app' => 'STREAMATE', 'modacc_username' => 'malubaker@studioelcastillo.com', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['malubaker@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'LIVEJASMIN', 'modacc_username' => 'gisellemina@studioelcastillo.com', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['gisellemina@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'SKYPRIVATE', 'modacc_username' => 'candycexxx@studioelcastillo.com', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['candycexxx@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => false, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'CHATURBATE', 'modacc_username' => 'CandyCexxx2023', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['candycexxx@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => false, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'IMLIVE', 'modacc_username' => 'CandyCexxx', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['candycexxx@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => false, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'XLOVECAM', 'modacc_username' => 'MartinaVergara', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['martinavergara@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'STRIPCHAT', 'modacc_username' => 'EMILYLEAH', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['emilyleah@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'FLIRT4FREE', 'modacc_username' => 'ChristieWilde01', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['christiewilde01@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'STREAMRAY', 'modacc_username' => 'CANDDY_LOVE69', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['canddy_love69@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'STREAMRAY', 'modacc_username' => 'margaretRogers', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['margaretrogers@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'CAM4', 'modacc_username' => 'RedbelbethEnyel', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['redbelbethenyel@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'CAMSODA ALIADOS', 'modacc_username' => 'EVAAANDMIKE', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['evaaandmike@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'BONGACAMS', 'modacc_username' => 'ValentinaGil', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['valentinagil@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'MYFREECAMS', 'modacc_username' => 'simonaevan@studioelcastillo.com', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['simonaevan@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => false, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'MYDIRTYHOBBY', 'modacc_username' => 'TAYLOR_BROWN', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['taylor_brown@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'CHATURBATE', 'modacc_username' => 'rileyrhoades', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['rileyrhoades@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'SKYPRIVATE', 'modacc_username' => 'meiiling@studioelcastillo.com', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['meiiling@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'IMLIVE', 'modacc_username' => 'KristalJhons', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['kristaljhons@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'MYFREECAMS', 'modacc_username' => 'SHARON_ANGELS', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['sharon_angels@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                // new
                ['modacc_app' => 'ONLYFANS', 'modacc_username' => 'scarlettandclark', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['scarlettandclark@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'ONLYFANS', 'modacc_username' => 'clarkkent', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['clarkkent@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'XVIDEOS', 'modacc_username' => 'scarlettandclark', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['scarlettandclark@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'MANYVIDS', 'modacc_username' => 'scarlettandclark', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['scarlettandclark@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['modacc_app' => 'XHAMSTER', 'modacc_username' => 'scarletkent', 'modacc_password' => $placeholderPassword, 'stdmod_id' => $usersModelsList['scarletkent@studioelcastillo.com']->stdmod_id, 'modacc_state' => 'APROBADO', 'modacc_active' => true, 'modacc_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
            ]);
        }
    }
}
