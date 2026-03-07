<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class UpdateBotsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bots:update-verified'; // Nombre del comando, puedes poner el que quieras

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Updates the verified status of bots with website="sex"'; // Descripción

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        // Ejecuta la consulta SQL usando el constructor de consultas de Laravel
        $updated = DB::table('bots')
                     ->where('website', 'sex')
                     ->update(['verified' => true]);

        // O si prefieres SQL puro:
        // $updated = DB::update("UPDATE public.bots SET verified = true WHERE website = 'sex'");

        $this->info("Updated {$updated} bots."); // Muestra un mensaje en la consola/log

        return 0; // 0 indica éxito
    }
}