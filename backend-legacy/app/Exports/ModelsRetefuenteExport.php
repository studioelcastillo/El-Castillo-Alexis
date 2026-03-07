<?php
namespace App\Exports;

use App\Models\Payment;
use App\Models\AccountVoucher;
use App\Models\Account;
use App\Http\Controllers\LiquidationModelController;

// use App\Models\PaymentFile;
use Illuminate\Support\Facades\DB;

use IntlDateFormatter;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\ConditionalFormatting\Wizard;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Conditional;

class ModelsRetefuenteExport
{
    private $helper;
    private $length;
    private $excel;
    private $sheet;
    private static $alphabet;
    private static $banks;

    public function __construct($term, $action, $consecutive)
    {
        self::$alphabet = range('A', 'Z');
        $this->excel = new Spreadsheet();
        $this->sheet = $this->excel->getActiveSheet();
        $this->generateXlsx($term, $action, $consecutive);
    }

    public function generateXlsx($term, $action, $consecutive)
    {
        $models_retefuente = $this->getModelsRetefuente($term, $action, $consecutive);
        $this->sheet = $this->excel->getSheet(0);
        $this->modelsRetefuenteSheet($models_retefuente);


        $fileName = 'Retefuente-de-modelos-'.date('Y-m-d').'.xlsx';
        header("Content-type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        header('Content-Disposition: attachment;filename="'.$fileName.'"');
        header('Cache-Control: max-age=0');
        header("Pragma: no-cache");
        header("Expires: 0");

        $writer = IOFactory::createWriter($this->excel, 'Xlsx');
        $writer->save('php://output');
    }

    public function getModelsRetefuente($term, $action, $consecutive)
    {
    	$account_voucher = AccountVoucher::where('accvou_siigo_code', 9)->first();
        $account_accounts = Account::all();
        $report_generated = array();
        if ($action === 'all') {
            $report_generated = [false, true];
        } else if ($action === 'pending') {
            $report_generated = [false];
        } else if ($action === 'downloaded') {
            $report_generated = [true];
        }
        $where = '1=1';
        $where.= " AND lq.liq_date >= '".$term[0]."'";
        $where.= " AND lq.liq_date <= '".$term[1]."'";
        $where.= " AND st.std_active = true";
        $orderBy = "sum_earnings_cop DESC";

        $args = ['where' => $where,'orderBy' => $orderBy];
        $liquidation = new LiquidationModelController();
    	$models_retefuente_liq = $liquidation->liquidate($term[0], $term[1], $args);
    	$models_retefuente = array();
        $payments_ids = array();

        $models_accounts = array();
        foreach ($account_accounts as $account) {
            if (in_array($account->accacc_code , ['VRT', 'DESC', 'RETE', 'PMOD'])) {
                $models_accounts[$account->accacc_code] = $account->accacc_number;
            }
        }
    	foreach($models_retefuente_liq as $model_retefuente) {
            if (sizeof($model_retefuente['payments']) > 0 && in_array($model_retefuente['payments'][0]['pay_models_retefuente_generated'], $report_generated)) {
                $row1 = array(
                    $account_voucher->accvou_siigo_code,
                    $consecutive,
                    $term[1],
                    'COP',
                    (isset($model_retefuente['incomes'][0]) && isset($model_retefuente['incomes'][0]['modstr_earnings_trm'])) ? $model_retefuente['incomes'][0]['modstr_earnings_trm'] : '',
                    $models_accounts['VRT'],
                    $model_retefuente['user_identification'],
                    '','','','','','','','','',
                    '',
                    '','',
                    'VALORES RECIBIDOS DE TERCEROS '.$term[1],
                    '',
                    (isset($model_retefuente['sum_earnings_cop'])) ? floor($model_retefuente['sum_earnings_cop']): '',
                    ''
                );
                $models_retefuente[] = $row1;
                if (sizeof($model_retefuente['discounts']) > 0) {
                    $row2 = array(
                        $account_voucher->accvou_siigo_code,
                        $consecutive,
                        $term[1],
                        'COP',
                        (isset($model_retefuente['incomes'][0]) && isset($model_retefuente['incomes'][0]['modstr_earnings_trm'])) ? $model_retefuente['incomes'][0]['modstr_earnings_trm'] : '',
                        $models_accounts['DESC'],
                        $model_retefuente['user_identification'],
                        '','','','','','','','','',
                        '',
                        '','',
                        'DESCUENTOS '.$term[1],
                        '',
                        '',
                        (isset($model_retefuente['sum_earnings_discounts'])) ? floor($model_retefuente['sum_earnings_discounts']) : ''
                    );
                    $models_retefuente[] = $row2;
                }
                $row3 = array(
                    $account_voucher->accvou_siigo_code,
                    $consecutive,
                    $term[1],
                    'COP',
                    (isset($model_retefuente['incomes'][0]) && isset($model_retefuente['incomes'][0]['modstr_earnings_trm'])) ? $model_retefuente['incomes'][0]['modstr_earnings_trm'] : '',
                    $models_accounts['RETE'],
                    $model_retefuente['user_identification'],
                    '','','','','','','','','',
                    '6',
                    '','',
                    'RETEFUENTE 4% '.$term[1],
                    '',
                    '',
                    (isset($model_retefuente['sum_earnings_rtefte'])) ? floor($model_retefuente['sum_earnings_rtefte']): '',
                );
                $models_retefuente[] = $row3;
                $row4 = array(
                    $account_voucher->accvou_siigo_code,
                    $consecutive,
                    $term[1],
                    'COP',
                    (isset($model_retefuente['incomes'][0]) && isset($model_retefuente['incomes'][0]['modstr_earnings_trm'])) ? $model_retefuente['incomes'][0]['modstr_earnings_trm'] : '',
                    $models_accounts['PMOD'],
                    $model_retefuente['user_identification'],
                    '','','','','','','','','',
                    '',
                    '','',
                    'PAGO MODELO '.$term[1],
                    '',
                    '',
                    (isset($model_retefuente['sum_earnings_rtefte']) && isset($model_retefuente['sum_earnings_discounts']) && isset($model_retefuente['sum_earnings_cop'])) ? floor($model_retefuente['sum_earnings_cop'] - $model_retefuente['sum_earnings_rtefte'] - $model_retefuente['sum_earnings_discounts']) : '',
                );
                $models_retefuente[] = $row4;
                foreach ($model_retefuente['payments'] as $payment) {
                    $payments_ids[] = $payment['pay_id'];
                }
            }
    	}
        Payment::whereIn('pay_id', $payments_ids)->update(['pay_models_retefuente_generated' => true]);
        $account_voucher->accvou_consecutive = $consecutive + 1;
        $account_voucher->save();
        return $models_retefuente;
    }

    //inventory control summary sheets
    public function modelsRetefuenteSheet($models_retefuente)
    {
    	$titles = ['Tipo de comprobante', 'Consecutivo comprobante', 'Fecha de elaboración', 'Sigla moneda', 'Tasa de cambio', 'Código cuenta contable', 'Identificación tercero', 'Sucursal', 'Código producto', 'Código de bodega', 'Acción', 'Cantidad producto', 'Prefijo', 'Consecutivo', 'No. cuota', 'Fecha vencimiento', 'Código impuesto', 'Código grupo activo fijo', 'Código activo fijo', 'Descripción', 'Código centro/subcentro de costos', 'Débito', 'Crédito', 'Observaciones', 'Base gravable libro compras/ventas', 'Base exenta libro compras/ventas', 'Mes de cierre'];
        /////////////
        // CONTENT //
        /////////////
        $this->sheet->fromArray([$titles], null, 'A1');
        $this->sheet->fromArray($models_retefuente, null, 'A2');
        $highest_row = $this->sheet->getHighestRow();
        $highest_column = $this->sheet->getHighestColumn();

        ////////////
        // FORMAT //
        ////////////
        $titles_style = [
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER,],
            'font' => [ 'bold' => true, 'color' => ['argb' => 'FFFFFF']],
            'borders' => ['allBorders' => ['borderStyle' => 'thin', 'color' => ['rgb' => '808080']],]
        ];
        // content
        $content_style = [
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER,],
            'borders' => ['allBorders' => [ 'borderStyle' => 'thin', 'color' => ['rgb' => '808080']],]
        ];
        //$total_columns = $months_count + 3;
        $products_style = ['borders' => ['allBorders' => [ 'borderStyle' => 'thin', 'color' => ['rgb' => '808080']],]];
        $this->sheet->getStyle('A1:'.$highest_column.'1')->getFont()->setSize(11);
        $this->sheet->getStyle('A1:'.$highest_column.'1')->applyFromArray($titles_style);
        $this->sheet->getStyle('D1:E1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('0070C0');
        $this->sheet->getStyle('H1:'.$highest_column.'1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('0070C0');
        $this->sheet->getStyle('A1:C1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF0000');
        $this->sheet->getStyle('F1:G1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF0000');

        // hide columns
        $this->sheet->getColumnDimension('H')->setCollapsed(true);
        $this->sheet->getColumnDimension('I')->setCollapsed(true);
        $this->sheet->getColumnDimension('J')->setCollapsed(true);
        $this->sheet->getColumnDimension('K')->setCollapsed(true);
        $this->sheet->getColumnDimension('L')->setCollapsed(true);
        $this->sheet->getColumnDimension('M')->setCollapsed(true);
        $this->sheet->getColumnDimension('N')->setCollapsed(true);
        $this->sheet->getColumnDimension('O')->setCollapsed(true);
        $this->sheet->getColumnDimension('P')->setCollapsed(true);
        $this->sheet->getColumnDimension('Q')->setCollapsed(true);
        $this->sheet->getColumnDimension('R')->setCollapsed(true);
        $this->sheet->getColumnDimension('S')->setCollapsed(true);
        $this->sheet->getColumnDimension('X')->setCollapsed(true);
        $this->sheet->getColumnDimension('Y')->setCollapsed(true);
        $this->sheet->getColumnDimension('Z')->setCollapsed(true);
        $this->sheet->getColumnDimension('AA')->setCollapsed(true);
        $this->sheet->getColumnDimension('H')->setVisible(false);
        $this->sheet->getColumnDimension('I')->setVisible(false);
        $this->sheet->getColumnDimension('J')->setVisible(false);
        $this->sheet->getColumnDimension('K')->setVisible(false);
        $this->sheet->getColumnDimension('L')->setVisible(false);
        $this->sheet->getColumnDimension('M')->setVisible(false);
        $this->sheet->getColumnDimension('N')->setVisible(false);
        $this->sheet->getColumnDimension('O')->setVisible(false);
        $this->sheet->getColumnDimension('P')->setVisible(false);
        $this->sheet->getColumnDimension('Q')->setVisible(false);
        $this->sheet->getColumnDimension('R')->setVisible(false);
        $this->sheet->getColumnDimension('S')->setVisible(false);
        $this->sheet->getColumnDimension('X')->setVisible(false);
        $this->sheet->getColumnDimension('Y')->setVisible(false);
        $this->sheet->getColumnDimension('Z')->setVisible(false);
        $this->sheet->getColumnDimension('AA')->setVisible(false);

        // autosize
        foreach ($this->sheet->getColumnIterator() as $column) {
            if ($column->getColumnIndex() === 'T') {
                $this->sheet->getColumnDimension($column->getColumnIndex())->setWidth(38);
            } else {
                $this->sheet->getColumnDimension($column->getColumnIndex())->setWidth(20);
            }
        }
        $this->sheet->getStyle('A1:'.$highest_column.'1')->getAlignment()->setWrapText(true);
        // sheet name
        $this->sheet->setTitle(substr('Retefuente de modelos', 0, 29));
    }
    /**
     */
    public function startCell() {
        return 3;
    }

    /** it is use to know which letter is corresponding to a number relative to alphabet, including repetitions of sequence like AA or AB. (excel purposes)
     * ???
     * @param  [type]  $n [description]
     * @param  boolean $b auxiliar var, dont use it while calling it.
     * @return [type]     [description]
     */
    public static function getLetter($n, $b = false) {
        if($n > 25) {
            $first_letter = (!$b) ? self::$alphabet[floor($n/26) - 1] : '';
            return $first_letter.self::getLetter($n - 26, true);
        }
        else
            return self::$alphabet[$n];
    }

}
