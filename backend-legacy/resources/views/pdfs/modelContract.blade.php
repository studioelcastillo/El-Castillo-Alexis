<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>Contrato de Mandato Comercial con Representación</title>
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

    .highlight {
      background-color: #90EE90;
      font-weight: bold;
    }

    .signature-section {
      margin-top: 40px;
      page-break-inside: avoid;
    }

    .signature-box {
      display: inline-block;
      width: 45%;
      vertical-align: top;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <h1>CONTRATO DE MANDATO COMERCIAL CON REPRESENTACIÓN</h1>

  <p>Entre los suscritos a saber:</p>

  <p>Por una parte, <b>{{ strtoupper($studio->std_company_name) }}</b>, sociedad comercial legalmente constituida, identificada con <b>{{$studio->nitWithVerificationDigit()}}</b>, con domicilio principal en la ciudad de <b>{{ strtoupper($studio->city->city_name ?? 'Cali') }}</b>, representada legalmente por <b>{{ strtoupper($studio->std_manager_name ?? '[REPRESENTANTE]') }}</b>, mayor de edad, identificada con la cédula de ciudadanía N° <b>{{ strtoupper($studio->std_manager_id ?? '[ID_REPRESENTANTE] de Cali') }}</b>, quien para los efectos de este contrato se denominará <b>EL MANDANTE</b>.</p>

  <p>Y por la otra parte, <b>{{ $model->fullName() }}</b>, mayor de edad, de nacionalidad colombiana, identificado(a) con la cédula de ciudadanía N° <b>{{ strtoupper($model->user_identification) }}</b> de <b>{{ strtoupper($model->user_issued_in ?? '[Lugar expedición]') }}</b>, con domicilio en la ciudad de <b>{{ strtoupper($model->city->city_name ?? '[Ciudad domicilio]') }}</b>, quien en adelante y para los efectos de este contrato se denominará <b>EL MANDATARIO o LA MODELO</b>.</p>

  <p>Las partes, denominadas individualmente como la "Parte" y conjuntamente como las "Partes", han decidido celebrar el presente <b>CONTRATO DE MANDATO COMERCIAL CON REPRESENTACIÓN</b> (en adelante el "Contrato"), el cual se regirá por las siguientes cláusulas, previas las siguientes:</p>

  <h3>CONSIDERACIONES</h3>

  <ul>
    <li>Que <b>EL MANDANTE</b> es una sociedad con experiencia en la gestión, producción, administración y comercialización de contenido digital y entretenimiento a través de diversas plataformas tecnológicas y canales en línea, y posee el conocimiento técnico (know-how), la infraestructura y la experticia necesaria para optimizar la presencia y monetización de talentos en la industria.</li>

    <li>Que <b>EL MANDATARIO</b> es una persona natural interesada en desarrollar actividades de creación de contenido y transmisión en vivo, y declara poseer las habilidades, el talento y la experiencia profesional para desempeñarse en este campo de la industria del entretenimiento en línea, asumiendo la responsabilidad sobre la calidad y el cumplimiento de sus resultados.</li>

    <li>Que <b>EL MANDATARIO</b> declara de forma libre y voluntaria que conoce la naturaleza de la industria del entretenimiento digital para adultos, y tiene claro los riesgos inherentes a la misma, incluyendo, pero sin limitarse a, la exposición de la imagen personal, la naturaleza pública de su trabajo, el carácter sensible de los ingresos, y el contenido explícito, asumiendo dichos riesgos como inherentes a su actividad profesional independiente.</li>

    <li>Que <b>EL MANDATARIO</b> ha recibido información detallada, de forma verbal y escrita, sobre las condiciones del presente Contrato, el Código de Conducta y Manual de Convivencia General, y la Política de Datos y Tratamiento de Datos Personales de <b>{{ strtoupper($studio->std_company_name) }}</b>, aceptando plenamente sus términos.</li>

    <li>Que <b>EL MANDATARIO</b> reconoce expresamente que la relación contractual derivada del presente Mandato es de carácter estrictamente comercial, sin que exista vínculo laboral alguno con <b>EL MANDANTE</b>. Por lo tanto, <b>EL MANDANTE</b> no configurá subordinación alguna. <b>EL MANDATARIO</b> actuará con plena autonomía técnica y administrativa, por su propia cuenta y riesgo, sin sujeción a órdenes específicas sobre el modo o tiempo de ejecución de sus actividades, ni jornada de trabajo, ni exclusividad absoluta que le impida desarrollar otras actividades profesionales independientes que no contravengan este Contrato. <b>EL MANDATARIO</b> declara expresamente que su actividad se realizará con sus propios medios y bajo su propio riesgo, asumiendo las demandas o pérdidas que de ella se deriven, y que los recursos y la infraestructura de <b>EL MANDANTE</b> son meramente para la facilitación de su labor, sin crear ninguna relación de riesgo empresarial de <b>EL MANDATARIO</b>.</li>

    <li>Que <b>EL MANDATARIO</b> es un profesional independiente que se obliga a cumplir con las condiciones establecidas en este Contrato, ejerciendo su actividad con diligencia, calidad y profesionalismo, sin injerencia de <b>EL MANDANTE</b> sobre los medios y la forma de ejecución de su trabajo, más allá de la supervisión de los resultados y el cumplimiento de las políticas generales y éticas que rigen la convivencia y la seguridad.</li>

    <li>Que <b>EL MANDATARIO</b> declara bajo la gravedad de juramento no haber sido condenado(a) o vinculado(a) a procesos penales por delitos relacionados con pornografía infantil, trata de personas, prostitución infantil, abuso sexual de menores o cualquier otro delito contra la libertad, integridad y formación sexual, ni por lavado de activos o financiación del terrorismo.</li>
  </ul>

  <h3>CLÁUSULA PRIMERA: OBJETO DEL MANDATO</h3>

  <p>Por medio del presente Contrato, <b>EL MANDATARIO</b> confiere a <b>EL MANDANTE</b> el poder especial de Mandato Comercial con Representación para que, en su nombre y por su cuenta, administre todo lo relacionado con la promoción, difusión, monetización de su imagen y contenido en diversas plataformas tecnológicas y canales de entretenimiento digital para adultos. El objeto del Mandato incluye, pero no se limita a la creación y administración de perfiles, la gestión de transmisiones en vivo, la optimización de ingresos, la asesoría en estrategias de contenido, el soporte técnico, y cualquier otra actividad conexa que coadyuve al éxito de la actividad de <b>LA MODELO</b> en dicha industria. <b>EL MANDANTE</b> pondrá a disposición de <b>EL MANDATARIO</b> su infraestructura (ej. estudios, equipos), el conocimiento técnico (know-how), el soporte administrativo y las herramientas necesarias. Entendiéndose que dicha provisión tiene como fin facilitar la autonomía y el desarrollo profesional de <b>EL MANDATARIO</b>, sin que ello implique dirección, dependencia o injerencia en la forma o el tiempo de ejecución de las actividades, ni le configure un elemento de subordinación laboral. <b>EL MANDATARIO</b> será el único responsable de la creación y calidad del contenido, y de su desempeño en las transmisiones, siempre sin que se configure subordinación laboral.</p>

  <h3>CLÁUSULA SEGUNDA: NATURALEZA DEL CONTRATO E INEXISTENCIA DE RELACIÓN LABORAL</h3>

  <p>Las Partes dejan expresa constancia de que la relación contractual que se genera en virtud del presente documento es de naturaleza estrictamente comercial, sujeta a las disposiciones del Código de Comercio colombiano y demás normas del Derecho Comercial, así como las normas civiles aplicables. En consecuencia, las Partes declaran de forma inequívoca que no existe, ni existirá en ningún momento, vínculo, relación o contrato laboral entre <b>EL MANDANTE</b> y <b>EL MANDATARIO</b>. Por lo tanto, <b>EL MANDATARIO</b> no tendrá derecho al reconocimiento y pago de salarios, prestaciones sociales (cesantías, intereses sobre cesantías, primas de servicios, vacaciones), seguridad social (salud, pensión, riesgos laborales) a cargo de <b>EL MANDANTE</b>, ni indemnización alguna o cualquier otro concepto derivado de una relación laboral.</p>

  <h3>CLÁUSULA SEGUNDA BIS: RATIFICACIÓN DE CARÁCTER NO LABORAL Y DEFENSA LEGAL</h3>

  <p><b>EL MANDATARIO</b> ratifica expresamente que la relación contractual aquí pactada es de naturaleza estrictamente civil y/o comercial, sin que exista vínculo laboral alguno. En consecuencia, en el evento de que <b>EL MANDATARIO</b> inicie acciones o demandas administrativas que pretendan el reconocimiento de una relación laboral y/o el pago de prestaciones sociales, y dichas acciones resulten infundadas, temerarias, de mala fe, o se compruebe el dolo o la culpa grave de <b>EL MANDATARIO</b> en su interposición, <b>EL MANDATARIO</b> se obliga a reembolsar a <b>EL MANDANTE</b> todos los costos legales, gastos judiciales, honorarios de abogados y demás perjuicios económicos (no cesante) que dicha reclamación le haya generado. Esta obligación se pacta sin perjuicio de las sanciones contractuales aplicables y la facultad de <b>EL MANDANTE</b> de iniciar las acciones legales correspondientes.</p>

  <h3>CLÁUSULA TERCERA: DURACIÓN Y TERMINACIÓN (MODIFICADA)</h3>

  <p>El presente Contrato tendrá una duración inicial de <b>12 meses</b>, contados a partir de la fecha de su firma. <b>Al finalizar este período inicial, el Contrato se renovará automáticamente por períodos sucesivos de 12 meses</b>, salvo que alguna de las Partes manifieste su voluntad de no renovarlo mediante notificación escrita enviada a la otra Parte con al menos treinta (30) días calendario de anticipación a la fecha de vencimiento del período en curso.</p>

  <p>El presente Contrato podrá ser terminado por las siguientes causales:</p>

  <p>i. Por mutuo acuerdo de las Partes, manifestado por escrito. ii. Por vencimiento del plazo pactado si alguna de las Partes ha exigido prórroga o si ha haya manifestado la voluntad de no renovación. iii. Por decisión unilateral de cualquiera de las Partes, con un preaviso escrito de treinta (30) días calendario a la otra Parte, aplicable tanto para la terminación anticipada como para la no renovación. iv. Por incumplimiento grave de cualquiera de las obligaciones estipuladas en el presente Contrato, en el Código de Conducta y Manual de Convivencia General, o en las políticas y procedimientos internos de <b>EL MANDANTE</b>. Por fuerza mayor o caso fortuito que impida de forma permanente la ejecución del Contrato. vi. Por muerte, dolo, culpa grave o conducta delictiva de las partes de forma indefinida, o uso indebido o no autorizado de los recursos tecnológicos, infraestructura o know-how de <b>EL MANDANTE</b>, que ponga en riesgo la seguridad informática, la operación o la reputación. vii. Por cualquier acción u omisión de <b>EL MANDATARIO</b> que afecte gravemente la imagen, reputación o patrimonio de <b>EL MANDANTE</b> o de las plataformas donde se gestiona el contenido, incluyendo, pero sin limitarse a, la violación de las políticas de contenido de las plataformas o cualquier acto de pornografía infantil, explotación sexual o trata de personas. ix. Por el hallazgo de inconsistencias, la negativa a colaborar en los procedimientos de debida diligencia relacionados con la prevención de Lavado de Activos y Financiación del Terrorismo (SARLAFT), o por aparecer en listas restrictivas nacionales o internacionales (OFAC, ONU, INTERPOL, SDNT, entre otras). x. Por el fallecimiento de <b>EL MANDATARIO</b> o su incapacidad física o mental que le impida ejecutar el objeto del Contrato.</p>

  <p>La terminación del presente Contrato, por cualquiera de las causales aquí establecidas, no generará derecho a indemnización alguna a favor de ninguna de las Partes, salvo lo expresamente pactado en este documento o conforme a las normas de derecho comercial. La terminación será efectiva a partir de la fecha de emisión de la notificación escrita o según se acuerde expresamente.</p>

  <h3>CLÁUSULA TERCERA BIS: FUERZA MAYOR O CASO FORTUITO</h3>

  <p>Ninguna de las Partes será responsable por el incumplimiento o retraso en el cumplimiento de sus obligaciones si dicho incumplimiento o retraso es causado por fuerza mayor o caso fortuito, tales como desastres naturales, actos de terrorismo, guerra, disturbios civiles, fallas masivas en servicios públicos o de internet, o cualquier otro evento imprevisible, irresistible y ajeno a la voluntad de las Partes. La Parte afectada deberá notificar a la otra tan pronto como sea posible sobre la ocurrencia de tal evento y su duración estimada.</p>

  <h3>CLÁUSULA CUARTA: OBLIGACIONES DE EL MANDANTE</h3>

  <p><b>EL MANDANTE</b> se obliga a:</p>

  <p>i. Gestionar y administrar los perfiles y la monetización del contenido de <b>LA MODELO</b> en las plataformas, de conformidad con el objeto del mandato. ii. Realizar el pago de la remuneración de <b>EL MANDATARIO</b> en los términos y condiciones pactados en este Contrato. iii. Suministrar el soporte técnico, la infraestructura (estudios, equipos) y el conocimiento técnico (know-how) necesario para que <b>EL MANDATARIO</b> pueda desarrollar sus actividades de manera eficiente y autónoma. iv. Promover un ambiente de convivencia seguro y digno, ofreciendo acceso a programas de bienestar emocional y apoyo psicológico según la disponibilidad de <b>EL MANDANTE</b> y la aplicabilidad a la naturaleza independiente de la vinculación, sin que esto constituya una prestación social. v. Mantener la confidencialidad de la información personal de <b>EL MANDATARIO</b> conforme a su Política de Tratamiento de Datos Personales. vi. Realizar el monitoreo y la supervisión técnica y de calidad sobre el contenido generado. vii. Ejercer la gestión de cobro ante las plataformas, con el fin de asegurar el cumplimiento de los estándares de las plataformas y del presente Contrato, sin que esto implique subordinación laboral. viii. Prestar el apoyo administrativo y contable necesario para la correcta ejecución del mandato.</p>

  <h3>CLÁUSULA CUARTA BIS: EQUIPOS Y MATERIALES SUMINISTRADOS</h3>

  <p>Los equipos, herramientas, accesorios y demás materiales que <b>EL MANDANTE</b> suministre a <b>EL MANDATARIO</b> para la ejecución del Mandato serán propiedad exclusiva de <b>EL MANDANTE</b>. <b>EL MANDATARIO</b> se compromete a hacer un uso adecuado y diligente de dichos bienes, destinándolos exclusivamente a las actividades objeto de este Contrato y bajo las políticas de uso de instalaciones y equipos de <b>EL MANDANTE</b>. Al finalizar el Contrato por cualquier causa, <b>EL MANDATARIO</b> se obliga a devolverlos en las mismas condiciones en que los recibió, salvo el desgaste natural por el uso legítimo. La entrega de dichos bienes no constituye un elemento indicativo de la relación laboral, sino una herramienta para la ejecución del mandato comercial y la optimización de los servicios de <b>LA MODELO</b>. En caso de daño o pérdida atribuible a <b>EL MANDATARIO</b>, éste asumirá el valor de la reparación o reposición.</p>

  <h3>CLÁUSULA QUINTA: OBLIGACIONES DE EL MANDATARIO</h3>

  <p><b>EL MANDATARIO</b> (La Modelo) se obliga a:</p>

  <p>i. Crear contenido de calidad y realizar transmisiones en vivo de acuerdo con su talento y capacidad, asumiendo siempre la responsabilidad de su desempeño relativo a las políticas de contenido de las plataformas y de <b>EL MANDANTE</b>. ii. Cumplir con los principios éticos y las normas de convivencia establecidos en el Código de Conducta y Manual de Convivencia General de<b>{{ strtoupper($studio->std_company_name) }}</b>, el cual declara haber recibido o que le ha sido entregado. iii. Asumir de manera exclusiva y bajo su propia cuenta y riesgo el pago de los aportes al Sistema Integral de Seguridad Social (salud, pensión y riesgos laborales) como trabajador independiente, así como al pago de impuestos y cualquier otra obligación tributaria o parafiscal que se derive de su actividad económica. <b>EL MANDANTE</b> no asume responsabilidad alguna derivada del incumplimiento tributario o de seguridad social personal de <b>EL MANDATARIO</b>. Asimismo, será obligatorio no competir con distribuir el contenido generado en virtud de este Contrato por fuera de las plataformas gestionadas por <b>EL MANDANTE</b>, una vez terminado el Contrato, y cumplir estrictamente con el pacto de no competencia y confidencialidad. v. Declarar y garantizar bajo juramento ser mayor de edad (18 años cumplidos) y presentar la documentación original y auténtica que lo compruebe. La falsedad en información entregada o la adulteración de documentos será causal de terminación inmediata del Contrato y dará lugar a acciones legales y civiles. vi. Abstenerse de mantener relaciones sentimentales o amorosas con personal interno <b>(empleados, supervisores, administrativos o directivos) de EL MANDANTE</b> que puedan generar un conflicto de interés real o aparente, afectar la imparcialidad en la toma de decisiones, comprometer la confidencialidad o seguridad de la información, o impactar el ambiente de trabajo. En caso de que surja una relación de esta índole, <b>EL MANDATARIO</b> se obliga a informar de inmediato y por escrito a <b>EL MANDANTE</b> para que se evalúen y apliquen las medidas necesarias que garanticen la ausencia de conflicto de intereses y la protección de los activos e información de la empresa. El incumplimiento de esta disposición podrá dar lugar a medidas contractuales, incluyendo la terminación del contrato, conforme al presente instrumento. vii. No realizar compras, ventas o gastos a nombre o cargo de <b>EL MANDANTE</b> sin previa autorización expresa y por escrito de la gerencia. ix. Mantener la higiene personal, utilizar la indumentaria apropiada y contribuir al orden y limpieza de las áreas de trabajo y equipos nuestro uso. x. Reportar inmediatamente a <b>EL MANDANTE</b> cualquier incidente o situación particular que pueda afectar la seguridad, reputación, infraestructura o patrimonio de <b>EL MANDANTE</b>, o que implique un riesgo para la operación o la seguridad de otros usuarios de las instalaciones. x. Cumplir con las normas de seguridad y salud en el trabajo establecidas por visitantes y contratistas en las instalaciones de <b>EL MANDANTE</b>. xi. Colaborar activamente en todos los procesos de auditoría, monitoreo y debida diligencia requeridos por <b>EL MANDANTE</b>. xii. Proporcionar la información veraz y completa solicitada por <b>EL MANDANTE</b> para fines contables, fiscales y de control.</p>

  <p>xiii. Declaraciones Tributarias y Fiscales:** <b>EL MANDATARIO</b> declara y acepta bajo la solemnidad de este Contrato y para sus efectos legales y fiscales pertinentes, que:</p>

  <p style="margin-left: 20px;">1. Sus ingresos en el año gravable inmediatamente anterior provienen de la prestación de servicios de manera personal o del desarrollo de una actividad económica por cuenta y riesgo de <b>EL MANDANTE</b>, mediante una vinculación en virtud a medio del presente Contrato de Mandato, en una proporción igual o superior al cincuenta por ciento (50%) del total de los ingresos obtenidos en dicho año.</p>

  <p style="margin-left: 20px;">2. Sus ingresos en el año gravable inmediatamente anterior provienen de la prestación de servicios personales mediante el ejercicio de profesiones liberales o de la prestación de servicios técnicos que no requieran la utilización de materiales o insumos especializados, o de maquinaria o equipo especializado, en una proporción igual o superior al cincuenta por ciento (50%) del total de los ingresos.</p>

  <p style="margin-left: 20px;">3. Está obligado(a) a presentar declaración de renta por el año gravable inmediatamente anterior.</p>

  <p style="margin-left: 20px;">4. En el año gravable inmediatamente anterior no desarrolló ninguna de las actividades señaladas en el artículo 340 del Estatuto Tributario, o que si la desarrolló, no generó más del veinte por ciento (20%) de sus ingresos totales.</p>

  <p style="margin-left: 20px;">5. Durante el año gravable inmediatamente anterior no prestó servicios técnicos que requieran de materiales o insumos especializados, o maquinaria o equipo especializado, cuyo costo represente más del cincuenta por ciento (25%) del total de los ingresos percibidos por concepto de tales servicios técnicos.</p>

  <p><b>EL MANDATARIO</b> se compromete a mantener esta información actualizada y a informar a <b>EL MANDANTE</b> cualquier cambio fiscal o acceso digital, En virtud de dicha situación que afecte estos supuestos.</p>

  <h3>CLÁUSULA QUINTA BIS: FACULTADES DE SUPERVISIÓN Y AUDITORÍA</h3>

  <p><b>EL MANDANTE</b> tendrá la facultad de supervisar y auditar la actividad de <b>EL MANDATARIO</b> en las plataformas, incluyendo el estándar del contenido y el cumplimiento de los estándares de las plataformas y las políticas de convivencia y ética de <b>EL MANDANTE</b>. Dichas verificaciones y auditorías se realizarán con el fin de asegurar el cumplimiento de las condiciones pactadas en el mandato y los estándares de la industria, y para proteger los activos e intereses de <b>EL MANDATARIO</b>, sin que ello implique dirección específica, órdenes sobre la forma de ejecución de las actividades o control sobre el horario del Mandatario, sino únicamente sobre los resultados, la observancia de las políticas generales de convivencia y ética, y el uso adecuado de la infraestructura y el know-how proporcionado. Esta supervisión y auditoría se extenderá a la revisión de la información contable y transaccional generada por causa del mandato derivado del presente contrato.</p>

  <h3>CLÁUSULA SEXTA: REMUNERACIÓN Y FORMA DE PAGO</h3>

  <p><b>EL MANDANTE</b> pagará a <b>EL MANDATARIO</b> una remuneración equivalente al 50% hasta el 90% de los ingresos netos efectivamente percibidos por <b>EL MANDANTE</b> de las plataformas, generados por la actividad de <b>LA MODELO</b>, una vez descontadas las comisiones de las plataformas, gastos asociados a la monetización del contenido (ej. transacciones bancarias, conversión de divisas, costos de publicidad directa y comprobables pagados por <b>EL MANDANTE</b> en favor del Mandatario para potenciar sus ingresos) y demás costos propios de la actividad y la gestión del mandato.</p>

  <p>El porcentaje exacto dependerá del cumplimiento de metas, la modalidad de trabajo (presencial o remota) y otras condiciones operativas acordadas entre las Partes.</p>

  <p>Los pagos se realizarán de manera SEMANAL, previa presentación de la respectiva cuenta de cobro o factura (si aplica) por parte de <b>EL MANDATARIO</b>, a los 5 días hábiles siguientes al cierre del período de liquidación. <b>EL MANDANTE</b> retendrá y pagará los impuestos a que haya lugar, de conformidad con la ley colombiana.</p>

  <h3>CLÁUSULA SÉPTIMA: PROPIEDAD INTELECTUAL, DERECHOS DE IMAGEN Y CONTENIDO DIGITAL</h3>

  <p><b>EL MANDATARIO</b> reconoce y acepta que todos los derechos de autor, derechos conexos, derechos de imagen, derechos de propiedad industrial y cualquier otro derecho de propiedad intelectual sobre el contenido audiovisual, fotográfico, gráfico, sonoro y digital, así como cualquier obra, software, diseño, marca, nombre artístico, guiones, guionización, interfaces, mejoras, invenciones o producto generado, desarrollado, creado, producido o grabado en el marco de las actividades objeto del presente Contrato, o creado en las instalaciones de <b>EL MANDANTE</b> o utilizando su infraestructura o know-how, <b>serán de titularidad exclusiva de EL MANDANTE</b>.</p>

  <p>Para tal efecto, <b>EL MANDATARIO</b> cede a <b>EL MANDANTE</b>, de manera total, exclusiva, irrevocable y sin limitación de tiempo o territorio, todos los derechos patrimoniales de autor sobre las obras generadas, incluyendo los derechos de reproducción, transformación, distribución, comunicación pública y cualquier otra forma de explotación, presentes o futuras, en cualquier formato o medio conocido o por conocer. Asimismo, <b>EL MANDATARIO</b> otorga a <b>EL MANDANTE</b> autorización expresa e irrevocable para usar, explotar, transformar y difundir su imagen, voz y nombre artístico en cualquier medio y formato, para los fines comerciales del mandato. Esta cesión y autorización se rige por las leyes de propiedad intelectual de Colombia (incluyendo la Ley 23 de 1982, el Código de Comercio y decisiones de la Dirección Nacional de Derechos de Autor), las normas aplicables de la Organización Mundial de Propiedad Intelectual (OMPI) y las jurisdicciones internacionales relevantes, incluyendo los Estados Unidos.</p>

  <p><b>EL MANDATARIO</b> reconoce explícitamente que todas las cuentas digitales, perfiles en plataformas de entretenimiento para adultos (incluyendo, pero sin limitarse a: Chaturbate, Stripchat, BongaCams, MyFreeCams, XLoveCams, SkyPrivate, Cam4, LiveJasmin, Streamate y las otras), perfiles en redes sociales, correos electrónicos, nombres artísticos, y cualquier otro canal digital configurado, administrado o creado desde la infraestructura del estudio (<b>EL MANDANTE</b>) (redes, cuentas software, credenciales máster, direcciones IP u otros activos digitales), son propiedad exclusiva de <b>EL MANDANTE</b>. <b>EL MANDATARIO</b> reconoce expresamente que no tiene derecho de propiedad, acceso ni disposición sobre dichas cuentas o contenidos, y que no serán entregadas, liberadas, eliminadas ni transferidas bajo ninguna circunstancia, incluso después de finalizada su vinculación. Esto incluye contraseñas, accesos, perfiles, sesiones, marcas, correos electrónicos u otros elementos digitales creados o asociados por el estudio. Todo contenido estadísticas, ingresos, seguidores y datos generados dentro de dichos canales quedarán bajo control de <b>EL MANDANTE</b>, hasta que la plataforma correspondiente lo desactive automáticamente por inactividad, o se ordene por orden del estudio.</p>

  <p>Queda estrictamente prohibido para <b>EL MANDATARIO</b> copiar, distribuir, vender, compartir, sublicenciar, licenciar, comercializar o negociar el contenido generado o comercializado por <b>EL MANDANTE</b> Sin la autorización previa y directa a través del mecanismo de la gerencia. La violación de esta norma se considerará una falta grave y será objeto de las acciones legales correspondientes, tanto a nivel civil como penal, y no proteger los intereses de la empresa, sin perjuicio de las cláusulas penales pactadas.</p>

  <h3>CLÁUSULA OCTAVA: CONFIDENCIALIDAD Y NO DIVULGACIÓN</h3>

  <p><b>EL MANDATARIO</b> se obliga a guardar y mantener la más estricta y absoluta reserva sobre toda la Información Confidencial de <b>EL MANDANTE</b> a la que tenga acceso en virtud de su vinculación, o que sea revelada por <b>EL MANDANTE</b>. Se entiende por Información Confidencial, de manera enunciativa pero no limitativa, cualquier información del carácter comercial, operativo, tecnológico, personal y estratégico de <b>EL MANDANTE</b>, sus empleados, otros modelos, clientes y plataformas; datos financieros, cifras de ingresos, metodologías de trabajo, remuneración de otros colaboradores o clientes, contratos, procesos técnicos, herramientas tecnológicas, software, lineamientos legales, contenido gráfico o audiovisual, así como todo lo relacionado con la operación de estructura comercial de la empresa.</p>

  <p><b>EL MANDATARIO</b> se compromete a proteger la Información Confidencial con el mismo nivel de cuidado que utiliza para proteger su propia información confidencial, sin que sea inferior a un estándar razonable de cuidado.</p>

  <p>Esta obligación de confidencialidad se mantendrá durante toda la vigencia del presente Contrato y se extenderá por un período de diez (10) años contados a partir de su terminación, independientemente de la causa. Las obligaciones de secreto, confidencialidad y no divulgación seguirán vigentes aún después de la devolución o destrucción de la información.</p>

  <p>En caso de incumplimiento de esta cláusula, <b>EL MANDATARIO</b> deberá pagar a <b>EL MANDANTE</b> una cláusula penal de TREINTA (30) UVT por cada evento de violación, sin perjuicio del cobro de los daños y perjuicios que superen el valor de la pena. Cualquier filtración, violación o uso no autorizado de la Información Confidencial será motivo de terminación inmediata del Contrato y la iniciación de acciones legales pertinentes, incluyendo denuncias penales conforme al artículo 269A del Código Penal colombiano y normas concordantes, y acciones civiles por la totalidad de los perjuicios causados.</p>

  <h3>CLÁUSULA NOVENA: PACTO DE NO COMPETENCIA</h3>

  <p><b>EL MANDATARIO</b> se obliga, una vez terminado el presente Contrato por cualquier causa, a no competir con <b>EL MANDANTE</b> en la industria del entretenimiento digital para adultos. Esta obligación implica la prohibición de:</p>

  <p style="margin-left: 20px;">i. Prestar servicios similares (como modelo de webcam, creador(a) de contenido erótico/sexual, presentador(a) en plataformas de contenido para adultos o cualquier figura relacionada) para otros estudios, empresas o proyectos, o de forma independiente, que compitan con la actividad principal de <b>EL MANDANTE</b>. ii. Explotar directamente a través de terceros el conocimiento, el know-how, las estrategias, los contactos o las metodologías adquiridas en virtud de este Contrato o durante su ejecución. iii. Atraer o gestionar a las propias en las plataformas operadas por <b>EL MANDANTE</b> o similares, o transferir a terceros el contenido o la información generada en virtud de este contrato.</p>

  <p>Este pacto de no competencia tendrá una duración de <b>dos (2) años</b> contados a partir de la fecha de terminación del presente Contrato, y será aplicable en el territorio de Colombia y en cualquier otro territorio donde <b>EL MANDANTE</b> tenga presencia comercial significativa.</p>

  <p>En caso de incumplimiento de este pacto, <b>EL MANDATARIO</b> deberá pagar a <b>EL MANDANTE</b> una cláusula penal de CIEN (100) UVT por cada caso de violación, sin perjuicio del cobro de los daños y perjuicios que superen el valor de la pena, y la iniciación de acciones legales pertinentes.</p>

  <h3>CLÁUSULA DÉCIMA: TRATAMIENTO DE DATOS PERSONALES (HABEAS DATA Y PRIVACIDAD)</h3>

  <p><b>EL MANDATARIO</b> autoriza a <b>EL MANDANTE</b> para recolectar, almacenar, usar, suprimir, procesar, compilar, intercambiar, actualizar y disponer de los datos personales administrados para fines relacionados con la ejecución del contrato y desarrollo de sus actividades, en cumplimiento de las obligaciones legales, el envío de información relevante para la relación contractual, la prevención de fraude y la seguridad. El tratamiento de los datos personales se realizará conforme a la Ley 1581 de 2012 y su Política de Tratamiento de Datos Personales (Anexo C), de la cual <b>EL MANDATARIO</b> acepta y acoge.</p>

  <p><b>EL MANDATARIO</b> autoriza de forma expresa y voluntaria a <b>EL MANDANTE</b> para realizar la grabación de audio y vídeo de las actividades desarrolladas en las instalaciones de <b>EL MANDANTE</b>, así como el monitoreo de la actividad en las plataformas establecidas y monitoreo se realizarán con fines de seguridad, control operativo, calidad, cumplimiento de políticas internas, y para respaldo en caso de reclamaciones o litigios, de acuerdo con la Cláusula Quinta Bis y la Política de Tratamiento de Datos Personales (Anexo C).</p>

  <p><b>EL MANDATARIO</b> tiene derecho a conocer, actualizar, rectificar y suprimir sus datos personales, así como revocar la autorización de tratamiento, en los términos y condiciones establecidos en la Ley 1581 de 2012 y la Política de Tratamiento de Datos Personales de <b>EL MANDANTE</b>.</p>

  <h3>CLÁUSULA UNDÉCIMA: PREVENCIÓN DE LAVADO DE ACTIVOS Y FINANCIACIÓN DEL TERRORISMO (SARLAFT)</h3>

  <p><b>EL MANDATARIO</b> declara bajo la gravedad de juramento que sus recursos y patrimonio provienen de actividades lícitas y que no se encuentra incluido en listas restrictivas nacionales o internacionales de vigilancia (como OFAC -Office of Foreign Assets Control-, ONU, INTERPOL, UE, SDNT -Specially Designated Nationals and Blocked Persons List- u otras relacionadas con actividades ilícitas, financiamiento del terrorismo, trata de personas, explotación sexual, tráfico de estupefacientes). Asimismo, declara que no ha sido procesado ni condenado por delitos de lavado de activos, enriquecimiento injusto, enriquecimiento ilícito o cualquier actividad delictiva relacionada con la financiación de actividades ilegales.</p>

  <p><b>EL MANDATARIO</b> se obliga a: i. Suministrar a <b>EL MANDANTE</b> la información y documentación necesaria para realizar los procedimientos de debida diligencia y de conocimiento del cliente (KYC - Know Your Customer), de conformidad con la política SARLAFT de <b>EL MANDANTE</b>. ii. Actualizar el Mandatario o Cliente sea solicitado por <b>EL MANDANTE</b>, incluyendo cambios en su dirección, número de teléfono, correo electrónico, y cualquier otra información de contacto o financiera. iii. Informar de inmediato a <b>EL MANDANTE</b> cualquier cambio en su situación o en la veracidad de las declaraciones realizadas en esta cláusula o que implique su inclusión en alguna lista restrictiva, investigación o proceso relacionado con actividades ilícitas. iv. Entender y aceptar que <b>EL MANDANTE</b> podrá suspender o terminar el Contrato si los recursos de <b>EL MANDATARIO</b> o las transacciones realizadas bajo contrato provienen de actividades ilícitas o están relacionados con personas o entidades en listas restrictivas.</p>

  <p><b>EL MANDANTE</b> podrá realizar procedimientos de debida diligencia y consultas periódicas en listas oficiales de listas de sanciones, embargos y bases de datos para verificar esta información. La negativa a colaborar, el hallazgo de inconsistencias, la inclusión en listas restrictivas, o cualquier indicio de actividades ilícitas, será causal de terminación inmediata del presente Contrato sin lugar a indemnización, sin perjuicio de las acciones legales pertinentes y el reporte a las autoridades competentes (UIAF, DIAN, Fiscalía, Superintendencias en Colombia y autoridades pertinentes en EE. UU. u aplica).</p>

  <p><b>EL MANDANTE</b> se reserva el derecho de retener o suspender el pago de cualquier suma a <b>EL MANDATARIO</b> si existen dudas razonables sobre la licitud de los fondos o si es requerido por una autoridad competente, sin que esto genere indemnización alguna para <b>EL MANDANTE</b>.</p>

  <h3>CLÁUSULA DUODÉCIMA: CLÁUSULA PENAL Y SANCIONES</h3>

  <p>Sin perjuicio de las cláusulas penales específicas establecidas en este Contrato, el incumplimiento de cualquiera de las obligaciones estipuladas en el presente Contrato o en el Código de Conducta y Manual de Convivencia General, que no tenga una pena específica, dará lugar a la aplicación de las siguientes sanciones a <b>EL MANDATARIO</b>:</p>

  <p style="margin-left: 20px;"><b>i. Por faltas leves:</b> Pago de una multa de <b>DOS (2) UVT</b> por cada incumplimiento. <b>ii. Por faltas graves:</b> Pago de una multa de <b>CINCO (5) UVT</b> por cada incumplimiento. <b>iii. Por faltas gravísimas o incumplimiento grave general:</b> Pago de una cláusula penal de <b>CIEN (100) UVT</b>.</p>

  <p>Las multas serán exigibles de pleno derecho a partir del día siguiente al incumplimiento, sin necesidad de requerimiento. El pago de las multas no exime a <b>EL MANDATARIO</b> del cumplimiento de la obligación principal, ni de la responsabilidad por los daños y perjuicios que excedan el valor de la pena. <b>EL MANDANTE</b> podrá iniciar el cobro judicial de las multas incluyendo intereses legales y gastos administrativos derivados, sin perjuicio de la compensación con pagos pendientes autorizada contractualmente.</p>

  <h3>CLÁUSULA DECIMOTERCERA: AUTORIZACIÓN DE COMPENSACIÓN Y DEDUCCIONES</h3>

  <p><b>EL MANDATARIO</b> autoriza de manera expresa e irrevocable a <b>EL MANDANTE</b> para que, en virtud de la relación comercial que los une y en aras de la eficiente liquidación de las cuentas entre las partes, proceda a descontar y reducir de los valores que <b>EL MANDANTE</b> le deba pagar a <b>EL MANDATARIO</b> en concepto de remuneración, los saldos pendientes por los siguientes conceptos, siempre que dichos conceptos se encuentren debidamente soportados y autorizados por <b>EL MANDATARIO</b> o se derive de un incumplimiento contractual, sin limitación de porcentaje:</p>

  <p style="margin-left: 20px;">i. Valores correspondientes a multas o cláusulas penales pactadas en este Contrato o en el Código de Conducta y Manual de Convivencia General. ii. Daños o pérdidas causados a los bienes, equipos o instalaciones de <b>EL MANDANTE</b> atribuibles a <b>EL MANDATARIO</b>, incluyendo, y sin limitarse a, equipos tecnológicos, muebles o infraestructura. iii. Gastos de abogados y costos judiciales en los que incurra <b>EL MANDANTE</b> debido a reclamaciones infundadas, temerarias iniciadas por <b>EL MANDATARIO</b>. iv. Cualquier otra obligación de carácter comercial que <b>EL MANDATARIO</b> tenga con <b>EL MANDANTE</b> que sea exigible y que surja de la ejecución o terminación del presente contrato.</p>

  <p>Dicha compensación o deducción se realizará directamente al momento de liquidar la remuneración, con el fin de agilizar los procesos administrativos. No obstante, si al finalizar el Contrato, se realizará una liquidación final de todas las obligaciones pendientes, pudiendo <b>EL MANDANTE</b> compensar cualquier saldo a favor de <b>EL MANDANTE</b> con las deudas que éste último tenga con <b>EL MANDANTE</b>.</p>

  <h3>CLÁUSULA DECIMOCUARTA: ACUERDO INTEGRAL Y MODIFICACIONES</h3>

  <p>Este Contrato, junto con sus Anexos debidamente incorporados, constituye el acuerdo integral entre las Partes y reemplaza cualquier acuerdo de negociación previa, verbal o escrita. Cualquier modificación, adición o supresión a las cláusulas del presente Contrato deberá hacerse por escrito y ser firmada por ambas Partes. En caso de contradicciones entre las cláusulas del Contrato principal y sus Anexos, prevalecerá lo establecido en el Contrato principal, salvo que el Anexo contenga una disposición que complemente o detalle expresamente lo aquí pactado sin contradecirlo, en cuyo caso será igualmente vinculante.</p>

  <h3>CLÁUSULA DECIMOCUARTA BIS: MECANISMO DE SOLUCIÓN DE CONTROVERSIAS</h3>

  <p>En caso de cualquier controversia o diferencia que surja entre las Partes con ocasión de la celebración, ejecución o terminación del presente Contrato, las Partes se comprometen a intentar una solución amigable y directa a través del mecanismo de la conciliación extrajudicial ante un centro de conciliación legalmente constituido en la ciudad de<b>{{ strtoupper($studio->city->city_name ?? 'Cali') }}</b> Si la controversia no se resuelve dentro de los treinta (30) días calendario siguientes a la fecha de inicio de la conciliación, cualquiera de las Partes podrá acudir a la jurisdicción ordinaria competente.</p>

  <h3>CLÁUSULA DECIMOQUINTA: LEY APLICABLE Y JURISDICCIÓN</h3>

  <p>El presente Contrato se regirá e interpretará de acuerdo con las leyes de la República de Colombia. Para todos los efectos legales que se deriven de esta Contrato, las Partes se someten a la jurisdicción de los Juzgados Civiles Municipales de la ciudad de <b>{{ strtoupper($studio->city->city_name ?? 'Cali') }}</b> renunciando a cualquier otro fuero que pudiere corresponderles.</p>

  <h3>CLÁUSULA DECIMOSEXTA: CLÁUSULA DE INDEMNIDAD</h3>

  <p><b>EL MANDATARIO</b> se obliga a mantener indemne a <b>EL MANDANTE</b> frente a cualquier reclamación, demanda, multa, sanción o responsabilidad, civil, administrativa o fiscal, que se derive directa o indirectamente de su incumplimiento de las obligaciones contractuales, de la ley, o de cualquier otro acto u omisión culposo o doloso de <b>EL MANDATARIO</b> en el desarrollo de sus actividades, incluyendo, pero sin limitarse a, reclamaciones de terceros por contenido ilegal u ofensivo, daño, violencia o fraude, cibercoso, incumplimiento de políticas de plataformas o cualquier otro daño causado por el contenido o la conducta de <b>EL MANDATARIO</b>. <b>EL MANDATARIO</b> asumirá la defensa y los costos asociados a dichas reclamaciones, incluyendo, honorarios de abogados y gastos judiciales, liberando de toda responsabilidad a <b>EL MANDANTE</b>.</p>

  <h3>CLÁUSULA DECIMOSÉPTIMA: FIRMA ELECTRÓNICA Y VALIDEZ</h3>

  <p>Las Partes acuerdan que la firma física, electrónica o digital, así como la huella dactilar impuesta al final de este documento, se entenderán como prueba expresa y válida de su consentimiento, conocimiento y aceptación de todas las cláusulas y condiciones del presente Contrato. La validez de la firma electrónica o digital se regirá por la Ley 527 de 1999, el Decreto 2364 de 2012 y demás normas concordantes. La autenticidad, integridad y aceptación del documento quedan plenamente certificadas por cualquiera de los medios de firma o huella utilizados, otorgando efectos jurídicos equivalentes a la firma manuscrita.</p>

  <h3>CLÁUSULA DECIMOSÉPTIMA BIS: IDIOMA VINCULANTE</h3>

  <p>El idioma oficial y vinculante del presente Contrato es el español. En caso de que se realice alguna traducción, la versión en español prevalecerá para todos los efectos legales.</p>

  <h3>CLÁUSULA DECIMOSÉPTIMA TER: INTERPRETACIÓN CONTRACTUAL</h3>

  <p>En caso de duda o ambigüedad en la interpretación de alguna de las cláusulas del presente Contrato, y una vez agotadas las reglas de interpretación legal, prevalecerá la interpretación más favorable a <b>EL MANDANTE</b>, teniendo en cuenta su rol de administrador del entorno tecnológico, titular de los activos digitales y responsable jurídico de la operación empresarial, siempre que dicha interpretación sea coherente con la naturaleza comercial y no laboral del contrato.</p>

  <h3>ANEXOS DEL CONTRATO DE MANDATO COMERCIAL CON REPRESENTACIÓN</h3>

  <p>Los siguientes documentos forman parte integral del presente Contrato:</p>

  <h3>ANEXO A – CONSENTIMIENTO EXPRESO PARA GRABACIÓN DE AUDIO Y VIDEO Y MONITOREO DE ACTIVIDAD</h3>

  <p><b>EL MANDATARIO</b> otorga su consentimiento expreso, previo e informado para que <b>{{ strtoupper($studio->std_company_name) }}</b> (<b>EL MANDANTE</b>), realice la grabación continua de audio y vídeo (24/7) en todas las áreas de las instalaciones (estudios/áreas comunes de trabajo, pasillos y áreas comunes), así como el monitoreo de la actividad realizada en las plataformas digitales objeto del presente mandato.</p>

  <p><b>EL MANDATARIO</b> entiende y acepta que estas grabaciones y monitoreo tienen las siguientes finalidades, entre otras:</p>

  <p style="margin-left: 20px;">1. Garantizar la seguridad de las personas y bienes dentro de las instalaciones y la prevención de actividades ilícitas.</p>

  <p style="margin-left: 20px;">2. Controlar la calidad del servicio, la optimización del desempeño y el cumplimiento de los estándares establecidos en el Contrato de Mandato y las políticas de <b>EL MANDANTE</b>.</p>

  <p style="margin-left: 20px;">3. Prevenir y detectar conductas que puedan afectar la seguridad, la ética, la reputación, el patrimonio de <b>EL MANDANTE</b> o de terceros, o que infrinjan las políticas de las plataformas.</p>

  <p style="margin-left: 20px;">4. Servir como prueba y respaldo en procesos internos, reclamaciones o litigios de carácter civil, comercial, penal o administrativo.</p>

  <p style="margin-left: 20px;">5. Fines de capacitación y mejora continua de servicios.</p>

  <p><b>EL MANDATARIO</b> ha sido informado que el tratamiento de estas grabaciones y datos personales se realizará de conformidad con la Política de Tratamiento de Datos Personales de <b>EL MANDANTE</b> (Anexo B), y que tiene derecho a conocer, actualizar y rectificar sus datos personales, así como a revocar esta autorización en los términos de la Ley 1581 de 2012, sin perjuicio de las obligaciones contractuales y legales que persistan, o la necesidad de conservar la información por motivos de seguridad o cumplimiento normativo.</p>

  <h3>ANEXO B – POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES (HABEAS DATA)</h3>

  <p><b>EL MANDATARIO</b> declara que ha leído, comprendido y aceptado la Política de Tratamiento de Datos Personales de <b>{{ strtoupper($studio->std_company_name) }}</b> (disponible en su sede principal <b>{{ strtoupper($studio->std_address ?? '[DIRECCIÓN DEL ESTUDIO]') }}</b> o a solicitud vía <b>{{ strtoupper($studio->userOwner->user_personal_email ?? '[CORREO ELECTRÓNICO DEL ESTUDIO]') }}</b>), la cual se incorpora a este Contrato como referencia y de la cual ha recibido una copia impresa o acceso digital. En virtud de la Ley 1581 de 2012, <b>EL MANDATARIO</b> autoriza el tratamiento de sus datos personales, incluyendo datos sensibles (si aplica y ha sido solicitado de manera explícita), para los fines descritos en la Cláusula Décima del presente Contrato y en la Política de Datos, así como para la gestión de su cuenta, pagos, cumplimiento de obligaciones fiscales y legales, y fines de seguridad. <b>EL MANDATARIO</b> autoriza expresamente la transferencia de sus datos personales a las plataformas digitales y a terceros que presten servicios de apoyo a la operación de <b>EL MANDANTE</b>, garantizando que el tratamiento y la ejecución del mandato y siempre bajo estándares de protección de datos.</p>

  <h3>ACEPTACIÓN Y FIRMA</h3>

  <p>Las Partes declaran haber leído, entendido y aceptado el contenido íntegro de este Contrato y sus <b>cláusulas principales, así como sus anexos</b>, los cuales forman parte integral del presente instrumento.</p>

  <p>En constancia de lo anterior, lo firman en un solo acto en la ciudad de <b>{{ strtoupper($studio->city->city_name ?? 'Cali') }}</b> a la fecha de la última firma.</p>

  <br><br>

  <p><b>Fecha de Firma:</b> {{ date('d') }} de {{ strtoupper(monthLetters(date('m'))) }} de {{date('Y')}}</p>

  <br><br><br>

  <table>
    <tr>
      <td style="width: 50%; vertical-align: top;">
        <p><b>EL MANDANTE</b></p>
        @if(isset($signatures['owner']) && $signatures['owner']->docsig_signed_at && $signatures['owner']->userSignature)
          <div style="margin: 10px 0;">
            <img src="{{ public_path('uploads/signatures/' . $signatures['owner']->userSignature->usrsig_image_path) }}" style="height: 60px; max-width: 200px;">
          </div>
          <p style="font-size: 9px; margin: 5px 0;"><i>Firmado digitalmente el: {{ $signatures['owner']->docsig_signed_at->format('d/m/Y H:i') }}</i></p>
        @else
          <p style="margin: 30px 0;">_______________________________</p>
        @endif
        <p><b>{{ strtoupper($studio->std_manager_name ?? '[REPRESENTANTE]') }}</b></p>
        <p>C.C. {{ strtoupper($studio->std_manager_id ?? '[ID_REPRESENTANTE]') }}</p>
        <p>Representante Legal</p>
        <p><b>{{ strtoupper($studio->std_company_name) }}</b></p>
        <p><b>{{$studio->nitWithVerificationDigit()}}</b></p>
      </td>
      <td style="width: 50%; vertical-align: top;">
        <p><b>EL MANDATARIO</b></p>
        @if(isset($signatures['model']) && $signatures['model']->docsig_signed_at && $signatures['model']->userSignature)
          <div style="margin: 10px 0;">
            <img src="{{ public_path('uploads/signatures/' . $signatures['model']->userSignature->usrsig_image_path) }}" style="height: 60px; max-width: 200px;">
          </div>
          <p style="font-size: 9px; margin: 5px 0;"><i>Firmado digitalmente el: {{ $signatures['model']->docsig_signed_at->format('d/m/Y H:i') }}</i></p>
        @else
          <p style="margin: 30px 0;">_______________________________</p>
        @endif
        <p><b>{{ $model->fullName() }}</b></p>
        <p>C.C. {{ strtoupper($model->user_identification) }}</p>
        <p>Dirección: {{ strtoupper($model->user_address ?? '[Dirección]') }}</p>
        <p>Correo: {{ strtoupper($model->user_personal_email ?? '[Correo]') }}</p>
        <p>Celular: {{ strtoupper($model->user_telephone ?? '[Celular]') }}</p>
      </td>
    </tr>
  </table>

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
