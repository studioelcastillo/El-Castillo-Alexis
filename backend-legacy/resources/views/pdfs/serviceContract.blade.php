<!DOCTYPE html>
<html lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>Contrato de Prestación de Servicios Personales Independientes</title>
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
  <h1>CONTRATO DE PRESTACIÓN DE SERVICIOS PERSONALES INDEPENDIENTES</h1>

  <p>Entre los suscritos a saber:</p>

  <p>De una parte, <b>{{ strtoupper($studio->std_company_name) }}</b>, sociedad comercial legalmente constituida, identificada con <b>NIT {{$studio->nitWithVerificationDigit()}}</b>, con domicilio principal en la ciudad de <b>{{ strtoupper($studio->city->city_name ?? 'Cali, Valle del Cauca') }}</b>, específicamente en la <b>{{ strtoupper($studio->std_address ?? '[DIRECCIÓN DEL ESTUDIO]') }}</b>, representada legalmente por <b>{{ strtoupper($studio->std_manager_name ?? '[REPRESENTANTE]') }}</b>, mayor de edad, identificada con la cédula de ciudadanía N° <b>{{ strtoupper($studio->std_manager_id ?? '[ID_REPRESENTANTE] de Cali') }}</b>, quien para los efectos de este contrato se denominará <b>LA CONTRATANTE</b>.</p>

  <p>Y de la otra parte, el(la) señor(a) <b>{{ $model->fullName() }}</b>, mayor de edad, identificado(a) con la cédula de ciudadanía N° <b>{{ strtoupper($model->user_identification) }}</b> de <b>{{ strtoupper($model->user_issued_in ?? '[Lugar de expedición]') }}</b>, domiciliado(a) en la ciudad de <b>{{ strtoupper($model->city->city_name ?? '[Ciudad de domicilio]') }}</b>, quien en adelante y para los efectos de este contrato se denominará <b>EL CONTRATISTA</b>.</p>

  <p>Las Partes, denominadas individualmente como la "Parte" y conjuntamente como las "Partes", han convenido celebrar el presente <b>CONTRATO DE PRESTACIÓN DE SERVICIOS PERSONALES INDEPENDIENTES</b> (en adelante el "Contrato"), el cual se regirá por las siguientes cláusulas, previas las siguientes:</p>

  <h3>CONSIDERACIONES:</h3>

  <p>Que <b>LA CONTRATANTE</b> es una sociedad con experiencia en la gestión, producción, administración y comercialización de contenido digital y entretenimiento a través de diversas plataformas tecnológicas y canales en línea, lo que implica el manejo de información sensible, la creación de Propiedad Intelectual y la necesidad de mantener altos estándares de seguridad y ética.</p>

  <p>Que <b>EL CONTRATISTA</b> es una persona natural con la experiencia, conocimientos y habilidades necesarias para prestar los servicios profesionales, técnicos o especializados requeridos por <b>LA CONTRATANTE</b> de forma autónoma e independiente.</p>

  <p>Que <b>EL CONTRATISTA</b> declara bajo la gravedad de juramento que no posee antecedentes penales relacionados con delitos de pornografía infantil, trata de personas, lavado de activos, financiación del terrorismo, o cualquier otro delito que pueda poner en riesgo la integridad, la seguridad de las operaciones o la reputación de <b>LA CONTRATANTE</b> o de las personas involucradas en sus actividades.</p>

  <p>Que <b>EL CONTRATISTA</b> declara haber recibido, leído y comprendido el <b>CÓDIGO DE CONDUCTA Y MANUAL DE CONVIVENCIA GENERAL DE {{ strtoupper($studio->std_company_name) }}</b> y la <b>POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES (HABEAS DATA)</b> de <b>LA CONTRATANTE</b>, documentos que se entienden incorporados a este Contrato por referencia y que acepta cumplir en lo que le sea aplicable como prestador de servicios independientes, sin que en esto implique subordinación o vínculo laboral alguno.</p>

  <h3>CLÁUSULA PRIMERA: OBJETO DEL CONTRATO Y AUTONOMÍA DEL CONTRATISTA</h3>

  <p><b>EL CONTRATISTA</b> se compromete a prestar a <b>LA CONTRATANTE</b> servicios profesionales, técnicos o especializados en <b>{{$studioModel->stdmod_position ?? '[COLOCAR AQUÍ EL CARGO EJEMPLO: FOTÓGRAFO]'}}</b>.</p>

  <h4>1. Área de Administración</h4>

  <p class="indent">El colaborador prestará sus servicios en el Área de Administración, siendo responsable de coordinar procesos operativos, legales, financieros y estratégicos de la empresa. Incluye el seguimiento del cumplimiento de procesos internos, supervisión de contratos, provisiones, control documental y coordinación entre áreas. También será responsable del manejo de relaciones comerciales y alianzas estratégicas.</p>

  <hr/>

  <h4>2. Área de Recursos Humanos (incluye Selección)</h4>

  <p class="indent">El colaborador prestará sus servicios en el Área de Recursos Humanos, participando activamente en los procesos de bienestar laboral, evaluación de desempeño, capacitación, seguimiento del clima organizacional y gestión de beneficios. También incluye funciones de reclutamiento, selección, entrevistas, filtrado de candidatos y acompañamiento en los procesos de inducción y vinculación laboral.</p>

  <hr/>

  <h4>3. Área de Creación de Cuentas y Soporte Técnico (incluye Ciberseguridad)</h4>

  <p class="indent">El colaborador prestará sus servicios en el Área de Creación de Cuentas y Soporte Técnico, encargándose del registro, configuración y mantenimiento de cuentas en plataformas digitales, así como del soporte técnico en equipos, conectividad, software de operación. También incluye la gestión de ciberseguridad, protección de datos, prevención de accesos no autorizados y capacitación básica en seguridad digital al equipo.</p>

  <hr/>

  <h4>4. Área de Fotografía y Marketing</h4>

  <p class="indent">El colaborador prestará sus servicios en el Área de Fotografía y Marketing, participando en la creación, producción y edición de contenido visual (fotos y videos), así como en la planeación y ejecución de estrategias de promoción digital, manejo de redes sociales, campañas publicitarias, posicionamiento de marca y análisis de métricas de alcance.</p>

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

  <p class="indent">El colaborador prestará sus servicios en el Área de Monitores, acompañando operativamente a las modelos en su jornada laboral, brindando orientación, técnicas de ventas, apoyo en contenido básico y reporte de situaciones relevantes. También deberá velar por el cumplimiento de normas internas y el correcto desempeño de las modelos asignadas.</p>

  <hr/>

  <h4>9. Área de Psicología</h4>

  <p class="indent">El colaborador prestará sus servicios en el Área de Psicología, brindando acompañamiento emocional, individual y grupal a modelos y personal interno. Sus funciones incluyen intervenciones en crisis, talleres de bienestar, seguimiento conductual, asesoría psicoemocional y garantía de confidencialidad de los procesos de atención.</p>

  <hr/>

  <h4>10. Área Jurídica</h4>

  <p class="indent">El colaborador prestará sus servicios en el Área Jurídica, siendo responsable de la redacción, revisión y validación de contratos, aplicación de cláusulas de confidencialidad, protección de datos personales, derechos de imagen y normativas SARLAFT. También será el encargado de brindar asesoría legal preventiva, correctiva y representar jurídicamente a la empresa si se requiere.</p>

  <p><b>Además de las funciones aquí descritas</b>, el colaborador podrá ser requerido para ejecutar otras tareas afines o complementarias dentro del mismo ámbito de trabajo, que respondan a las necesidades operativas, estratégicas o administrativas de la empresa, aun cuando no estén expresamente detalladas en este contrato, siempre y cuando guarden relación con la naturaleza del área o el servicio contratado.</p>

  <p>De forma autónoma, independiente y sin que exista subordinación alguna frente a <b>LA CONTRATANTE</b>.</p>

  <p><b>EL CONTRATISTA</b> será responsable de la ejecución de sus servicios mediante sus propios medios, herramientas y bajo su propio riesgo, enfocándose en la obtención de los resultados o entregables acordados.</p>

  <p><b>LA CONTRATANTE</b> podrá indicar los lineamientos generales, especificaciones técnicas o resultados esperados y los plazos entregables, pero no la forma específica de ejecución del servicio, ni imponer horarios, ni directrices de cumplimiento de personal, ni instrucciones que desnaturalicen la autonomía e independencia de <b>EL CONTRATISTA</b>.</p>

  <h3>CLÁUSULA SEGUNDA: NATURALEZA JURÍDICA</h3>

  <p>El presente contrato es de carácter <b>civil</b> y <b>no genera vínculo laboral alguno</b> entre <b>LA CONTRATANTE</b> y <b>EL CONTRATISTA</b>.</p>

  <p><b>EL CONTRATISTA</b> actuará en todo momento de forma independiente, bajo su cuenta y riesgo, sin que exista subordinación continuada, dependencia económica exclusiva ni horario fijo, y será el único responsable por el cumplimiento de sus obligaciones como contratista independiente ante las autoridades fiscales, de seguridad social y cualquier otra entidad.</p>

  <p>Este Contrato se regirá por las disposiciones del Código Civil Colombiano y las demás normas comerciales aplicables.</p>

  <h3>CLÁUSULA TERCERA: DURACIÓN</h3>

  <p>El presente contrato tendrá una duración inicial de <b>dos (2)</b> meses contados a partir de la fecha de su firma.</p>

  <p>Podrá ser prorrogado por períodos sucesivos de <b>dos (2) meses</b>, mediante acuerdo escrito entre las Partes, hasta un máximo de <b>seis (6) meses</b> de duración total.</p>

  <p>Si después de este tiempo se requiere continuar con la relación contractual, se evaluará la viabilidad de un nuevo acuerdo o un contrato de diferente naturaleza, si las condiciones lo ameritan.</p>

  <h3>CLÁUSULA CUARTA: VALOR Y FORMA DE PAGO</h3>

  <p>Por los servicios prestados, <b>LA CONTRATANTE</b> pagará a <b>EL CONTRATISTA</b> honorarios por un valor total de <b>{{$studioModel->stdmod_monthly_salary ?? '[VALOR EN NÚMERO] $ [VALOR EN LETRA$] M/CTE.'}}</b>, pagaderos de la siguiente forma: En pagos quincenales de <b>[VALOR]</b> contra la presentación de la cuenta de cobro y el informe de actividades/entregables de la quincena anterior.</p>

  <p><b>EL CONTRATISTA</b> será responsable de realizar los aportes al Sistema General de Seguridad Social Integral (salud, pensión y ARL) de acuerdo con la legislación vigente para contratistas independientes, así como de cumplir con sus obligaciones tributarias.</p>

  <p><b>LA CONTRATANTE</b> efectuará las retenciones en la fuente a que haya lugar de conformidad con la ley.</p>

  <h3>CLÁUSULA QUINTA: OBLIGACIONES DE LA CONTRATANTE</h3>

  <p><b>LA CONTRATANTE</b> se obliga a:</p>

  <p>i. Pagar los honorarios pactados a <b>EL CONTRATISTA</b> en la forma y plazos convenidos.</p>

  <p>ii. Suministrar a <b>EL CONTRATISTA</b> la información necesaria y las condiciones (materiales, accesos, etc.) que estén bajo su control y sean indispensables para la correcta ejecución de los servicios, sin que esto implique una subordinación o control sobre la forma de ejecución del servicio.</p>

  <p>iii. Brindar los apoyos administrativos necesarios que permitan el normal desarrollo de los servicios.</p>

  <h3>CLÁUSULA SEXTA: OBLIGACIONES DEL CONTRATISTA</h3>

  <p><b>EL CONTRATISTA</b> se obliga a:</p>

  <p>i. <b>Autonomía e Independencia:</b> Ejecutar el objeto del presente Contrato de manera autónoma e independiente, utilizando sus propios medios, elementos y asumiendo todos los riesgos inherentes a la prestación del servicio.</p>

  <p>ii. <b>Cumplimiento de Especificaciones:</b> Prestar los servicios con la diligencia y profesionalismo debidos, de acuerdo con las especificaciones técnicas, los resultados esperados y los plazos establecidos por <b>LA CONTRATANTE</b> para los entregables, sin que esto implique el cumplimiento de horarios fijos.</p>

  <p>iii. <b>Uso de Recursos Propios:</b> Proveer sus propios recursos (personal, herramientas, equipos, etc.) para la ejecución del Contrato, salvo aquellos que expresamente y por escrito <b>LA CONTRATANTE</b> se comprometa a facilitar para la debida prestación del servicio, sin que esto desnaturalice la independencia de <b>EL CONTRATISTA</b>.</p>

  <p>iv. <b>Cumplimiento Normativo:</b> Cumplir con todas las normas legales aplicables a su actividad como contratista independiente, incluyendo las relativas a la seguridad social integral, régimen tributario y parafiscal.</p>

  <p>v. <b>Confidencialidad:</b> Cumplir con la obligación de confidencialidad de acuerdo con lo estipulado en la Cláusula Séptima del presente Contrato.</p>

  <p>vi. <b>Propiedad Intelectual:</b> Acatar las disposiciones relativas a la Propiedad Intelectual establecidas en la Cláusula Octava de este Contrato.</p>

  <p>vii. <b>Protección de Datos Personales:</b> Cumplir con las obligaciones en materia de protección de datos personales de acuerdo con lo establecido en la Cláusula Décima y la Política de Tratamiento de Datos Personales de <b>LA CONTRATANTE</b>.</p>

  <p>viii. <b>Seguridad y Salud:</b> En caso de que los servicios se presten en las instalaciones de <b>LA CONTRATANTE</b>, acatar las normas de seguridad y salud en el trabajo aplicables a visitantes y contratistas, así como reportar cualquier incidente o condición de riesgo.</p>

  <p>ix. <b>No Conflicto de Intereses y Lealtad:</b> Actuar con lealtad y buena fe hacia <b>LA CONTRATANTE</b>, absteniéndose de incurrir en situaciones de conflicto de interés real o aparente que puedan afectar su objetividad o la ejecución del Contrato.</p>

  <p>x. <b>Cumplimiento de Políticas y Disposiciones Aplicables:</b> Cumplir con las políticas y manuales de <b>LA CONTRATANTE</b> que sean estrictamente necesarios para la correcta y segura ejecución de los servicios objeto de este contrato, incluyendo, pero no limitándose a, las normas de seguridad de información, protección de datos personales (según la Política de Tratamiento de Datos Personales), y el Código de Conducta General de <b>LA CONTRATANTE</b>, así como cualesquiera otras disposiciones relativas al uso adecuado de las instalaciones y equipos de <b>LA CONTRATANTE</b> (si aplica y han sido suministrados para la ejecución del servicio). Este cumplimiento no implicará en ningún caso la existencia de subordinación laboral, sino la debida diligencia y profesionalismo esperados en la adecuada prestación del servicio.</p>

  <p>xi. <b>Conducta en Plataformas y Redes Sociales:</b> Mantener una conducta profesional y ética en todo momento, incluyendo el uso de plataformas digitales, redes sociales y comunicaciones, evitando comentarios, publicaciones o acciones que puedan dañar la imagen, reputación, clientes, modelos o proveedores de <b>LA CONTRATANTE</b>, o que sean contrarias a la ley o a la moral y buenas costumbres, o que de cualquier forma afecte la operación o los intereses comerciales de <b>LA CONTRATANTE</b>. Esta obligación se mantiene durante y después de la terminación del contrato, si afecta la relación entre la publicación y los intereses de <b>LA CONTRATANTE</b> es directa.</p>

  <p>xii. <b>Prevención de Actividades Ilícitas (SARLAFT):</b> Cumplir con todas las políticas y procedimientos de <b>LA CONTRATANTE</b> para la prevención del lavado de activos, financiación del terrorismo y proliferación de armas de destrucción masiva (SARLAFT), y colaborar con cualquier solicitud de información relacionada con este fin.</p>

  <p>xiii. <b>Responsabilidad por Terceros:</b> En caso de que <b>EL CONTRATISTA</b> subcontrate o delegue la ejecución de parte de los servicios a terceros, deberá garantizar que dichos terceros cumplan con todas las obligaciones contractuales y legales derivadas del presente Contrato, especialmente las relacionadas con confidencialidad, propiedad intelectual, protección de datos personales, prevención de lavado de activos y listas restrictivas, asumiendo <b>EL CONTRATISTA</b> la total y exclusiva responsabilidad por cualquier incumplimiento de los subcontratistas o personal a su cargo.</p>

  <h3>CLÁUSULA SÉPTIMA: CONFIDENCIALIDAD Y NO DIVULGACIÓN</h3>

  <p><b>EL CONTRATISTA</b> se obliga a mantener absoluta confidencialidad sobre toda la Información técnica, comercial, estratégica, de clientes, modelos, aliados, proveedores, software, know-how y cualquier otra información a la que tenga acceso con ocasión de la ejecución del presente Contrato (en adelante, la "Información Confidencial").</p>

  <p>Esta obligación se extiende a no revelar, usar, reproducir o divulgar dicha información a terceros sin el consentimiento previo y por escrito de <b>LA CONTRATANTE</b>, tanto durante la vigencia del Contrato como por un período de <b>diez (10) años</b> contados a partir de su terminación por cualquier causa.</p>

  <p>Adicionalmente, a la terminación del presente Contrato por cualquier causa, <b>EL CONTRATISTA</b> se obliga a devolver a <b>LA CONTRATANTE</b> toda la Información Confidencial, documentos, copias, materiales o elementos de cualquier tipo que contengan dicha información, en cualquier formato, y eliminar de forma permanente o segura toda Información Confidencial de la cual posea copias digitales o físicas en sus dispositivos personales, correos electrónicos o cualquier otro medio bajo su control.</p>

  <p>Una vez realizada dicha eliminación, <b>EL CONTRATISTA</b> deberá emitir y entregar a <b>LA CONTRATANTE</b> una certificación escrita, clara y bajo la gravedad de juramento, en la cual conste que ha cumplido con la obligación de devolver y/o eliminar completamente toda la Información Confidencial, y que no retiene copias de la misma.</p>

  <h3>CLÁUSULA OCTAVA: PROPIEDAD INTELECTUAL Y DERECHOS DE AUTOR</h3>

  <p>Todo el contenido, obras, desarrollos, diseños, software, materiales gráficos, audiovisuales, textos, marcas, patentes, ideas, invenciones, mejoras, know-how, procesos y cualquier otra creación de Propiedad Intelectual (en adelante, "Creaciones") que <b>EL CONTRATISTA</b> desarrolle, produzca o conciba durante la vigencia de este Contrato, o con ocasión o en relación con los servicios prestados a <b>LA CONTRATANTE</b>, incluyendo aquellas que sean resultado de las actividades asignadas o con el uso de recursos de <b>LA CONTRATANTE</b>, <b>serán de exclusiva propiedad de LA CONTRATANTE</b>.</p>

  <p><b>EL CONTRATISTA</b> cede a <b>LA CONTRATANTE</b>, de manera exclusiva, irrevocable, limitada en el tiempo y en el territorio, y a título universal, todos los derechos patrimoniales de autor, así como cualquier otro derecho de propiedad intelectual o industrial que puedan generarse sobre dichas Creaciones.</p>

  <p><b>EL CONTRATISTA</b> renuncia a cualquier derecho moral en la medida que la ley lo permita y se compromete a no oponerse al ejercicio de los derechos de <b>LA CONTRATANTE</b>.</p>

  <p><b>EL CONTRATISTA</b> se obliga a firmar cualquier documento o a realizar cualquier acto que sea necesario para formalizar la titularidad de <b>LA CONTRATANTE</b> sobre dichas Creaciones, incluyendo, pero no limitándose a, cesiones adicionales de derechos que puedan ser requeridas por <b>LA CONTRATANTE</b> en el futuro.</p>

  <h3>CLÁUSULA NOVENA: NO COMPETENCIA Y NO SOLICITACIÓN POST-CONTRACTUAL</h3>

  <p><b>EL CONTRATISTA</b> se obliga a no desarrollar, directa o indirectamente, por cuenta propia o a través de terceros, actividades de competencia o relacionadas con el objeto social de <b>LA CONTRATANTE</b>, incluyendo la gestión, producción, administración o comercialización de contenido digital y entretenimiento para adultos en plataformas en línea. Esta obligación de no competencia se extiende por un período de <b>dos (2) años</b> contados a partir de la terminación del presente Contrato, cualquiera que sea la causa de terminación, y será aplicable en todo el territorio de Colombia. Asimismo, durante el mismo período de <b>dos (2) años</b> y en el mismo territorio, <b>EL CONTRATISTA</b> se abstendrá de solicitar, contactar, ofrecer empleo o contratos, o inducir a la terminación de su relación contractual con <b>LA CONTRATANTE</b> a clientes, modelos, proveedores, o cualquier personal vinculado a <b>LA CONTRATANTE</b> con el fin de realizar actividades similares o en competencia con <b>LA CONTRATANTE</b>.</p>

  <h3>CLÁUSULA DÉCIMA: TRATAMIENTO DE DATOS PERSONALES</h3>

  <p><b>EL CONTRATISTA</b> reconoce y acepta que, en su calidad de titular de los datos personales, <b>LA CONTRATANTE</b> dará tratamiento a su información conforme a la <b>Política de Tratamiento de Datos Personales (Habeas Data)</b> de <b>{{ strtoupper($studio->std_company_name) }}</b>, la cual ha sido puesta a su disposición y de la cual ha recibido una copia o acceso digital. <b>EL CONTRATISTA</b> autoriza de manera expresa e informada a <b>LA CONTRATANTE</b> para recolectar, almacenar, usar, circular, suprimir, transmitir y/o transferir sus datos personales, incluyendo datos sensibles (si aplica y han sido suministrados voluntariamente), para los fines relacionados con la ejecución y administración del presente Contrato, el cumplimiento de obligaciones legales y fiscales, la gestión de pagos, la prevención de lavado de activos y financiación del terrorismo, la seguridad de las operaciones, y cualquier otra finalidad establecida en la Política de Tratamiento de Datos Personales de <b>LA CONTRATANTE</b>, así como para dar estricto cumplimiento a la Ley 1581 de 2012, al Decreto Reglamentario 1377 de 2013 y demás normas concordantes y complementarias en materia de protección de datos personales. <b>EL CONTRATISTA</b> deberá solicitar todas las autorizaciones necesarias de los titulares de la información y garantizar que el tratamiento de datos personales se realice bajo los principios de legalidad, finalidad, libertad, veracidad, transparencia, acceso y circulación restringida, seguridad y confidencialidad. <b>EL CONTRATISTA</b> será el único responsable de cualquier violación a la normatividad de protección de datos personales que ocurra por su acción u omisión, y deberá garantizar los derechos de los titulares (acceso, rectificación, supresión y revocatoria de la autorización) respecto de los datos bajo su custodia.</p>

  <h3>CLÁUSULA UNDÉCIMA: CLÁUSULA PENAL</h3>

  <p>En caso de incumplimiento de cualquiera de las obligaciones esenciales y críticas estipuladas en este Contrato por parte de <b>EL CONTRATISTA</b>, incluyendo, pero no limitándose a las obligaciones de confidencialidad (Cláusula Séptima), propiedad intelectual (Cláusula Octava), no competencia y no solicitación (Cláusula Novena), y protección de datos personales (Cláusula Décima), <b>EL CONTRATANTE</b> podrá dar por terminado el contrato de manera inmediata, sin perjuicio de la ejecución de la presente cláusula penal. Para cada incumplimiento grave y debidamente comprobado de las obligaciones críticas, <b>EL CONTRATISTA</b> deberá pagar a <b>LA CONTRATANTE</b> la suma equivalente a <b>Cincuenta (50) Unidades de Valor Tributario (UVT)</b>, a título de pena, sin necesidad de requerimiento para la constitución en mora, y sin</p>

  <p>perjuicio de la facultad de <b>LA CONTRATANTE</b> para exigir la indemnización de perjuicios adicionales que superen el valor de la pena aquí pactada, así como las acciones legales a que haya lugar. El valor de la UVT aplicable será el vigente para la fecha en que configure el incumplimiento.</p>

  <h3>CLÁUSULA DUODÉCIMA: APORTES A SEGURIDAD SOCIAL Y LEY 2381 DE 2024</h3>

  <p><b>EL CONTRATISTA</b> declara ser el único responsable de la realización de los aportes al Sistema General de Seguridad Social Integral (Salud, Pensión y Riesgos Laborales – ARL) en su calidad de contratista independiente. <b>EL CONTRATISTA</b> presentará a <b>LA CONTRATANTE</b> los soportes de pagos de aportes de forma mensual, dentro de los plazos establecidos por la ley. Para el cumplimiento de lo estipulado en la Ley 2381 de 2024, o cualquier norma que la modifique o sustituya, siempre que <b>EL CONTRATISTA</b> lo autorice expresamente por escrito, <b>LA CONTRATANTE</b> podrá retener y girar de los honorarios los montos correspondientes a los aportes obligatorios a Salud, Pensión y ARL, a partir del 1 de julio de 2025, o la fecha que la ley establezca para la entrada en vigencia de dicha facultad. Esta cesión se realizará de acuerdo con los porcentajes y bases de cotización establecidos por la normativa vigente para trabajadores independientes y se consignará directamente a las entidades administradoras de seguridad social.</p>

  <h3>CLÁUSULA DECIMOTERCERA: JURISDICCIÓN Y SOLUCIÓN DE CONTROVERSIAS</h3>

  <p>Para todos los efectos legales y contractuales, el presente Contrato se regirá por las leyes de la República de Colombia. Cualquier controversia o diferencia que surja entre las Partes con ocasión de la celebración, ejecución, interpretación, liquidación o terminación del Contrato, y que no pueda ser resuelta mediante arreglo directo, será sometida a la Jurisdicción Civil Ordinaria de la ciudad de <b>{{ strtoupper($studio->city->city_name ?? 'Cali, Valle del Cauca') }}</b>, Colombia. Las Partes renuncian expresamente a cualquier otro fuero que pudiere corresponderles.</p>

  <h3>CLÁUSULA DECIMOCUARTA: SUPERVIVENCIA CONTRACTUAL</h3>

  <p>Las Partes acuerdan que, no obstante la terminación del presente Contrato por cualquier causa (incluyendo, pero no limitándose a, vencimiento del plazo, mutuo acuerdo, o terminación unilateral por incumplimiento), las siguientes cláusulas y obligaciones subsistirán y estarán en plena vigencia y efecto entre las Partes: i. Cláusula Séptima (Confidencialidad y No Divulgación), así como cualquier otra obligación relativa a la devolución y destrucción de información. ii. Cláusula Octava (Propiedad Intelectual y Derechos de Autor), incluyendo la cesión de derechos y la renuncia de derechos morales, según se prevé en dicha cláusula. iii. Cláusula Novena (No Competencia y No Solicitación Post-Contractual). iv. Cláusula Décima (Tratamiento de Datos Personales), incluyendo las obligaciones relativas a la responsabilidad de datos y a la legitimación de <b>EL CONTRATISTA</b> como operador/encargado. v. Cláusula Undécima (Cláusula Penal). vi. Cláusula Duodécima (Aportes a Seguridad Social y Ley 2381 de 2024) en lo que respecta a obligaciones pendientes. vii. Cláusula Decimotercera (Jurisdicción y Solución de Controversias). viii. Las obligaciones relativas a la responsabilidad por daños causados a <b>LA CONTRATANTE</b> por dolo o culpa grave de <b>EL CONTRATISTA</b>. ix. Cualquier otra obligación que por su naturaleza deba sobrevivir a la terminación del Contrato para la protección de los intereses legítimos de <b>LA CONTRATANTE</b>.</p>

  <h3>CLÁUSULA DECIMOQUINTA: AUTORIZACIÓN DE DEDUCCIONES</h3>

  <p><b>EL CONTRATISTA</b> autoriza expresa, libre, informada e irrevocablemente a <b>LA CONTRATANTE</b> para efectuar deducciones de sus honorarios o cualquier otro valor que le corresponda recibir con ocasión</p>

  <p>de este Contrato, en los siguientes eventos y bajo las siguientes condiciones: i. Por concepto de daños, pérdidas, deterioro, hurto o extravío de equipos, bienes o infraestructura propiedad de <b>LA CONTRATANTE</b> o de terceros, siempre que se compruebe la responsabilidad directa de <b>EL CONTRATISTA</b> por dolo o culpa grave. La cuantía de la deducción será proporcional al daño causado, previa valoración y comunicación a <b>EL CONTRATISTA</b>, quien tendrá derecho a presentar descargos. ii. Por concepto de anticipos, préstamos o cualquier otra suma entregada por <b>LA CONTRATANTE</b> a <b>EL CONTRATISTA</b> de forma anticipada en causación de los honorarios, según lo acordado por escrito. iii. Por la adquisición de productos o servicios internos ofrecidos por <b>LA CONTRATANTE</b> y autorizados por <b>EL CONTRATISTA</b> por escrito, como uniformes, tecnología, lencería, insumos de trabajo, entre otros. iv. En caso de terminación del Contrato por cualquier causa, <b>LA CONTRATANTE</b> podrá retener proporcionalmente el valor de los honorarios o liquidación, cualquier valor pendiente por los conceptos antes mencionados. Esta facultad de deducción se ejercerá respetando los límites legales aplicables a este tipo de contrato de deducción se ejercerá respetando los límites legales aplicables a este tipo de</p>

  <h3>CLÁUSULA DECIMOSEXTA: MENCION EXPRESA A POLÍTICAS DE LA EMPRESA</h3>

  <p><b>EL CONTRATISTA</b> declara expresamente que conoce, comprende el contenido del Código de Conducta General de <b>{{ strtoupper($studio->std_company_name) }}</b>, el Manual de Convivencia General, y la Política de Tratamiento de Datos Personales (Habeas Data) de <b>LA CONTRATANTE</b>. <b>EL CONTRATISTA</b> se obliga a cumplir y acatar todas las disposiciones contenidas en dichos documentos en lo que le sea aplicable como prestador de servicios independientes, sin que el cumplimiento de estos reglamentos o manuales implique o pueda interpretarse en ningún caso como una relación de subordinación laboral, dependencia o vínculo de trabajo entre las Partes, manteniendo siempre su autonomía e independencia.</p>

  <h3>CLÁUSULA DECIMOSÉPTIMA: INTEGRIDAD DEL CONTRATO Y FIRMA DIGITAL</h3>

  <p>Este documento, junto con sus anexos (incluyendo el <b>CÓDIGO DE CONDUCTA Y MANUAL DE CONVIVENCIA GENERAL</b> de <b>{{ strtoupper($studio->std_company_name) }}</b> y la <b>POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES (HABEAS DATA)</b>), constituye la totalidad del acuerdo entre las Partes con respecto al objeto contractual. Cualquier modificación o alteración a los términos del presente Contrato deberá realizarse por escrito y ser firmada por ambas Partes. La firma del presente Contrato implica la aceptación plena e incondicional de todos sus términos y condiciones.</p>

  <p>La firma física, electrónica o digital de las Partes, así como la huella dactilar impuesta al final de este documento (si aplica), se entenderán como prueba expresa y válida de su consentimiento, conocimiento y aceptación de todas las cláusulas y condiciones del presente Contrato y sus anexos. La validez y fuerza jurídica de la firma electrónica y digital se regirá por la Ley 527 de 1999, el Decreto 2364 de 2012 y demás normas concordantes. La autenticidad, integridad y aceptación del documento quedan plenamente certificadas por cualquiera de los medios de firma o huella utilizados, otorgando efectos jurídicos equivalentes a la firma manuscrita, garantizando la trazabilidad y verificabilidad de la aceptación por parte del firmante.</p>

  <h3>ANEXO A – AUTORIZACIÓN DE DESCUENTOS Y DEDUCCIONES</h3>

  <p>En mi calidad de contratista independiente de <b>{{ strtoupper($studio->std_company_name) }}</b>, identificada con NIT <b>{{$studio->nitWithVerificationDigit()}}</b>, autorizo expresa, libre, informada e irrevocable que se me efectúen descuentos de mis honorarios o cualquier otro ingreso derivado de mi relación contractual, conforme a lo establecido en la Cláusula Decimoquinta del Contrato de Prestación de Servicios Personales Independientes, en los siguientes conceptos:</p>

  <p>1. <b>Préstamos o anticipos otorgados por LA CONTRATANTE</b> y debidamente documentados.</p>

  <p>2. <b>Adquisición de productos o servicios internos</b> ofrecidos por <b>LA CONTRATANTE</b> (ej. uniformes, tecnología, lencería, insumos personales de trabajo, etc.), previamente autorizados por escrito por mi parte.</p>

  <p>3. <b>Deducciones por daños, pérdidas, deterioro, hurto o extravío</b> de equipos, bienes o infraestructura propiedad de <b>LA CONTRATANTE</b> o de terceros, siempre que mi responsabilidad directa sea comprobada por dolo o culpa grave. La cuantía de la deducción será proporcional al daño causado, previa valoración y comunicación.</p>

  <h4>Condiciones de aplicación de los descuentos:</h4>

  <ul>
    <li>Los descuentos se aplicarán por cuotas o de forma única, según lo acordado previamente por escrito, hasta saldar la obligación.</li>
    <li>Se realizarán conforme a las políticas internas de <b>LA CONTRATANTE</b>, el Contrato de Prestación de Servicios y los valores previamente acordados y autorizados.</li>
    <li>En caso de terminación del vínculo contractual, <b>LA CONTRATANTE</b> podrá descontar cualquier saldo pendiente de manera justa y proporcional de los valores adeudados a <b>EL CONTRATISTA</b>.</li>
  </ul>

  <p>La presente autorización se firma como parte integral del Contrato de Prestación de Servicios Personales Independientes y bajo el principio de la autonomía de la voluntad.</p>

  <h3>ACEPTACIÓN Y FIRMA</h3>

  <p>Las Partes declaran haber leído, entendido y aceptado el contenido íntegro de este Contrato y sus <b>diecisiete (17) cláusulas</b> principales, así como sus anexos, los cuales forman parte integral del presente instrumento y de los cuales han recibido copia o acceso digital. En constancia de lo anterior, lo firman en un solo acto en la ciudad de <b>{{ strtoupper($studio->city->city_name ?? 'Cali') }}</b>, a la fecha de la última firma.</p>

  <p><b>Fecha de Firma:</b> {{ date('d') }} de {{ strtoupper(monthLetters(date('m'))) }} de {{date('Y')}}</p>

  <br><br>

  <table>
    <tr>
      <td style="width: 50%; vertical-align: top;">
        <p><b>LA CONTRATANTE</b></p>
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
        <p><b>CONTRATISTA</b></p>
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

