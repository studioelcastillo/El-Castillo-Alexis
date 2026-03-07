<?php

namespace App\Console\Commands;

use App\Services\LivejasminService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class UpdateLivejasminPerformanceCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'livejasmin:update-performance';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update performance data for LiveJasmin models';

    /**
     * Execute the console command.
     */
    public function handle(LivejasminService $livejasminService)
    {
        $this->info('Starting LiveJasmin performance update...');

        try {
            $results = $livejasminService->updateModelsPerformance();

            if (isset($results['updated']) && isset($results['total'])) {
                $this->info("Update completed: {$results['updated']} of {$results['total']} models updated");
            }

            if (isset($results['errors']) && $results['errors'] > 0) {
                $this->warn("Errors occurred: {$results['errors']} models failed to update");

                foreach ($results['error_details'] as $error) {
                    $this->error($error);
                }
            }

            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to update performance data: ' . $e->getMessage());
            Log::error('LiveJasmin update command error: ' . $e->getMessage());

            return 1;
        }
    }
}
