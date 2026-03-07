<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>Certificado de Contrato de Prestación de Servicios Independientes</title>
  <style>
    * {
      font-family: "Arial", "sans-serif" !important;
    }

    body {
      font-size: 10px;
      line-height: 1.4;
      margin: 40px;
    }

    h1, h2, h3, h4 {
      text-align: center;
      margin: 10px 0;
    }

    h1 {
      font-size: 12px;
      font-weight: bold;
    }

    h3 {
      font-size: 11px;
      font-weight: bold;
      margin-top: 15px;
      margin-bottom: 10px;
      text-align: left;
    }

    h4 {
      font-size: 10px;
      font-weight: bold;
      margin-top: 12px;
      margin-bottom: 8px;
      text-align: left;
    }

    p {
      font-size: 10px;
      text-align: justify;
      margin: 8px 0;
    }

    ul {
      margin: 5px 0;
      padding-left: 20px;
    }

    li {
      font-size: 10px;
      margin: 5px 0;
    }

    table {
      width: 100%;
      margin-top: 20px;
    }

    .page-break {
      page-break-before: always;
    }

    .indent {
      margin-left: 20px;
    }

    .signature-block {
      margin-top: 40px;
      text-align: left;
    }
  </style>
</head>
<body>
  <h1>CERTIFICADO DE CONTRATO DE PRESTACIÓN DE SERVICIOS INDEPENDIENTES</h1>

  <br>

  <p>La suscrita, <b>{{ strtoupper($studio->std_manager_name ?? '[Nombre Completo del Representante]') }}</b>, identificada con Cédula de Ciudadanía No. <b>{{ strtoupper($studio->std_manager_id ?? '[Número de Cédula]') }}</b> de Cali, actuando en calidad de Representante Legal de <b>{{$studio->std_company_name ?? '[NOMBRE_ESTUDIO]'}}</b>, sociedad comercial debidamente constituida e identificada con NIT <b>{{$studio->nitWithVerificationDigit()}}</b>, por medio del presente certifica que:</p>

  <p>El(la) señor(a) <b>{{ $model->fullName() }}</b>, identificado(a) con Cédula de Ciudadanía No. <b>{{$model->user_identification ?? '[NÚMERO DE CÉDULA DEL/LA CONTRATISTA]'}}</b> expedida en <b>{{ strtoupper($model->user_issued_in ?? '[LUGAR DE EXPEDICIÓN DE LA CÉDULA]') }}</b>, con domicilio en la ciudad de <b>{{ strtoupper($model->city->city_name ?? '[CIUDAD DE DOMICILIO DEL/LA CONTRATISTA]') }}</b>, mantiene un Contrato de Prestación de Servicios Independientes con nuestra empresa, <b>{{$studio->std_company_name ?? '[EL CASTILLO GROUP SAS]'}}</b>, bajo las siguientes condiciones:</p>

  <ol>
    <li><b>Naturaleza Contractual:</b> La relación entre <b>{{$studio->std_company_name ?? '[NOMBRE ESTUDIO]'}}</b> y el(la) señor(a) <b>{{ $model->fullName() }}</b> es de naturaleza <b>civil y/o comercial</b>, regulada por un Contrato de Prestación de Servicios Independientes. Se declara de forma expresa que <b>NO</b> existe ni ha existido relación laboral alguna, ni vínculo de subordinación, dependencia o cualquier otro elemento propio de un contrato de trabajo, en cumplimiento de la legislación colombiana aplicable al Código Civil, Código de Comercio y demás normas pertinentes.</li>

    <li><b>Objeto del Contrato y Servicios Prestados:</b> Bajo este contrato, el(la) señor(a) <b>{{ $model->fullName() }}</b> se ha comprometido a prestar, de forma autónoma y con sus propios medios, servicios de (Cargo) {{$studioModel->stdmod_position ?? '[Cargo]'}} para nuestra organización.</li>

    <li><b>Vigencia del Contrato:</b> El Contrato de Prestación de Servicios se encuentra vigente desde el {{$studioModel->stdmod_start_at ? date('d', strtotime($studioModel->stdmod_start_at)) . ' de ' . strtoupper(monthLetters(date('n', strtotime($studioModel->stdmod_start_at)))) . ' de ' . date('Y', strtotime($studioModel->stdmod_start_at)) : '[Día] de [Mes] de [Año]'}} hasta la fecha actual y sigue en vigencia.</li>

    <li><b>Honorarios Percibidos:</b> El(la) señor(a) <b>{{ $model->fullName() }}</b> recibe periódicamente honorarios por los servicios prestados en virtud del contrato, de acuerdo con los valores y condiciones pactados contractualmente.</li>
  </ol>

  <ul style="list-style-type: none; padding-left: 50px;">
    <li>&bullet; El promedio mensual de honorarios recibidos por sus servicios ha sido de aproximadamente $ {{ number_format($studioModel->stdmod_monthly_salary ?? 0, 0, ',', '.') }} ({{ numberToLetters($studioModel->stdmod_monthly_salary ?? 0) }} PESOS COLOMBIANOS).</li>
  </ul>

  <ol start="4">
    <li><b>Cumplimiento:</b> Durante la vigencia del contrato, el(la) señor(a) <b>{{ $model->fullName() }}</b> ha cumplido satisfactoriamente con las obligaciones inherentes a la ejecución de sus servicios, demostrando profesionalismo y compromiso con los resultados esperados.</li>
  </ol>

  <p>Se expide la presente certificación a solicitud del(la) interesado(a), en <b>{{ strtoupper($studio->city->city_name ?? '[CIUDAD]') }}</b>, a los <b>{{ date('d') }}</b> días del mes de <b>{{ strtoupper(monthLetters(date('m'))) }}</b> de <b>{{ date('Y') }}</b>.</p>

  <p>Atentamente,</p>

  <br><br><br>

  <div class="signature-block">
    @if(isset($signatures['owner']) && $signatures['owner']->docsig_signed_at && $signatures['owner']->userSignature)
      <div style="margin: 10px 0;">
        <img src="{{ public_path('uploads/signatures/' . $signatures['owner']->userSignature->usrsig_image_path) }}" style="height: 60px; max-width: 200px;">
      </div>
      <p style="font-size: 9px; margin: 5px 0;"><i>Firmado digitalmente el: {{ $signatures['owner']->docsig_signed_at->format('d/m/Y H:i') }}</i></p>
    @else
      <p style="margin: 30px 0;">_______________________________</p>
    @endif
    <p><b>{{ strtoupper($studio->std_manager_name ?? '[Representante Legal]') }}</b></p>
    <p>C.C. <b>{{ strtoupper($studio->std_manager_id ?? '[Cédula]') }}</b> de Cali</p>
    <p>Representante Legal</p>
    <p><b>{{ strtoupper($studio->std_company_name) }}</b></p>
    <p><b>NIT {{$studio->nitWithVerificationDigit()}}</b></p>
    <p>Correo: {{ strtoupper($studio->userOwner->user_personal_email ?? '[Correo Electrónico de la Empresa para Verificación]') }}</p>
    <p>Teléfono: {{ strtoupper($studio->userOwner->user_telephone ?? '[Número de Teléfono de la Empresa para Verificación]') }}</p>
  </div>

