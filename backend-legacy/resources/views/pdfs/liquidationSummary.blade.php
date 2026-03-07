<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>Resumen por páginas</title>
  <style>
    * { font-family: "sans-serif" !important; }
    h1, h2, h3, h4, h5 { text-align: center; }
    th, td { font-size: 12px; }
    .platform-title { font-size: 15px; font-weight: bold; margin-top: 20px; }
    .totals-row { font-weight: bold; background: #f0f0f0; }
    @page { margin: 40px 30px 60px 30px; }
    footer { position: fixed; bottom: -30px; left: 0; right: 0; height: 30px; text-align: right; font-size: 12px; color: #888; }
    .header-table th { background: #e0e0e0; }
  </style>
</head>
<body>
  <h1>{{ strtoupper($studio->std_company_name ?? 'EMPRESA') }}</h1>
  <h2>NIT: {{ strtoupper($studio->nitWithVerificationDigit()) }}</h2>
  <h3>RESUMEN POR PÁGINAS</h3>
  <p><b>DEL {{ strtoupper($period_since) }} AL {{ strtoupper($period_until) }}</b></p>
  <p><b>ESTADO:</b> {{ strtoupper($period_state) }}</p>
  <br>
  @foreach($summary as $platformName => $platformRows)
      <div class="platform-title">{{ strtoupper($platformName ?? 'PLATAFORMA') }}</div>
    @php $consecutivo = 1; @endphp
    <table border="1" cellspacing="0" cellpadding="2" style="width: 100%; margin-bottom: 10px;">
      <thead>
        <tr align="center" class="header-table">
          <th>No.</th>
          <th>Nick</th>
          <th>Mandante</th>
          <th>Tokens</th>
          <th>USD</th>
          <th>EUR</th>
          <th>%</th>
          <th>Neto</th>
          <th>Página</th>
        </tr>
      </thead>
      <tbody>
        @php
          $totalTokens = 0;
          $totalUsd = 0;
          $totalEur = 0;
          $totalNeto = 0;
        @endphp
        @foreach($platformRows as $row)
          <tr align="center">
            <td>{{ $consecutivo }}</td>
        <td>{{ strtoupper($row['modacc_username'] ?? '') }}</td>
        <td>{{ strtoupper($row['mandante'] ?? '') }}</td>
        <td>{{ number_format($row['sum_earnings_tokens'] ?? 0, 2, ',', '.') }}</td>
        <td>{{ number_format($row['sum_earnings_usd'] ?? 0, 2, ',', '.') }}</td>
        <td>{{ number_format($row['sum_earnings_eur'] ?? 0, 2, ',', '.') }}</td>
        <td>{{ isset($row['modstr_earnings_percent']) ? ($row['modstr_earnings_percent']*100).'%' : '' }}</td>
        <td>{{ number_format($row['sum_earnings_cop'] ?? 0, 0, ',', '.') }}</td>
        <td>{{ strtoupper($row['modacc_app'] ?? '') }}</td>
          </tr>
          @php
            $totalTokens += $row['sum_earnings_tokens'] ?? 0;
            $totalUsd += $row['sum_earnings_usd'] ?? 0;
            $totalEur += $row['sum_earnings_eur'] ?? 0;
            $totalNeto += $row['sum_earnings_cop'] ?? 0;
            $consecutivo++;
          @endphp
        @endforeach
      </tbody>
      <tfoot>
        <tr align="center" class="totals-row">
          <td colspan="3">Totales</td>
          <td>{{ number_format($totalTokens, 2, ',', '.') }}</td>
          <td>{{ number_format($totalUsd, 2, ',', '.') }}</td>
          <td>{{ number_format($totalEur, 2, ',', '.') }}</td>
          <td></td>
          <td>{{ number_format($totalNeto, 0, ',', '.') }}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  @endforeach
  <script type="text/php">
    if (isset($pdf)) {
        $pdf->page_script('
            if ($PAGE_COUNT > 1) {
                $font = $fontMetrics->get_font("Arial", "normal");
                $size = 10;
                $pageText = "Página " . $PAGE_NUM . " de " . $PAGE_COUNT;
                $pdf->text(500, 820, $pageText, $font, $size);
            }
        ');
    }
  </script>
</body>
</html>

<?php // Helper para Mandante
// Si no existe mandante en el row, intentar obtenerlo de la relación o concatenar user_name + user_surname si se pasa en el dataset
// Este helper puede ser reemplazado por lógica en el controlador si se requiere
