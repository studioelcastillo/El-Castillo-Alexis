<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    use HasFactory;
    protected $table = 'profiles';
    protected $primaryKey = 'prof_id';

    const ADMIN = 1;
    const ESTUDIO = 2; // aka PROPIETARIO
    const GESTOR = 3;
    const MODELO = 4;
    const MODELO_SATELITE = 5;
    const CREADOR_CUENTAS = 6;
    const JEFE_MONITOR = 7;
    const MONITOR = 8;
    const JEFE_FOTOGRAFO = 9;
    const FOTOGRAFO = 10;
    const CONTABILIDAD = 11;
    const AUDIOVISUALES = 12;
    const ENTREVISTAS = 13;



    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'prof_name', 'deleted_at'
    ];

    /**
     * The attributes excluded from the model's JSON form.
     *
     * @var array
     */
    protected $hidden = [
    ];
}
