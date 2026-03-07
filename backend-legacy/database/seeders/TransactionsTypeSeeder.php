<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class TransactionsTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // transactions_types
        $records = DB::select("SELECT COUNT(*) as n_rows FROM transactions_types");
        if ($records[0]->n_rows == 0) {
            DB::table('transactions_types')->insert([
                // INGRESOS
                ['transtype_group' => 'INGRESOS', 'transtype_name' => 'BONIFICACION', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'INGRESOS', 'transtype_name' => 'DEVOLUCION', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'INGRESOS', 'transtype_name' => 'PAGO MONITORA', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'INGRESOS', 'transtype_name' => 'PAGO MONITORAS', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'INGRESOS', 'transtype_name' => 'PAGO RETENIDO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'INGRESOS', 'transtype_name' => 'REFERIDOS', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'INGRESOS', 'transtype_name' => 'SOPORTE A MODELO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                // EGRESOS
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'ADELANTO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'AHORRO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'ALMUERZO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'ASESORIA CONTABLE', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'BASURA ABANDONADA', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'BISUTERIA', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'BONIFICACION', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'CANDADO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'COMIDA', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'CON. SUSTANCIAS NO PERMITIDAS (1 VEZ)', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'CON. SUSTANCIAS NO PERMITIDAS (2 VEZ)', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'CONSUME ALIMENTOS EN EL CUARTO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'CUARTO SUCIO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'CUARTO SUCIO (1) CABELLO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'DAÑO DE LAMPARA DE MESA', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'DAÑO DE VASOS', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'DAÑO DECORATIVOS', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'DAR INF. DATOS PERSONALES (1 VEZ)', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'DAR INF. DATOS PERSONALES (2 VEZ)', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'DEJAR CUARTOS ABIERTOS (C/U) MONITO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'DEJO EL AIRE ON', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'DESCUENTO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'DORMIR EN EL TURNO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'ENTRAR A OTRO ROOM Y DEJAR ENTRAR', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'ENTREGAR ROOM DESPUES DE 15 MINUTOS', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'FUMAR CIGARRILLO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'JUGUETES', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'LAVADO DECORATIVOS', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'LLEGO TARDE', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'LLEVARSE LLAVES', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'LUBRICANTES', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'MAQUILLAJES', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'NO ENTREGAR EL CELULAR DURANTE EL TURNO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'NO LLEGO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'NO LLEGO FESTIVO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'NO LLEGO FESTIVO Y NO AVISO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'NO LLEGO SABADO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'NO LLEGO SABADO Y NO AVISO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'NO LLEGO Y NO AVISO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'NO PORTAR CAMISA O UNIFORME CORRECTO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'NO RECIBIR LLAVES', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'NO TRAJO SABANA', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'NO USAR TAPABOCAS', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'NOMINA', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'PASADIA MODELO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'PASAR POR EL BAÑO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'PENALIDAD', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'PILAS AA', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'PILAS AAA', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'PLATO SUCIO MODELO O MONITOR', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'PRESTAMO', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'PRESTAMOS', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'PRESTO FERNANDA', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'PRESTO HENRY', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'REFERIDOS', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'REVISTAS', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'ROPA INADECUADA', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'SABANA', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'SALIR DESCALZO O EN TOALLA', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'SANCION', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'TECLADO, MOUSE', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'TENDIDOS Y DEMAS', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'TIENDA', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'TOYS O JUGUETES', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
                ['transtype_group' => 'EGRESOS', 'transtype_name' => 'USO DEL CELULAR DURANTE LA TRASMISION', 'transtype_behavior' => null, 'transtype_rtefte' => true, 'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
            ]);
        }
    }
}