</body>
</html>
<?php

/**
 * Basado en un numero que indique la cantidad de horas, retorna las horas en formato time (00:00:00)
 * @param  float  $entero segundos
 * @return string         tiempo en formato de texto
 * @example ej 1 hora y media: numberToTime(1.5 * 60 * 60) >> 01:30:00
 * @author bgiron
 */
function numberToTime($flotante)
{
    // Obtener las horas enteras
    $horas = floor($flotante);

    // Obtener los minutos y segundos
    $minutos = floor(($flotante - $horas) * 60);
    $segundos = round((($flotante - $horas) * 3600) - ($minutos * 60));

    // Formatear y devolver la cadena de tiempo
    $cadenaTiempo = sprintf("%02d:%02d:%02d", $horas, $minutos, $segundos);
    return $cadenaTiempo;
}

/**
 * Basado en una cadena tipo Time lo convierta en numero flotante, retorna las horas en formato flotante
 * @param  string $entero tiempo en formato de texto
 * @return float          horas
 * @example ej 1 hora y media: timeToNumber('01:00:00') >> 1.5
 * @author bgiron
 */
function timeToNumber($tiempo)
{
    $parts = explode(':', $tiempo);
    // validate parts
    if (!isset($parts[1])) {
        $parts[1] = 0;
    }
    if (!isset($parts[2])) {
        $parts[2] = 0;
    }
    // res
    $res = (float) (($parts[0] * 60 * 60) + ($parts[1] * 60) + $parts[2]); // return in seconds
    return $res / 60 / 60; // return in hours
}

