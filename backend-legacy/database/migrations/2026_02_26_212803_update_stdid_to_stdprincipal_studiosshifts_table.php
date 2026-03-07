<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Normaliza un nombre de turno para comparación:
     * - Minúsculas
     * - Reemplaza "ñ" / "ni" variantes
     * - Elimina acentos y espacios extra
     */
    private function normalize(string $name): string
    {
        $name = mb_strtolower(trim($name));
        // Normalizar variantes de ñ: "maniana" → "mañana"
        $name = str_replace('niana', 'ñana', $name);
        // Eliminar acentos
        $name = str_replace(
            ['á', 'é', 'í', 'ó', 'ú'],
            ['a', 'e', 'i', 'o', 'u'],
            $name
        );
        return $name;
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Obtener todos los turnos del estudio principal (std_id = 1)
        $principalShifts = DB::table('studios_shifts')
            ->where('std_id', 1)
            ->whereNull('deleted_at')
            ->get();

        // 2. Crear un mapa: nombre normalizado => stdshift_id del principal
        $principalMap = [];
        foreach ($principalShifts as $shift) {
            $normalized = $this->normalize($shift->stdshift_name);
            $principalMap[$normalized] = $shift->stdshift_id;
        }

        // 3. Obtener todos los turnos que NO son del estudio principal
        $otherShifts = DB::table('studios_shifts')
            ->where('std_id', '!=', 1)
            ->whereNull('deleted_at')
            ->get();

        // 4. Crear mapa: stdshift_id viejo => stdshift_id del principal
        $replacementMap = [];
        foreach ($otherShifts as $shift) {
            $normalized = $this->normalize($shift->stdshift_name);
            if (isset($principalMap[$normalized])) {
                $replacementMap[$shift->stdshift_id] = $principalMap[$normalized];
            }
        }

        // 5. Actualizar studios_models: reemplazar cada stdshift_id por el del principal
        foreach ($replacementMap as $oldId => $newId) {
            DB::table('studios_models')
                ->where('stdshift_id', $oldId)
                ->update(['stdshift_id' => $newId]);
        }

        // 6. Excepciones: stdshift_id 6 y 16 se reemplazan por stdshift_id = 1
        DB::table('studios_models')
            ->whereIn('stdshift_id', [6, 16])
            ->update(['stdshift_id' => 1]);

        // 7. Eliminar todos los turnos que no sean del estudio principal
        DB::table('studios_shifts')
            ->where('std_id', '!=', 1)
            ->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No es posible revertir automáticamente ya que se pierde
        // la referencia original de stdshift_id.
    }
};
