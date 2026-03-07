<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdatePasswordWithIdentificationInUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::statement("
            UPDATE users
            SET user_email = user_identification
            WHERE user_identification IS NOT NULL
                AND user_id > 2
                -- actualizar la password de de los que sean unicos en la base de datos
                AND user_identification IN (SELECT user_identification FROM users GROUP BY user_identification HAVING COUNT(*) = 1)
        ");

        $records = DB::select("SELECT user_id, user_identification, user_password FROM users WHERE user_identification = user_email");
        foreach ($records as $record) {
            $user_id = $record->user_id;
            $user_password = bcrypt(substr($record->user_identification, -5)); // ultimos 5 digitos
            DB::statement("UPDATE users SET user_password = '$user_password' WHERE user_id = '$user_id'");
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
    }
}
