<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\LivejasminBonusType;

class CheckBonusTypes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bonuses:check-types';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check LiveJasmin bonus types in database';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Checking LiveJasmin Bonus Types...');
        
        $count = LivejasminBonusType::count();
        $this->info("Total bonus types: {$count}");
        
        if ($count > 0) {
            $bonusTypes = LivejasminBonusType::all();
            
            $this->table(
                ['ID', 'Name', 'Percentage', 'Active', 'Profile'],
                $bonusTypes->map(function ($bt) {
                    return [
                        $bt->ljbt_id,
                        $bt->ljbt_name,
                        $bt->ljbt_bonus_percentage . '%',
                        $bt->ljbt_active ? 'Yes' : 'No',
                        $bt->ljbt_profile ?? 'All'
                    ];
                })
            );
        } else {
            $this->warn('No bonus types found in database!');
        }
        
        return 0;
    }
}