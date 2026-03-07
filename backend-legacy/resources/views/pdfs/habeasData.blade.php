<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Política de Tratamiento de Datos Personales (Habeas Data)</title>
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

    ol {
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

    hr {
      margin: 30px 0;
      border: none;
      border-top: 1px solid #000;
    }

    .page-number {
      text-align: right;
      margin-top: 30px;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <h1>POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES (HABEAS DATA)</h1>

  <p><b>{{ strtoupper($studio->std_company_name) }}</b></p>
  <p><b>NIT: {{ strtoupper($studio->nitWithVerificationDigit()) }}</b></p>

  <p><b>Fecha de Expedición/Última Actualización:</b> {{ date('d') }} de {{ strtoupper(monthLetters(date('m'))) }} de {{ date('Y') }}</p>

  <h2>1. INTRODUCCIÓN Y OBJETO</h2>

  <p><b>{{ strtoupper($studio->std_company_name) }}</b> (en adelante "EL MANDANTE" o "la Compañía"), identificada con NIT <b>{{ strtoupper($studio->nitWithVerificationDigit()) }}</b>, con domicilio principal en la ciudad de <b>{{ strtoupper($studio->city->city_name ?? 'Cali, Valle del Cauca') }}</b>, específicamente en la <b>{{ strtoupper($studio->std_address ?? 'Carrera 44 # 2A-50, Barrio El Lido') }}</b>, en cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de 2013, y demás normas que regulan la protección de datos personales en Colombia, presenta la presente Política de Tratamiento de Datos Personales (en adelante, la "Política").</p>

  <p>Esta Política tiene como objeto establecer los términos y condiciones bajo los cuales la Compañía recolecta, almacena, usa, circula, suprime y realiza cualquier otra operación sobre los datos personales de sus empleados, colaboradores, colaboradores (como EL MANDATARIO), contratistas, proveedores, clientes, visitantes, y cualquier otra persona natural ("Titular") de quien se obtengan datos personales. Así mismo, busca garantizar que el tratamiento de datos personales se realice bajo los principios de legalidad, finalidad, libertad, veracidad o calidad, transparencia, acceso y circulación restringida, seguridad y confidencialidad.</p>

  <h2>2. RESPONSABLE DEL TRATAMIENTO DE DATOS PERSONALES</h2>

  <p>El Responsable del Tratamiento de los datos personales es:</p>

  <ul>
    <li><b>Razón Social:</b> <b>{{ strtoupper($studio->std_company_name) }}</b></li>
    <li><b>NIT:</b> <b>{{$studio->nitWithVerificationDigit()}}</b></li>
    <li><b>Domicilio Principal:</b> <b>{{ strtoupper($studio->std_address ?? 'Carrera 44 # 2A-50, Barrio El Lido, Cali, Valle del Cauca, Colombia') }}</b></li>
    <li><b>Teléfono de Contacto:</b> <b>{{ strtoupper($studio->userOwner->user_telephone ?? '3153507516') }}</b></li>
    <li><b>Correo Electrónico:</b> <b>{{ strtoupper($studio->userOwner->user_personal_email ?? 'STUDIOELCASTILLO@GMAIL.COM') }}</b></li>
  </ul>

  <h2>3. MARCO NORMATIVO</h2>

  <p>Esta Política se rige por:</p>

  <ul>
    <li>Constitución Política de Colombia, Artículo 15.</li>
    <li>Ley 1581 de 2012 (Ley General de Protección de Datos Personales).</li>
    <li>Decreto 1377 de 2013 (Decreto reglamentario de la Ley 1581 de 2012).</li>
    <li>Decreto 1074 de 2015 (Decreto Único Reglamentario del Sector Comercio, Industria y Turismo).</li>
    <li>Circular Externa No. 002 de 2015 de la Superintendencia de Industria y Comercio (SIC).</li>
    <li>Las demás normas que modifiquen, adicionen o deroguen las anteriores.</li>
  </ul>

  <h2>4. DEFINICIONES</h2>

  <p>Para los efectos de esta Política, se aplicarán las siguientes definiciones conforme a la normativa vigente:</p>

  <ul>
    <li><b>Autorización:</b> Consentimiento previo, expreso e informado del Titular para llevar a cabo el Tratamiento de datos personales.</li>
    <li><b>Aviso de Privacidad:</b> Comunicación verbal o escrita generada por el Responsable, dirigida al Titular para el tratamiento de sus datos personales, mediante la cual se le informa acerca de la existencia de las políticas de tratamiento de información que le serán aplicables, la forma de acceder a las mismas y las finalidades del tratamiento que se pretende dar a los datos personales.</li>
    <li><b>Base de Datos:</b> Conjunto organizado de datos personales que sea objeto de Tratamiento.</li>
    <li><b>Dato Personal:</b> Cualquier información vinculada o que pueda asociarse a una o varias personas naturales determinadas o determinables.</li>
    <li><b>Dato Público:</b> Es el dato calificado como tal, semiprivado, privado o sensible. Son considerados datos públicos, entre otros, los datos relativos al estado civil de las personas, a su profesión u oficio y a su calidad de comerciante o de servidor público. Por su naturaleza, los datos públicos pueden estar contenidos, entre otros, en registros públicos, documentos públicos, gacetas y boletines oficiales y sentencias judiciales debidamente ejecutoriadas que no estén sometidas a reserva.</li>
    <li><b>Datos Sensibles:</b> Aquellos que afectan la intimidad personal del Titular o cuyo uso indebido puede generar su discriminación, tales como aquellos que revelen el origen racial o étnico, la orientación política, las convicciones religiosas o filosóficas, la pertenencia a sindicatos, organizaciones sociales, de derechos humanos o que promueva intereses de cualquier partido político o que garanticen los derechos y garantías de partidos políticos de oposición, así como los datos relativos a la salud, a la vida sexual y los datos biométricos.</li>
    <li><b>Encargado del Tratamiento:</b> Persona natural o jurídica, pública o privada, que por sí misma o en asocio con otros, realice el Tratamiento de datos personales por cuenta del Responsable del Tratamiento.</li>
    <li><b>Responsable del Tratamiento:</b> Persona natural o jurídica, pública o privada, que por sí misma o en asocio con otros, decida sobre la Base de Datos y/o el Tratamiento de los datos.</li>
    <li><b>Titular:</b> Persona natural cuyos datos personales sean objeto de Tratamiento.</li>
    <li><b>Tratamiento:</b> Cualquier operación o conjunto de operaciones sobre datos personales, tales como la recolección, almacenamiento, uso, circulación o supresión.</li>
  </ul>

  <h2>5. PRINCIPIOS PARA EL TRATAMIENTO DE DATOS PERSONALES</h2>

  <p>La Compañía aplicará los siguientes principios rectores en el tratamiento de datos personales:</p>

  <ul>
    <li><b>Principio de Legalidad:</b> El Tratamiento de datos es una actividad regulada que debe sujetarse a lo establecido en la Ley y en las demás disposiciones que la desarrollen.</li>
    <li><b>Principio de Finalidad:</b> El Tratamiento debe obedecer a una finalidad legítima de acuerdo con la Constitución y la Ley, la cual debe ser informada al Titular.</li>
    <li><b>Principio de Libertad:</b> El Tratamiento sólo puede ejercerse con el consentimiento previo, expreso e informado del Titular. No se pueden obtener datos sin previo consentimiento o que no sean consecuencia de una obligación legal o contractual.</li>
    <li><b>Principio de Veracidad o Calidad:</b> La información sujeta a Tratamiento debe ser veraz, completa, exacta, actualizada, comprobable y comprensible. Se prohíbe el Tratamiento de datos parciales, incompletos, fraccionados o que induzcan a error.</li>
    <li><b>Principio de Transparencia:</b> En el Tratamiento debe garantizarse el derecho del Titular a obtener del Responsable del Tratamiento o del Encargado del Tratamiento, en cualquier momento y sin restricciones, información acerca de la existencia de datos que le conciernen.</li>
    <li><b>Principio de Acceso y Circulación Restringida:</b> El Tratamiento se sujeta a los límites que se derivan de la naturaleza de los datos personales, de las disposiciones de la Ley y la Constitución. Los datos personales, salvo la información pública, no podrán estar disponibles en Internet u otros medios de divulgación o comunicación masiva, salvo que el acceso sea técnicamente controlable para brindar un conocimiento restringido sólo a los Titulares o terceros autorizados.</li>
    <li><b>Principio de Seguridad:</b> La información sujeta a Tratamiento por el Responsable del Tratamiento o Encargado del Tratamiento se deberá manejar con las medidas técnicas, humanas y administrativas necesarias para otorgar seguridad a los registros, evitando su adulteración, pérdida, consulta, uso o acceso no autorizado o fraudulento.</li>
    <li><b>Principio de Confidencialidad:</b> Todas las personas que intervengan en el Tratamiento de datos personales que no tengan la naturaleza de públicos están obligadas a garantizar la reserva de la información, inclusive después de finalizada su relación con alguna de las labores que comprende el Tratamiento.</li>
  </ul>

  <h2>6. FINALIDADES DEL TRATAMIENTO DE DATOS PERSONALES</h2>

  <p>La Compañía realizará el Tratamiento de datos personales con las siguientes finalidades:</p>

  <h3>A. Para EL MANDATARIO (Modelos) y otros Colaboradores Independientes:</h3>

  <ul>
    <li><b>Gestión Contractual:</b> Ejecutar las obligaciones derivadas del Contrato de Mandato Comercial con Representación, incluyendo la gestión de perfiles, monetización de contenido, soporte técnico y administrativo, y el pago de la remuneración.</li>
    <li><b>Verificación y Seguridad:</b> Realizar procesos de debida diligencia (KYC), prevención de Lavado de Activos y Financiación del Terrorismo (SARLAFT) y control de listas restrictivas.</li>
    <li><b>Monitoreo y Auditoría:</b> Realizar grabaciones de audio y video en las instalaciones para fines de seguridad, control operativo, calidad, cumplimiento de políticas internas, y respaldo en caso de reclamaciones o litigios. Así mismo, monitorear la actividad en plataformas digitales para asegurar la calidad y el cumplimiento de los términos del mandato.</li>
    <li><b>Protección de Propiedad Intelectual:</b> Garantizar la titularidad y explotación de los derechos de imagen y propiedad intelectual sobre el contenido generado.</li>
  </ul>

  <ul>
    <li><b>Gestión Administrativa y Contable:</b> Procesar pagos, emitir certificados y gestionar la información financiera para el cumplimiento de obligaciones fiscales.</li>
    <li><b>Comunicación:</b> Envío de comunicaciones relacionadas con la operación del mandato, políticas, procedimientos o novedades relevantes.</li>
    <li><b>Bienestar:</b> Ofrecer acceso a programas de bienestar emocional y apoyo psicológico, según la disponibilidad de la Compañía.</li>
    <li><b>Cumplimiento Legal:</b> Atender requerimientos de autoridades judiciales o administrativas.</li>
  </ul>

  <h3>B. Para Empleados y Candidatos a Empleo:</h3>

  <ul>
    <li><b>Gestión de Talento Humano:</b> Realizar procesos de selección, contratación, nómina, capacitación, evaluación del desempeño y terminación de la relación laboral.</li>
    <li><b>Seguridad Social y Parafiscales:</b> Realizar los aportes y reportes a los sistemas de seguridad social integral y cajas de compensación familiar.</li>
    <li><b>Bienestar Laboral:</b> Administrar programas de bienestar, salud ocupacional y seguridad en el trabajo.</li>
    <li><b>Gestión de Desempeño:</b> Monitorear el desempeño laboral, realizar evaluaciones y gestionar planes de mejora.</li>
    <li><b>Cumplimiento Legal:</b> Atender requerimientos de autoridades judiciales o administrativas, incluyendo auditorías laborales y fiscales.</li>
  </ul>

  <h3>C. Para Proveedores y Contratistas (personas naturales):</h3>

  <ul>
    <li><b>Gestión Contractual:</b> Celebración, ejecución y terminación de contratos de prestación de servicios o suministro de bienes.</li>
    <li><b>Gestión de Pagos:</b> Realizar pagos y retenciones fiscales correspondientes.</li>
    <li><b>Evaluación y Monitoreo:</b> Evaluar el desempeño de los servicios y productos ofrecidos.</li>
    <li><b>Cumplimiento Legal:</b> Atender requerimientos de autoridades judiciales o administrativas.</li>
  </ul>

  <h3>D. Para Clientes y Visitantes (general):</h3>

  <ul>
    <li><b>Comunicación y Atención:</b> Responder a consultas, quejas y solicitudes.</li>
    <li><b>Seguridad y Control:</b> Control de acceso a las instalaciones para garantizar la seguridad de personas y bienes (a través de registros, videovigilancia).</li>
    <li><b>Marketing y Publicidad:</b> Envío de información sobre productos, servicios y promociones, siempre que se cuente con el consentimiento del Titular.</li>
  </ul>

  <h2>7. TRATAMIENTO DE DATOS SENSIBLES</h2>

  <p>La Compañía se compromete a proteger la privacidad de los datos sensibles y a manejarlos con estricta confidencialidad. El tratamiento de datos sensibles (como datos biométricos para acceso, datos de salud en el ámbito laboral, o información sobre orientación sexual en el caso de modelos si es relevante para el contenido y es entregado voluntariamente) se realizará únicamente cuando:</p>

  <ul>
    <li>El Titular haya dado su autorización explícita para dicho tratamiento, salvo en los casos que la Ley exceptúe dicha autorización.</li>
    <li>El tratamiento sea necesario para salvaguardar un interés vital del Titular o de otra persona.</li>
    <li>El tratamiento sea efectuado en el curso de las actividades legítimas y con las debidas garantías por una fundación, ONG, asociación o cualquier otro organismo sin ánimo de lucro, cuya finalidad sea política, filosófica, religiosa o sindical.</li>
    <li>El tratamiento se refiera a datos que sean necesarios para el reconocimiento, ejercicio o defensa de un derecho en un proceso judicial.</li>
    <li>El tratamiento tenga una finalidad histórica, estadística o científica, siempre y cuando se adopten medidas para la supresión de identidad de los Titulares.</li>
  </ul>

  <p><b>EL MANDANTE.</b> no condicionará la vinculación o la prestación de un servicio a la entrega de datos sensibles, a menos que sean absolutamente indispensables para la ejecución del contrato o la prestación del servicio.</p>

  <h2>8. DERECHOS DE LOS TITULARES DE DATOS</h2>

  <p>De conformidad con el Artículo 8 de la Ley 1581 de 2012, el Titular de los datos personales tiene los siguientes derechos:</p>

  <ul>
    <li><b>Derecho de Acceso:</b> Conocer, actualizar y rectificar sus datos personales frente a la Compañía en su calidad de Responsable del Tratamiento. Este derecho se podrá ejercer, entre otros, frente a datos parciales, incompletos, fraccionados, que induzcan a error, o aquellos cuyo Tratamiento esté expresamente prohibido o no haya sido autorizado.</li>
    <li><b>Derecho de Rectificación y Actualización:</b> Solicitar prueba de la autorización otorgada a la Compañía, salvo cuando la ley exceptúe expresamente dicho requisito.</li>
    <li><b>Derecho de Revocatoria del Consentimiento:</b> Ser informado por la Compañía, previa solicitud, respecto del uso que le ha dado a sus datos personales.</li>
    <li><b>Derecho a Reclamo:</b> Presentar ante la Superintendencia de Industria y Comercio (SIC) quejas por infracciones a lo dispuesto en la presente ley y las demás normas que la modifiquen, adicionen o complementen.</li>
    <li><b>Derecho de Supresión (Eliminación):</b> Solicitar a la Compañía la supresión del dato cuando en el Tratamiento no se respeten los principios, derechos y garantías constitucionales y legales. La supresión implica la eliminación total o parcial de la información personal de acuerdo con lo solicitado por el Titular en los registros, archivos, bases de datos o tratamientos de la Compañía. No obstante, este derecho no es absoluto y la Compañía podrá negarlo cuando deba conservar los datos por una obligación legal o contractual.</li>
  </ul>

  <h2>9. PROCEDIMIENTO PARA EL EJERCICIO DE LOS DERECHOS DEL TITULAR</h2>

  <p>El Titular, o sus causahabientes, podrá ejercer sus derechos de Acceso, Rectificación, Actualización, Supresión y Revocatoria del Consentimiento, así como presentar consultas o reclamos, a través de los siguientes canales:</p>

  <ul>
    <li><b>Correo Electrónico:</b> <b>{{ strtoupper($studio->userOwner->user_personal_email ?? 'STUDIOELCASTILLO@GMAIL.COM') }}</b></li>
    <li><b>Dirección Física:</b> <b>{{ strtoupper($studio->std_address ?? 'Carrera 44 # 2A-50, Barrio El Lido, Cali, Valle del Cauca, Colombia') }}</b></li>
    <li><b>Teléfono de Contacto:</b> <b>{{ strtoupper($studio->userOwner->user_telephone ?? '3153507516') }}</b></li>
  </ul>

  <p><b>Procedimiento para Consultas (Acceso a la información):</b> El Titular podrá consultar sus datos personales que reposen en la base de datos de la Compañía. La Compañía responderá la consulta en un término máximo de <b>diez (10) días hábiles</b> contados a partir de la fecha de recibo de la misma. Cuando no fuere posible atender la consulta dentro de dicho término, se informará al interesado, expresando los motivos de la demora y señalando la fecha en que se atenderá su consulta, la cual en ningún caso podrá superar los cinco (5) días hábiles siguientes al vencimiento del primer término.</p>

  <p><b>Procedimiento para Reclamos (Rectificación, Actualización, Supresión, Revocatoria):</b> El Titular que considere que la información contenida en una base de datos debe ser objeto de corrección, actualización, supresión o que desee revocar la autorización, podrá presentar un reclamo a la Compañía. El reclamo deberá contener: a. Identificación del Titular. b. Descripción de los hechos que dan lugar al reclamo. c. Dirección física o electrónica para notificación. d. Documentos que se quieran hacer valer.</p>

  <p>Si el reclamo resulta incompleto, se requerirá al interesado dentro de los cinco (5) días hábiles siguientes a la recepción del reclamo para que subsane las fallas. Transcurridos dos (2) meses desde la fecha del requerimiento sin que el solicitante presente la información requerida, se entenderá que ha desistido del reclamo.</p>

  <p>Una vez recibido el reclamo completo, se incluirá en la base de datos una leyenda que diga "reclamo en trámite" y el motivo del mismo, en un término no mayor a dos (2) días hábiles. Dicha leyenda deberá mantenerse hasta que el reclamo sea decidido.</p>

  <p>El término máximo para atender el reclamo será de <b>quince (15) días hábiles</b> contados a partir del día siguiente a la fecha de su recibo. Cuando no fuere posible atender el reclamo dentro de dicho término, se informará al interesado los motivos de la demora y la fecha en que se atenderá su reclamo, la cual en ningún caso podrá superar los ocho (8) días hábiles siguientes al vencimiento del primer término.</p>

  <h2>10. SEGURIDAD DE LA INFORMACIÓN</h2>

  <p><b>EL MANDANTE</b> adoptará las medidas técnicas, humanas y administrativas que sean necesarias para otorgar seguridad a los registros, evitando su adulteración, pérdida, consulta, uso o acceso no autorizado o fraudulento. Estas medidas incluyen, pero no se limitan a:</p>

  <ul>
    <li>Controles de acceso físico y lógico a las bases de datos.</li>
    <li>Mecanismos de autenticación y autorización para el personal que accede a la información.</li>
    <li>Sistemas de monitoreo y detección de intrusiones.</li>
    <li>Capacitación continua al personal en materia de protección de datos.</li>
    <li>Acuerdos de confidencialidad con empleados y colaboradores.</li>
  </ul>

  <h2>11. TRANSFERENCIA Y TRANSMISIÓN DE DATOS PERSONALES</h2>

  <p><b>EL MANDANTE</b> podrá transferir o transmitir datos personales a terceros, nacionales o internacionales, únicamente cuando sea necesario para las finalidades establecidas en esta Política o para el cumplimiento de obligaciones legales o contractuales. Dichas transferencias/transmisiones se realizarán bajo las siguientes condiciones:</p>

  <ul>
    <li><b>Transferencia (a un nuevo responsable):</b> Se realizará con la autorización del Titular y cuando el país de destino ofrezca niveles adecuados de protección de datos, o mediante la implementación de garantías adecuadas (ej. cláusulas contractuales tipo).</li>
    <li><b>Transmisión (a un encargado para tratamiento por cuenta del responsable):</b> Se realizará mediante la suscripción de un contrato de transmisión de datos que contenga las obligaciones y responsabilidades del Encargado, garantizando que el tratamiento se realice conforme a esta Política y a la ley colombiana. Esto incluye la transmisión de datos a plataformas de contenido digital y proveedores de servicios tecnológicos necesarios para la operación del negocio.</li>
  </ul>

  <h2>12. VIGENCIA DE LA POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES</h2>

  <p>La presente Política rige a partir de la fecha de su expedición y las bases de datos de la Compañía se mantendrán por el tiempo que sea razonable y necesario para cumplir con las finalidades del tratamiento, las obligaciones legales o contractuales, o las disposiciones de las autoridades competentes.</p>

  <p>Cualquier cambio sustancial en esta Política será comunicado a los Titulares a través de los medios que <b>EL MANDANTE</b> considere pertinentes.</p>

  <hr>

  <h2>SECCIÓN DE ACEPTACIÓN Y FIRMA DE LA POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES</h2>

  <p>Yo, <b>{{ $model->fullName() }}</b>, identificado(a) con <b>{{ strtoupper($model->user_identification_type ?? '[Tipo de Documento]') }}</b> Nº <b>{{ strtoupper($model->user_identification) }}</b>, expedida en <b>{{ strtoupper($model->user_issued_in ?? '[Lugar de Expedición]') }}</b>, con domicilio en <b>{{ strtoupper($model->city->city_name ?? '[Ciudad de Domicilio]') }}</b>, y número de contacto <b>{{ strtoupper($model->user_telephone ?? '[Teléfono]') }}</b>, declaro bajo la gravedad de juramento que:</p>

  <ol>
    <li>He leído, comprendido y recibido una copia (física o digital) de la <b>Política de Tratamiento de Datos Personales (Habeas Data)</b> de <b>{{ strtoupper($studio->std_company_name) }}</b>.</li>
    <li>Conozco y acepto plenamente los términos y condiciones bajo los cuales <b>{{ strtoupper($studio->std_company_name) }}</b>, identificada con NIT <b>{{$studio->nitWithVerificationDigit()}}</b>, con domicilio en <b>{{ strtoupper($studio->std_address ?? 'Carrera 44 # 2A-50, Barrio El Lido, Cali (Valle del Cauca)') }}</b>, representada legalmente por <b>{{ strtoupper($studio->std_manager_name ?? 'MARLYN MICHELLE BRAVO CASTILLO') }}</b>, C.C. <b>{{ strtoupper($studio->std_manager_id ?? '1.144.083.039') }}</b>, y contacto <b>{{ strtoupper($studio->userOwner->user_telephone ?? '3153507516') }}</b>, realizará el tratamiento de mis datos personales.</li>
    <li>Otorgo mi consentimiento previo, expreso e informado para que mis datos personales, incluyendo datos sensibles (si aplica y han sido suministrados voluntariamente), sean recolectados, almacenados, usados, circulados, suprimidos y procesados para las finalidades descritas en esta Política.</li>
  </ol>

  <ol start="4">
    <li>Soy consciente de mis derechos como Titular de los datos (acceso, actualización, rectificación, supresión y revocatoria de la autorización) y de los canales dispuestos por <b>{{ strtoupper($studio->std_company_name) }}</b> para ejercerlos.</li>
  </ol>

  <h2>SECCIÓN DE ACEPTACIÓN Y FIRMA DE LA POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES</h2>

  <p>Yo, <b>{{ $model->fullName() }}</b>, Identificado(a) con <b>{{ strtoupper($model->user_identification_type ?? '[Tipo de Documento]') }}</b> Nº <b>{{ strtoupper($model->user_identification) }}</b>, Expedida en <b>{{ strtoupper($model->user_issued_in ?? '[Lugar de Expedición]') }}</b>, Con domicilio en <b>{{ strtoupper($model->city->city_name ?? '[Ciudad de Domicilio]') }}</b>, Y número de contacto <b>{{ strtoupper($model->user_telephone ?? '[Teléfono]') }}</b></p>

  <p>En mi calidad de <b>{{ getRoleByContractType($studioModel->stdmod_contract_type) }}</b>, declaro bajo la gravedad de juramento que:</p>

  <ol>
    <li>He leído, comprendido y recibido una copia (física o digital) de la <b>Política de Tratamiento de Datos Personales (Habeas Data)</b> de <b>{{ strtoupper($studio->std_company_name) }}</b>.</li>
    <li>Conozco y acepto plenamente los términos y condiciones bajo los cuales <b>{{ strtoupper($studio->std_company_name) }}</b>, identificada con NIT <b>{{$studio->nitWithVerificationDigit()}}</b>, con domicilio en <b>{{ strtoupper($studio->std_address ?? 'Carrera 44 # 2A-50, Barrio El Lido, Cali (Valle del Cauca)') }}</b>, representada legalmente por <b>{{ strtoupper($studio->std_manager_name ?? 'MARLYN MICHELLE BRAVO CASTILLO') }}</b>, C.C. <b>{{ strtoupper($studio->std_manager_id ?? '1.144.083.039') }}</b>, y contacto <b>{{ strtoupper($studio->userOwner->user_telephone ?? '3153507516') }}</b>, realizará el tratamiento de mis datos personales.</li>
    <li>Otorgo mi consentimiento previo, expreso e informado para que mis datos personales, incluyendo datos sensibles (si aplica y han sido suministrados voluntariamente), sean recolectados, almacenados, usados, circulados, suprimidos y procesados para las finalidades descritas en esta Política.</li>
    <li>Soy consciente de mis derechos como Titular de los datos (acceso, actualización, rectificación, supresión y revocatoria de la autorización) y de los canales dispuestos por <b>{{ strtoupper($studio->std_company_name) }}</b> para ejercerlos.</li>
  </ol>

  <p>En constancia de lo anterior, firmo el presente documento de aceptación en la ciudad de <b>{{ strtoupper($studio->city->city_name ?? 'Cali') }}</b>, a la fecha de aceptación que se indica a continuación.</p>

  <hr>

  <p><b>PARA SER LLENADO POR EL TITULAR DE LOS DATOS:</b></p>

  <p><b>FIRMA:</b></p>

  @if(isset($signatures['model']) && $signatures['model']->docsig_signed_at && $signatures['model']->userSignature)
    <div style="margin: 10px 0;">
      <img src="{{ public_path('uploads/signatures/' . $signatures['model']->userSignature->usrsig_image_path) }}" style="height: 60px; max-width: 200px;">
    </div>
    <p style="font-size: 9px; margin: 5px 0;"><i>Firmado digitalmente el: {{ $signatures['model']->docsig_signed_at->format('d/m/Y H:i') }}</i></p>
  @else
    <p>_____________________________________________________________</p>
  @endif

  <br>

  <p><b>NOMBRE COMPLETO:</b></p>

  <p><b>{{ $model->fullName() }}</b></p>

  <br>

  <p><b>TIPO Y NÚMERO DE IDENTIFICACIÓN:</b></p>

  <p><b>{{ strtoupper($model->user_identification_type ?? 'C.C.') }} {{ strtoupper($model->user_identification) }}</b></p>

  <br>

  <p><b>ROL (Modelo/Aliado/Personal Interno/Otro):</b></p>

  <p><b>{{ getRoleByContractType($studioModel->stdmod_contract_type) }}</b></p>

  <br>

  <p><b>HUELLA DACTILAR (Opcional):</b></p>

  <br><br><br>

  <p><b>FECHA DE ACEPTACIÓN:</b> {{ date('d') }} de {{ strtoupper(monthLetters(date('m'))) }} de {{ date('Y') }}.</p>

  <br><br>

  <p><b>POR {{ strtoupper($studio->std_company_name) }}</b></p>

  <p><b>FIRMA:</b></p>

  @if(isset($signatures['owner']) && $signatures['owner']->docsig_signed_at && $signatures['owner']->userSignature)
    <div style="margin: 10px 0;">
      <img src="{{ public_path('uploads/signatures/' . $signatures['owner']->userSignature->usrsig_image_path) }}" style="height: 60px; max-width: 200px;">
    </div>
    <p style="font-size: 9px; margin: 5px 0;"><i>Firmado digitalmente el: {{ $signatures['owner']->docsig_signed_at->format('d/m/Y H:i') }}</i></p>
  @else
    <p>_____________________________________________________________</p>
  @endif

  <br>

  <p><b>{{ strtoupper($studio->std_manager_name ?? 'MARLYN MICHELLE BRAVO CASTILLO') }}</b></p>
  <p>C.C. <b>{{ strtoupper($studio->std_manager_id ?? '1.144.083.039') }}</b></p>
  <p>Representante Legal</p>
  <p><b>{{ strtoupper($studio->std_company_name) }}</b></p>
  <p><b>NIT {{$studio->nitWithVerificationDigit()}}</b></p>
  <p>Teléfono: <b>{{ strtoupper($studio->userOwner->user_telephone ?? '3153507516') }}</b></p>
  <p>Correo: <b>{{ strtoupper($studio->userOwner->user_personal_email ?? 'STUDIOELCASTILLO@GMAIL.COM') }}</b></p>

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

function getRoleByContractType($contractType)
{
  switch ($contractType) {
    case 'MANDANTE - MODELO':
      return 'Modelo';

    case 'TERMINO FIJO':
    case 'TERMINO INDEFINIDO':
      return 'Personal Interno';

    case 'APRENDIZAJE':
      return 'Aprendiz';

    case 'OCASIONAL DE TRABAJO':
    case 'OBRA O LABOR':
    case 'CIVIL POR PRESTACIÓN DE SERVICIOS':
      return 'Aliado / Contratista';

    default:
      return 'Colaborador';
  }
}
?>

