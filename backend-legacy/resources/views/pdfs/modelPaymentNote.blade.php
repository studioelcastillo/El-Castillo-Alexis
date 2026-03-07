<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>Cuenta de Cobro</title>
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
      border-collapse: collapse;
    }

    th, td {
      font-size: 10px;
      padding: 5px;
      border: 1px solid #000;
      text-align: center;
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

    .signature-block {
      margin-top: 40px;
      text-align: left;
    }
  </style>
</head>
<body>
  <h1>CUENTA DE COBRO</h1>

  <br>

  <p><b>{{ strtoupper($model->city->city_name ?? '[Ciudad de Domicilio de la Modelo]') }}, {{ date('d') }} de {{ strtoupper(monthLetters(date('m'))) }} de {{ date('Y') }}</b></p>

  <p>Señores:</p>
  <p><b>{{ strtoupper($studio->std_company_name) }}</b></p>
  <p><b>NIT: {{$studio->nitWithVerificationDigit()}}</b></p>
  <p><b>Dirección: {{ strtoupper($studio->std_address ?? 'Carrera 44 # 2A-50, Barrio El Lido, Cali, Valle del Cauca, Colombia') }}</b></p>
  
  <br>
  
  <p><b>Asunto:</b> Cobro de Honorarios por Contrato de Mandato Comercial y Servicios Digitales.</p>

  <p><b>Referencia:</b> Contrato de Mandato Comercial con Representación suscrito el <b>{{$studioModel->stdmod_start_at ?? 'DD/MM/AAAA'}}</b></p>

  <p>Cordial Saludo.</p>

  <p>Por medio de la presente, yo, <b>{{ $model->fullName() }}</b>, identificado(a) con Cédula de Ciudadanía No. <b>{{ strtoupper($model->user_identification) }}</b> expedida en <b>{{ strtoupper($model->user_issued_in ?? '[Lugar de Expedición de la Cédula]') }}</b>, con domicilio en la ciudad de <b>{{ strtoupper($model->city->city_name ?? '[Ciudad de Domicilio del/la Modelo o Aliado/a]') }}</b>, y en mi calidad de Mandatario(a) y prestador(a) de servicios independientes, me permito presentar la siguiente cuenta de cobro correspondiente a los servicios y actividades desarrolladas en virtud del Contrato de Mandato Comercial con Representación antes mencionado, durante el período de <b>{{ strtoupper($period_since) }}</b> al <b>{{ strtoupper($period_until) }}</b> de <b>{{date('Y', strtotime($period_until))}}</b>.</p>

  <p><b>DETALLE DE HONORARIOS Y DEDUCCIONES</b></p>

  <table>
    <tr>
      <th>CONCEPTO</th>
      <th>VALOR BRUTO($)</th>
      <th>DEDUCCIONES ($)</th>
      <th>VALOR NETO ($)</th>
    </tr>
    <tr>
      <td>Honorarios por Gestión y Creación de Contenido Digital</td>
      <td><b>{{number_format($dataset['sum_earnings_cop'], 0, ",", ".")}}</b></td>
      <td><b>{{number_format($dataset['sum_earnings_discounts'], 0, ",", ".")}}</b></td>
      <td><b>{{number_format($dataset['sum_earnings_net'], 0, ",", ".")}}</b></td>
    </tr>
    <tr>
      <td>Menos: Retención en la Fuente (4%)</td>
      <td><b>{{number_format($dataset['sum_earnings_cop'], 0, ",", ".")}}</b></td>
      <td><b>{{number_format($dataset['sum_earnings_rtefte'], 0, ",", ".")}}</b></td>
      <td><b>{{number_format($dataset['sum_earnings_total'], 0, ",", ".")}}</b></td>
    </tr>
    <tr>
      <td colspan="3"><b>TOTAL A PAGAR (NETO)</b></td>
      <td><b>{{number_format($dataset['sum_earnings_total'], 0, ",", ".")}}</b></td>
    </tr>
  </table>

  <br>

  <p><b>Observaciones:</b></p>

  <ul>
    <li>El presente cobro se emite conforme a las condiciones de liquidación y pago estipuladas en la Cláusula <b>CLAUSULA SEXTA: REMUNERACION Y FORMA DE PAGO</b> del Contrato de Mandato Comercial.</li>
    <li>Declaro bajo la gravedad del juramento que la información aquí consignada es veraz y corresponde a la realidad de los servicios prestados.</li>
  </ul>

  <p>Agradezco su pronta gestión para el pago de este valor en la cuenta bancaria registrada para tal fin.</p>

  <p>Atentamente,</p>

  <br><br><br>

  <div class="signature-block">
    <p>_______________________________</p>
    <p><b>{{ $model->fullName() }}</b></p>
    <p><b>C.C. {{ strtoupper($model->user_identification) }}</b></p>
    <p><b>Número de Contacto:</b> {{ strtoupper($model->user_telephone ?? '[Teléfono de la Modelo]') }}</p>
    <p><b>Correo Electrónico:</b> {{ strtoupper($model->user_personal_email ?? '[Correo Electrónico de la Modelo]') }}</p>
  </div>

  <br>

  <h4>INFORMACIÓN BANCARIA PARA EL PAGO:</h4>
  <ul style="list-style-type: none; padding-left: 0;">
    <li><b>&bullet; Banco:</b> {{$model->user_bank_entity ?? '[Banco de la Modelo]'}}</li>
    <li><b>&bullet; Tipo de Cuenta:</b> {{$model->user_bank_account_type ?? '[Ahorros / Corriente]'}}</li>
    <li><b>&bullet; Número de Cuenta:</b> {{$model->user_bank_account ?? '[Número Cuenta de la Modelo]'}}</li>
  </ul>

</body>
</html>

<?php
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


function letras($numero, $moneda = "PESOS")
{
  //----------------------------------------------------------------------------------
  //                     ***** NUMEROS DE DOS DIGITOS *****
  //----------------------------------------------------------------------------------

  $digitos2 = array('UN','DOS','TRES','CUATRO','CINCO','SEIS','SIETE',
                    'OCHO','NUEVE','DIEZ','ONCE','DOCE','TRECE','CATORCE',
                    'QUINCE','DIECISEIS','DIECISIETE','DIECIOCHO','DIECINUEVE',
                    'VEINTE','VEINTIUN','VEINTIDOS','VEINTITRES','VEINTICUATRO',
                    'VEINTICINCO','VEINTISEIS','VEINTISIETE','VEINTIOCHO',
                    'VEINTINUEVE','TREINTA','TREINTA Y UN','TREINTA Y DOS',
                    'TREINTA Y TRES','TREINTA Y CUATRO','TREINTA Y CINCO',
                    'TREINTA Y SEIS','TREINTA Y SIETE','TREINTA Y OCHO',
                    'TREINTA Y NUEVE','CUARENTA','CUARENTA Y UN','CUARENTA Y DOS',
                    'CUARENTA Y TRES','CUARENTA Y CUATRO','CUARENTA Y CINCO',
                    'CUARENTA Y SEIS','CUARENTA Y SIETE','CUARENTA Y OCHO',
                    'CUARENTA Y NUEVE','CINCUENTA','CINCUENTA Y UN','CINCUENTA Y DOS',
                    'CINCUENTA Y TRES','CINCUENTA Y CUATRO','CINCUENTA Y CINCO',
                    'CINCUENTA Y SEIS','CINCUENTA Y SIETE',
                    'CINCUENTA Y OCHO','CINCUENTA Y NUEVE','SESENTA','SESENTA Y UN',
                    'SESENTA Y DOS','SESENTA Y TRES','SESENTA Y CUATRO','SESENTA Y CINCO',
                    'SESENTA Y SEIS','SESENTA Y SIETE','SESENTA Y OCHO','SESENTA Y NUEVE',
                    'SETENTA','SETENTA Y UN','SETENTA Y DOS','SETENTA Y TRES','SETENTA Y CUATRO',
                    'SETENTA Y CINCO','SETENTA Y SEIS','SETENTA Y SIETE','SETENTA Y OCHO',
                    'SETENTA Y NUEVE','OCHENTA','OCHENTA Y UN','OCHENTA Y DOS','OCHENTA Y TRES',
                    'OCHENTA Y CUATRO','OCHENTA Y CINCO','OCHENTA Y SEIS',
                    'OCHENTA Y SIETE','OCHENTA Y OCHO','OCHENTA Y NUEVE',
                    'NOVENTA','NOVENTA Y UN','NOVENTA Y DOS','NOVENTA Y TRES',
                    'NOVENTA Y CUATRO','NOVENTA Y CINCO','NOVENTA Y SEIS',
                    'NOVENTA Y SIETE','NOVENTA Y OCHO','NOVENTA Y NUEVE');

  //------------------------------------------------------------------------------------
  //                      ***** NUMEROS DE 3 DIGITOS *****
  //------------------------------------------------------------------------------------

  $digitos3 = array('CIEN','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS',
                    'QUINIENTOS','SEISCIENTOS','SETECIENTOS','OCHOCIENTOS',
                    'NOVECIENTOS');

  $digitos33 = array('CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS',
                    'QUINIENTOS','SEISCIENTOS','SETECIENTOS','OCHOCIENTOS',
                    'NOVECIENTOS');

  //------------------------------------------------------------------------------------
  //                    ***** NUMEROS DE CINCO DIGITOS *****
  //------------------------------------------------------------------------------------

  $digitos5 = array('UN MIL','DOS MIL','TRES MIL','CUATRO MIL','CINCO MIL',
                    'SEIS MIL','SIETE MIL','OCHO MIL','NUEVE MIL','DIEZ MIL',
                    'ONCE MIL','DOCE MIL','TRECE MIL','CATORCE MIL','QUINCE MIL',
                    'DIECISEIS MIL','DIECISIETE MIL','DIECIOCHO MIL','DIECINUEVE MIL',
                    'VEINTE MIL','VEINTIUN MIL','VEINTIDOS MIL','VEINTITRES MIL',
                    'VEINTICUATRO MIL','VEINTICINCO MIL','VENTISEIS MIL','VEINTISIETE MIL',
                    'VEINTIOCHO MIL','VEINTINUEVE MIL','TREINTA MIL','TREINTA Y UN MIL',
                    'TREINTA Y DOS MIL','TREINTA Y TRES MIL','TREINTA Y CUATRO MIL',
                    'TREINTA Y CINCO MIL','TREINTA Y SEIS MIL','TREINTA Y SIETE MIL',
                    'TREINTA Y OCHO MIL','TREINTA Y NUEVE MIL','CUARENTA MIL','CUARENTA Y UN MIL',
                    'CUARENTA Y DOS MIL','CUARENTA Y TRES MIL','CUARENTA Y CUATRO MIL',
                    'CUARENTA Y CINCO MIL','CUARENTA Y SEIS MIL','CUARENTA Y SIETE MIL',
                    'CUARENTA Y OCHO MIL','CUARENTA Y NUEVE MIL','CINCUENTA MIL','CINCUENTA Y UN MIL',
                    'CINCUENTA Y DOS MIL','CINCUENTA Y TRES MIL','CINCUENTA Y CUATRO MIL',
                    'CINCUENTA Y CINCO MIL','CINCUENTA Y SEIS MIL','CINCUENTA Y SIETE MIL',
                    'CINCUENTA Y OCHO MIL','CINCUENTA Y NUEVE MIL','SESENTA MIL',
                    'SESENTA Y UN MIL','SESENTA Y DOS MIL','SESENTA Y TRES MIL',
                    'SESENTA Y CUATRO MIL','SESENTA Y CINCO MIL','SESENTA Y SEIS MIL',
                    'SESENTA Y SIETE MIL','SESENTA Y OCHO MIL','SESENTA Y NUEVE MIL',
                    'SETENTA MIL','SETENTA Y UN MIL','SETENTA Y DOS MIL','SETENTA Y TRES MIL',
                    'SETENTA Y CUATRO MIL','SETENTA Y CINCO MIL','SETENTA Y SEIS MIL','SETENTA Y SIETE MIL',
                    'SETENTA Y OCHO MIL','SETENTA Y NUEVE MIL','OCHENTA MIL',
                    'OCHENTA Y UN MIL','OCHENTA Y DOS MIL','OCHENTA Y TRES MIL',
                    'OCHENTA Y CUATRO MIL','OCHENTA Y CINCO MIL','OCHENTA Y SEIS MIL',
                    'OCHENTA Y SIETE MIL','OCHENTA Y OCHO MIL','OCHENTA Y NUEVE MIL',
                    'NOVENTA MIL','NOVENTA Y UN MIL','NOVENTA Y DOS MIL','NOVENTA Y TRES MIL',
                    'NOVENTA CUATRO MIL','NOVENTA Y CINCO MIL','NOVENTA Y SEIS MIL','NOVENTA Y SIETE MIL',
                    'NOVENTA Y OCHO MIL','NOVENTA Y NUEVE MIL');

  //------------------------------------------------------------------------------------
  //                    ***** NUMEROS DE SEIS DIGITOS *****
  //------------------------------------------------------------------------------------

  $digitos6 = array('CIEN MIL','DOSCIENTOS MIL','TRESCIENTOS MIL',
                    'CUATROCIENTOS MIL','QUINIENTOS MIL','SEISCIENTOS MIL',
                    'SETECIENTOS MIL','OCHOCIENTOS MIL','NOVECIENTOS MIL');

  $digitos66 = array('CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS',
                    'QUINIENTOS','SEISCIENTOS','SETECIENTOS','OCHOCIENTOS',
                    'NOVECIENTOS');

  //------------------------------------------------------------------------------------
  //-                    ***** NUMEROS DE SIETE DIGITOS *****                -
  //------------------------------------------------------------------------------------

  $digitos7 = array('UN MILLON','DOS MILLONES','TRES MILLONES','CUATRO MILLONES',
                    'CINCO MILLONES','SEIS MILLONES','SIETE MILLONES',
                    'OCHO MILLONES','NUEVE MILLONES','DIEZ MILLONES',
                    'ONCE MILLONES','DOCE MILLONES','TRECE MILLONES',
                    'CATORCE MILLONES','QUINCE MILLONES','DIECISEIS MILLONES',
                    'DIECISIETE MILLONES','DIECIOCHO MILLONES','DIECINUEVE MILLONES',
                    'VEINTE MILLONES','VEINTIUN MILLONES','VEINTIDOS MILLONES',
                    'VEINTITRES MILLONES','VEINTICUATRO MILLONES',
                    'VEINTICINCO MILLONES','VEINTISEIS MILLONES',
                    'VEINTISIETE MILLONES','VEINTIOCHO MILLONES',
                    'VEINTINUEVE MILLONES','TREINTA MILLONES',
                    'TREINTA Y UN MILLONES','TREINTA Y DOS MILLONES',
                    'TREINTA Y TRES MILLONES','TREINTA Y CUATRO MILLONES',
                    'TREINTA Y CINCO MILLONES', 'TREINTA Y SEIS MILLONES',
                    'TREINTA Y SIETE MILLONES','TREINTA Y OCHO MILLONES',
                    'TREINTA Y NUEVE MILLONES','CUARENTA MILLONES',
                    'CUARENTA Y UN MILLONES','CUARENTA Y DOS MILLONES',
                    'CUARENTA Y TRES MILLONES','CUARENTA Y CUATRO MILLONES',
                    'CUARENTA Y CINCO MILLONES','CUARENTA Y SEIS MILLONES',
                    'CUARENTA Y SIETE MILLONES','CUARENTA Y OCHO MILLONES',
                    'CUARENTA Y NUEVE MILLONES','CINCUENTA MILLONES',
                    'CINCUENTA Y UN MILLONES','CINCUENTA Y DOS MILLONES',
                    'CINCUENTA Y TRES MILLONES','CINCUENTA Y CUATRO MILLONES',
                    'CINCUENTA Y CINCO MILLONES','CINCUENTA Y SEIS MILLONES',
                    'CINCUENTA Y SIETE MILLONES','CINCUENTA Y OCHO MILLONES',
                    'CINCUENTA Y NUEVE MILLONES','SESENTA MILLONES',
                    'SESENTA Y UN MILLONES','SESENTA Y DOS MILLONES',
                    'SESENTA Y TRES MILLONES','SESENTA Y CUATRO MILLONES',
                    'SESENTA Y CINCO MILLONES','SESENTA Y SEIS MILLONES',
                    'SESENTA Y SIETE MILLONES','SESENTA Y OCHO MILLONES',
                    'SESENTA Y NUEVE MILLONES','SETENTA MILLONES',
                    'SETENTA Y UN MILLONES','SETENTA Y DOS MILLONES',
                    'SETENTA Y TRES MILLONES','SETENTA Y CUATRO MILLONES',
                    'SETENTA Y CINCO MILLONES','SETENTA Y SEIS MILLONES',
                    'SETENTA Y SIETE MILLONES','SETENTA Y OCHO MILLONES',
                    'SETENTA Y NUEVE MILLONES','OCHENTA MILLONES',
                    'OCHENTA Y UN MILLONES','OCHENTA Y DOS MILLONES',
                    'OCHENTA Y TRES MILLONES','OCHENTA Y CUATRO MILLONES',
                    'OCHENTA Y CINCO MILLONES','OCHENTA Y SEIS MILLONES',
                    'OCHENTA Y SIETE MILLONES','OCHENTA Y OCHO MILLONES',
                    'OCHENTA Y NUEVE MILLONES','NOVENTA MILLONES',
                    'NOVENTA Y UN MILLONES','NOVENTA Y DOS MILLONES',
                    'NOVENTA Y TRES MILLONES','NOVENTA Y CUATRO MILLONES',
                    'NOVENTA Y CINCO MILLONES','NOVENTA Y SEIS MILLONES',
                    'NOVENTA Y SIETE MILLONES','NOVENTA Y OCHO MILLONES',
                    'NOVENTA Y NUEVE MILLONES');

  //------------------------------------------------------------------------------------
  //-                   ***** NUMEROS DE OCHO Y NUEVE DIGITOS *****                -
  //------------------------------------------------------------------------------------

  $digitos8 = array('CIEN MILLONES','DOSCIENTOS MILLONES',
                    'TRESCIENTOS MILLONES','CUATROCIENTOS MILLONES',
                    'QUINIENTOS MILLONES','SEISCIENTOS MILLONES',
                    'SETECIENTOS MILLONES','OCHOCIENTOS MILLONES',
                    'NOVECIENTOS MILLONES');

  $digitos9 = array('CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS',
                    'QUINIENTOS','SEISCIENTOS','SETECIENTOS','OCHOCIENTOS',
                    'NOVECIENTOS');
  $digitos10 = array('MIL MILLONES','DOS MIL MILLONES',
                    'TRES MIL MILLONES','CUATRO MIL MILLONES',
                    'CINCO MIL MILLONES','SEIS MIL MILLONES',
                    'SIETE MIL MILLONES','OCHO MIL MILLONES',
                    'NUEVE MIL  MILLONES');

  for ($k=0; $k<6; $k++) {
    $letras[$k]=" ";
  }

  $numero_decimal = explode(".", $numero);
  $numero = $numero_decimal[0];
  $longitudcadena = strlen($numero);

  if ($longitudcadena >= 1) {
    $diez = (int) substr($numero, -2);
    if ($diez != 0) {
      $letras[0] = $digitos2[$diez - 1];
    }
  }

  //-----------------------------------------------------------------------------

  if ($longitudcadena >= 3) {
    $cien = (int) substr($numero, -3, 1);


    if ($cien != 0 && $diez == 0) {
      $letras[1] = $digitos3[$cien - 1];
    } elseif ($cien != 0 && $diez != 0) {
      $letras[1] = $digitos33[$cien - 1];
    }
  }

  //-----------------------------------------------------------------------------

  if ($longitudcadena >= 5) {
    $diezmil= substr($numero, -5, 2);
  } elseif ($longitudcadena >= 4) {
    $diezmil= substr($numero, -5, 1);
  }




  if ($longitudcadena >= 4 || $longitudcadena >= 5) {
    if ($diezmil != 0) {
      $letras[2] = $digitos5[$diezmil - 1];
    }
  }

  //-----------------------------------------------------------------------------

  if ($longitudcadena >= 6) {
    $cienmil = (int) substr($numero, -6, 1);



    if ($cienmil != 0) {
      if ($diezmil == 0) {
        $letras[3] = $digitos6[$cienmil - 1];
      } else {
        $letras[3] = $digitos66[$cienmil - 1];
      }
    }
  }

  //-----------------------------------------------------------------------------

  $de = "";

  if ($longitudcadena >= 8) {
    $diezmillones = (int) substr($numero, -8, 2);
  } elseif ($longitudcadena >= 7) {
    $diezmillones = (int) substr($numero, -7, 1);
  }


  if ($longitudcadena >= 7 || $longitudcadena >= 8) {
    if ($diezmillones != 0) {
      $letras[4] = $digitos7[$diezmillones - 1];
    }


    if ($diez==0 && $cien==0 && $diezmil==0 && $cienmil ==0) {
      $de = "DE ";
    }
  }

  //-----------------------------------------------------------------------------

  if ($longitudcadena >= 9) {
    $cienmillones = (int) substr($numero, -9, 1);


    if ($cienmillones != 0) {
      if ($diezmillones == 0) {
        $letras[5] = $digitos8[$cienmillones - 1];
      } else {
        $letras[5] = $digitos9[$cienmillones - 1];
      }
    }
  }
  //-----------------------------------------------------------------------------

  if ($longitudcadena >= 10) {
    $millones = (int) substr($numero, -10, 1);

    if ($millones != 0) {
      if ($diezmillones == 0) {
        $letras[5] = $digitos8[$cienmillones - 1];
      } else {
        $letras[5] = $digitos9[$cienmillones - 1];
      }
    }
  }

  for ($k=5; $k>=0; $k--) {
    if (!isset($letras[$k])) {
      $letras[$k]="";
    }

    if (!isset($valor)) {
      $valor="";
    }

    if ($letras[$k] == "") {
      $valor = $valor;
    } else {
      $valor = " ".$valor." ".$letras[$k];
    }
  }

  if (!isset($decimal)) {
    $decimal="";
  } else {
    $decimal = $decimal;
  }

  $valor = trim($valor).' '.trim($de).' '.trim($moneda).' '.trim($decimal);
  return $valor;
}
