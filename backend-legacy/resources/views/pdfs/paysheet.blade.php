<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>Recibo de Pago</title>
  <style>
    * {
      font-family: "Arial", sans-serif !important;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      margin: 10px;
      font-size: 10px;
      line-height: 1.2;
    }

    .main-container {
      border: 2px solid #000;
      width: 100%;
      min-height: 600px;
    }

    .header {
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      padding: 8px;
      border-bottom: 1px solid #000;
    }

    .logo {
      text-align: center;
      padding-top: 5px;
    }

    .content-wrapper {
      padding: 10px;
    }

    .top-section {
      display: table;
      width: 100%;
      margin-bottom: 10px;
    }

    .left-column {
      display: table-cell;
      width: 70%;
      vertical-align: top;
      padding-right: 15px;
    }

    .right-column {
      display: table-cell;
      width: 30%;
      vertical-align: top;
      padding-left: 10px;
    }

    .field-group {
      margin-bottom: 3px;
    }

    .field-inline {
      display: inline-block;
      margin-right: 20px;
      margin-bottom: 3px;
    }

    .field-label {
      font-weight: bold;
      display: inline-block;
      margin-right: 5px;
    }

    .field-value {
      border-bottom: 1px solid #000;
      display: inline-block;
      min-width: 120px;
      padding: 0 3px;
      min-height: 14px;
    }

    .field-value-short {
      border-bottom: 1px solid #000;
      display: inline-block;
      min-width: 60px;
      padding: 0 3px;
      min-height: 14px;
      text-align: right;
    }

    .middle-section {
      display: table;
      width: 100%;
      margin: 10px 0;
    }

    .employee-info {
      display: table-cell;
      width: 60%;
      vertical-align: top;
      padding-right: 20px;
    }

    .deductions-section {
      display: table-cell;
      width: 40%;
      vertical-align: top;
    }

    .bottom-section {
      margin-top: 20px;
    }

    .signature-section {
      margin-top: 15px;
    }

    .signature-box {
      border: 1px solid #000;
      height: 40px;
      width: 300px;
      margin-top: 5px;
    }

    .quinquennia-section {
      margin-top: 20px;
      border-top: 1px solid #000;
      padding-top: 10px;
    }

    .quinquennia-header {
      text-align: center;
      font-weight: bold;
      margin-bottom: 8px;
      font-size: 11px;
    }

    .quinquennia-table {
      width: 100%;
      border-collapse: collapse;
    }

    .quinquennia-table th,
    .quinquennia-table td {
      border: 1px solid #000;
      padding: 3px 5px;
      text-align: center;
      font-size: 9px;
    }

    .quinquennia-table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }

    .quinquennia-table td:first-child {
      text-align: left;
      font-weight: bold;
    }

    .amount-right {
      text-align: right;
    }

    .total-descuentos {
      display: inline-block;
      margin-right: 20px;
    }

    .comentario {
      display: inline-block;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="main-container">
    <div class="header">
      Recibo de pago
    </div>

    <div class="content-wrapper">
      <!-- Sección superior -->
      <div class="top-section">
        <div class="left-column">
          <div style="float: left; width: 50%; padding-right: 10px;">
            <div class="field-group">
              <span class="field-label">Razon social:</span>
              <span class="field-value">{{ strtoupper($user->std_name ?? '') }}</span>
            </div>

            <div class="field-group">
              <span class="field-label">Nit:</span>
              <span class="field-value">{{ strtoupper($studio->nitWithVerificationDigit() ?? '') }}</span>
            </div>

            <div class="field-group">
              <span class="field-label">Direccion:</span>
              <span class="field-value"></span>
            </div>

            <div class="field-group">
              <span class="field-label">Santiago de Cali:</span>
              <span class="field-value">{{ $formatted_today }}</span>
            </div>

            <div class="field-group">
              <span class="field-label">Periodo pagado:</span>
              <span class="field-value">{{ $formatted_period_start }} - {{ $formatted_period_end }}</span>
            </div>
          </div>

          <div style="float: right; width: 50%; padding-left: 10px;">
            <div class="field-group">
              <span class="field-label">Nombre:</span>
              <span class="field-value" style="min-width: 100px;">{{ strtoupper($user->user_name ?? '') }}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Cedula:</span>
              <span class="field-value" style="min-width: 100px;">{{ $user->user_identification ?? '' }}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Cargo:</span>
              <span class="field-value" style="min-width: 100px;">{{ $user->prof_name ?? 'Gerencia' }}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Días período:</span>
              <span class="field-value" style="min-width: 100px;">{{ $days_in_period }}</span>
            </div>
          </div>
          <div style="clear: both;"></div>
        </div>

        <div class="right-column">
          <div class="logo">
            <img src="{{ public_path('images/studios/icon.png') }}" alt="El Castillo Logo" style="max-width: 100px; max-height: 100px; width: auto; height: auto;">
          </div>
        </div>
      </div>

      <!-- Sección media -->
      <div class="middle-section">
        <div class="employee-info">
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <tr>
              <td style="font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">Salario base:</td>
              <td style="padding: 2px 5px; border-bottom: 1px solid #000; text-align: right;">${{ number_format($base_salary, 2, ",", ".") }}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">
                @php
                  $startDate = \Carbon\Carbon::parse($period->payroll_period_start_date);
                  $month = $startDate->month;
                  $commissionLabel = ($month % 2 === 0) ? 'Aux. de rodamiento' : 'Aux. de alimentación';
                @endphp
                {{ $commissionLabel }}:
              </td>
              <td style="padding: 2px 5px; border-bottom: 1px solid #000; text-align: right;">${{ number_format($commission_amount, 2, ",", ".") }}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">Horas extras:</td>
              <td style="padding: 2px 5px; border-bottom: 1px solid #000; text-align: right;">${{ number_format($extra_hours_amount, 2, ",", ".") }}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">Auxilio de transporte:</td>
              <td style="padding: 2px 5px; border-bottom: 1px solid #000; text-align: right;">${{ number_format($transport_allowance, 2, ",", ".") }}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">Dotación:</td>
              <td style="padding: 2px 5px; border-bottom: 1px solid #000; text-align: right;">${{ number_format($dotacion_amount ?? 0, 2, ",", ".") }}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">EPS empleado:</td>
              <td style="padding: 2px 5px; border-bottom: 1px solid #000; text-align: right;">-${{ number_format($eps_employee, 2, ",", ".") }}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">Pensión empleado:</td>
              <td style="padding: 2px 5px; border-bottom: 1px solid #000; text-align: right;">-${{ number_format($pension_employee, 2, ",", ".") }}</td>
            </tr>
            @if($snacks_total > 0)
            <tr>
              <td style="font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">Consumos ({{ $snacks_count }}):</td>
              <td style="padding: 2px 5px; border-bottom: 1px solid #000; text-align: right;">-${{ number_format($snacks_total, 2, ",", ".") }}</td>
            </tr>
            @endif
            <tr>
              <td style="font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">Total deducciones:</td>
              <td style="padding: 2px 5px; border-bottom: 1px solid #000; text-align: right;">${{ number_format($total_deducciones, 2, ",", ".") }}</td>
            </tr>
          </table>
        </div>

        <div class="deductions-section">
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <tr>
              <td style="font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">Sueldo mensual:</td>
              <td style="padding: 2px 5px; border-bottom: 1px solid #000; text-align: right;">${{ number_format($monthly_salary, 2, ",", ".") }}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">Sueldo diario:</td>
              <td style="padding: 2px 5px; border-bottom: 1px solid #000; text-align: right;">${{ number_format($daily_salary, 2, ",", ".") }}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">Días período:</td>
              <td style="padding: 2px 5px; border-bottom: 1px solid #000; text-align: right;">{{ $days_in_period }}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">Cesantías:</td>
              <td style="padding: 2px 5px; border-bottom: 1px solid #000; text-align: right;">${{ number_format($cesantias, 2, ",", ".") }}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">Prima:</td>
              <td style="padding: 2px 5px; border-bottom: 1px solid #000; text-align: right;">${{ number_format($prima, 2, ",", ".") }}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">Vacaciones:</td>
              <td style="padding: 2px 5px; border-bottom: 1px solid #000; text-align: right;">${{ number_format($vacaciones, 2, ",", ".") }}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 2px 5px; border-bottom: 1px solid #000;">Total devengado:</td>
              <td style="padding: 2px 5px; border-bottom: 1px solid #000; text-align: right;">${{ number_format($total_devengado, 2, ",", ".") }}</td>
            </tr>
            <tr style="font-weight: bold;">
              <td style="padding: 2px 5px; border-bottom: 1px solid #000;">Total a pagar:</td>
              <td style="padding: 2px 5px; border-bottom: 1px solid #000; text-align: right;">${{ number_format($total_neto, 2, ",", ".") }}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Sección inferior -->
      <div class="bottom-section">
        <div class="signature-section" style="display: table; width: 100%;">
          <div style="display: table-cell; width: 50%; vertical-align: top; padding-left: 10px;">
            <span class="field-label">Firma:</span>
            <div class="signature-box"></div>
          </div>
          <div style="display: table-cell; width: 50%; vertical-align: top; padding-right: 10px;">
            <span class="field-label">Comentario:</span>
            <div class="signature-box"></div>
          </div>
        </div>
      </div>

      <!-- Sección de prestaciones y aportes -->
      <div class="quinquennia-section">
        <div class="quinquennia-header">
          Prestaciones sociales y aportes - {{ strtoupper($user->user_name) }} - Año {{ $current_year }}
        </div>

        <table class="quinquennia-table" style="font-size: 8px;">
          <thead>
            <tr>
              <th style="text-align: left;">Prestaciones</th>
              <th style="text-align: center;">Mes actual ({{ date('F', strtotime($period->payroll_period_start_date)) }})</th>
              <th style="text-align: center;">Meses año {{ $current_year }}</th>
              <th style="text-align: center;">Valor pagado mensual</th>
              <th style="text-align: center;">Valor más prestaciones</th>
            </tr>
          </thead>
          <tbody>
            <!-- Fila de cabecera con nombres de conceptos del mes actual -->
            <tr style="background-color: #f0f0f0;">
              <td><b>Conceptos base</b></td>
              <td style="text-align: right;"><b>Valor</b></td>
              <td colspan="3"></td>
            </tr>
            @php
              $conceptsCount = 12; // Total de conceptos base
              $monthIndex = 0;
            @endphp
            <tr>
              <td>Salario base</td>
              <td style="text-align: right;">${{ number_format($base_salary, 0, ",", ".") }}</td>
              @if($monthIndex < count($monthly_data))
                <td style="text-align: center;"><b>{{ $monthly_data[$monthIndex]['month_name'] }}</b></td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['salary_plus_commission'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['salary_plus_commission'], 0, ",", ".") : '$0' }}</td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['total_with_benefits'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['total_with_benefits'], 0, ",", ".") : '$0' }}</td>
                @php $monthIndex++; @endphp
              @else
                <td colspan="3"></td>
              @endif
            </tr>
            <tr>
              <td>{{ $commissionLabel }}</td>
              <td style="text-align: right;">${{ number_format($commission_amount, 0, ",", ".") }}</td>
              @if($monthIndex < count($monthly_data))
                <td style="text-align: center;"><b>{{ $monthly_data[$monthIndex]['month_name'] }}</b></td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['salary_plus_commission'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['salary_plus_commission'], 0, ",", ".") : '$0' }}</td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['total_with_benefits'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['total_with_benefits'], 0, ",", ".") : '$0' }}</td>
                @php $monthIndex++; @endphp
              @else
                <td colspan="3"></td>
              @endif
            </tr>
            <tr>
              <td>Horas extras</td>
              <td style="text-align: right;">${{ number_format($extra_hours_amount, 0, ",", ".") }}</td>
              @if($monthIndex < count($monthly_data))
                <td style="text-align: center;"><b>{{ $monthly_data[$monthIndex]['month_name'] }}</b></td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['salary_plus_commission'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['salary_plus_commission'], 0, ",", ".") : '$0' }}</td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['total_with_benefits'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['total_with_benefits'], 0, ",", ".") : '$0' }}</td>
                @php $monthIndex++; @endphp
              @else
                <td colspan="3"></td>
              @endif
            </tr>
            <tr>
              <td>Auxilio de transporte</td>
              <td style="text-align: right;">${{ number_format($transport_allowance, 0, ",", ".") }}</td>
              @if($monthIndex < count($monthly_data))
                <td style="text-align: center;"><b>{{ $monthly_data[$monthIndex]['month_name'] }}</b></td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['salary_plus_commission'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['salary_plus_commission'], 0, ",", ".") : '$0' }}</td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['total_with_benefits'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['total_with_benefits'], 0, ",", ".") : '$0' }}</td>
                @php $monthIndex++; @endphp
              @else
                <td colspan="3"></td>
              @endif
            </tr>
            <tr>
              <td>Dotación</td>
              <td style="text-align: right;">${{ number_format($dotacion_amount ?? 0, 0, ",", ".") }}</td>
              @if($monthIndex < count($monthly_data))
                <td style="text-align: center;"><b>{{ $monthly_data[$monthIndex]['month_name'] }}</b></td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['salary_plus_commission'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['salary_plus_commission'], 0, ",", ".") : '$0' }}</td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['total_with_benefits'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['total_with_benefits'], 0, ",", ".") : '$0' }}</td>
                @php $monthIndex++; @endphp
              @else
                <td colspan="3"></td>
              @endif
            </tr>
            <tr>
              <td>Cesantías</td>
              <td style="text-align: right;">${{ number_format($cesantias, 0, ",", ".") }}</td>
              @if($monthIndex < count($monthly_data))
                <td style="text-align: center;"><b>{{ $monthly_data[$monthIndex]['month_name'] }}</b></td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['salary_plus_commission'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['salary_plus_commission'], 0, ",", ".") : '$0' }}</td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['total_with_benefits'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['total_with_benefits'], 0, ",", ".") : '$0' }}</td>
                @php $monthIndex++; @endphp
              @else
                <td colspan="3"></td>
              @endif
            </tr>
            <tr>
              <td>Prima</td>
              <td style="text-align: right;">${{ number_format($prima, 0, ",", ".") }}</td>
              @if($monthIndex < count($monthly_data))
                <td style="text-align: center;"><b>{{ $monthly_data[$monthIndex]['month_name'] }}</b></td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['salary_plus_commission'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['salary_plus_commission'], 0, ",", ".") : '$0' }}</td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['total_with_benefits'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['total_with_benefits'], 0, ",", ".") : '$0' }}</td>
                @php $monthIndex++; @endphp
              @else
                <td colspan="3"></td>
              @endif
            </tr>
            <tr>
              <td>Vacaciones</td>
              <td style="text-align: right;">${{ number_format($vacaciones, 0, ",", ".") }}</td>
              @if($monthIndex < count($monthly_data))
                <td style="text-align: center;"><b>{{ $monthly_data[$monthIndex]['month_name'] }}</b></td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['salary_plus_commission'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['salary_plus_commission'], 0, ",", ".") : '$0' }}</td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['total_with_benefits'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['total_with_benefits'], 0, ",", ".") : '$0' }}</td>
                @php $monthIndex++; @endphp
              @else
                <td colspan="3"></td>
              @endif
            </tr>
            <tr>
              <td>EPS empleador</td>
              <td style="text-align: right;">${{ number_format($eps_employer, 0, ",", ".") }}</td>
              @if($monthIndex < count($monthly_data))
                <td style="text-align: center;"><b>{{ $monthly_data[$monthIndex]['month_name'] }}</b></td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['salary_plus_commission'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['salary_plus_commission'], 0, ",", ".") : '$0' }}</td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['total_with_benefits'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['total_with_benefits'], 0, ",", ".") : '$0' }}</td>
                @php $monthIndex++; @endphp
              @else
                <td colspan="3"></td>
              @endif
            </tr>
            <tr>
              <td>Pensión empleador</td>
              <td style="text-align: right;">${{ number_format($pension_employer, 0, ",", ".") }}</td>
              @if($monthIndex < count($monthly_data))
                <td style="text-align: center;"><b>{{ $monthly_data[$monthIndex]['month_name'] }}</b></td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['salary_plus_commission'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['salary_plus_commission'], 0, ",", ".") : '$0' }}</td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['total_with_benefits'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['total_with_benefits'], 0, ",", ".") : '$0' }}</td>
                @php $monthIndex++; @endphp
              @else
                <td colspan="3"></td>
              @endif
            </tr>
            <tr>
              <td>ARL</td>
              <td style="text-align: right;">${{ number_format($arl, 0, ",", ".") }}</td>
              @if($monthIndex < count($monthly_data))
                <td style="text-align: center;"><b>{{ $monthly_data[$monthIndex]['month_name'] }}</b></td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['salary_plus_commission'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['salary_plus_commission'], 0, ",", ".") : '$0' }}</td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['total_with_benefits'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['total_with_benefits'], 0, ",", ".") : '$0' }}</td>
                @php $monthIndex++; @endphp
              @else
                <td colspan="3"></td>
              @endif
            </tr>
            <tr>
              <td>SENA</td>
              <td style="text-align: right;">${{ number_format($sena, 0, ",", ".") }}</td>
              @if($monthIndex < count($monthly_data))
                <td style="text-align: center;"><b>{{ $monthly_data[$monthIndex]['month_name'] }}</b></td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['salary_plus_commission'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['salary_plus_commission'], 0, ",", ".") : '$0' }}</td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['total_with_benefits'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['total_with_benefits'], 0, ",", ".") : '$0' }}</td>
                @php $monthIndex++; @endphp
              @else
                <td colspan="3"></td>
              @endif
            </tr>
            <tr>
              <td>ICBF</td>
              <td style="text-align: right;">${{ number_format($icbf, 0, ",", ".") }}</td>
              @if($monthIndex < count($monthly_data))
                <td style="text-align: center;"><b>{{ $monthly_data[$monthIndex]['month_name'] }}</b></td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['salary_plus_commission'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['salary_plus_commission'], 0, ",", ".") : '$0' }}</td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['total_with_benefits'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['total_with_benefits'], 0, ",", ".") : '$0' }}</td>
                @php $monthIndex++; @endphp
              @else
                <td colspan="3"></td>
              @endif
            </tr>
            <tr>
              <td>Caja compensación</td>
              <td style="text-align: right;">${{ number_format($caja_compensacion, 0, ",", ".") }}</td>
              @if($monthIndex < count($monthly_data))
                <td style="text-align: center;"><b>{{ $monthly_data[$monthIndex]['month_name'] }}</b></td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['salary_plus_commission'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['salary_plus_commission'], 0, ",", ".") : '$0' }}</td>
                <td style="text-align: right;">{{ $monthly_data[$monthIndex]['total_with_benefits'] > 0 ? '$'.number_format($monthly_data[$monthIndex]['total_with_benefits'], 0, ",", ".") : '$0' }}</td>
                @php $monthIndex++; @endphp
              @else
                <td colspan="3"></td>
              @endif
            </tr>

            <!-- Fila de total -->
            <tr style="font-weight: bold; background-color: #000; color: #fff;">
              <td>TOTAL MES ACTUAL</td>
              <td style="text-align: right;">${{ number_format($base_salary + $commission_amount + $extra_hours_amount + $transport_allowance + ($dotacion_amount ?? 0) + $cesantias + $prima + $vacaciones + $eps_employer + $pension_employer + $arl + $sena + $icbf + $caja_compensacion, 0, ",", ".") }}</td>
              <td colspan="3"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tabla de detalle de comisiones -->
      {{-- @if(count($commission_details) > 0)
      <div style="margin-top: 15px;">
        <div style="background-color: #000; color: #fff; padding: 6px; font-weight: bold; font-size: 10px;">
          @php
            $startDate = \Carbon\Carbon::parse($period->payroll_period_start_date);
            $month = $startDate->month;
            $commissionLabel = ($month % 2 === 0) ? 'DETALLE AUXILIO DE RODAMIENTO' : 'DETALLE AUXILIO DE ALIMENTACIÓN';
          @endphp
          {{ $commissionLabel }}
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="border: 1px solid #000; padding: 4px; text-align: left;">Modelo</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: center;">Porcentaje</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: right;">Ganancias Totales</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: right;">
                @php
                  $commissionShortLabel = ($month % 2 === 0) ? 'Aux. Rodamiento' : 'Aux. Alimentación';
                @endphp
                {{ $commissionShortLabel }}
              </th>
            </tr>
          </thead>
          <tbody>
            @foreach($commission_details as $detail)
              <tr>
                <td style="border: 1px solid #ddd; padding: 4px;">{{ $detail->model_name }}</td>
                <td style="border: 1px solid #ddd; padding: 4px; text-align: center;">{{ number_format($detail->commission_percentage, 1) }}%</td>
                <td style="border: 1px solid #ddd; padding: 4px; text-align: right;">${{ number_format($detail->total_earnings, 0, ",", ".") }}</td>
                <td style="border: 1px solid #ddd; padding: 4px; text-align: right;">${{ number_format($detail->commission_amount, 0, ",", ".") }}</td>
              </tr>
            @endforeach

            <!-- Fila de total -->
            <tr style="font-weight: bold; background-color: #000; color: #fff;">
              <td style="border: 1px solid #000; padding: 4px;" colspan="3">TOTAL {{ $commissionShortLabel }}</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: right;">${{ number_format($commission_amount, 0, ",", ".") }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      @endif --}}
    </div>
  </div>
</body>
</html>