function monthLetters($m)
{
  $monthList = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  return $monthList[$m - 1];
}

function dayOfWeekLetters($dw)
{
  $monthList = [
    'Mon' => 'lunes',
    'Tue' => 'martes',
    'Wed' => 'miercoles',
    'Thu' => 'jueves',
    'Fri' => 'viernes',
    'Sat' => 'sabado',
    'Sun' => 'domingo',
  ];
  return $monthList[$dw];
}

/**
 * Convierte un número a su representación en letras en español
 * @param  float|int  $number número a convertir
 * @return string texto en mayúsculas
 * @example numberToLetters(1500000) >> "UN MILLÓN QUINIENTOS MIL"
 * @author geckode
 */
function numberToLetters($number)
{
    if (!is_numeric($number)) {
        return '';
    }

    $number = floatval($number);

    if ($number == 0) {
        return 'CERO';
    }

    $unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    $decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    $especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    $centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    $convertirGrupo = function($n) use ($unidades, $decenas, $especiales, $centenas) {
        $result = '';

        // Centenas
        $c = floor($n / 100);
        if ($c > 0) {
            if ($c == 1 && $n == 100) {
                $result = 'CIEN';
            } else {
                $result = $centenas[$c];
            }
        }

        $n = $n % 100;

        // Decenas y unidades
        if ($n >= 10 && $n <= 19) {
            if ($result != '') $result .= ' ';
            $result .= $especiales[$n - 10];
        } else {
            $d = floor($n / 10);
            $u = $n % 10;

            if ($d > 0) {
                if ($result != '') $result .= ' ';
                $result .= $decenas[$d];

                if ($u > 0) {
                    if ($d == 2) {
                        $result = 'VEINTI' . $unidades[$u];
                    } else {
                        $result .= ' Y ' . $unidades[$u];
                    }
                }
            } else if ($u > 0) {
                if ($result != '') $result .= ' ';
                $result .= $unidades[$u];
            }
        }

        return $result;
    };

    $intNumber = floor($number);
    $result = '';

    // Millones
    if ($intNumber >= 1000000) {
        $millones = floor($intNumber / 1000000);
        if ($millones == 1) {
            $result = 'UN MILLÓN';
        } else {
            $result = $convertirGrupo($millones) . ' MILLONES';
        }
        $intNumber = $intNumber % 1000000;
    }

    // Miles
    if ($intNumber >= 1000) {
        $miles = floor($intNumber / 1000);
        if ($result != '') $result .= ' ';

        if ($miles == 1) {
            $result .= 'MIL';
        } else {
            $result .= $convertirGrupo($miles) . ' MIL';
        }
        $intNumber = $intNumber % 1000;
    }

    // Centenas, decenas y unidades
    if ($intNumber > 0) {
        if ($result != '') $result .= ' ';
        $result .= $convertirGrupo($intNumber);
    }

    return $result;
}


