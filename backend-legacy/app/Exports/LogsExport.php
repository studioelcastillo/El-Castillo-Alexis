<?php

namespace App\Exports;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Contracts\View\View;
use Illuminate\Database\Eloquent\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Events\AfterSheet;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use DateTime;
use DateTimeZone;

use App\Library\HelperController;
use App\Models\Log;

class LogsExport implements FromCollection, WithMapping, WithEvents, WithCustomStartCell
{
    private $helper;
    private $length;
    protected $request;
    protected $tz;

    public function __construct(Request $request, $tz)
    {
        $this->helper = new HelperController();
        $this->request = $request;
        $this->tz = $tz;
    }

    public function collection()
    {
        $data = $this->helper::generateConditions($this->request);
        $log = Log::with('user')
                ->where($data['where'])
                ->orWhere($data['orWhere'])
                ->whereRaw($data['whereRaw'])
                ->whereNull('deleted_at')
                ->orderby('created_at', 'Desc')
                ->get();
        $this->length = $log->count();
        return $log;
    }

    public function map($log): array
    {
        $beforemsm = '';
        if ($log->log_before !== null) {
            $before = json_decode($log->log_before, true);
            $keysBefore = array_keys($before);
            for ($u = 0; $u < count($keysBefore); $u++) {
                if (strtolower($keysBefore[$u]) === 'user_password') {
                    $beforemsm = $beforemsm.$this->traslateStatus($this->generateStringToTraslate(strtolower($keysBefore[$u]))).' = '.$before[$keysBefore[$u]].PHP_EOL;
                } else {
                    $beforemsm = $beforemsm.$this->traslateStatus($this->generateStringToTraslate(strtolower($keysBefore[$u]))).' = '.$before[$keysBefore[$u]].PHP_EOL;
                }
            }
        }
        $aftermsm = '';
        if ($log->log_after !== null) {
            $after = json_decode($log->log_after, true);
            $keysAfter = array_keys($after);
            for ($i = 0; $i < count($keysAfter); $i++) {
                if (strtolower($keysAfter[$i]) === 'user_password') {
                    $aftermsm = $aftermsm.$this->traslateStatus($this->generateStringToTraslate(strtolower($keysAfter[$i]))).' = '.$after[$keysAfter[$i]].PHP_EOL;
                } else {
                    $aftermsm = $aftermsm.$this->traslateStatus($this->generateStringToTraslate(strtolower($keysAfter[$i]))).' = '.$after[$keysAfter[$i]].PHP_EOL;
                }
            }
        }
        return [
            $log->log_id,
            $log->log_ip,
            $log->user->user_name,
            $log->log_table,
            $log->log_table_id,
            $beforemsm,
            $aftermsm,
            $this->convertUTC($log->created_at)
        ];
    }


    /**
     * @return array
     */
    public function generateStringToTraslate($string)
    {
        $datos = explode('_', $string);
        if (strpos($string, 'id') !== false || strpos($string, 'created_at') !== false || strpos($string, 'updated_at') !== false || strpos($string, 'deleted_at') !== false) {
            return $string;
        } else {
            $response = $datos[1];
            for ($i = 2; $i < count($datos); $i++) {
                $response = $response.$this->capitalize($datos[$i]);
            }
            return $response;
        }
    }

    public function capitalize($word)
    {
        return strtoupper($word[0]).substr($word, 1);
    }

