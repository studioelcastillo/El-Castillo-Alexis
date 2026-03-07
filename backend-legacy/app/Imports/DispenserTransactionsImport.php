<?php

namespace App\Imports;

use App\Models\User;
use App\Models\Product;
use App\Models\StudioModel;
use App\Models\Transaction;
use App\Models\Period;
use App\Models\PayrollPeriod;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithStartRow;

class DispenserTransactionsImport implements ToCollection, WithHeadingRow, WithStartRow
{
    protected $results = [
        'success' => [],
        'errors' => []
    ];

    // Cache para evitar múltiples consultas
    protected $usersCache = [];
    protected $productsCache = [];
    protected $studioModelsCache = [];

    // Modo preview: solo valida sin guardar
    protected $previewMode = false;

    // Tipo de cargue: 'models' o 'payroll'
    protected $importType = 'models';

    // Período seleccionado
    protected $selectedPeriod = null;

    // Perfiles de modelos
    const MODEL_PROFILES = [4, 5]; // MODELO, MODELO SATELITE

    /**
     * Constructor
     * @param bool $previewMode Si es true, solo valida sin guardar transacciones
     * @param string $importType Tipo de cargue: 'models' o 'payroll'
     * @param int|null $periodId ID del período seleccionado
     */
    public function __construct(bool $previewMode = false, string $importType = 'models', ?int $periodId = null)
    {
        $this->previewMode = $previewMode;
        $this->importType = $importType;

        // Cargar el período seleccionado
        if ($periodId) {
            if ($importType === 'models') {
                $this->selectedPeriod = Period::find($periodId);
            } else {
                $this->selectedPeriod = PayrollPeriod::find($periodId);
            }
        }
    }

    /**
     * Indica que la fila de cabeceras está en la fila 1
     */
    public function headingRow(): int
    {
        return 1;
    }

    /**
     * Los datos comienzan en la fila 2
     */
    public function startRow(): int
    {
        return 2;
    }

