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
use App\Models\User;

class UsersExport implements FromCollection, WithMapping, WithEvents, WithCustomStartCell
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
        $users = User::with(['profile'])
                ->where($data['where'])
                ->orWhere($data['orWhere'])
                ->whereNull('deleted_at')
                ->orderby('created_at', 'Desc')
                ->get();
        $this->length = $users->count();
        return $users;
    }

    public function map($user): array
    {
        return [
            $user->user_id,
            $user->user_name,
            $user->user_identification,
            $user->user_personal_email,
            $user->user_telephone,
            $user->profile?->prof_name ?? 'Sin perfil',
            ($user->user_active) ? 'VERDADERO' : 'FALSO'
        ];
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
                $event->sheet->setCellValue('A1', 'REGISTRO DE USUARIOS');
                $event->sheet->getDelegate()->mergeCells('A1:G1');
                $event->sheet->getStyle('A1:G1')->applyFromArray([
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
                $event->sheet->getStyle('A1:G1')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('87680F');
                $event->sheet->getDelegate()->getStyle('A1:G1')->getFont()->setSize(12);

                // titles
                $event->sheet->setCellValue('A2', 'ID');
                $event->sheet->setCellValue('B2', 'NOMBRE');
                $event->sheet->setCellValue('C2', 'IDENTIFICACIÓN');
                $event->sheet->setCellValue('D2', 'EMAIL PERSONAL');
                $event->sheet->setCellValue('E2', 'TELÉFONO');
                $event->sheet->setCellValue('F2', 'PERFIL');
                $event->sheet->setCellValue('G2', 'ACTIVO');
                $event->sheet->getStyle('A2:G2')->applyFromArray([
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
                $event->sheet->getStyle('A2:G2')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('E9BC36');
                $event->sheet->getDelegate()->getStyle('A2:G2')->getFont()->setSize(12);

                for ($i=1; $i <= $this->length; $i++) {
                    $event->sheet->getStyle('A'.($i+2).':G'.($i+2))->applyFromArray([
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
                $event->sheet->getDelegate()->getColumnDimension('B')->setWidth(30);
                $event->sheet->getDelegate()->getColumnDimension('C')->setWidth(40);
                $event->sheet->getDelegate()->getColumnDimension('D')->setWidth(40);
                $event->sheet->getDelegate()->getColumnDimension('E')->setWidth(20);
                $event->sheet->getDelegate()->getColumnDimension('F')->setWidth(30);
                $event->sheet->getDelegate()->getColumnDimension('G')->setWidth(15);
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