    /**
     * @return array
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                //main title
                $event->sheet->setCellValue('A1', 'REGISTRO DE TRANSACCIONES');
                $event->sheet->getDelegate()->mergeCells('A1:H1');
                $event->sheet->getStyle('A1:H1')->applyFromArray([
                    'alignment' => [
                        'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                        'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
                    ],
                    'font' => [
                        'bold' => true,
                        'color' => ['argb' => 'FFFFFF']
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => 'thin',
                            'color' => ['rgb' => '808080']
                        ],
                    ]
                ]);
                $event->sheet->getStyle('A1:H1')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('87680F');
                $event->sheet->getDelegate()->getStyle('A1:H1')->getFont()->setSize(12);

                // titles
                $event->sheet->setCellValue('A2', 'ID');
                $event->sheet->setCellValue('B2', 'IP');
                $event->sheet->setCellValue('C2', 'USUARIO');
                $event->sheet->setCellValue('D2', 'MODULO');
                $event->sheet->setCellValue('E2', 'ID DE REGISTRO');
                $event->sheet->setCellValue('F2', 'ANTES');
                $event->sheet->setCellValue('G2', 'DESPUES');
                $event->sheet->setCellValue('H2', 'FECHA-HORA');
                $event->sheet->getStyle('A2:H2')->applyFromArray([
                    'alignment' => [
                        'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                        'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
                        'wrap' => true,
                    ],
                    'font' => [
                        'bold' => true,
                        'color' => ['argb' => '000']
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => 'thin',
                            'color' => ['rgb' => '808080']
                        ],
                    ]
                ]);
                $event->sheet->getStyle('A2:H2')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('E9BC36');
                $event->sheet->getDelegate()->getStyle('A2:H2')->getFont()->setSize(12);

                for ($i=1; $i <= $this->length; $i++) {
                    $event->sheet->getStyle('A'.($i+2).':H'.($i+2))->applyFromArray([
                        'alignment' => [
                            'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                            'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
                        ],
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => 'thin',
                                'color' => ['rgb' => '808080']
                            ],
                        ]
                    ]);
                }

                $event->sheet->getDelegate()->getColumnDimension('A')->setWidth(20);
                $event->sheet->getDelegate()->getColumnDimension('B')->setWidth(20);
                $event->sheet->getDelegate()->getColumnDimension('C')->setWidth(30);
                $event->sheet->getDelegate()->getColumnDimension('D')->setWidth(20);
                $event->sheet->getDelegate()->getColumnDimension('E')->setWidth(20);
                $event->sheet->getDelegate()->getColumnDimension('F')->setWidth(40);
                $event->sheet->getDelegate()->getColumnDimension('G')->setWidth(40);
                $event->sheet->getDelegate()->getColumnDimension('H')->setWidth(20);
            }
        ];
    }

    /**
     * @return array
     */
    public function startCell(): string
    {
        return 'A3';
    }

    /**
     * Traslate Status
     *
     * @param string $status
     * @param boolean $partial
     * @return string $status
     */
    public function traslateStatus($status)
    {
        $statusArray = array(
            'cate_id' => 'ID DE CATEGORIA',
            'user_id' => 'ID DEL USUARIO',
            'oc_id' => 'ID DEL CENTRO DE OPERACIÓN',
            'prof_id' => 'ID DEL PERFIL',
            'prod_id' => 'ID DEL PRODUCTO',
            'uplo_id' => 'ID DEL CARGUE',
            'uplo_table_id' => 'ID DE LA TABLA',
            'cons_id' => 'ID DEL CONSECUTIVO',
            'requ_id' => 'ID DE LA REQUISICIÓN',
            'ri_id' => 'ID DEL ITEM DE LA REQUISICIÓN',
            'comm_id' => 'ID DEL COMENTARIO',
            'comm_table_id' => 'ID DE LA TABLA',
            'surv_id' => 'ID DE LA ENCUESTA',
            'ques_id' => 'ID DE LA PREGUNTA',
            'updated_at' => 'FECHA DE ACTUALIZACIÓN',
            'created_at' => 'FECHA DE CREACIÓN',
            'deleted_at' => 'FECHA DE ELIMINACIÓN',
            'table' => 'TABLA',
            'before' => 'ANTES',
            'after' => 'DESPUES',
            'upload' => 'CARGUE',
            'pr_id' => 'ID DE SOLICITUD DE PRODUCTO',
            'name' => 'NOMBRE',
            'status' => 'ESTADO',
            'question' => 'PREGUNTA',
            'answer' => 'RESPUESTA',
            'quantity' => 'CANTIDAD',
            'quantityReceived' => 'CANTIDAD RECIBIDA',
            'commentary' => 'COMENTARIO',
            'json' => 'JSON',
            'code' => 'CÓDIGO',
            'typeSupport' => 'TIPO DE SOPORTE',
            'consecutiveSupport' => 'CONSECUTIVO DE SOPORTE',
            'consecutiveCompletion' => 'CONSECUTIVO DE FINALIZACIÓN',
            'consecutive' => 'CONSECUTIVO',
            'description' => 'DESCRIPCIÓN',
            'price' => 'PRECIO',
            'um' => 'UNIDAD DE MEDIDA',
            'daysOfManagement' => 'DÍAS DE GESTIÓN',
            'email' => 'CORREO',
            'password' => 'CONTRASEÑA',
            'address' => 'DIRECCIÓN',
            'phoneNumber' => 'NUMERO DE TELEFONO',
            'images' => 'IMAGENES',
            'products' => 'PRODUCTOS',
        );

        if (isset($statusArray[$status])) {
            return $statusArray[$status];
        } else {
            return $status;
        }
    }

    /**
     * convertUTC
     *
     * @param string $date
     * @return string $status
     */
    public function convertUTC($date)
    {
        // create a $dt object with the UTC timezone
        // $dt = new DateTime('2016-12-12 12:12:12', new DateTimeZone('UTC'));
        $dt = new DateTime($date);

        // change the timezone of the object without changing it's time
        $dt->setTimezone(new DateTimeZone($this->tz));

        // format the datetime
        $dt->format('Y-m-d H:i:s');

        return $dt;
    }
}
