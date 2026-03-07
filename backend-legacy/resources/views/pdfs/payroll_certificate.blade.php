<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado de Nómina</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 20px;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }

        .header h2 {
            color: #34495e;
            margin: 5px 0;
            font-size: 18px;
            font-weight: normal;
        }

        .header .period-info {
            background-color: #ecf0f1;
            padding: 10px;
            border-radius: 5px;
            margin-top: 15px;
            font-weight: bold;
            color: #2c3e50;
        }

        .employee-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid #3498db;
        }

        .employee-info h3 {
            margin-top: 0;
            color: #2c3e50;
            font-size: 16px;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 8px;
        }

        .employee-data {
            display: table;
            width: 100%;
        }

        .employee-row {
            display: table-row;
        }

        .employee-label {
            display: table-cell;
            font-weight: bold;
            width: 30%;
            padding: 5px 10px 5px 0;
            color: #34495e;
        }

        .employee-value {
            display: table-cell;
            padding: 5px 0;
            color: #2c3e50;
        }

        .concepts-section {
            margin-bottom: 25px;
        }

        .section-title {
            background-color: #2c3e50;
            color: white;
            padding: 12px;
            margin: 20px 0 0 0;
            font-weight: bold;
            text-align: center;
            font-size: 14px;
        }

        .concepts-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .concepts-table th {
            background-color: #34495e;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
        }

        .concepts-table td {
            border: 1px solid #bdc3c7;
            padding: 10px 8px;
            vertical-align: top;
        }

        .concepts-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }

        .concepts-table tr:hover {
            background-color: #e8f4f8;
        }

        .amount {
            text-align: right;
            font-weight: bold;
            font-family: 'Courier New', monospace;
        }

        .positive-amount {
            color: #27ae60;
        }

        .negative-amount {
            color: #e74c3c;
        }

        .total-row {
            background-color: #2c3e50 !important;
            color: white !important;
            font-weight: bold;
        }

        .total-row td {
            border-color: #2c3e50 !important;
            font-size: 13px;
        }

        .summary-boxes {
            display: table;
            width: 100%;
            margin-top: 25px;
        }

        .summary-box {
            display: table-cell;
            width: 33.33%;
            text-align: center;
            padding: 0 10px;
        }

        .summary-card {
            background-color: #ecf0f1;
            border-radius: 8px;
            padding: 15px;
            margin: 5px;
        }

        .devengado-card { border-left: 4px solid #27ae60; }
        .deduccion-card { border-left: 4px solid #e74c3c; }
        .neto-card { border-left: 4px solid #3498db; background-color: #d5dbdb; }

        .summary-label {
            font-size: 10px;
            color: #7f8c8d;
            text-transform: uppercase;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .summary-amount {
            font-size: 18px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
        }

        .devengado-amount { color: #27ae60; }
        .deduccion-amount { color: #e74c3c; }
        .neto-amount { color: #2c3e50; }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #bdc3c7;
            font-size: 10px;
            color: #7f8c8d;
            text-align: center;
        }

        .legal-notice {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin-top: 25px;
            font-size: 10px;
            color: #856404;
        }

        .percentage {
            font-size: 10px;
            color: #7f8c8d;
            font-style: italic;
        }

        @media print {
            body { margin: 0; padding: 15px; }
            .summary-box { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ strtoupper($studio->std_name) }}</h1>
        <h2>Certificado de Liquidación de Nómina</h2>
        <div class="period-info">
            Período: {{ strtoupper($period->payroll_period_start_date) }} - {{ strtoupper($period->payroll_period_end_date) }}
            ({{ ucfirst(strtolower($period->payroll_period_interval)) }})
        </div>
    </div>

    <div class="employee-info">
        <h3>Información del Empleado</h3>
        <div class="employee-data">
            <div class="employee-row">
                <div class="employee-label">Nombre Completo:</div>
                <div class="employee-value">{{ strtoupper($employee->fullName()) }}</div>
            </div>
            <div class="employee-row">
                <div class="employee-label">Identificación:</div>
                <div class="employee-value">{{ $employee->user_identification }}</div>
            </div>
            <div class="employee-row">
                <div class="employee-label">Cargo/Posición:</div>
                <div class="employee-value">{{ $employee->prof_name ?? 'Empleado' }}</div>
            </div>
            <div class="employee-row">
                <div class="employee-label">Fecha de Generación:</div>
                <div class="employee-value">{{ $generated_at->format('d/m/Y H:i:s') }}</div>
            </div>
        </div>
    </div>

    <div class="concepts-section">
        <div class="section-title">CONCEPTOS DEVENGADOS</div>
        <table class="concepts-table">
            <thead>
                <tr>
                    <th>Concepto</th>
                    <th>Base de Cálculo</th>
                    <th>Porcentaje</th>
                    <th>Valor</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Salario Base</td>
                    <td class="amount">${{ number_format($transaction->base_salary, 0, ',', '.') }}</td>
                    <td class="percentage">-</td>
                    <td class="amount positive-amount">${{ number_format($transaction->base_salary, 0, ',', '.') }}</td>
                </tr>
                @if($transaction->commission_amount > 0)
                <tr>
                    <td>Comisiones</td>
                    <td class="amount">-</td>
                    <td class="percentage">-</td>
                    <td class="amount positive-amount">${{ number_format($transaction->commission_amount, 0, ',', '.') }}</td>
                </tr>
                @endif
                <tr>
                    <td>Cesantías</td>
                    <td class="amount">${{ number_format($transaction->base_salary, 0, ',', '.') }}</td>
                    <td class="percentage">8.33%</td>
                    <td class="amount positive-amount">${{ number_format($transaction->cesantias, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td>Prima de Servicios</td>
                    <td class="amount">${{ number_format($transaction->base_salary, 0, ',', '.') }}</td>
                    <td class="percentage">8.33%</td>
                    <td class="amount positive-amount">${{ number_format($transaction->prima, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td>Vacaciones</td>
                    <td class="amount">${{ number_format($transaction->base_salary, 0, ',', '.') }}</td>
                    <td class="percentage">4.17%</td>
                    <td class="amount positive-amount">${{ number_format($transaction->vacaciones, 0, ',', '.') }}</td>
                </tr>
                @if($transaction->transport_allowance > 0)
                <tr>
                    <td>Auxilio de Transporte</td>
                    <td class="amount">SMMLV < 2</td>
                    <td class="percentage">-</td>
                    <td class="amount positive-amount">${{ number_format($transaction->transport_allowance, 0, ',', '.') }}</td>
                </tr>
                @endif
                @if($transaction->food_allowance > 0)
                <tr>
                    <td>Auxilio de Alimentación</td>
                    <td class="amount">-</td>
                    <td class="percentage">-</td>
                    <td class="amount positive-amount">${{ number_format($transaction->food_allowance, 0, ',', '.') }}</td>
                </tr>
                @endif
                @if($transaction->extra_hours_amount > 0)
                <tr>
                    <td>Horas Extras</td>
                    <td class="amount">-</td>
                    <td class="percentage">Variable</td>
                    <td class="amount positive-amount">${{ number_format($transaction->extra_hours_amount, 0, ',', '.') }}</td>
                </tr>
                @endif
                <tr class="total-row">
                    <td colspan="3"><strong>TOTAL DEVENGADO</strong></td>
                    <td class="amount"><strong>${{ number_format($transaction->total_devengado, 0, ',', '.') }}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="concepts-section">
        <div class="section-title">CONCEPTOS DEDUCIDOS</div>
        <table class="concepts-table">
            <thead>
                <tr>
                    <th>Concepto</th>
                    <th>Base de Cálculo</th>
                    <th>Porcentaje</th>
                    <th>Valor</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>EPS - Empleado</td>
                    <td class="amount">${{ number_format($transaction->base_salary, 0, ',', '.') }}</td>
                    <td class="percentage">4.00%</td>
                    <td class="amount negative-amount">${{ number_format($transaction->eps_employee, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td>Pensión - Empleado</td>
                    <td class="amount">${{ number_format($transaction->base_salary, 0, ',', '.') }}</td>
                    <td class="percentage">4.00%</td>
                    <td class="amount negative-amount">${{ number_format($transaction->pension_employee, 0, ',', '.') }}</td>
                </tr>
                <tr class="total-row">
                    <td colspan="3"><strong>TOTAL DEDUCCIONES</strong></td>
                    <td class="amount"><strong>${{ number_format($transaction->total_deducciones, 0, ',', '.') }}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="concepts-section">
        <div class="section-title">APORTES PATRONALES (INFORMATIVO)</div>
        <table class="concepts-table">
            <thead>
                <tr>
                    <th>Concepto</th>
                    <th>Base de Cálculo</th>
                    <th>Porcentaje</th>
                    <th>Valor</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>EPS - Empleador</td>
                    <td class="amount">${{ number_format($transaction->base_salary, 0, ',', '.') }}</td>
                    <td class="percentage">8.50%</td>
                    <td class="amount">${{ number_format($transaction->eps_employer, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td>Pensión - Empleador</td>
                    <td class="amount">${{ number_format($transaction->base_salary, 0, ',', '.') }}</td>
                    <td class="percentage">12.00%</td>
                    <td class="amount">${{ number_format($transaction->pension_employer, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td>ARL</td>
                    <td class="amount">${{ number_format($transaction->base_salary, 0, ',', '.') }}</td>
                    <td class="percentage">Variable</td>
                    <td class="amount">${{ number_format($transaction->arl, 0, ',', '.') }}</td>
                </tr>
                @if($transaction->sena > 0)
                <tr>
                    <td>SENA</td>
                    <td class="amount">${{ number_format($transaction->base_salary, 0, ',', '.') }}</td>
                    <td class="percentage">2.00%</td>
                    <td class="amount">${{ number_format($transaction->sena, 0, ',', '.') }}</td>
                </tr>
                @endif
                @if($transaction->icbf > 0)
                <tr>
                    <td>ICBF</td>
                    <td class="amount">${{ number_format($transaction->base_salary, 0, ',', '.') }}</td>
                    <td class="percentage">3.00%</td>
                    <td class="amount">${{ number_format($transaction->icbf, 0, ',', '.') }}</td>
                </tr>
                @endif
                @if($transaction->caja_compensacion > 0)
                <tr>
                    <td>Caja de Compensación</td>
                    <td class="amount">${{ number_format($transaction->base_salary, 0, ',', '.') }}</td>
                    <td class="percentage">4.00%</td>
                    <td class="amount">${{ number_format($transaction->caja_compensacion, 0, ',', '.') }}</td>
                </tr>
                @endif
            </tbody>
        </table>
    </div>

    <div class="summary-boxes">
        <div class="summary-box">
            <div class="summary-card devengado-card">
                <div class="summary-label">Total Devengado</div>
                <div class="summary-amount devengado-amount">${{ number_format($transaction->total_devengado, 0, ',', '.') }}</div>
            </div>
        </div>
        <div class="summary-box">
            <div class="summary-card deduccion-card">
                <div class="summary-label">Total Deducciones</div>
                <div class="summary-amount deduccion-amount">${{ number_format($transaction->total_deducciones, 0, ',', '.') }}</div>
            </div>
        </div>
        <div class="summary-box">
            <div class="summary-card neto-card">
                <div class="summary-label">Neto a Pagar</div>
                <div class="summary-amount neto-amount">${{ number_format($transaction->total_neto, 0, ',', '.') }}</div>
            </div>
        </div>
    </div>

    <div class="legal-notice">
        <strong>NOTA LEGAL:</strong> Este certificado de liquidación de nómina ha sido generado de acuerdo con la legislación laboral colombiana vigente.
        Los cálculos de prestaciones sociales, seguridad social y parafiscales se basan en los porcentajes establecidos por la ley.
        SMMLV utilizado: ${{ number_format($period->payroll_period_smmlv, 0, ',', '.') }}.
        Los aportes patronales se incluyen únicamente con fines informativos y son responsabilidad del empleador.
    </div>

    <div class="footer">
        <p><strong>{{ strtoupper($studio->std_name) }}</strong></p>
        <p>NIT: {{ strtoupper($studio->nitWithVerificationDigit() ?? 'No especificado') }} |
           Certificado generado el {{ $generated_at->format('d/m/Y') }} a las {{ $generated_at->format('H:i:s') }}</p>
        <p>Este documento es válido sin firma según el artículo 7° del Decreto 1070 de 2013</p>
    </div>
</body>
</html>
