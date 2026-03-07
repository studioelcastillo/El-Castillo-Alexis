<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de Conducta y Manual de Convivencia General</title>
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
  </style>
</head>
<body>
  <h1>CÓDIGO DE CONDUCTA Y MANUAL DE CONVIVENCIA GENERAL DE <span>{{ strtoupper($studio->std_company_name) }}</span> Y REGLAMENTO INTERNO DE TRABAJO PARA EMPLEADOS</h1>

  <div>
    <p><b>{{ strtoupper($studio->std_company_name) }} NIT: {{$studio->nitWithVerificationDigit()}} Correo: {{ strtoupper($studio->userOwner->user_personal_email ?? 'studioelcastillo@gmail.com') }}</b></p>
    <p><b>Teléfono: {{ strtoupper($studio->userOwner->user_telephone ?? '3153507516') }} Representante Legal: {{ strtoupper($studio->std_manager_name ?? '[Representante Legal]') }} - C.C {{ strtoupper($studio->std_manager_id ?? '[Cédula]') }}</b></p>
  </div>

  <hr>

  <div>
    <h2>INTRODUCCIÓN</h2>

    <p>El presente documento es una herramienta fundamental que establece las pautas de comportamiento, los principios éticos y las normas de convivencia que rigen la interacción de todos los individuos que forman parte de la comunidad de <b>{{ strtoupper($studio->std_company_name) }}</b>, quien para los efectos de este contrato se denominará <b>EL MANDANTE</b>, así como las regulaciones específicas aplicables a aquellos vinculados mediante un contrato de trabajo.</p>

    <p>Este documento se compone de dos partes principales:</p>

    <p>a) <b>El Código de Conducta y Manual de Convivencia</b>, cuyas normas son de obligatorio cumplimiento para todos los miembros de la comunidad de <b>EL MANDANTE</b>, incluyendo a los <b>Empleados</b> (vinculados por contrato de trabajo a término indefinido), <b>Contratistas y Prestadores de Servicios</b>, y <b>Mandatarios (Modelos)</b>. Para los Contratistas y Mandatarios, estas normas se aplican siempre dentro del marco de su autonomía e independencia contractual, sin que en ningún momento impliquen subordinación laboral. Esta parte busca fomentar un ambiente de respeto, ética, profesionalismo y buenas prácticas para la convivencia, promoviendo un entorno seguro y productivo.</p>

    <p>b) <b>El Reglamento Interno de Trabajo (RIT)</b>, cuyas disposiciones aplican de manera exclusiva y obligatoria a los <b>EMPLEADOS</b> de <b>EL MANDANTE</b> vinculados mediante contrato de trabajo, de conformidad con el Código Sustantivo del Trabajo y demás normatividad laboral colombiana vigente.</p>

    <p><b>EL MANDANTE</b> se reserva el derecho de modificar este documento unilateralmente, notificando previamente a sus colaboradores y modelos, y asegurando su conformidad con la legislación vigente y las necesidades de la empresa.</p>
  </div>

  <hr>

  <h2>PARTE I: CÓDIGO DE CONDUCTA Y MANUAL DE CONVIVENCIA GENERAL</h2>

  <p>(Aplicable a todos los Miembros de la Comunidad: Empleados, Contratistas, Prestadores de Servicios y Mandatarios/Modelos)</p>

  <hr>

  <h3>CAPÍTULO I: DISPOSICIONES GENERALES Y ÁMBITO DE APLICACIÓN</h3>

  <p><b>Artículo 1. Objeto y Alcance.</b> El presente Código de Conducta y Manual de Convivencia tiene como objeto establecer las normas de comportamiento, los principios éticos y las directrices de convivencia que deben observar los individuos que interactúan con <b>EL MANDANTE</b>, independientemente de su tipo de vinculación contractual. Su cumplimiento es obligatorio para <b>Empleados, Contratistas, Prestadores de Servicios, Mandatarios (Modelos), directivos, proveedores y visitantes</b> que ingresen dentro de las instalaciones de la empresa o en el desarrollo de actividades relacionadas con la misma. Para Contratistas y Mandatarios, la aplicación de estas normas se entiende siempre en el marco de la <b>autonomía e independencia</b> que rige su relación contractual, y no constituye ni implica la existencia de una relación laboral subordinada.</p>

  <p><b>Artículo 2. Principios Fundamentales.</b> La convivencia y el desarrollo de las actividades en <b>EL MANDANTE</b> se rigen por los siguientes principios:</p>

  <ol>
    <li><b>Respeto y Tolerancia:</b> Promover un ambiente de respeto mutuo, reconociendo la diversidad y evitando cualquier forma de discriminación, acoso o violencia.</li>
    <li><b>Integridad y Transparencia:</b> Actuar con honestidad, rectitud y transparencia en todas las actividades, decisiones y comunicaciones.</li>
    <li><b>Profesionalismo:</b> Desempeñar las funciones y actividades con diligencia, responsabilidad y compromiso, buscando la excelencia en el servicio y la calidad del contenido.</li>
    <li><b>Colaboración:</b> Fomentar el trabajo en equipo y la cooperación para alcanzar los objetivos, manteniendo una comunicación efectiva y constructiva.</li>
    <li><b>Confidencialidad:</b> Proteger la información sensible de la empresa, sus miembros, clientes y operaciones.</li>
    <li><b>Cumplimiento Normativo:</b> Observar y acatar todas las leyes, regulaciones y políticas internas aplicables, tanto colombianas como, cuando sea el caso, las leyes federales y estatales de los Estados Unidos (incluyendo, pero sin limitarse a, regulaciones de privacidad como la CCPA, normativas de la SEC si aplica, y otras leyes laborales y corporativas aplicables a contratistas o actividades transfronterizas).</li>
  </ol>

  <p><b>Artículo 3. Definiciones de Vinculación.</b> Para efectos del presente documento, se entenderá por:</p>

  <ul>
    <li><b>Miembro de la Comunidad / Colaborador / Personal Vinculado:</b> Cualquier persona natural o jurídica que, de forma permanente o temporal, interactúe o preste servicios a <b>EL MANDANTE</b>, incluyendo empleados, contratistas, prestadores de servicios, mandatarios (modelos), directivos y proveedores.</li>
    <li><b>Empleado(a):</b> Persona natural vinculada a <b>EL MANDANTE</b> mediante un contrato de trabajo a término indefinido, sujeta a las disposiciones del Código Sustantivo del Trabajo colombiano y al Reglamento Interno de Trabajo (RIT) contenido en la Parte II de este documento.</li>
    <li><b>Contratista / Prestador de Servicios:</b> Persona natural o jurídica que presta servicios a <b>EL MANDANTE</b> por medio de un contrato de prestación de servicios o similar, <b>actuando con plena autonomía técnica y administrativa, por su propia cuenta y riesgo, sin que exista o se configure subordinación laboral alguna.</b></li>
    <li><b>Mandatario(a) / Modelo:</b> Persona natural vinculada a <b>EL MANDANTE</b> mediante un Contrato de Mandato Comercial con Representación, <b>actuando por cuenta propia y bajo su exclusiva responsabilidad, sin que exista o se configure subordinación laboral alguna.</b> Su actividad se enmarca en la gestión de negocios o la representación de intereses de la empresa, manteniendo su independencia en la ejecución de las actividades.</li>
  </ul>

  <hr>

  <h3>CAPÍTULO II: DERECHOS Y DEBERES GENERALES DE LOS MIEMBROS DE LA COMUNIDAD</h3>

  <p><b>Artículo 4. Derechos Generales.</b> Todos los Miembros de la Comunidad tienen derecho a:</p>

  <ol>
    <li>Ser tratados con respeto, dignidad y equidad, en un ambiente libre de acoso, discriminación o violencia.</li>
    <li>Recibir información clara sobre las normas y políticas de la empresa aplicables a su tipo de vinculación.</li>
    <li>Acceder a los mecanismos de reporte de situaciones irregulares o de incumplimiento de este Código.</li>
    <li>Participar en las capacitaciones y programas de bienestar que la empresa determine como aplicables a su rol.</li>
  </ol>

  <p><b>Artículo 5. Deberes Generales.</b> Son deberes de todos los Miembros de la Comunidad:</p>

  <ol>
    <li>Cumplir con los principios y normas establecidas en este Código de Conducta y Manual de Convivencia, siempre en el marco de la naturaleza de su vinculación contractual.</li>
    <li>Actuar con integridad, honestidad y ética en todas las interacciones relacionadas con <b>EL MANDANTE</b>.</li>
    <li>Respetar a todos los individuos, independientemente de su rol, género, raza, orientación sexual o cualquier otra condición.</li>
    <li>Cuidar y hacer buen uso de los equipos, instalaciones y bienes de la empresa a los que tenga acceso en virtud de su relación con <b>EL MANDANTE</b>.</li>
    <li>Reportar cualquier anomalía, incidente o situación irregular que pueda afectar la seguridad, reputación o patrimonio de la empresa o de sus miembros.</li>
    <li>Mantener la higiene personal y contribuir al orden y limpieza de las áreas comunes.</li>
    <li>Cumplir con los compromisos y obligaciones estipulados en su respectivo <b>contrato individual</b> (laboral, prestación de servicios, mandato), entendiendo que para contratistas y mandatarios esto se realiza con plena autonomía e independencia.</li>
  </ol>

  <hr>

  <h3>CAPÍTULO III: USO DE TECNOLOGÍA, PROPIEDAD INTELECTUAL Y CONFIDENCIALIDAD</h3>

  <p><b>Artículo 6. Uso de Tecnología y Delitos Informáticos.</b> Todos los Miembros de la Comunidad deberán utilizar adecuada y responsablemente los recursos tecnológicos (hardware, software, redes, sistemas) proporcionados por <b>EL MANDANTE</b> o utilizados en el marco de sus actividades. Queda estrictamente prohibido:</p>

  <ol>
    <li>El uso de VPN, proxies no autorizados o cualquier método que altere la seguridad informática de la empresa.</li>
    <li>La instalación de software no autorizado o la modificación de configuraciones de los equipos de la empresa.</li>
    <li>El acceso no autorizado a sistemas, información o cuentas de otros miembros o de la empresa.</li>
    <li>La realización de actividades ajenas a las funciones o al objeto contractual durante el uso de los recursos tecnológicos de la empresa.</li>
    <li>El uso de dispositivos móviles o distractores (tabletas, mp4, celulares, etc.) que interfieran con el desarrollo de las actividades, la productividad o la seguridad operativa, especialmente durante transmisiones o labores que requieran concentración. Las violaciones a esta cláusula serán sancionadas conforme a las consecuencias aplicables a cada tipo de vinculación (disciplinaria para empleados, contractual para independientes, según lo detallado en sus respectivos contratos) y podrán dar lugar a acciones legales pertinentes, incluyendo denuncias penales por delitos informáticos.</li>
  </ol>

  <p><b>Artículo 7. Cámaras de Seguridad y Monitoreo.</b> <b>EL MANDANTE</b> cuenta con sistemas de vigilancia audiovisual permanente (grabación de audio y video 24/7) en todas las áreas comunes, pasillos, habitaciones, oficinas, estudios y zonas operativas de sus instalaciones. Estas grabaciones se realizan con fines de seguridad, control operativo, auditoría interna, respaldo legal, y para la aplicación de medidas correctivas o acciones legales. Todos los Miembros de la Comunidad aceptan explícitamente esta condición al ingresar o permanecer en las instalaciones, entendiendo que dichas grabaciones se realizan en cumplimiento de la Ley 1581 de 2012 (Protección de Datos Personales en Colombia) y sus decretos reglamentarios, así como la Política de Tratamiento de Datos Personales de la empresa (Anexo C), la cual detalla los fines y el tratamiento de dicha información. Se garantiza que la finalidad de la grabación de audio está estrictamente justificada por motivos de seguridad y control operativo.</p>

  <p><b>Artículo 8. Confidencialidad Reforzada y No Divulgación.</b> Todos los Miembros de la Comunidad se obligan a guardar y mantener la más estricta y absoluta reserva sobre toda la "Información Confidencial" de <b>EL MANDANTE</b> a la que tengan acceso en virtud de su vinculación. Se entiende por <b>Información Confidencial</b>, de manera enunciativa y no limitativa: información de carácter comercial, operativo, tecnológico, personal y estratégico de <b>EL MANDANTE</b>, sus empleados, modelos, clientes y plataformas; datos financieros, cifras de ingresos, metodologías de trabajo, información de otros colaboradores o clientes, contraseñas, procesos internos, herramientas tecnológicas, software, lineamientos legales, contenido gráfico o audiovisual, así como todo lo relacionado con la operación o estructura comercial de la empresa. Esta obligación de confidencialidad se mantendrá durante toda la vigencia del vínculo y durante un período de <b>diez (10) años</b> contados a partir de su terminación, independientemente de la causa. Las obligaciones de confidencialidad y no divulgación seguirán vigentes aún después de la devolución o destrucción de la información. Cualquier filtración, violación o uso no autorizado de Información Confidencial será motivo de sanción inmediata, incluyendo la terminación de la vinculación, la imposición de <b>multas (en UVT)</b> conforme a lo establecido en los contratos individuales (Anexos D y E), y la iniciación de acciones legales pertinentes, incluyendo denuncias penales conforme al artículo 269A del Código Penal colombiano y normas concordantes, reclamación de indemnizaciones y perjuicios.</p>

  <p><b>Artículo 9. Propiedad Intelectual y Uso de Contenido.</b> <b>EL MANDANTE</b> es titular de la propiedad intelectual y los derechos de autor sobre todo el contenido audiovisual, fotográfico, gráfico, sonoro y digital, así como cualquier obra, software, diseño, marca, logo, eslogan, guiones, producción, interfaces, mejoras, invenciones o producto generado dentro de las instalaciones o en el marco de las actividades de la empresa, o utilizando su infraestructura o bienes de cualquier tipo. Todos los Miembros de la Comunidad reconocen esta propiedad exclusiva de <b>EL MANDANTE</b> y se comprometen a proteger sus creaciones. Queda estrictamente prohibido a cualquier Miembro de la Comunidad copiar, distribuir, vender, compartir, sublicenciar, licenciar, comercializar o negociar el contenido generado o comercializado por <b>EL MANDANTE</b> sin la autorización expresa y por escrito de la gerencia. La violación de esta norma se considerará una falta grave y será objeto de las acciones legales correspondientes, tanto a nivel civil como penal, para proteger los intereses de la empresa. Esta disposición es aplicable de conformidad con la legislación colombiana y la de los Estados Unidos en materia de derechos de autor y propiedad intelectual.</p>

  <p><b>Artículo 10. Propiedad de Cuentas Digitales.</b> Todos los Miembros de la Comunidad reconocen explícitamente que todas las cuentas digitales, perfiles en plataformas de entretenimiento para adultos (incluyendo, pero sin limitarse a: Chaturbate, Stripchat, BongaCams, MyFreeCams, XLoveCams, SkrPrivate, Cam4, LiveJasmin, Streamate, entre otras), perfiles en redes sociales, nombres electrónicos, nombres artísticos, y cualquier otro canal digital configurado, administrado o creado desde la infraestructura del estudio (<b>EL MANDANTE</b>) (redes, equipos, conexiones, credenciales máster, direcciones IP u otros activos digitales), son propiedad exclusiva de <b>EL MANDANTE</b>. Los Miembros de la Comunidad reconocen expresamente que no tienen derecho de propiedad, acceso ni disposición sobre dichas cuentas o contenidos, y que no serán entregadas, liberadas, eliminadas ni transferidas bajo ninguna circunstancia, incluso después de finalizada su vinculación. Esto incluye contraseñas, accesos, perfiles, sesiones, nombres de usuario, dominios, marcas, correos electrónicos u otros elementos digitales creados o asociados por el estudio. Todo contenido, estadísticas, ingresos, imágenes y datos generados dentro de dichos canales quedarán bajo control de <b>EL MANDANTE</b>, hasta que la plataforma correspondiente lo desactive automáticamente por inactividad, o se tome una decisión unilateral por parte del estudio. Esta disposición también se reitera y amplía en los <b>Contratos de Mandato Comercial con Representación (Anexo D)</b> y de <b>Prestación de Servicios (Anexo E)</b>.</p>

  <hr>

  <h3>CAPÍTULO IV: ÉTICA, CONVIVENCIA Y PREVENCIÓN DE RIESGOS</h3>

  <p><b>Artículo 11. Integridad y Transparencia.</b> Todos los Miembros de la Comunidad deben actuar con honestidad, transparencia y rectitud en todas las actividades y decisiones, tanto dentro como fuera de la empresa. Es fundamental asumir las responsabilidades inherentes a cada rol y función, garantizando la calidad y el cumplimiento de las tareas asignadas, siempre en el marco de su respectiva vinculación contractual.</p>

  <p><b>Artículo 12. No Discriminación.</b> <b>EL MANDANTE</b> promueve un ambiente libre de discriminación por razones de raza, etnia, religión, género, orientación sexual, identidad de género, discapacidad, edad o cualquier otra condición. Cualquier acto discriminatorio será considerado una falta grave y será objeto de las consecuencias aplicables. Esta política se adhiere a las leyes antidiscriminatorias de Colombia y, cuando aplique, de los Estados Unidos.</p>

  <p><b>Artículo 13. Prevención de Lavado de Activos y Financiación del Terrorismo (SARLAFT).</b> Todos los Miembros de la Comunidad declaran bajo la gravedad de juramento que sus recursos patrimoniales provienen de actividades lícitas y que no se encuentran incluidos en listas restrictivas nacionales o internacionales de vigilancia (como OFAC, ONU, INTERPOL, UE, entre otras relacionadas con actividades ilícitas, financiamiento del terrorismo, trata de personas, explotación sexual, tráfico de estupefacientes). <b>EL MANDANTE</b> podrá realizar procedimientos de debida diligencia (due diligence) y consultas periódicas en plataformas de listas de sanciones o embargos para verificar esta información, de conformidad con su <b>Manual Interno SARLAFT</b>. La negativa al suministro o el hallazgo de inconsistencias será causal de terminación de la vinculación y reporte a las autoridades competentes (UIAF, DIAN, Fiscalía, Superintendencias de Colombia, y las agencias pertinentes en EE. UU. si aplica). Se reitera que la empresa implementa controles estrictos en el manejo de pagos internacionales para cumplir con las regulaciones de la OFAC (Office of Foreign Assets Control) y FATF (Financial Action Task Force).</p>

  <p><b>Artículo 14. Conflicto de Intereses y Profesionalismo.</b> Se espera que todos los Miembros de la Comunidad mantengan un ambiente de profesionalismo y respeto. Las relaciones sentimentales o amorosas entre personal interno (administrativo, monitores, supervisores, técnicos, etc.) y Mandatarios (Modelos) o Contratistas, que puedan generar un conflicto de interés real o aparente, afectar la imparcialidad en la toma de decisiones, comprometer la confidencialidad, la seguridad de la información, o la eficiencia operativa, <b>deben ser reportadas a la gerencia</b>. La empresa evaluará cada caso y podrá determinar la necesidad de implementar medidas correctivas, reubicación inmediata o la terminación de la vinculación, conforme a las condiciones contractuales aplicables. Se busca preservar la objetividad y la ética en todas las interacciones profesionales.</p>

  <p><b>Artículo 15. Prohibición de Vinculación de Menores de Edad.</b> Todos los Miembros de la Comunidad que se vinculen con <b>EL MANDANTE</b> declaran expresamente bajo juramento ser <b>mayores de edad (18 años cumplidos)</b> y garantizan que la documentación proporcionada es auténtica y legítima. La vinculación o involucramiento de menores de edad al objeto de la empresa implicará la terminación inmediata de la vinculación y dará lugar a acciones legales penales inmediatas conformes a la legislación colombiana y, si aplica, la de los Estados Unidos.</p>

  <p><b>Artículo 16. Reporte de Situaciones Irregulares.</b> Todos los Miembros de la Comunidad están obligados a informar inmediatamente a gerencia o al área designada cualquier incidente o irregularidad que pueda implicar fraude, acoso, amenazas, conductas ilegales, filtraciones o cualquier situación que ponga en riesgo la seguridad, la reputación o el patrimonio de la empresa o de sus miembros.</p>

  <p><b>Artículo 17. Salud Mental y Bienestar.</b> <b>EL MANDANTE</b> se compromete a mantener un entorno de trabajo saludable, promoviendo el bienestar integral de sus Miembros de la Comunidad mediante programas de prevención del estrés, apoyo psicológico y acciones que fomenten un ambiente positivo y ético, dentro de sus posibilidades y aplicabilidad para cada tipo de vinculación.</p>

  <hr>

  <h3>CAPÍTULO V: CONSECUENCIAS POR INCUMPLIMIENTO AL CÓDIGO DE CONDUCTA</h3>

  <p><b>Artículo 18. Conductas Inaceptables.</b> El incumplimiento de las normas establecidas en este Código de Conducta y Manual de Convivencia, así como de las obligaciones estipuladas en los respectivos contratos individuales (laboral, prestación de servicios, mandato), será considerado una falta y generará consecuencias.</p>

  <p><b>Artículo 19. Consecuencias Diferenciadas.</b> Las consecuencias por el incumplimiento de las normas de este Código de Conducta se aplicarán de la siguiente manera, de acuerdo con el tipo de vinculación:</p>

  <ol>
    <li><b>Para Empleados:</b> Las faltas al presente Código serán consideradas faltas laborales y se regirán por lo establecido en la Parte II (Reglamento Interno de Trabajo) de este documento, incluyendo amonestaciones, suspensiones y terminación del contrato de trabajo con justa causa, de conformidad con el Código Sustantivo del Trabajo.</li>
    <li><b>Para Contratistas, Prestadores de Servicios y Mandatarios (Modelos):</b> Las faltas al presente Código serán consideradas <b>incumplimientos contractuales graves</b> y darán lugar a las consecuencias establecidas en sus respectivos contratos individuales (Anexos D y E), incluyendo, pero sin limitarse a:
      <ul style="list-style-type: circle; margin-left: 40px;">
        <li>Terminación unilateral del contrato sin lugar a indemnización.</li>
        <li>Aplicación de cláusulas penales y multas pactadas en el contrato (ej. 30 UVT, 100 UVT, según la gravedad y el tipo de incumplimiento, los montos específicos se detallarán en cada contrato individual).</li>
        <li>Reclamación de daños y perjuicios adicionales.</li>
        <li>Inicio de acciones legales civiles o penales pertinentes, tanto en Colombia como en EE. UU. si aplica.</li>
        <li>Retención de pagos pendientes para compensar daños o multas, conforme a las autorizaciones contractuales expresas.</li>
      </ul>
    </li>
  </ol>

  <p><b>Artículo 20. Política de Sanciones Económicas y Legales (Aplicable a Contratistas y Mandatarios).</b> Toda sanción económica (multa) derivada de un incumplimiento contractual deberá ser cancelada por el Contratista o Mandatario dentro de los sesenta (60) días siguientes a la notificación formal escrita por parte de <b>EL MANDANTE</b>. En caso de mora, la empresa podrá iniciar el cobro judicial incluyendo intereses legales y gastos administrativos derivados, sin perjuicio de la compensación con pagos pendientes autorizada contractualmente.</p>

  <hr>

  <h2>PARTE II: REGLAMENTO INTERNO DE TRABAJO (RIT)</h2>

  <p>(Normas exclusivas para Empleados - Aplicable exclusivamente a Empleados de <b>EL MANDANTE</b> vinculados mediante Contrato de Trabajo a Término Indefinido)</p>

  <hr>

  <h3>CAPÍTULO I: DISPOSICIONES GENERALES DEL RIT</h3>

  <p><b>Artículo 21. Objeto y Alcance.</b> El presente Reglamento Interno de Trabajo (RIT) tiene como objeto regular las condiciones a las que deben sujetarse exclusivamente los <b>Empleados de EL MANDANTE</b> vinculados mediante contrato laboral. Sus disposiciones son obligatorias tanto para la empresa como para todos sus Empleados, de conformidad con el Código Sustantivo del Trabajo y demás normas concordantes de la legislación laboral colombiana.</p>

  <p><b>Artículo 22. Contrato Laboral.</b> Todos los Empleados de <b>EL MANDANTE</b> estarán vinculados mediante contrato de trabajo a término indefinido, salvo las excepciones legales. La admisión de personal se realizará conforme a los requisitos legales y los establecidos por la empresa, y de acuerdo con el <b>Contrato de Trabajo a Término Indefinido (Anexo F)</b>.</p>

  <hr>

  <h3>CAPÍTULO II: JORNADA LABORAL Y HORARIOS</h3>

  <p><b>Artículo 23. Jornada Laboral.</b> La jornada máxima legal de trabajo para los Empleados de <b>EL MANDANTE</b> es de <b>42 horas semanales</b>, en cumplimiento de la Ley 2101 de 2021. La distribución de estas horas se realizará de común acuerdo entre el empleado y el trabajador en 5 o 6 días a la semana, garantizando siempre el día de descanso obligatorio. La empresa se acoge a la reducción progresiva de la jornada laboral establecida en dicha ley.</p>

  <p><b>Artículo 24. Horarios.</b> Los horarios de trabajo serán asignados por el supervisor, pudiendo ser en turnos de mañana, tarde o noche, según las necesidades operativas de la empresa. La empresa informará a sus Empleados el horario específico que deberán cumplir. Las horas de trabajo se registrarán por medio del sistema biométrico o el que la empresa determine, garantizando un control adecuado de la jornada laboral.</p>

  <p><b>Artículo 25. Horas Extras y Recargos.</b> Las horas extras y los recargos por trabajo nocturno, dominical o festivo se pagarán de acuerdo con lo establecido en la normativa laboral colombiana vigente, previo cumplimiento de los requisitos legales para su autorización y reconocimiento.</p>

  <hr>

  <h3>CAPÍTULO III: OBLIGACIONES Y PROHIBICIONES ESPECÍFICAS DE LOS EMPLEADOS</h3>

  <p><b>Artículo 26. Obligaciones Especiales de los Empleados.</b> Además de las establecidas en el Código Sustantivo del Trabajo y en la Parte I de este documento (Código de Conducta), son obligaciones especiales de los Empleados de <b>EL MANDANTE</b>:</p>

  <ol>
    <li>Cumplir con la jornada laboral y los horarios asignados.</li>
    <li>Permanecer durante la jornada de trabajo en el sitio o lugar donde debe desempeñar sus labores, siendo prohibido, salvo orden superior, entrar a las habitaciones de otros compañeros o modelos sin autorización.</li>
    <li>No hablar de computador a computador en horas laborales, ya que esto interrumpe la labor.</li>
    <li>Asear los cuartos de trabajo de manera adecuada.</li>
    <li>Cumplir cabalmente con las directrices e instrucciones específicas impartidas por sus superiores jerárquicos relacionadas con sus funciones y el desarrollo del trabajo.</li>
  </ol>

  <p><b>Artículo 27. Prohibiciones Especiales de los Empleados.</b> Además de las establecidas en el Código Sustantivo del Trabajo y en la Parte I de este documento (Código de Conducta), se prohíbe expresamente a los Empleados:</p>

  <ol>
    <li>Consumir sustancias alucinógenas, fumar cigarrillo o consumir bebidas alcohólicas dentro de las instalaciones.</li>
    <li>Salir de su puesto de trabajo o de las instalaciones sin la debida autorización del supervisor.</li>
    <li>Realizar actividades ajenas a sus funciones durante la jornada laboral.</li>
    <li>No salir en ropa interior o con prendas pequeñas fuera de sus habitaciones de trabajo en áreas comunes o que no correspondan a su puesto.</li>
  </ol>

  <hr>

  <h3>CAPÍTULO IV: MEDIDAS DISCIPLINARIAS (APLICABLE A EMPLEADOS)</h3>

  <p><b>Artículo 28. Faltas y Sanciones.</b> El incumplimiento de las obligaciones y prohibiciones establecidas en este Reglamento Interno de Trabajo, el contrato de trabajo y la legislación laboral, podrá dar lugar a la imposición de medidas disciplinarias, las cuales se aplicarán de acuerdo con la gravedad de la falta y el debido proceso. Las sanciones podrán incluir:</p>

  <ol>
    <li>Amonestación escrita.</li>
    <li>Suspensión del trabajo sin remuneración.</li>
    <li>Terminación del contrato de trabajo con justa causa, de conformidad con el artículo 62 del Código Sustantivo del Trabajo.</li>
  </ol>

  <p><b>Artículo 29. Procedimiento Disciplinario.</b> Antes de aplicar cualquier sanción, se garantizará el derecho a la defensa del Empleado, mediante la comunicación formal de los cargos o conductas reprochables, el otorgamiento de un término razonable para presentar sus descargos y pruebas, y el análisis de las mismas. El procedimiento se realizará conforme a lo previsto en el Código Sustantivo del Trabajo y demás normas aplicables, garantizando siempre el debido proceso.</p>

  <p><b>Artículo 30. Faltas Leves.</b> Se consideran faltas leves, entre otras:</p>

  <ol>
    <li>Incumplimiento leve de horarios o puntualidad.</li>
    <li>Faltas menores a las normas de vestimenta o conducta general establecidas en el Código de Conducta.</li>
    <li>Descuido en el aseo de su puesto de trabajo.</li>
  </ol>

  <p><b>Artículo 31. Faltas Graves.</b> Se consideran faltas graves, entre otras:</p>

  <ol>
    <li>Reiteración de faltas leves, a pesar de haber recibido amonestaciones previas.</li>
    <li>Ausentismo o abandono del puesto de trabajo sin justificación ni autorización.</li>
    <li>Incumplimiento grave de las normas de seguridad y salud en el trabajo.</li>
    <li>Afectación a la imagen de la empresa por conducta inapropiada, tanto dentro como fuera de las instalaciones.</li>
    <li>Filtración menor de información no clasificada como confidencial.</li>
    <li>Incumplimiento grave de las obligaciones laborales inherentes a su cargo.</li>
  </ol>

  <p><b>Artículo 32. Faltas Gravísimas.</b> Se consideran faltas gravísimas aquellas que por su naturaleza, magnitud o reincidencia causen un perjuicio sustancial a la empresa, sus bienes, su reputación, o la seguridad y bienestar de sus miembros. Estas faltas, entre otras, podrán dar lugar a la terminación del contrato con justa causa, de conformidad con el artículo 62 del Código Sustantivo del Trabajo, sin perjuicio de las acciones legales a que haya lugar. Ejemplos de faltas gravísimas incluyen, pero no se limitan a: actos de violencia, fraude, hurto, acoso laboral o sexual (previo el trámite de Ley 1010 de 2006 y Ley 2365 de 2024), violación de la confidencialidad de la información crítica (Artículo 8), o cualquier acto que ponga en riesgo la seguridad informática o el patrimonio de la empresa.</p>

  <hr>

  <h3>CAPÍTULO V: LICENCIAS Y PERMISOS (APLICABLE A EMPLEADOS)</h3>

  <p><b>Artículo 33. Concesión de Licencias.</b> La empresa concederá a los Empleados las licencias necesarias para los fines y en los términos indicados en el Código Sustantivo del Trabajo y la legislación laboral vigente, incluyendo, pero sin limitarse a:</p>

  <ol>
    <li>Licencia por luto.</li>
    <li>Licencia por calamidad doméstica.</li>
    <li>Licencia por matrimonio.</li>
    <li>Licencia de maternidad y paternidad (Ley 1822 de 2017 y posteriores reformas).</li>
    <li>Licencia para el ejercicio del derecho al sufragio.</li>
    <li>Licencias para el desempeño de cargos oficiales transitorios de forzosa aceptación.</li>
    <li>Licencias para el desempeño de funciones sindicales.</li>
  </ol>

  <hr>

  <h3>CAPÍTULO VI: MECANISMO DE PREVENCIÓN Y ATENCIÓN DEL ACOSO LABORAL Y SEXUAL (APLICABLE A EMPLEADOS)</h3>

  <p><b>Artículo 34. Prevención del Acoso Laboral y Sexual.</b> <b>EL MANDANTE</b> adopta plenamente las medidas de prevención y atención del acoso laboral, conforme a la Ley 1010 de 2006, y del acoso sexual en el ámbito laboral, conforme a la Ley 2365 de 2024 y demás normatividad aplicable. La empresa garantiza un ambiente libre de acoso laboral y sexual para sus Empleados.</p>

  <p><b>Artículo 35. Definición de Acoso Sexual.</b> Se entenderá por acoso sexual todo acto de persecución, hostigamiento o asedio, de carácter o connotación sexual, lasciva o libidinosa, que se manifieste por relaciones de poder de orden vertical u horizontal, mediadas por la edad, el sexo, el género, orientación e identidad sexual, la posición laboral, social, o económica, y que afecte la dignidad, la integridad o el ambiente de trabajo de la persona.</p>

  <p><b>Artículo 36. Comité de Convivencia Laboral.</b> <b>EL MANDANTE</b> contará con un Comité de Convivencia Laboral, debidamente conformado de acuerdo con la normativa vigente (Resolución 652 de 2012 y 1356 de 2012 del Ministerio de Trabajo, y aquellas que las modifiquen o sustituyan). Sus funciones incluirán:</p>

  <ol>
    <li>Recibir y dar trámite a las quejas presentadas sobre acoso laboral.</li>
    <li>Examinar de forma confidencial los casos.</li>
    <li>Realizar audiencias de conciliación entre las partes, cuando sea procedente.</li>
    <li>Formular recomendaciones para la mejora del ambiente laboral.</li>
    <li>Hacer seguimiento al cumplimiento de compromisos adquiridos.</li>
  </ol>

  <p><b>Artículo 37. Mecanismos de Protección y Denuncia.</b> <b>EL MANDANTE</b> cuenta con un <b>PROTOCOLO DE PREVENCIÓN Y ATENCIÓN PARA EL ACOSO LABORAL Y SEXUAL (Anexo A)</b>, el cual forma parte integral de este manual. Este protocolo detalla los procedimientos para la presentación de quejas, la investigación de los casos y las medidas de protección para las víctimas y los testigos, garantizando su estabilidad laboral reforzada en los casos que la ley así lo prevea. Las víctimas o terceros que conozcan de hechos de acoso tienen derecho a ser protegidos de retaliaciones.</p>

  <hr>

  <h3>CAPÍTULO VII: SALUD Y SEGURIDAD EN EL TRABAJO (APLICABLE A EMPLEADOS)</h3>

  <p><b>Artículo 38. Compromiso con la SST.</b> <b>EL MANDANTE</b> se compromete a implementar y mantener un Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) conforme la legislación vigente (Decreto 1072 de 2015 y Resolución 0312 de 2019, o las normas que las modifiquen o sustituyan), con el fin de proteger la integridad física y mental de sus Empleados, previniendo accidentes y enfermedades laborales.</p>

  <p><b>Artículo 39. Obligaciones de los Empleados en SST.</b> Los Empleados tienen la obligación de participar en las actividades de SST, cumplir las normas y procedimientos de seguridad, reportar condiciones inseguras y utilizar los elementos de protección personal suministrados, de acuerdo con la normativa vigente y las políticas internas de la empresa.</p>

  <hr>

  <h3>DISPOSICIONES FINALES</h3>

  <p><b>Artículo 40. Capacitación y Concientización Continua.</b> <b>EL MANDANTE</b> se compromete a proporcionar capacitación periódica en temas legales, éticos y de cumplimiento a todos sus Miembros de la Comunidad. Estas capacitaciones buscarán concientizar sobre:</p>

  <ol>
    <li>Las normas internas y su actualización (incluyendo este Código de Conducta y el RIT cuando aplique).</li>
    <li>Las leyes laborales, comerciales, de protección de datos y de propiedad intelectual aplicables al sector en Colombia y, cuando sea pertinente, en los Estados Unidos.</li>
    <li>Los protocolos de prevención de acoso (general y laboral/sexual).</li>
    <li>La importancia de la ciberseguridad y la prevención de delitos informáticos (como la suplantación de identidad, amenazas y extorsión).</li>
    <li>La estrategia de reputación legal y la evasión de riesgos internacionales (como las sanciones de la OFAC y FATF en el manejo de pagos internacionales).</li>
  </ol>

  <p>La participación en estas capacitaciones es obligatoria para el personal que la empresa determine, buscando asegurar que todo el equipo esté actualizado y preparado para actuar conforme a la legislación y las mejores prácticas de la industria, blindando a la empresa de posibles problemas futuros.</p>

  <p><b>Artículo 41. Manejo de Documentos de Identidad, Fotos y Datos Personales.</b> <b>EL MANDANTE</b> almacenará fotografías, documentos de identidad y datos personales de sus Miembros de la Comunidad conforme a la Ley 1581 de 2012 (Ley de Protección de Datos Personales en Colombia) y su <b>Política de Tratamiento de Datos Personales (Anexo C)</b>. Esta información será utilizada exclusivamente para fines contractuales, operativos, tributarios, de seguridad y legales dentro del software corporativo interno de la empresa.</p>

  <p>Para el tratamiento de datos sensibles, se garantizará el consentimiento explícito del titular y se aplicarán medidas de seguridad reforzadas. Si la operación se extiende a Estados Unidos, el tratamiento de datos personales también se regirá por las leyes de privacidad aplicables, como la CCPA (California Consumer Privacy Act) si corresponde.</p>

  <p><b>Artículo 42. Actualización del Documento.</b> El presente Código de Conducta y Manual de Convivencia General y Reglamento Interno de Trabajo podrá ser revisado y actualizado periódicamente por <b>EL MANDANTE</b> para asegurar su conformidad con la legislación vigente y las necesidades de la empresa. Las modificaciones serán comunicadas oportunamente a todos los Miembros de la Comunidad.</p>

  <hr>

  <h2>ANEXOS (REAFIRMACIÓN)</h2>

  <p>Los siguientes documentos forman parte integral del presente Código de Conducta y Manual de Convivencia General y Reglamento Interno de Trabajo:</p>

  <ol>
    <li><b>Anexo A:</b> Protocolo de Prevención y Atención para el Acoso Laboral y Sexual.</li>
    <li><b>Anexo B:</b> Política de Uso de Instalaciones y Equipos.</li>
    <li><b>Anexo C:</b> Política de Tratamiento de Datos Personales (Habeas Data).</li>
    <li><b>Anexo D:</b> Contrato de Mandato Comercial con Representación (para Mandatarios/Modelos) – <b>Este contrato detallará la autonomía e independencia del mandatario, la ausencia de subordinación laboral, la forma de pago por resultados, las responsabilidades propias del mandatario en seguridad social y riesgos, y las cláusulas penales por incumplimiento.</b></li>
    <li><b>Anexo E:</b> Contrato de Prestación de Servicios (para Contratistas/Prestadores de Servicios) – <b>Este contrato detallará la autonomía e independencia del contratista, la ausencia de subordinación laboral, la forma de pago por resultados o proyectos, las responsabilidades propias del contratista en seguridad social y riesgos, y las cláusulas penales por incumplimiento.</b></li>
    <li><b>Anexo F:</b> Contrato de Trabajo a Término Indefinido (para Empleados).</li>
  </ol>

  <hr>

  <h2>CERTIFICACIÓN DE LECTURA, COMPRENSIÓN Y ACEPTACIÓN DEL DOCUMENTO</h2>

  <p>El suscriptor del presente documento declara, bajo la gravedad de juramento, que ha leído íntegramente el contenido del mismo, lo ha comprendido completamente y acepta de manera libre, informada y voluntaria todas sus cláusulas, obligaciones, condiciones y restricciones.</p>

  <p>El suscriptor entiende que las secciones de la <b>PARTE I: CÓDIGO DE CONDUCTA Y MANUAL DE CONVIVENCIA GENERAL</b> son de aplicación general y obligatoria para todos los miembros de la comunidad de <b>EL MANDANTE</b>, independientemente de su tipo de vinculación, y que para los <b>Contratistas</b> y <b>Mandatarios</b> se aplican en el marco de su autonomía e independencia contractual. Asimismo, comprende que las disposiciones contenidas en la <b>PARTE II: REGLAMENTO INTERNO DE TRABAJO (RIT)</b> le son aplicables exclusivamente si su vinculación es bajo un contrato de trabajo a término indefinido.</p>

  <p>La firma física, electrónica o digital, así como la huella dactilar impuesta al final de este documento, se entenderá como prueba expresa y válida de su consentimiento, conocimiento y aceptación, en cumplimiento de lo dispuesto por la Ley 527 de 1999 sobre validez de mensajes de datos, firmas electrónicas y digitales, el Decreto 2364 de 2012, que reglamenta la firma electrónica y la Ley 1581 de 2012 sobre protección de datos personales.</p>

  <p>La autenticidad, integridad y aceptación del documento quedan plenamente certificadas por cualquiera de los medios de firma o huella utilizados, otorgando efectos jurídicos equivalentes a la firma manuscrita. Se confirma que el procedimiento de recolección de esta certificación asegura la trazabilidad y verificabilidad de la aceptación por parte del firmante.</p>

  <p>Para constancia de aceptación expresa, se firma en <b>{{ strtoupper($studio->city->city_name ?? 'Cali') }}</b>, a los <b>{{ date('d') }}</b> días del mes de <b>{{ strtoupper(monthLetters(date('m'))) }}</b> de <b>{{ date('Y') }}</b>.</p>

  <br>

  <div style="margin: 20px 0;">
    <p><b>REPRESENTANTE LEGAL DEL ESTUDIO</b></p>
    @if(isset($signatures['owner']) && $signatures['owner']->docsig_signed_at && $signatures['owner']->userSignature)
      <div style="margin: 10px 0;">
        <img src="{{ public_path('uploads/signatures/' . $signatures['owner']->userSignature->usrsig_image_path) }}" style="height: 60px; max-width: 200px;">
      </div>
      <p style="font-size: 9px; margin: 5px 0;"><i>Firmado digitalmente el: {{ $signatures['owner']->docsig_signed_at->format('d/m/Y H:i') }}</i></p>
    @else
      <p style="margin: 20px 0;">_______________________________</p>
    @endif
    <p><b>{{ strtoupper($studio->std_manager_name ?? 'MARLYN MICHELLE BRAVO CASTILLO') }}</b></p>
    <p>C.C. {{ strtoupper($studio->std_manager_id ?? '1144 083 039') }}</p>
    <p>Representante Legal</p>
    <p><b>{{ strtoupper($studio->std_company_name) }}</b></p>
    <p><b>NIT {{$studio->nitWithVerificationDigit()}}</b></p>
  </div>

  <br>

  <div style="margin: 20px 0;">
    <p><b>EL COLABORADOR / MODELO / EMPLEADO</b></p>
    @if(isset($signatures['model']) && $signatures['model']->docsig_signed_at && $signatures['model']->userSignature)
      <div style="margin: 10px 0;">
        <img src="{{ public_path('uploads/signatures/' . $signatures['model']->userSignature->usrsig_image_path) }}" style="height: 60px; max-width: 200px;">
      </div>
      <p style="font-size: 9px; margin: 5px 0;"><i>Firmado digitalmente el: {{ $signatures['model']->docsig_signed_at->format('d/m/Y H:i') }}</i></p>
    @else
      <p style="margin: 20px 0;">_______________________________</p>
    @endif
    <p><b>{{ strtoupper($model->fullName()) }}</b></p>
    <p>{{ strtoupper($model->user_identification_type ?? 'C.C./T.I.') }} {{ strtoupper($model->user_identification) }}</p>
    <p><b>Tipo de Vinculación:</b></p>
    @php
        $contractType = $studioModel->stdmod_contract_type ?? '';
        $isIndefinido = ($contractType == 'TERMINO INDEFINIDO');
        $isAprendizaje = ($contractType == 'APRENDIZAJE' || $contractType == 'TERMINO FIJO');
        $isModelo = ($contractType == 'MANDANTE - MODELO');
        $isServicio = in_array($contractType, ['OCASIONAL DE TRABAJO', 'OBRA O LABOR', 'CIVIL POR PRESTACIÓN DE SERVICIOS']);
    @endphp
    <p>[{{ $isIndefinido ? 'X' : ' ' }}] Empleado(a) (Contrato a Término Indefinido)</p>
    <p>[{{ $isAprendizaje ? 'X' : ' ' }}] Empleado(a) (Contrato a Término Fijo / Aprendizaje)</p>
    <p>[{{ $isServicio ? 'X' : ' ' }}] Contratista / Prestador de Servicios</p>
    <p>[{{ $isModelo ? 'X' : ' ' }}] Mandatario(a) / Modelo</p>
  </div>
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
?>

