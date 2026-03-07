<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\LivejasminBonusType;

class CheckBonusTypesDetailed extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bonuses:check-types-detailed';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check LiveJasmin bonus types with detailed information';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Checking LiveJasmin Bonus Types (Detailed)...');
        
        $bonusTypes = LivejasminBonusType::all();
        
        foreach ($bonusTypes as $bt) {
            $this->info("\n=== Bonus Type ID: {$bt->ljbt_id} ===");
            $this->line("Name: {$bt->ljbt_name}");
            $this->line("Description: {$bt->ljbt_description}");
            $this->line("Percentage: {$bt->ljbt_percentage}%");
            $this->line("Active: " . ($bt->ljbt_active ? 'Yes' : 'No'));
            $this->line("Profile: " . ($bt->ljbt_profile ?? 'All'));
            $criteria = $bt->criteria;
            $this->line("Criteria count: " . $criteria->count());
            foreach ($criteria as $criterion) {
                $this->line("  - {$criterion->ljbc_json_path} {$criterion->ljbc_operator} {$criterion->ljbc_target_value}");
            }
            $this->line("Created: {$bt->created_at}");
            $this->line("Updated: {$bt->updated_at}");
            if (isset($bt->deleted_at)) {
                $this->line("Deleted: {$bt->deleted_at}");
            }
        }
        
        return 0;
    }
}