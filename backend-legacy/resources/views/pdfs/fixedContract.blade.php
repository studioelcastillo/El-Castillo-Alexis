<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>Contrato Individual de Trabajo a Término Fijo</title>
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
  </style>
</head>
<body>
  <h1>CONTRATO INDIVIDUAL DE TRABAJO A TÉRMINO FIJO</h1>

  <p>Entre los suscritos a saber:</p>

  <p>De una parte, <b>{{ strtoupper($studio->std_company_name) }}</b>, sociedad comercial legalmente constituida, identificada con <b>NIT {{$studio->nitWithVerificationDigit()}}</b>, con domicilio principal en la ciudad de <b>{{ strtoupper($studio->city->city_name ?? 'Cali (Valle del Cauca)') }}</b>, específicamente en la <b>{{ strtoupper($studio->std_address ?? '[DIRECCIÓN DEL ESTUDIO]') }}</b>, representada legalmente por <b>{{ strtoupper($studio->std_manager_name ?? '[REPRESENTANTE]') }}</b>, mayor de edad, identificada con la cédula de ciudadanía N° <b>{{ strtoupper($studio->std_manager_id ?? '[ID_REPRESENTANTE] de Cali') }}</b>, quien para los efectos de este contrato se denominará <b>EL EMPLEADOR</b>.</p>

  <p>Y de la otra parte, el(la) señor(a) <b>{{ $model->fullName() }}</b>, mayor de edad, identificado(a) con la cédula de ciudadanía N° <b>{{ strtoupper($model->user_identification) }}</b> de <b>{{ strtoupper($model->user_issued_in ?? '[Lugar de expedición]') }}</b>, domiciliado(a) en la ciudad de <b>{{ strtoupper($model->city->city_name ?? '[Ciudad de domicilio]') }}</b>, quien en adelante para los efectos de este contrato se denominará <b>EL TRABAJADOR</b>.</p>

  <p>Las Partes, denominadas individualmente como la "Parte" y conjuntamente como las "Partes", han convenido celebrar el presente <b>CONTRATO INDIVIDUAL DE TRABAJO A TÉRMINO FIJO</b> (en adelante el "Contrato"), el cual se regirá por las siguientes cláusulas, previas las siguientes:</p>

  <h3>CONSIDERACIONES:</h3>

  <ul>
    <li>Que <b>EL EMPLEADOR</b> es una sociedad con experiencia en la gestión, producción, administración y comercialización de contenido digital y servicios de entretenimiento para adultos a través de diversas plataformas tecnológicas y canales en línea, y requiere personal calificado para el desarrollo de sus actividades.</li>

    <li>Que <b>EL TRABAJADOR</b> declara contar con la capacidad, idoneidad y experiencia requeridas para desempeñar el cargo para el cual se está contratando(a), y se ha informado(a) sobre la naturaleza de la actividad económica de <b>EL EMPLEADOR</b>, así como sobre los principios éticos y de conducta de la empresa.</li>

    <li>Que <b>EL TRABAJO</b> a desarrollar implica el acceso a información sensible, confidencial y estratégica de <b>EL EMPLEADOR</b>, así como la posible creación de obras y desarrollos de propiedad intelectual, la cual, se exige al <b>TRABAJADOR</b> un compromiso de absoluta lealtad, confidencialidad y ética profesional.</li>

    <li>Que <b>EL TRABAJADOR</b> declara que no ha sido condenado(a) o vinculado(a) a procesos penales por delitos relacionados con pornografía infantil, trata de personas, prostitución infantil, abuso sexual, financiación del terrorismo, o cualquier otro delito contra la libertad, integridad y formación sexual, ni por lavado de activos o financiación del terrorismo, y se compromete a notificar de inmediato a <b>EL EMPLEADOR</b> en caso de ser vinculado(a) en actividades ilícitas.</li>

    <li>Que <b>EL TRABAJADOR</b> ha recibido, leído, comprendido y acepta plenamente el <b>CÓDIGO DE CONDUCTA Y MANUAL DE CONVIVENCIA GENERAL DE {{ strtoupper($studio->std_company_name) }}</b>, Y <b>REGLAMENTO INTERNO DE TRABAJO PARA EMPLEADOS</b> y la <b>POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES (HABEAS DATA)</b> de <b>EL EMPLEADOR</b>, documentos que forman parte integral de este Contrato y cuyas disposiciones se obliga a cumplir.</li>
  </ul>

  <h3>CLÁUSULA PRIMERA: OBJETO DEL CONTRATO Y NATURALEZA DE LAS FUNCIONES</h3>

  <p><b>EL EMPLEADOR</b> contrata a <b>EL TRABAJADOR</b> para desempeñar el cargo de <b>{{$studioModel->stdmod_position ?? '[COLOCAR AQUÍ EL CARGO EJEMPLO FOTÓGRAFO]'}}</b>.</p>

  <p>Las funciones que <b>EL TRABAJADOR</b> deberá desempeñar incluyen, pero no se limitan a: i.</p>

  <h4>1. Área de Administración</h4>

  <p class="indent">El colaborador prestará sus servicios en el Área de Administración, siendo responsable de coordinar procesos operativos, legales, financieros y estratégicos de la empresa. Incluye el seguimiento del cumplimiento de procesos internos; supervisión de contratos, provisiones, control documental y coordinación entre áreas. También será responsable del manejo de relaciones comerciales y alianzas estratégicas.</p>

  <hr/>

  <h4>2. Área de Recursos Humanos (incluye Selección)</h4>

  <p class="indent">El colaborador prestará sus servicios en el Área de Recursos Humanos, participando activamente en los procesos de bienestar laboral, evaluación de desempeño, capacitación, seguimiento del clima organizacional y gestión de beneficios. También incluye funciones de reclutamiento, selección, entrevistas, filtrado de candidatos y acompañamiento en los procesos de inducción y vinculación laboral.</p>

  <hr/>

  <h4>3. Área de Creación de Cuentas y Soporte Técnico (incluye Ciberseguridad)</h4>

  <p class="indent">El colaborador prestará sus servicios en el Área de Creación de Cuentas y Soporte Técnico, encargándose del registro, configuración y mantenimiento de cuentas en plataformas digitales, así como del soporte técnico en equipos, conectividad y software de operación. También incluye la gestión de ciberseguridad, protección de datos, prevención de accesos no autorizados y capacitación básica en seguridad digital al equipo.</p>

  <hr/>

  <h4>4. Área de Fotografía y Marketing</h4>

  <p class="indent">El colaborador prestará sus servicios en el Área de Fotografía y Marketing, participando en la creación, producción y edición de contenido visual (fotos y videos), así como en la planeación y ejecución de estrategias de promoción</p>

  <p class="indent">digital, manejo de redes sociales, campañas publicitarias, posicionamiento de marca y análisis de métricas de alcance.</p>

  <hr/>

  <h4>5. Área de Maquillaje</h4>

  <p class="indent">El colaborador prestará sus servicios en el Área de Maquillaje, siendo responsable de la preparación estética de las modelos, incluyendo maquillaje profesional, estilismo básico, higiene y cuidado de herramientas, y adaptación visual de las modelos según las temáticas de contenido y directrices del equipo de fotografía.</p>

  <hr/>

  <h4>6. Área de Ventas de Contenido y Estudios Aliados</h4>

  <p class="indent">El colaborador prestará sus servicios en el Área de Ventas de Contenido y Estudios Aliados, encargándose de la comercialización y gestión de contenido personalizado, atención al cliente, coordinación con el equipo creativo y seguimiento de ventas. También incluye la atención, capacitación y soporte a estudios aliados, fortaleciendo relaciones comerciales sostenibles.</p>

  <hr/>

  <h4>7. Área de Contabilidad</h4>

  <p class="indent">El colaborador prestará sus servicios en el Área de Contabilidad, gestionando pagos, elaboración de informes financieros, organización de facturas e inventarios, alimentación de plataformas contables internas y análisis mensual de utilidades y pérdidas. También deberá garantizar el cumplimiento de obligaciones tributarias y laborales.</p>

  <hr/>

  <h4>8. Área de Monitores</h4>

  <p class="indent">El colaborador prestará sus servicios en el Área de Monitores, acompañando operativamente a las modelos en su jornada laboral, brindando orientación, seguimiento de metas, apoyo en contenido básico y reporte de situaciones relevantes. También deberá velar por el cumplimiento de normas internas y el correcto desempeño de las modelos asignadas.</p>

  <hr/>

  <h4>9. Área de Psicología</h4>

  <p class="indent">El colaborador prestará sus servicios en el Área de Psicología, brindando acompañamiento emocional, individual y grupal a modelos y personal interno.</p>

  <p class="indent">Sus funciones incluyen intervenciones en crisis, talleres de bienestar, seguimiento conductual, asesoría psicoemocional y garantía de confidencialidad de los procesos de atención.</p>

  <hr/>

  <h4>10. Área Jurídica</h4>

  <p class="indent">El colaborador prestará sus servicios en el Área Jurídica, siendo responsable de la redacción, revisión y validación de contratos, aplicación de cláusulas de confidencialidad, protección de datos personales, derechos de imagen y normativas SARLAFT. También será el encargado de brindar asesoría legal preventiva, correctiva y representar jurídicamente a la empresa si se requiere.</p>

  <p>Además de las funciones aquí descritas, el colaborador podrá ser requerido para ejecutar otras tareas afines o complementarias dentro del mismo ámbito de trabajo, que respondan a las necesidades operativas, estratégicas o administrativas de la empresa, aun cuando no estén expresamente detalladas en este contrato, siempre y cuando guarden relación con la naturaleza del área o el servicio contratado.</p>

  <p>ii. Todas aquellas actividades inherentes, conexas o complementarias a su cargo y naturaleza del mismo, que le sean asignadas por su superior jerárquico en la Dirección de la empresa, y que estén acordes con su capacidad, experiencia, formación y la evolución de las necesidades del servicio. iii. Cumplir con los objetivos y metas asignadas por <b>EL EMPLEADOR</b> en relación con su cargo y las políticas internas. iv. Acatar diligentemente las instrucciones, órdenes y directrices de <b>EL EMPLEADOR</b> en el desarrollo de sus funciones.</p>

  <p><b>EL TRABAJADOR</b> se compromete a poner al servicio de <b>EL EMPLEADOR</b> toda su capacidad normal de trabajo, conocimientos y experiencia para el cabal cumplimiento de las funciones asignadas, con la dedicación, eficiencia y profesionalismo requeridos por la naturaleza del cargo y la actividad de la empresa.</p>

  <h3>CLÁUSULA SEGUNDA: DURACIÓN Y NATURALEZA DEL CONTRATO</h3>

  <p>El presente contrato de trabajo es a <b>TÉRMINO FIJO</b>, y comenzará a regir a partir del día <b>{{$studioModel->stdmod_start_at ? date('d', strtotime($studioModel->stdmod_start_at)) : '[DÍA]'}}</b> del mes de <b>{{$studioModel->stdmod_start_at ? strtoupper(monthLetters(date('n', strtotime($studioModel->stdmod_start_at)))) : '[MES]'}}</b> de <b>{{$studioModel->stdmod_start_at ? date('Y', strtotime($studioModel->stdmod_start_at)) : '[AÑO]'}}</b>. Su fecha de finalización es <b>{{$studioModel->stdmod_finish_at ? date('d', strtotime($studioModel->stdmod_finish_at)) : '[DÍA]'}}</b> del mes de <b>{{$studioModel->stdmod_finish_at ? strtoupper(monthLetters(date('n', strtotime($studioModel->stdmod_finish_at)))) : '[MES]'}}</b> de <b>{{$studioModel->stdmod_finish_at ? date('Y', strtotime($studioModel->stdmod_finish_at)) : '[AÑO]'}}</b>.</p>

  <p>Su duración se extenderá mientras subsistan las causas que le dieron origen y la necesidad del servicio para <b>EL EMPLEADOR</b>, sin perjuicio de las causales de terminación legalmente establecidas en el Código Sustantivo del Trabajo (CST) y las causales especiales pactadas en este contrato.</p>

  <h3>CLÁUSULA TERCERA: PERIODO DE PRUEBA</h3>

  <p>Se pacta un período de prueba de dos <b>(2) meses</b>, contados a partir del inicio de la ejecución del presente Contrato. Durante este período, cualquiera de las Partes podrá dar por terminado el contrato unilateralmente, sin previo aviso y sin el pago de indemnización alguna, de conformidad con el artículo 78 del Código Sustantivo del Trabajo.</p>

  <p><b>EL EMPLEADOR</b> se reserva el derecho de dar por terminado el contrato durante el período de prueba si el desempeño, habilidades, adaptación, conducta, ética o idoneidad de <b>EL TRABAJADOR</b> no cumplen con las expectativas o requisitos del cargo y de la empresa.</p>

  <h3>CLÁUSULA CUARTA: LUGAR DE TRABAJO Y MODALIDAD</h3>

  <p><b>EL TRABAJADOR</b> desempeñará sus funciones principalmente en las instalaciones de <b>EL EMPLEADOR</b> ubicadas en la <b>Carrera 44 # 2A-50, Barrio El Lido, Cali, Valle del Cauca</b>, o en el lugar que <b>EL EMPLEADOR</b> determine según las necesidades del servicio, siempre que no implique un desmejoramiento de las condiciones laborales de <b>EL TRABAJADOR</b>.</p>

  <p><b>EL EMPLEADOR</b> podrá, a su discreción y según la naturaleza del cargo, establecer o modificar la modalidad de prestación del servicio a teletrabajo o trabajo en casa, total o parcial, de conformidad con la Ley 1221 de 2008, Ley 2121 de 2021 y demás normas aplicables, garantizando las condiciones de seguridad y salud en el trabajo. En tal caso, se suscribirá el acuerdo respectivo y se observarán las condiciones que determinen la modalidad.</p>

  <h3>CLÁUSULA QUINTA: JORNADA LABORAL Y HORARIOS</h3>

  <p><b>EL TRABAJADOR</b> se obliga a laborar la jornada máxima legal vigente, que actualmente es de cuarenta y ocho (48) horas semanales, de conformidad con la Ley 2101 de 2021 y sus reglamentaciones, o la que la ley determine en el futuro. <b>EL EMPLEADOR</b> establecerá el horario de trabajo, el cual podrá ser modificado según las necesidades operativas de la empresa, respetando siempre los límites legales de la jornada diurna, nocturna, suplementaria y el descanso obligatorio.</p>

  <p><b>EL TRABAJADOR</b> reconoce que la naturaleza de la actividad de <b>EL EMPLEADOR</b> puede requerir trabajo en días no hábiles, turnos rotativos, y trabajo en fines de semana o festivos, lo cual será remunerado de acuerdo con las disposiciones legales vigentes (recargos nocturnos, dominicales y festivos, horas extras).</p>

  <h3>CLÁUSULA SEXTA: SALARIO Y FORMA DE PAGO</h3>

  <p><b>EL EMPLEADOR</b> pagará a <b>EL TRABAJADOR</b> un salario mensual de <b>{{$studioModel->stdmod_monthly_salary ?? '[VALOR EN NÚMERO]'}} ($ [VALOR EN LETRAS]) M/CTE.</b>, pagaderos por períodos <b>QUINCENALES</b>, los días 16 y 1 de cada mes, o último día hábil de cada mes, mediante transferencia electrónica a la cuenta bancaria del trabajador, efectivo, etc.</p>

  <p>Este salario comprende la remuneración ordinaria y fija por la prestación del servicio. Adicionalmente, <b>EL EMPLEADOR</b> reconocerá y pagará a <b>EL TRABAJADOR</b> todas las prestaciones sociales, aportes a seguridad social integral (salud, pensión, riesgos laborales) y parafiscales (Sena, ICBF, Cajas de Compensación Familiar) a que haya lugar, de conformidad con la ley colombiana.</p>

  <h3>CLÁUSULA SÉPTIMA: OBLIGACIONES DEL TRABAJADOR</h3>

  <p>Además de las obligaciones generales establecidas en el Código Sustantivo del Trabajo, <b>EL TRABAJADOR</b> se obliga a:</p>

  <p>i. <b>Cumplimiento de Políticas y Reglamentos:</b> Acatar y cumplir estrictamente el <b>CÓDIGO DE CONDUCTA Y MANUAL DE CONVIVENCIA GENERAL DE {{ strtoupper($studio->std_company_name) }}</b>, Y <b>REGLAMENTO INTERNO DE TRABAJO PARA EMPLEADOS</b> (aplicando las partes que le corresponden según su tipo de vinculación), y la <b>POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES (HABEAS DATA)</b> de <b>EL EMPLEADOR</b>, documentos que ha recibido, leído, comprendido y acepta, y que forman parte integral del presente Contrato. La violación de cualquiera de las disposiciones de estos documentos se considerará un incumplimiento contractual y podrá dar lugar a las acciones disciplinarias y la terminación sin justa causa correspondiente. ii. <b>Diligencia y Profesionalismo:</b> Desempeñar sus funciones con la máxima diligencia, cuidado, profesionalismo, lealtad, ética y probidad, actuando siempre en el mejor interés de <b>EL EMPLEADOR</b>. iii. <b>Uso de Bienes y Recursos:</b> Utilizar de manera adecuada, eficiente y responsable los equipos, herramientas, sistemas informáticos, vehículos, materiales y demás bienes de <b>EL EMPLEADOR</b> que sean puestos a su disposición para el desarrollo de sus funciones, informando de inmediato cualquier daño, hurto o pérdida. Queda prohibido el uso de dichos bienes para fines personales o ajenos a la actividad de <b>EL EMPLEADOR</b>, salvo autorización expresa y por escrito. iv. <b>Seguridad y Salud en el Trabajo:</b> Cumplir con todas las normas, procedimientos y capacitaciones en materia de seguridad y salud en el trabajo (SST) establecidas por <b>EL EMPLEADOR</b> y las autoridades competentes, reportando cualquier condición insegura o accidente. v. <b>Información y Reportes:</b> Suministrar de manera veraz, completa y oportuna toda la información y documentación que le sea requerida por <b>EL EMPLEADOR</b> para fines laborales, contables, fiscales, de seguridad, SARLAFT o de cualquier otra índole laboral. vi. <b>Confidencialidad:</b> Mantener en absoluta reserva y confidencialidad toda la Información Confidencial de <b>EL EMPLEADOR</b> a la que tenga acceso, durante y después de la terminación de este Contrato, tal como se detalla en la Cláusula Décima de este Contrato. vii. <b>Protección de Datos Personales:</b> Garantizar la protección de los datos personales a los que tenga acceso en virtud de sus funciones, cumpliendo estrictamente con la Política de Tratamiento de Datos Personales de <b>EL EMPLEADOR</b> y la Ley 1581 de 2012, absteniéndose de divulgar, usar o ceder datos sin la autorización de <b>EL EMPLEADOR</b>. viii. <b>No Conflicto de Intereses y Lealtad:</b> Abstenerse de realizar actividades o mantener intereses en conflicto real o aparente con los de <b>EL EMPLEADOR</b>, o que puedan afectar su lealtad, independencia o el debido cumplimiento de sus funciones. Esto incluye la prohibición de trabajar, asesorar o colaborar con empresas competidoras directas o indirectas de <b>EL EMPLEADOR</b> durante la vigencia del Contrato. ix. <b>Prohibición de Relaciones Sentimentales y Conflictos de Interés:</b> Abstenerse de mantener relaciones sentimentales o amorosas con personal interno, supervisores, administradores o directivos de <b>EL EMPLEADOR</b>, que puedan generar un conflicto de interés real o aparente, afectar la imparcialidad en la toma de decisiones, comprometer la confidencialidad, o impactar negativamente el ambiente laboral. El incumplimiento de esta disposición podrá dar lugar a medidas disciplinarias que podrán incluir la terminación del contrato con justa causa. x. <b>Prevención de Actividades Ilícitas (SARLAFT):</b> Cumplir con la política de prevención de lavado de activos y financiación del terrorismo (SARLAFT) de <b>EL EMPLEADOR</b>, y reportar cualquier operación sospechosa o indicio de actividad ilícita.</p>

  <p>xi. <b>Conducta en Plataformas y Redes Sociales:</b> Mantener una conducta profesional y ética en todo momento, incluyendo el uso de plataformas digitales, redes sociales y comunicaciones, evitando comentarios, publicaciones o acciones que puedan dañar la imagen, reputación o intereses de <b>EL EMPLEADOR</b>, sus colaboradores, modelos, clientes o proveedores.</p>

  <h3>CLÁUSULA OCTAVA: PROPIEDAD INTELECTUAL Y DERECHOS DE AUTOR</h3>

  <p><b>EL TRABAJADOR</b> reconoce y acepta que todos los derechos de autor, derechos conexos, derechos de propiedad industrial (incluyendo marcas, patentes, diseños industriales, secretos empresariales, know-how, software, bases de datos, aplicaciones, metodologías, procesos, manuales, contenido audiovisual, gráfico, sonoro, fotográfico, digital o cualquier otra obra, invención, creación, desarrollo o mejora que sea creada, desarrollada, descubierta, producida o concebida por <b>EL TRABAJADOR</b> durante la ejecución de su contrato de trabajo, o en relación con sus funciones o el objeto social de <b>EL EMPLEADOR</b>, o utilizando los recursos de <b>EL EMPLEADOR</b>, pertenecerán de manera exclusiva a <b>EL EMPLEADOR</b>.</p>

  <p>Para tal efecto, <b>EL TRABAJADOR</b> cede a <b>EL EMPLEADOR</b>, de manera total, exclusiva, irrevocable y sin limitación de tiempo o territorio, todos los derechos patrimoniales de autor y de propiedad industrial, incluyendo los derechos de reproducción, transformación, distribución, comunicación pública y cualquier otra forma de explotación, presentes o futuras, en cualquier formato o medio conocido o por conocer. Esta cesión se extiende a todas las facultades de explotación comercial de dichas obras y creaciones.</p>

  <p><b>EL TRABAJADOR</b> se compromete a firmar cualquier documento adicional que sea necesario para formalizar la titularidad o registro de dichos derechos a nombre de <b>EL EMPLEADOR</b>, tanto en Colombia como en el extranjero.</p>

  <h3>CLÁUSULA NOVENA: NO COMPETENCIA Y NO SOLICITACIÓN (POST-TERMINACIÓN)</h3>

  <p>Con el fin de proteger los legítimos intereses comerciales y el know-how de <b>EL EMPLEADOR</b>, <b>EL TRABAJADOR</b> se obliga, durante la vigencia de este contrato y por un período de <b>Dos (2) años</b> contados a partir de su terminación por cualquier causa, a:</p>

  <p>i. <b>No Solicitación de Clientes y Modelos:</b> Abstenerse de contactar, inducir o solicitar, directa o indirectamente, a clientes, modelos, aliados, proveedores o subsidiarios de <b>EL EMPLEADOR</b> con el propósito de prestarles servicios similares a los de la misma naturaleza que los ofrecidos por <b>EL EMPLEADOR</b>, o para que cesen su relación comercial con <b>EL EMPLEADOR</b>.</p>

  <p>ii. <b>No Solicitación de Empleados:</b> Abstenerse de inducir o solicitar, directa o indirectamente, a otros empleados de <b>EL EMPLEADOR</b> a terminar su relación laboral para vincularse a una empresa competidora o para iniciar un negocio similar.</p>

  <p>iii. <b>Prohibición de Competencia Post-Contractual y su Compensación Especial:</b> <b>EL TRABAJADOR</b> se obliga, una vez finalizado el presente contrato por cualquier causa, a abstenerse de prestar servicios laborales o profesionales, de forma directa o indirecta (ya sea como empleado, consultor, socio, accionista, contratista o cualquier otra modalidad), a empresas o personas naturales que desarrollen actividades económicas idénticas, similares o directamente competidoras de las de <b>EL EMPLEADOR</b>, dentro del territorio de la República de Colombia, por el mismo período establecido en encabezado de esta cláusula.</p>

  <p>Para que esta prohibición de competencia post-contractual sea plenamente válida y exigible, las Partes acuerdan y aceptan expresamente la <b>"Compensación Económica Especial por Restricción de No Competencia"</b> a la que se refiere el artículo Sustantivo del Trabajo, se reconoce y paga a <b>EL TRABAJADOR</b> de la siguiente manera durante toda la vigencia de la relación laboral, constituyendo esta la Compensación Económica por la obligación de no competencia post-contractual:</p>

  <p>a) Un auxilio mensual denominado <b>"Auxilio de Protección por No Competencia"</b> por un valor de <b>cien mil pesos ($100.000) M/CTE.</b>, que será entregado mensualmente, junto con el salario. Las Partes acuerdan que, si que este auxilio no sea pagado en un solo mes o período, la correspondiente suma que debería determinarse el pago correspondiente se acumulará y será pagado en el período siguiente, entendiéndose siempre como la intención de las Partes que el auxilio tendrá el carácter de pago no salarial si cumple con las condiciones legales para tal fin y es pactado expresamente como tal, pero en todo caso se considera parte esencial de la compensación especial por la restricción de no competencia.</p>

  <p>b) Un valor mensual adicional calculado como el <b>tres por ciento (3%) del Salario Mínimo Legal Mensual Vigente (SMLMV)</b>, que se causará y será pagado mensualmente junto con el salario, a partir de la fecha siguiente a la fecha en que <b>EL TRABAJADOR</b> cumpla un (1) año de servicio continuo con <b>EL EMPLEADOR</b>. Este valor se actualizará anualmente conforme el SMLMV que se establezca para cada año y es considerada parte integral de la Compensación Económica Especial por Restricción de No Competencia. Se aclara que este auxilio se calcula exclusivamente sobre el Salario Mínimo Legal Mensual Vigente y no incluirá ningún tipo de auxilios o beneficios no salariales.</p>

  <p>Las Partes convienen que la totalidad de los valores acumulados y pagados por los conceptos descritos en los literales a) y b) de este numeral, durante la vigencia de la relación laboral, no representan la Compensación Económica Especial de no competencia post-contractual aquí pactada. Por consiguiente, a la terminación de este contrato, por cualquier causa, <b>EL EMPLEADOR</b> no estará obligado a realizar pagos adicionales por concepto de esta compensación especial, al entenderse que la misma ya ha sido cabalmente retribuida durante la ejecución del vínculo laboral.</p>

  <p>El incumplimiento de esta obligación de no competencia post-contractual por parte de <b>EL TRABAJADOR</b> lo hará responsable de los perjuicios causados a <b>EL EMPLEADOR</b>, sin perjuicio de las acciones legales pertinentes.</p>

  <h3>CLÁUSULA DÉCIMA: CONFIDENCIALIDAD Y NO DIVULGACIÓN</h3>

  <p><b>EL TRABAJADOR</b> se obliga a guardar y mantener la más estricta y absoluta reserva y confidencialidad sobre toda la "Información Confidencial" de <b>EL EMPLEADOR</b> a la que tenga acceso en su cargo o en el desarrollo de sus funciones. Se entiende por Información Confidencial, de manera enunciativa y no limitativa: información de carácter comercial, operativo, técnico, tecnológico, financiero, contable, jurídico, legal, datos de clientes, modelos, subsidiados, aliados, empleados, proveedores, plataformas, contrasistas, métodos de trabajo, know-how, procesos internos, software, diseños, bases de datos, contenido no público, información de seguridad, y cualquier otra información que no sea de dominio público o que <b>EL EMPLEADOR</b> designe como confidencial.</p>

  <p>Esta obligación de confidencialidad se mantendrá durante toda la vigencia del presente Contrato y por un período de <b>diez (10) años</b> contados a partir de su terminación por cualquier causa, salvo que la información pase a ser de dominio público por causas ajenas a <b>EL TRABAJADOR</b>.</p>

  <p><b>EL TRABAJADOR</b> se compromete a no divulgar, copiar, reproducir, usar, explotar o permitir el acceso a la Información Confidencial a terceros, salvo que cuente con autorización expresa y por escrito de <b>EL EMPLEADOR</b> o que sea exigido por una autoridad competente.</p>

  <p>El incumplimiento de esta cláusula será considerado una falta grave y justa causa para la terminación de contrato de trabajo sin indemnización, sin perjuicio de las acciones legales (civiles y/o penales) que <b>EL EMPLEADOR</b> pueda iniciar para reclamar los perjuicios causados.</p>

  <p>Adicionalmente, a la terminación del presente Contrato por cualquier causa, <b>EL TRABAJADOR</b> se obliga a devolver a <b>EL EMPLEADOR</b> toda la Información Confidencial, documentos, copias, materiales o elementos de cualquier tipo que contengan dicha información, en cualquier formato, y a eliminar de forma permanente y segura toda Información Confidencial de la cual posea copias digitales o físicas en sus dispositivos personales, correos electrónicos o cualquier otro medio bajo su control. Una vez realizada dicha eliminación, <b>EL TRABAJADOR</b> deberá emitir y entregar a <b>EL EMPLEADOR</b> una certificación escrita, clara y bajo la gravedad de juramento, en la cual conste que ha cumplido con la obligación de devolver y/o eliminar completamente toda la Información Confidencial, y que no retiene copias de la misma.</p>

  <h3>CLÁUSULA UNDÉCIMA: TERMINACIÓN DEL CONTRATO Y JUSTAS CAUSAS ESPECÍFICAS</h3>

  <p>El presente Contrato podrá terminar por las causales establecidas en el Código Sustantivo del Trabajo (CST) y, en particular, por las siguientes justas causas en cabeza de <b>EL TRABAJADOR</b>, sin perjuicio de las demás establecidas en el RIT de <b>EL EMPLEADOR</b>:</p>

  <p>i. El engaño por parte del trabajador mediante la presentación de certificados falsos para su admisión o tendientes a obtener un provecho indebido. ii. Todo acto de violencia, injuria,</p>

  <p>malos tratamientos o grave indisciplina en que incurra el trabajador en sus labores, contra el empleador, los miembros de su familia, el personal directivo o los compañeros de trabajo. iii. Todo acto grave de violencia, injuria o malos tratamientos del trabajador fuera del servicio, en contra de una persona extraña al establecimiento, ejecutados en el sitio de trabajo o en conexión con él. iv. Todo daño material causado intencionalmente a los edificios, obras, maquinaria, instrumentos y demás objetos relacionados con el trabajo, y toda grave negligencia que ponga en peligro la seguridad de las personas o de las cosas. v. Todo acto inmoral o delictual que el trabajador cometa en el taller, establecimiento o en el desempeño de sus labores. vi. Cualquier violación grave de las obligaciones o prohibiciones especiales del trabajador, o cualquier falta calificada como grave en pactos o convenciones colectivas, fallos arbitrales, contratos individuales o reglamentos. vii. La detención preventiva del trabajador por más de treinta (30) días, a menos que posteriormente sea absuelto, o el arresto correccional que exceda de ocho (8) días, o aún por tiempo menor, cuando la causa del arresto sea suficiente por sí misma para justificar el despido. viii. El que el trabajador revele secretos técnicos o comerciales o utilice la Información Confidencial de <b>EL EMPLEADOR</b> de manera no autorizada. ix. El bajo rendimiento o la deficiencia grave y reiterada en el desempeño de las funciones encomendadas, a pesar de haber sido amonestado y capacitado proporcionadamente por <b>EL EMPLEADOR</b>. x. La violación grave o reiterada de las cláusulas del presente contrato, incluyendo, pero sin limitarse, al <b>CÓDIGO DE CONDUCTA Y MANUAL DE CONVIVENCIA GENERAL</b> y la <b>POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES (HABEAS DATA)</b>, o que facilite acceso no autorizado a persona ajena al establecimiento, ejecutados en el sitio de trabajo o en conexión con él. xi. Cualquier acción u omisión que ponga en riesgo la seguridad informática, los sistemas, las plataformas o la información de <b>EL EMPLEADOR</b>, o que facilite accesos no autorizados o vulneraciones. xii. La participación o colaboración en los procedimientos de debida diligencia, conocimiento del cliente (KYC), auditorías o suministro de información requerida por <b>EL EMPLEADOR</b> en el cumplimiento de sus políticas de SARLAFT y listas restrictivas. xiii. La vinculación, promoción o participación en cualquier actividad ilícita relacionada con pornografía infantil, explotación sexual de menores, trata de personas, lavado de activos, financiación del terrorismo o cualquier otra actividad ilícita. xiv. La infracción sistemática a las normas de seguridad y prevención de riesgos, auditados o solicitadas por <b>EL EMPLEADOR</b>, entre otras). xv. La negativa injustificada de <b>EL TRABAJADOR</b> a someterse a exámenes o pruebas solicitadas por <b>EL EMPLEADOR</b> en el cumplimiento de sus políticas de SARLAFT. xvi. Cualquier conducta que afecte gravemente la imagen, reputación o patrimonio de <b>EL EMPLEADOR</b>, sus colaboradores, sus clientes, modelos o patrocinadores. xvii. Mantener o fomentar actos de difamación u obstrucción de los incumplimientos de las políticas de SARLAFT y las conductas que revelen o afecten la seguridad, impacto negativo de las operaciones, la prohibición de relaciones sentimentales establecida en la Cláusula Séptima, numeral ix, si se verificó un conflicto de interés, afectó la confidencialidad, comprobó la seguridad, impacto negativamente el ambiente laboral.</p>

  <h3>CLÁUSULA DUODÉCIMA: AUTORIZACIÓN DE DESCUENTOS Y DEDUCCIONES</h3>

  <p><b>EL TRABAJADOR</b> autoriza de manera libre, expresa e irrevocable a <b>EL EMPLEADOR</b> para que, conforme al artículo 151 del Código Sustantivo del Trabajo (CST) y demás normas concordantes, se efectúen descuentos de sus ingresos laborales (salario y prestaciones sociales), hasta el límite legalmente permitido (hasta el 50% del salario que no afecte al mínimo), por los siguientes conceptos, siempre que exista un acuerdo previo por escrito para cada caso o se derive de un daño comprobado imputable a <b>EL TRABAJADOR</b>:</p>

  <p>i. Préstamos, anticipos o créditos otorgados por <b>EL EMPLEADOR</b>. ii. Compra de productos o servicios autorizados por <b>EL EMPLEADOR</b> (ej: uniformes, tecnología, insumos personales, equipos), herramientas, infraestructura o bienes de <b>EL EMPLEADOR</b> causados por dolo o culpa grave de <b>EL TRABAJADOR</b>, previa comprobación y agotamiento del debido proceso. iv. Cualquier otra obligación pecuniaria expresa y previamente autorizada por escrito por <b>EL TRABAJADOR</b> o impuesta por ley o autoridad competente.</p>

  <p>Los descuentos se aplicarán por cuotas mensuales hasta saldar la obligación. En la liquidación final de la relación laboral, <b>EL EMPLEADOR</b> podrá descontar cualquier saldo pendiente por los conceptos aquí autorizados.</p>

  <h3>CLÁUSULA DECIMOTERCERA: DEVOLUCIÓN DE BIENES Y PROPIEDAD</h3>

  <p>A la terminación del presente Contrato, por cualquier causa, <b>EL TRABAJADOR</b> se obliga a devolver de inmediato a <b>EL EMPLEADOR</b> la totalidad de los bienes, documentos, equipos, vehículos, dispositivos electrónicos (computadores, celulares, tabletas, etc.), software, credenciales de acceso, información (física o digital) y demás elementos de propiedad de <b>EL EMPLEADOR</b> que se encuentren en su posesión o bajo su control, en las mismas condiciones en que fue recibido, salvo el desgaste normal por el uso.</p>

  <p>La no restitución de dichos bienes o la restitución en estado deteriorado (más allá del uso normal) podrá dar lugar al inicio de las acciones legales correspondientes para la recuperación de los mismos o la indemnización de los perjuicios causados, sin perjuicio de la aplicación de las deducciones autorizadas en la Cláusula Duodécima.</p>

  <h3>CLÁUSULA DECIMOCUARTA: SALUD Y SEGURIDAD EMOCIONAL</h3>

  <p><b>EL EMPLEADOR</b> promoverá el bienestar emocional de <b>EL TRABAJADOR</b> mediante la implementación de un sistema de gestión de seguridad y salud en el trabajo que incluye, entre otros, la gestión de riesgos psicosociales y la provisión de ambientes laborales seguro y ético.</p>

  <p><b>EL TRABAJADOR</b> se compromete a participar activamente en los programas de salud y bienestar que <b>EL EMPLEADOR</b> implemente, así como a reportar cualquier situación que pueda afectar su salud física o mental, o la de sus compañeros de trabajo.</p>

  <h3>CLÁUSULA DECIMOQUINTA: SOLUCIÓN DE CONFLICTOS</h3>

  <p>Cualquier controversia o diferencia que surja entre las Partes con ocasión de la celebración, ejecución o terminación del presente Contrato, será sometida a los mecanismos de solución de conflictos establecidos en la legislación laboral colombiana, priorizando la conciliación extrajudicial ante el Ministerio de Trabajo o centros de conciliación legalmente constituidos. Si la controversia no se resuelve por estos medios, las Partes se someterán a la jurisdicción de la Justicia Ordinaria Laboral de la ciudad de <b>Cali</b>.</p>

  <h3>CLÁUSULA DECIMOSEXTA: LEY APLICABLE E INTEGRIDAD DEL CONTRATO</h3>

  <p>El presente Contrato se regirá e interpretará de acuerdo con las leyes de la República de Colombia, especialmente el Código Sustantivo del Trabajo y demás normas concordantes.</p>

  <p>Este documento, junto con sus anexos (el <b>CÓDIGO DE CONDUCTA Y MANUAL DE CONVIVENCIA GENERAL DE {{ strtoupper($studio->std_company_name) }}</b>, Y <b>REGLAMENTO INTERNO DE TRABAJO PARA EMPLEADOS</b> y la <b>POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES (HABEAS DATA)</b>), constituye la totalidad del acuerdo entre las Partes. Cualquier modificación o adición deberá constar por escrito y ser firmada por ambas Partes.</p>

  <h3>CLÁUSULA DECIMOSÉPTIMA: SUPERVIVENCIA DE OBLIGACIONES</h3>

  <p>Las Partes acuerdan expresamente que las obligaciones y derechos establecidos en las siguientes cláusulas del presente Contrato, debido a su naturaleza o al fin de proteger los legítimos intereses de <b>EL EMPLEADOR</b>, subsistirán y estarán plenamente exigibles incluso después de la terminación de la relación laboral por cualquier causa:</p>

  <p>i. <b>Cláusula Séptima:</b> Obligaciones del Trabajador (en lo referente a Confidencialidad, Protección de Datos Personales, No Conflicto de Intereses, Prevención de Actividades Ilícitas, Conducta en Plataformas y Redes Sociales, y Prohibición de Relaciones Sentimentales que comprometan la confidencialidad o intereses de la empresa). ii. <b>Cláusula Octava:</b> Propiedad Intelectual y Derechos de Autor (incluyendo la cesión de derechos y la prohibición de uso u oposición). iii. <b>Cláusula Novena:</b> No Competencia y No Solicitación (Post-Terminación). iv. <b>Cláusula Décima:</b> Confidencialidad y No Divulgación. v. <b>Cláusula Decimotercera:</b> Devolución de Bienes y Propiedad. vi. Las obligaciones relativas a la responsabilidad por daños causados a <b>EL EMPLEADOR</b> por dolo o culpa grave de <b>EL TRABAJADOR</b>.</p>

  <p>Esta enumeración es meramente enunciativa y no taxativa, entendiéndose que cualquier otra obligación que por su naturaleza deba sobrevivir a la terminación del vínculo laboral para la protección de los intereses legítimos de <b>EL EMPLEADOR</b>, subsistirá y será plenamente exigible incluso después de la terminación de la relación laboral por cualquier causa.</p>

  <h3>CLÁUSULA DECIMOCTAVA: FIRMA ELECTRÓNICA Y VALIDEZ</h3>

  <p>Las Partes acuerdan que la firma física, electrónica o digital, así como la huella dactilar impuesta al final de este documento (si aplica), se entenderán como prueba expresa y válida de su consentimiento, conocimiento y aceptación de todas las cláusulas y condiciones del presente Contrato y sus anexos. La validez de la firma electrónica y digital se regirá por la Ley 527 de 1999, el Decreto 2364 de 2012 y demás normas concordantes. La autenticidad, integridad y aceptación del documento quedan plenamente certificadas por cualquiera de los medios de firma o huella utilizados, otorgando efectos jurídicos equivalentes a la firma manuscrita.</p>

  <h3>ACEPTACIÓN Y FIRMA</h3>

  <p>Las Partes declaran haber leído, entendido y aceptado el contenido íntegro de este Contrato y sus anexos, los cuales forman parte integral del presente instrumento y de los cuales han recibido copia o acceso digital. En constancia de lo anterior, lo firman en un solo acto en la ciudad de <b>{{ strtoupper($studio->city->city_name ?? 'Cali') }}</b>, a la fecha de la última firma.</p>

  <p><b>Fecha de Firma:</b> {{ date('d') }} de {{ strtoupper(monthLetters(date('m'))) }} de {{ date('Y') }}</p>

  <br><br>

  <table>
    <tr>
      <td style="width: 50%; vertical-align: top;">
        <p><b>EL EMPLEADOR</b></p>
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
        <p><b>NIT {{$studio->nitWithVerificationDigit()}}</b></p>
      </td>
      <td style="width: 50%; vertical-align: top;">
        <p><b>EL TRABAJADOR</b></p>
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
        <p style="color: red">Dirección: {{ strtoupper($model->user_address ?? '[Dirección]') }}</p>
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

