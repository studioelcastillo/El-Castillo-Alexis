<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>Solicitud de Apertura de Cuenta de Ahorro o Nómina</title>
  <style>
    * {
      font-family: "Arial", "sans-serif" !important;
    }

    body {
      font-size: 10px;
      line-height: 1.4;
      margin: 40px;
    }

    h1 {
      text-align: center;
      font-size: 12px;
      font-weight: bold;
      margin: 10px 0;
    }

    p {
      font-size: 10px;
      text-align: justify;
      margin: 8px 0;
    }

    .signature-block {
      margin-top: 40px;
      text-align: left;
    }
  </style>
</head>
<body>
  <p><b>{{ strtoupper($studio->std_company_name) }}</b> NIT: <b>{{ strtoupper($studio->nitWithVerificationDigit()) }}</b> Dirección: <b>{{ strtoupper($studio->std_address ?? 'Carrera 44 # 2A-50, Barrio El Lido, Cali, Valle del Cauca, Colombia') }}, Teléfono: {{ strtoupper($studio->userOwner->user_telephone ?? '[Número de Teléfono de la Empresa]') }} Correo Electrónico: {{ strtoupper($studio->userOwner->user_personal_email ?? '[Correo Electrónico de la Empresa]') }}</b></p>

  <br>

  <p><b>{{ strtoupper($studio->city->city_name ?? 'Cali, Valle del Cauca') }}, {{ date('d') }} de {{ strtoupper(monthLetters(date('m'))) }} de {{ date('Y') }}</b></p>

  <br>

  <p>Señores: <b>{{ strtoupper($model->user_bank_entity ?? '[BANCO]') }}</b></p>

  <br>

  <p><b>ASUNTO: SOLICITUD DE APERTURA DE CUENTA DE AHORRO O NÓMINA</b></p>

  <p>Estimados Señores,</p>

  <p>Por medio de la presente, <b>{{ strtoupper($studio->std_company_name) }}</b>, sociedad legalmente constituida e identificada con NIT <b>{{ strtoupper($studio->nitWithVerificationDigit()) }}</b>, con domicilio principal en la <b>{{ strtoupper($studio->std_address ?? 'Carrera 44 # 2A-50, Barrio El Lido, ciudad de Cali, Valle del Cauca') }}</b>, y representada legalmente por la señora <b>{{ strtoupper($studio->std_manager_name ?? '[Representante Legal]') }}</b>, identificada con Cédula de Ciudadanía No. <b>{{ strtoupper($studio->std_manager_id ?? '[Número de Cédula]') }}</b>, nos dirigimos a ustedes con el fin de solicitar formalmente la apertura de una cuenta bancaria a nombre de <b>AHORRO O NÓMINA</b> para uno de nuestros colaboradores.</p>

  <p>El(la) señor(a) <b>{{ $model->fullName() }}</b>, identificado(a) con Cédula de Ciudadanía No. <b>{{$model->user_identification}}</b> expedida en <b>{{$model->user_issued_in ?? '[Lugar de Expedición de la Cédula]'}}</b>, se encuentra vinculado(a) actualmente con nuestra compañía mediante un <b>{{ getContractTypeName($studioModel->stdmod_contract_type) }}</b> desde el <b>{{$studioModel->stdmod_start_at ? date('d', strtotime($studioModel->stdmod_start_at)) : '[Día]'}}</b> de <b>{{$studioModel->stdmod_start_at ? monthLetters(date('n', strtotime($studioModel->stdmod_start_at))) : '[Mes]'}}</b> de <b>{{$studioModel->stdmod_start_at ? date('Y', strtotime($studioModel->stdmod_start_at)) : '[Año]'}}</b>, desempeñando las funciones correspondientes a desempeño y cumplimiento de los objetivos de la empresa. Sus responsabilidades incluyeron, entre otras, el <b>apoyo en la ejecución de procesos operativos y/o administrativos del área.</b></p>

  <p>La finalidad de esta cuenta es realizar los pagos correspondientes a su ingresos y demás prestaciones sociales, de acuerdo con las obligaciones laborales de nuestra empresa.</p>

  <p>Agradecemos de antemano su atención a la presente solicitud y quedamos a su entera disposición para cualquier información adicional o documento que sea requerido para la correcta y oportuna apertura de la cuenta.</p>

  <p>Para cualquier verificación de la información aquí consignada, pueden contactarnos a través de los datos de nuestra empresa indicados en el encabezado de esta carta.</p>

  <p>Atentamente,</p>

  <br>

  <p><b>Fecha de Firma:</b> {{ date('d') }} de {{ strtoupper(monthLetters(date('m'))) }} de {{ date('Y') }}</p>

  <br><br>

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
    <p><b>NIT {{ strtoupper($studio->nitWithVerificationDigit()) }}</b></p>
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

function getContractTypeName($contractType)
{
  switch ($contractType) {
    case 'APRENDIZAJE':
    case 'TERMINO FIJO':
      return 'Contrato a TERMINO FIJO';

    case 'TERMINO INDEFINIDO':
      return 'Contrato a TERMINO INDEFINIDO';

    case 'MANDANTE - MODELO':
      return 'Contrato MANDANTE';

    case 'OCASIONAL DE TRABAJO':
    case 'OBRA O LABOR':
    case 'CIVIL POR PRESTACIÓN DE SERVICIOS':
      return 'Contrato por PRESTACIÓN DE SERVICIOS';

    default:
      return 'Contrato de Trabajo';
  }
}