    /**
     * Process the collection of rows from Excel
     *
     * @param Collection $rows
     * @return void
     */
    public function collection(Collection $rows)
    {
        DB::beginTransaction();

        try {
            foreach ($rows as $index => $row) {
                $this->processRow($row, $index);
            }

            // En modo preview, hacemos rollback para no guardar nada
            if ($this->previewMode) {
                DB::rollBack();
            } else {
                DB::commit();
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error en importación de dispensadora: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Process a single row
     *
     * @param Collection $row
     * @param int $index
     * @return void
     */
    protected function processRow(Collection $row, int $index)
    {
        // Número de fila real en Excel (+2 porque empezamos en fila 2)
        $rowNumber = $index + 2;

        // Obtener datos del Excel (nombres de columna normalizados por Maatwebsite)
        $fecha = $row['fecha'] ?? null;
        $hora = $row['hora'] ?? null;
        $identificacion = trim($row['identificacion'] ?? '');
        $nombre = trim($row['nombre'] ?? '');
        $valorVentaCashless = $row['valor_venta_cashless'] ?? 0;
        $valorConsumidoCashless = $row['valor_consumido_cashless'] ?? 0;
        $codigoRaw = $row['codigo'] ?? '';
        // Excel puede leer el código como número, perdiendo ceros iniciales
        // Convertimos a string y rellenamos con ceros a la izquierda (6 dígitos)
        $codigo = str_pad(trim((string)$codigoRaw), 6, '0', STR_PAD_LEFT);
        $tipoCodigo = trim($row['tipo_de_codigo'] ?? '');
        $departamento = trim($row['departamento'] ?? '');
        $centroCostos = $row['centro_costos'] ?? null;
        $cargo = trim($row['cargo'] ?? '');
        $cuenta = trim($row['cuenta'] ?? '');
        $nombreDispensadora = trim($row['nombre_dispensadora'] ?? '');
        $serial = trim($row['serial'] ?? '');
        $producto = trim($row['producto'] ?? '');
        $codigoProductoRaw = $row['codigo_producto'] ?? '';
        // Excel puede leer el código como número, perdiendo ceros iniciales
        // Convertimos a string y rellenamos con ceros a la izquierda (3 dígitos)
        $codigoProducto = str_pad(trim((string)$codigoProductoRaw), 3, '0', STR_PAD_LEFT);
        $seleccion = $row['seleccion'] ?? null;
        $costoProducto = $row['costo_producto'] ?? 0;
        $precioSinIva = $this->parsePrecioMoneda($row['precio_sin_iva'] ?? '0');

        // Skip filas vacías
        if (empty($identificacion) || empty($producto)) {
            return;
        }

        // 1. Convertir fecha Excel a formato Y-m-d y filtrar por período PRIMERO
        $transDate = $this->parseExcelDate($fecha);
        if (!$transDate) {
            return; // Omitir filas con fecha inválida silenciosamente
        }

        // 2. Validar período seleccionado y filtrar por fecha
        if (!$this->selectedPeriod) {
            return; // Omitir si no hay período seleccionado
        }

        $periodStartDate = $this->importType === 'models'
            ? $this->selectedPeriod->period_start_date
            : $this->selectedPeriod->payroll_period_start_date;

        $periodEndDate = $this->importType === 'models'
            ? $this->selectedPeriod->period_end_date
            : $this->selectedPeriod->payroll_period_end_date;

        // Si la fecha no está dentro del período, omitir silenciosamente
        if ($transDate < $periodStartDate || $transDate > $periodEndDate) {
            return; // Omitir - fecha fuera del período seleccionado
        }

        // 3. Buscar usuario por identificación
        $user = $this->findUser($identificacion);
        if (!$user) {
            $this->results['errors'][] = [
                'fila' => $rowNumber,
                'identificacion' => $identificacion,
                'nombre' => $nombre,
                'producto' => $producto,
                'error' => 'Usuario no encontrado en el sistema'
            ];
            return;
        }

        // 4. Filtrar según el tipo de cargue (omitir silenciosamente los que no corresponden)
        $isModel = in_array($user->prof_id, self::MODEL_PROFILES);

        // Si es cargue de modelos, solo procesar modelos (omitir administrativos)
        if ($this->importType === 'models' && !$isModel) {
            return; // Omitir silenciosamente - no es modelo
        }

        // Si es cargue de nómina, solo procesar administrativos (omitir modelos)
        if ($this->importType === 'payroll' && $isModel) {
            return; // Omitir silenciosamente - es modelo
        }

        // 5. Buscar stdmod_id activo (contrato modelo-estudio o empleado-estudio)
        $studioModel = $this->findActiveStudioModel($user->user_id);
        if (!$studioModel) {
            $this->results['errors'][] = [
                'fila' => $rowNumber,
                'identificacion' => $identificacion,
                'nombre' => $nombre,
                'producto' => $producto,
                'error' => 'Usuario sin contrato activo'
            ];
            return;
        }

        // 6. Buscar producto por CÓDIGO PRODUCTO (no por nombre)
        $productRecord = $this->findProductByCode($codigoProducto);
        if (!$productRecord) {
            $this->results['errors'][] = [
                'fila' => $rowNumber,
                'identificacion' => $identificacion,
                'nombre' => $nombre,
                'producto' => $producto,
                'codigo_producto' => $codigoProducto,
                'costo_producto' => $costoProducto,
                'precio_sin_iva' => $precioSinIva,
                'monto' => $valorConsumidoCashless,
                'error' => 'Producto no existe con código: ' . $codigoProducto
            ];
            return;
        }

        // 7. Validar estado del período (esto sí es un error real)
        $periodState = $this->importType === 'models'
            ? $this->selectedPeriod->period_state
            : $this->selectedPeriod->payroll_period_state;

        if ($periodState !== 'ABIERTO') {
            $this->results['errors'][] = [
                'fila' => $rowNumber,
                'identificacion' => $identificacion,
                'nombre' => $nombre,
                'fecha' => $transDate,
                'error' => "El período seleccionado está {$periodState}"
            ];
            return;
        }

        // 8. Verificar si ya existe una transacción igual (evitar duplicados)
        $transDescription = $nombreDispensadora . ' - ' . $producto . ' [' . $hora . ']';
        $existingTransaction = Transaction::where('transtype_id', 79)
            ->where('user_id', $user->user_id)
            ->where('prod_id', $productRecord->prod_id)
            ->where('trans_date', $transDate)
            ->where('trans_amount', $valorConsumidoCashless)
            ->where('trans_description', $transDescription)
            ->first();

        if ($existingTransaction) {
            $this->results['errors'][] = [
                'fila' => $rowNumber,
                'identificacion' => $identificacion,
                'nombre' => $nombre,
                'producto' => $producto,
                'monto' => $valorConsumidoCashless,
                'error' => 'Transacción duplicada (ya existe en el sistema)'
            ];
            return;
        }

        // 9. Crear transacción
        try {
            $transactionData = [
                'transtype_id' => 79, // SNACKS
                'user_id' => $user->user_id,
                'stdmod_id' => $studioModel->stdmod_id,
                'prod_id' => $productRecord->prod_id,
                'trans_date' => $transDate,
                'trans_description' => $transDescription,
                'trans_amount' => $valorConsumidoCashless,
                'trans_quantity' => 1,
                'trans_rtefte' => false,
                'trans_pendingbalance' => false,
            ];

            // Asignar el período según el tipo de cargue
            if ($this->importType === 'models') {
                $transactionData['period_id'] = $this->selectedPeriod->period_id;
            } else {
                $transactionData['payroll_period_id'] = $this->selectedPeriod->payroll_period_id;
            }

            Transaction::create($transactionData);

            $this->results['success'][] = [
                'fila' => $rowNumber,
                'identificacion' => $identificacion,
                'nombre' => $nombre,
                'producto' => $producto,
                'monto' => $valorConsumidoCashless,
                'fecha' => $transDate
            ];

        } catch (\Exception $e) {
            Log::error("Error creando transacción fila {$rowNumber}: " . $e->getMessage());
            $this->results['errors'][] = [
                'fila' => $rowNumber,
                'identificacion' => $identificacion,
                'nombre' => $nombre,
                'producto' => $producto,
                'error' => 'Error al crear transacción: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Find user by identification with cache
     */
    protected function findUser(string $identificacion): ?User
    {
        if (!isset($this->usersCache[$identificacion])) {
            $this->usersCache[$identificacion] = User::with('profile')
                ->where('user_identification', $identificacion)
                ->first();
        }
        return $this->usersCache[$identificacion];
    }

    /**
     * Find active studio model with cache
     */
    protected function findActiveStudioModel(int $userId): ?StudioModel
    {
        if (!isset($this->studioModelsCache[$userId])) {
            $this->studioModelsCache[$userId] = StudioModel::where('user_id_model', $userId)
                ->where('stdmod_active', true)
                ->whereNull('deleted_at')
                ->first();
        }
        return $this->studioModelsCache[$userId];
    }

    /**
     * Find product by CODE with cache
     */
    protected function findProductByCode(string $productCode): ?Product
    {
        if (empty($productCode)) {
            return null;
        }
        if (!isset($this->productsCache[$productCode])) {
            $this->productsCache[$productCode] = Product::where('prod_code', $productCode)->first();
        }
        return $this->productsCache[$productCode];
    }

    /**
     * Parse precio con formato moneda "$ 6.400,00" a número 6400.00
     */
    protected function parsePrecioMoneda($value): float
    {
        if (is_numeric($value)) {
            return (float) $value;
        }

        // Remover símbolo $, espacios y puntos de miles
        $cleaned = str_replace(['$', ' ', '.'], '', $value);
        // Reemplazar coma decimal por punto
        $cleaned = str_replace(',', '.', $cleaned);

        return (float) $cleaned;
    }

    /**
     * Parse Excel date (puede venir como serial o como string)
     */
    protected function parseExcelDate($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        // Si es un número (serial de Excel)
        if (is_numeric($value)) {
            // Excel serial date to Unix timestamp
            // Excel cuenta desde 1900-01-01 (con bug de 1900 leap year)
            $unixTimestamp = ($value - 25569) * 86400;
            return date('Y-m-d', $unixTimestamp);
        }

        // Si es string, intentar parsear
        try {
            $date = \DateTime::createFromFormat('Y-m-d', $value);
            if ($date) {
                return $date->format('Y-m-d');
            }

            // Intentar otros formatos comunes
            $formats = ['d/m/Y', 'd-m-Y', 'Y/m/d', 'm/d/Y'];
            foreach ($formats as $format) {
                $date = \DateTime::createFromFormat($format, $value);
                if ($date) {
                    return $date->format('Y-m-d');
                }
            }
        } catch (\Exception $e) {
            Log::warning("Error parsing date: {$value}");
        }

        return null;
    }

    /**
     * Get the results of the import
     *
     * @return array
     */
    public function getResults(): array
    {
        return $this->results;
    }

    /**
     * Get count of successful imports
     */
    public function getSuccessCount(): int
    {
        return count($this->results['success']);
    }

    /**
     * Get count of errors
     */
    public function getErrorCount(): int
    {
        return count($this->results['errors']);
    }
}
