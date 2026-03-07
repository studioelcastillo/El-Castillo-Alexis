<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>Informe de Liquidación</title>
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

    h2 {
      font-size: 11px;
      font-weight: bold;
      margin-top: 15px;
      margin-bottom: 10px;
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
      border-collapse: collapse;
    }

    th, td {
      font-size: 10px;
      padding: 4px;
      border: 1px solid #000;
    }

    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }

    .page-break {
      page-break-before: always;
    }

    .indent {
      margin-left: 20px;
    }

    hr {
      border: none;
      border-top: 1px solid #000;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <p><b>{{ strtoupper($studio->std_company_name) }} NIT: {{$studio->nitWithVerificationDigit()}} Dirección: {{ strtoupper($studio->std_address ?? '[DIRECCIÓN DEL ESTUDIO]') }} Ciudad: {{ strtoupper($studio->city->city_name ?? '[Ciudad de EL_CASTILLO GROUP SAS]') }}</b></p>

  <hr>

  <h2>INFORME DE LIQUIDACIÓN DE ACTIVIDAD Y GENERACIÓN DE INGRESOS BRUTOS DEL MANDATARIO</h2>

  <p><b>Período de Informe:</b> Del <b>{{ strtoupper($period_since) }}</b> al <b>{{ strtoupper($period_until) }}</b></p>

  <p><b>Fecha de Emisión del Informe:</b> <b>{{ date('d') }} de {{ strtoupper(monthLetters(date('m'))) }} de {{ date('Y') }}</b></p>

  <h3>MANDATARIO (PRESTADOR DE SERVICIOS):</h3>

  <ul style="list-style-type: none; padding-left: 20px;">
    <li><b>&bullet; Nombres y Apellidos:</b> {{ $model->fullName() }}</li>
    <li><b>&bullet; Tipo y Núm. Identificación:</b> CC {{ strtoupper($model->user_identification) }}</li>
    <li><b>&bullet; Ciudad de Domicilio:</b> {{ strtoupper($model->city->city_name ?? '[Ciudad de Domicilio del Trabajador]') }}</li>
  </ul>

  <hr>

  <h3>RESUMEN DE GENERACIÓN DE INGRESOS BRUTOS</h3>

  <p><b>{{ strtoupper($studio->std_company_name) }}</b> informa la totalización de los ingresos brutos generados y las actividades realizadas por <b>{{ $model->fullName() }}</b>, en su rol de Mandatario(a) y prestador(a) de servicios independientes, por los conceptos detallados a continuación, correspondientes al período indicado.</p>

  <br>
  <p><b>POR CONCEPTO DE:</b></p>

  <p><b>Ingresos brutos generados por la ejecución de servicios de Marketing, Asesoría Comercial en Medios Digitales y Gestión de Contenido</b>, desarrollados de manera autónoma por el Mandatario(a) en el período comprendido del <b>{{ strtoupper($period_since) }}</b> al <b>{{ strtoupper($period_until) }}</b>:</p>

  <br>
  <div style="text-align: center; margin-bottom: 5px;">
    <b>INGRESOS</b>
  </div>
  <table border="1" cellspacing="0" cellpadding="1" style="width: 100%">
    <thead>
      <tr align="center" style="background: #FFFFFF">
        <th>No.</th>
        <th>Empresa</th>
        <th>Moneda</th>
        <th>Tasa</th>
        <th>%</th>
        <th>Valor</th>
        <th>Tokens</th>
        <th>Cantidad</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
    @php
      $totalTokens = 0;
      $totalUsd = 0;
      $totalCop = 0;
    @endphp
    @foreach ($dataset['incomes'] as $r => $row)
      <tr align="center" style="background: #FFFFFF">
        <td>{{$r}}</td>
        <td>{{ getCompanyName($row['modacc_app']) }}</td>
        <td>DOLAR</td>
        <td>{{ number_format($row['modstr_earnings_trm'], 2, ",", ".") }}</td>
        <td>{{$row['modstr_earnings_percent'] * 100}}%</td>
        <td></td>
        <td>{{ number_format($row['sum_earnings_tokens'], 2, ",", ".") }}</td>
        <td>$ {{ number_format($row['sum_earnings_usd'], 2, ",", ".") }}</td>
        <td>$ {{ number_format($row['sum_earnings_cop'], 0, ",", ".") }}</td>
      </tr>
      @php
        $totalTokens += $row['sum_earnings_tokens'];
        $totalUsd += $row['sum_earnings_usd'];
        $totalCop += $row['sum_earnings_cop'];
      @endphp
    @endforeach
    </tbody>
    <tfoot>
      <tr align="center" style="background: #FFFFFF">
        <td></td>
        <td colspan="5"></td>
        <td>{{ number_format( $totalTokens, 2, ",", ".") }}</td>
        <td>$ {{ number_format( $totalUsd, 2, ",", ".") }}</td>
        <td>$ {{ number_format( $totalCop, 0, ",", ".") }}</td>
      </tr>
    </tfoot>
  </table>

  @if(count($dataset['discounts']) > 0)
  <br>
  <div style="text-align: center; margin-bottom: 5px;">
    <b>DESCUENTOS</b>
  </div>
  <table border="1" cellspacing="0" cellpadding="3" style="width: 100%">
    <thead>
      <tr align="center" style="background: #FFFFFF">
        <th>No.</th>
        <th>Fecha</th>
        <th>Egreso</th>
        <th>Observación</th>
        <th>Valor</th>
      </tr>
    </thead>
    <tbody>
    @php
      $total = 0;
    @endphp
    @foreach ($dataset['discounts'] as $r => $row)
      <tr align="center" style="background: #FFFFFF">
        <td>{{$r}}</td>
        <td>{{$row['trans_date']}}</td>
        <td>{{$row['transtype_name']}}</td>
        <td>{{$row['trans_description']}}</td>
        <td>$ {{ number_format($row['trans_total'], 0, ",", ".") }}</td>
      </tr>
      @php
        $total += $row['trans_total'];
      @endphp
    @endforeach
    </tbody>
    <tfoot>
      <tr align="center" style="background: #FFFFFF">
        <td colspan="4"></td>
        <td>$ {{ number_format($total, 0, ",", ".") }}</td>
      </tr>
    </tfoot>
  </table>
  @endif

  @if(count($dataset['others']) > 0)
  <br>
  <div style="text-align: center; margin-bottom: 5px;">
    <b>OTROS INGRESOS</b>
  </div>
  <table border="1" cellspacing="0" cellpadding="3" style="width: 100%">
    <thead>
      <tr align="center" style="background: #FFFFFF">
        <th>No.</th>
        <th>Fecha</th>
        <th>Ingreso</th>
        <th>Observación</th>
        <th>Valor</th>
      </tr>
    </thead>
    <tbody>
    @php
      $total = 0;
    @endphp
    @foreach ($dataset['others'] as $r => $row)
      <tr align="center" style="background: #FFFFFF">
        <td>{{$r}}</td>
        <td>{{$row['trans_date']}}</td>
        <td>{{$row['transtype_name']}}</td>
        <td>{{$row['trans_description']}}</td>
        <td>$ {{ number_format($row['trans_total'], 0, ",", ".") }}</td>
      </tr>
      @php
        $total += $row['trans_total'];
      @endphp
    @endforeach
    </tbody>
    <tfoot>
      <tr align="center" style="background: #FFFFFF">
        <td colspan="4"></td>
        <td>$ {{ number_format($total, 0, ",", ".") }}</td>
      </tr>
    </tfoot>
  </table>
  @endif

  <br>
  <div style="text-align: center; margin-bottom: 5px;">
    <b>TIEMPO EN LINEA</b>
  </div>
  <table border="1" cellspacing="0" cellpadding="3" style="width: 100%">
    <thead>
      <tr align="center" style="background: #FFFFFF">
        <th>No.</th>
        <th>Fecha</th>
        <th>Página</th>
        <th>Observación</th>
        <th>Tiempo</th>
      </tr>
    </thead>
    <tbody>
    @php
      $total = 0;
    @endphp
    @foreach ($dataset['incomes'] as $r => $row)
      <tr align="center" style="background: #FFFFFF">
        <td>{{$r}}</td>
        <td>{{$row['modacc_period']}}</td>
        <td>{{$row['modacc_app']}}</td>
        <td></td>
        <td>{{$row['sum_time']}}</td>
      </tr>
      @php
        $total += timeToNumber($row['sum_time']);
      @endphp
    @endforeach
    </tbody>
    <tfoot>
      <tr align="center" style="background: #FFFFFF">
        <td colspan="4"></td>
        <td>{{ numberToTime($total) }}</td>
      </tr>
    </tfoot>
  </table>

  <br>
  <br>
  <hr style="border:1px dashed #000;">
  <br>
  <table border="1" cellspacing="0" cellpadding="3" style="width: 100%">
    <tr align="center" style="background: #FFFFFF">
      <td><b>Total ingresos</b></td>
      <td><b>$ {{ number_format( $dataset['sum_earnings_cop'], 0, ",", ".") }}</b></td>
    </tr>
    <tr align="center" style="background: #FFFFFF">
      <td><b>Retefuente</b></td>
      <td><b>$ {{ number_format( $dataset['sum_earnings_rtefte'], 0, ",", ".") }}</b></td>
    </tr>
    <tr align="center" style="background: #FFFFFF">
      <td><b>Total Deducciones</b></td>
      <td><b>$ {{ number_format( $dataset['sum_earnings_discounts'], 0, ",", ".") }}</b></td>
    </tr>
    <tr align="center" style="background: #FFFFFF">
      <td><b>Otros Ingresos</b></td>
      <td><b>$ {{ number_format( $dataset['sum_earnings_others'], 0, ",", ".") }}</b></td>
    </tr>
    <tr align="center" style="background: #FFFFFF">
      <td><b>Total a Pagar</b></td>
      <td><b>$ {{ number_format( $dataset['sum_earnings_total'], 0, ",", ".") }}</b></td>
    </tr>
  </table>

  <br>

  <p style="text-align: justify;">Este informe se emite con fines informativos sobre la actividad y la generación de ingresos brutos del Mandatario. Los valores aquí detallados sirven como base para la posterior liquidación y pago de honorarios netos, aplicando las retenciones fiscales correspondientes según la legislación vigente y las condiciones del Contrato de Mandato Comercial. Este documento no constituye una relación laboral ni establece, modifica o implica relación de subordinación o vínculo de empleo alguno entre <b>{{ strtoupper($studio->std_company_name) }}</b> y el Mandatario.</p>

  <hr>

  <p><b>{{ strtoupper($studio->std_manager_name ?? '[Nombre del Representante Legal]') }}</b></p>
  <p>C.C. {{ strtoupper($studio->std_manager_id ?? '[Cédula del Representante]') }} de {{ strtoupper($studio->city->city_name ?? 'Cali') }}</p>
  <p>Representante Legal</p>
  <p><b>{{ strtoupper($studio->std_company_name) }}</b></p>
  <p><b>NIT {{$studio->nitWithVerificationDigit()}}</b></p>
  <p>Correo: {{ strtoupper($studio->userOwner->user_personal_email ?? '[Correo Electrónico de la Empresa para Verificación]') }}</p>
  <p>Teléfono: {{ strtoupper($studio->userOwner->user_telephone ?? '[Número de Teléfono de la Empresa para Verificación]') }}</p>

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

function getCompanyName($app)
{
  $appUpper = strtoupper($app);

  // MYFREE CAMS -> ACH CREDIT MFCXY INC ACHTEST
  if (stripos($appUpper, 'MYFREE') !== false || stripos($appUpper, 'MFC') !== false) {
    return 'ACH CREDIT MFCXY INC';
  }

  // IMLIVE -> ACH CREDIT MTACC II PAYMENTS / PICOINS
  if (stripos($appUpper, 'IMLIVE') !== false) {
    return 'ACH CREDIT MTACC II / PICOINS';
  }

  // STRIPCHAT -> ACH CREDIT WISEBITS LLC
  if (stripos($appUpper, 'STRIPCHAT') !== false || stripos($appUpper, 'TECHNIU') !== false) {
    return 'ACH CREDIT WISEBITS LLC';
  }

  // JASMIN -> ACH CREDIT DUODECAD IT / JWS AMERICA
  if (stripos($appUpper, 'JASMIN') !== false) {
    return 'ACH CREDIT DUODECAD IT / JWS AMERICA';
  }

  // CHATURBATE -> MULTI MEDIA / 1628
  if (stripos($appUpper, 'CHATURBATE') !== false) {
    return 'MULTI MEDIA / 1628 MULTI MEDIA';
  }

  // SKYPRIVATE -> ACH CREDIT PPM INTERNET INC / VTL SUPPORT
  if (stripos($appUpper, 'SKYPRIVATE') !== false) {
    return 'ACH CREDIT PPM INTERNET INC / VTL SUPPORT';
  }

  // FLEER4FREE -> INTERACTIVE LLC
  if (stripos($appUpper, 'FLEER') !== false) {
    return 'INTERACTIVE LLC';
  }

  // CAM4 -> TLE OPPORTUNITIE
  if (stripos($appUpper, 'CAM4') !== false) {
    return 'TLE OPPORTUNITIE';
  }

  // STREAMATE -> ICF TECHNOLOGY, INC.
  if (stripos($appUpper, 'STREAMATE') !== false) {
    return 'ICF TECHNOLOGY, INC.';
  }

  // OSCAR MONETIZAR -> LOKA DIGITAL / SCORP INC
  if (stripos($appUpper, 'OSCAR') !== false || stripos($appUpper, 'MONETIZAR') !== false) {
    return 'LOKA DIGITAL / SCORP INC';
  }

  // MYDIRTYHOBBY -> MG SUPER HIPPO STUDIOS
  if (stripos($appUpper, 'MYDIRTYHOBBY') !== false || stripos($appUpper, 'DIRTYHOBBY') !== false) {
    return 'MG SUPER HIPPO STUDIOS LT';
  }

  // BONGA -> LATAM DIGITAL
  if (stripos($appUpper, 'BONGA') !== false) {
    return 'LATAM DIGITAL';
  }

  // CAMS / STREAMRAY -> STREAMRAY INC / FF_WL / FF
  if (stripos($appUpper, 'STREAMRAY') !== false || stripos($appUpper, 'CAMS.COM') !== false) {
    return 'STREAMRAY INC / FF_WL / FF';
  }

  // XLOVE -> SHOSHORO N.V. / WISE
  if (stripos($appUpper, 'XLOVE') !== false) {
    return 'SHOSHORO N.V. / WISE';
  }

  // ADULFORCE -> MASSPAY INCORPORATED
  if (stripos($appUpper, 'ADULFORCE') !== false || stripos($appUpper, 'BILLIN') !== false) {
    return 'MASSPAY INCORPORATED';
  }

  // DREAMCAM -> RABONL2U
  if (stripos($appUpper, 'DREAMCAM') !== false) {
    return 'RABONL2U';
  }

  // Si no se encuentra coincidencia, retornar el nombre original
  return $app;
}
