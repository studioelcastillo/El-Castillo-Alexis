<?php

namespace App\Jobs;

use App\Http\Controllers\ModelStreamController;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class PopulateStreamsFromModelsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Intentos permitidos para el job.
     *
     * @var int
     */
    public int $tries = 1;

    /**
     * Timeout del job en segundos.
     *
     * @var int
     */
    public int $timeout = 900; // 15 minutos

    /**
     * Filtros para la consulta de cuentas.
     *
     * @var array
     */
    private array $args;

    /**
     * @param array $args Filtros opcionales para la consulta
     */
    public function __construct(array $args = [])
    {
        $this->args = $args;
        $this->onQueue('scraping');
    }

    /**
     * Ejecuta el scraping de cuentas MODEL usando ms-wscrap.
     *
     * @param ModelStreamController $controller
     * @return void
     */
    public function handle(ModelStreamController $controller): void
    {
        Log::info('[JOB] Ejecutando PopulateStreamsFromModelsJob');

        $controller->populateStreamsFromModelsWithMS($this->args);
    }
}
