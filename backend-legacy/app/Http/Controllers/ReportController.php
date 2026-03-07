<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\IOFactory;
use ZipArchive;
use Validator;
use DateTime;
use Log;

use App\Models\User;
use App\Models\Profile;
use App\Models\Studio;
use App\Models\StudioModel;
use App\Models\Payment;
use App\Models\PaymentFile;
use App\Models\AccountVoucher;
use App\Http\Controllers\ExchangeRateController;

use App\Library\HelperController;
use App\Library\LogController;
use Spatie\LaravelPdf\Facades\Pdf;

use App\Exports\ModelsPaymentExport;
use App\Exports\ModelsRetefuenteExport;
use App\Exports\StudiosPaymentExport;
use App\Exports\StudiosRetefuenteExport;

class ReportController extends Controller
{
    private $helper;
    private $log;

    /**
     * Create a new instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->helper = new HelperController();
        $this->log = new LogController();
    }

    /**
     * Get studio periods.
     * @param  Request $request  [description]
     * @return response()->json
     */
    public function getStudioPeriods(Request $request)
    {
        // auth
        $uAuth = $request->user();
        $profile_id = $uAuth->prof_id;
        if ($request->filled('user_id') && $request->input('user_id') != 'undefined') {
            $user = User::find($request->input('user_id'));
            $profile_id = $user->prof_id;
        }

        // profile = model
        if (in_array($profile_id, [Profile::MODELO, Profile::MODELO_SATELITE])) {
            $periods = 5;
        } else {
            $periods = 10;
        }

        $dataset = [];

        $date = date('Y-m-d');
        for ($i=0; $i < $periods; $i++) {
            $dayOfWeek = date('l');
            $date = date('Y-m-d', strtotime($date.' -1 week'));
            // Si se encuentra en el dia lunes
            if ($dayOfWeek == 'Monday') {
                $period_since = date('Y-m-d', strtotime('2 monday '.$date));
                $period_until = date('Y-m-d', strtotime('2 sunday '.$date));
            } else {
                $period_since = date('Y-m-d', strtotime('1 monday '.$date));
                $period_until = date('Y-m-d', strtotime('2 sunday '.$date));
            }
            $dataset[] = [ 'since' => $period_since, 'until' => $period_until, 'label' => 'Periodo desde '.$period_since.' hasta '.$period_until ];
        }

        return response()->json(['status' => 'success', 'data' => $dataset], 200);
    }

    /**
     * Get studio periods.
     * @param  int     $idStudio Studio Id (no se utiliza para nada ahora, pero mas adelante se va a requerir separar por estudios)
     * @return response()->json
     */
    public function getStudioPeriodsArray($idStudio = null)
    {
        // profile = model
        $periods = 10;

        $dataset = [];

        $date = date('Y-m-d');
        for ($i=0; $i < $periods; $i++) {
            $dayOfWeek = date('l');
            $date = date('Y-m-d', strtotime($date.' -1 week'));
            // Si se encuentra en el dia lunes
            if ($dayOfWeek == 'Monday') {
                $period_since = date('Y-m-d', strtotime('2 monday '.$date));
                $period_until = date('Y-m-d', strtotime('2 sunday '.$date));
            } else {
                $period_since = date('Y-m-d', strtotime('1 monday '.$date));
                $period_until = date('Y-m-d', strtotime('2 sunday '.$date));
            }
            $dataset[] = [ 'since' => $period_since, 'until' => $period_until, 'label' => 'Periodo desde '.$period_since.' hasta '.$period_until ];
        }

        return $dataset;
    }

    public function getReportConsecutive(Request $request, $report_number)
    {
        try {
            $consecutive = AccountVoucher::where('accvou_siigo_code', $report_number)->value('accvou_consecutive');
            return response()->json(['status' => 'success', 'data' => $consecutive], 200);
        } catch (Exception $e) {
            dd($e->getMessage());
            // $response = $this->helper::errorArray($e);
            return response()->json($response['data'], $response['code']);
        }
    }

    public function modelsPaymentExport(Request $request)
    {
        $consecutive = $request->input('consecutive');
        $report_since = $request->input('report_since');
        $report_until = $request->input('report_until');
        $action = $request->input('action');
        new ModelsPaymentExport([$report_since, $report_until], $action, $consecutive);
        return response('', 200);
    }

    public function modelsRetefuenteExport(Request $request)
    {
        $consecutive = $request->input('consecutive');
        $report_since = $request->input('report_since');
        $report_until = $request->input('report_until');
        $action = $request->input('action');
        new ModelsRetefuenteExport([$report_since, $report_until], $action, $consecutive);
        return response('', 200);
    }

    public function studiosPaymentExport(Request $request)
    {
        $consecutive = $request->input('consecutive');
        $report_since = $request->input('report_since');
        $report_until = $request->input('report_until');
        $action = $request->input('action');
        new StudiosPaymentExport([$report_since, $report_until], $action, $consecutive);
        return response('', 200);
    }

    public function studiosRetefuenteExport(Request $request)
    {
        $consecutive = $request->input('consecutive');
        $report_since = $request->input('report_since');
        $report_until = $request->input('report_until');
        $action = $request->input('action');
        new StudiosRetefuenteExport([$report_since, $report_until], $action, $consecutive);
        return response('', 200);
    }

}
