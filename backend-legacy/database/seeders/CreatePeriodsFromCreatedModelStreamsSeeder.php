<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use App\Models\ModelStream;
use App\Models\Period;

class CreatePeriodsFromCreatedModelStreamsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $models_stream = ModelStream::select('modstr_date')->distinct()->get();

        foreach ($models_stream as $model_stream) {
            $modstr_date = $model_stream->modstr_date;
            $period_start_date = (date('l', strtotime($modstr_date)) == 'Monday') ? date('Y-m-d', strtotime($modstr_date)) : date('Y-m-d', strtotime('last monday', strtotime($modstr_date)));
            $period_end_date = date('Y-m-d', strtotime('this sunday', strtotime($modstr_date)));

            $period = Period::where('period_start_date', $period_start_date)
            ->where('period_end_date', $period_end_date)
            ->orderBy('period_id', 'desc')
            ->first();
            if (empty($period)) {
                $period_data = array(
                    'period_start_date' => $period_start_date, 
                    'period_end_date' => $period_end_date,
                    'period_state' => 'CERRADO'
                );
                $period = Period::create($period_data);
            }
        }
    }
}