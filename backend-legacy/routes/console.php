<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Http\Controllers\ModelStreamController;
use App\Http\Controllers\ModelAccountController;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your Closure based console
| commands. Each Closure is bound to a command instance allowing a
| simple approach to interacting with each command's IO methods.
|
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// on windows cmd:
// C:/AppServ/php83-nts/php artisan models:streams
Artisan::command('models:streams', function () {
    $m = new ModelStreamController();
    $m->populateStreamsFromApi();
    $this->comment('get models streams completed');
})->purpose('Get streams of models from webcam platforms');

// on windows cmd:
// C:/AppServ/php83-nts/php artisan studios:streams
Artisan::command('studios:streams', function () {
    try {
        $m = new ModelStreamController();
        $foo = $m->populateStreamsFromStudiosApi();
    } catch (Exception $e) {
        throw $e;
    }
    $this->comment('get studios streams completed');
})->purpose('Get streams of studios from webcam platforms');

// on windows cmd:
// C:/AppServ/php83-nts/php artisan models:inactive
Artisan::command('models:inactive', function () {
    $m = new ModelAccountController();
    $m->inactiveMassive();
    $this->comment('inactivation completed');
})->purpose('Models inactivation');

// on windows cmd:
// C:/AppServ/php83-nts/php artisan pass:encrypt
Artisan::command('pass:encrypt', function () {
    $records = DB::select("SELECT user_id, user_identification, user_password FROM users WHERE user_identification = user_email");
    foreach ($records as $record) {
        if (!preg_match("/\$..\$..\$/", $record->user_password)) {
            $user_id = $record->user_id;
            $user_password = bcrypt(substr($record->user_identification, -5)); // ultimos 5 digitos
            DB::statement("UPDATE users SET user_password = '$user_password' WHERE user_id = '$user_id'");
        }
    }
})->purpose('Encrypt users password based on the identification');
