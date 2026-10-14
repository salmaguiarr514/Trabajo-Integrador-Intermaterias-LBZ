# Sistemas de Información — Consignas

Texto original de la cátedra. Versión actualizada el 14/10/2026. Qué hay que cumplir, el estado y el plan del grupo están en [plan.md](plan.md).

---

## 1. Anuncio de la profesora

Buenas tardes. Ayer, el profe Agus les comentó sobre el trabajo práctico intermaterias. Sistemas de Información va a formar parte.

En nuestra materia van a realizar el relevamiento, el análisis y el diseño que servirán como base para desarrollar el software, siguiendo las pautas de las demás materias.

En el campus ya está disponible la sección Trabajo Práctico Integrador, con links a dos páginas de Notion:

- **Consigna del Trabajo Práctico:** detalla las actividades de relevamiento, análisis del sistema organizacional y del sistema de información, análisis y diseño orientados al dominio (DDD), y los criterios de evaluación.
- **Objetivo y alcance del software:** define los requisitos básicos del software que van a desarrollar. Este documento es el punto de partida para orientar el relevamiento y el análisis, y luego avanzar con la implementación.

**Tarea:**

Necesito que una persona de cada grupo me envíe por este medio:

- El dominio o rubro
- Los nombres de los integrantes
- El correo vinculado a la cuenta de ChatGPT de cada integrante.

Les pido esos correos para darles acceso a un proyecto de ChatGPT preparado para su grupo. Allí, la IA va a actuar como cliente y experto en el dominio. Chateando a través de él es como van a hacer el relevamiento de información. Este "cliente" es su fuente de información, van a hacer el análisis en base a la descripción del funcionamiento de la empresa y cuáles son las necesidades que plantee.

Una vez que tengan acceso al proyecto, comiencen con el relevamiento y el análisis. La próxima clase veremos los avances.

Recomendación: Pueden empezar preparando la "entrevista", siguiendo lo visto en la clase 7. Armen una lista de preguntas iniciales que les permita conocer la empresa e identificar los aspectos relevantes para el objetivo y alcance del software. Después, hagan esas preguntas en el chat del proyecto y profundicen según las respuestas que reciban.

IMPORTANTE: No es válido preguntarle directamente a la IA cuál es el límite del sistema, el entorno, los elementos, etc. Esos son conceptos que ustedes conocen como analistas, pero que su cliente no tiene por qué conocer. Deben preguntar sobre el funcionamiento de la empresa e interpretar las respuestas para construir el análisis. Al conversar con esta IA, piensen que están entrevistando a un cliente real.

Ante cualquier consulta, estoy a su disposición.

---

## 2. Objetivo y alcance del software

### Contexto

Cada grupo desarrollará una aplicación web para una empresa organizadora de eventos concreta. La empresa presta a sus clientes el servicio de organizar un evento y coordinar los servicios necesarios para realizarlo.

La especialización de la organizadora puede variar entre grupos. Todos compartirán el objetivo, el alcance obligatorio y los límites establecidos en esta consigna.

### Objetivo

Facilitar la gestión y el seguimiento de los eventos encargados por los clientes, centralizando sus requerimientos, la propuesta acordada y los compromisos de preparación, para que el personal de la organizadora pueda conocer qué se acordó, quién debe hacer qué y qué falta resolver.

### Límites generales

- Se contemplan eventos de una jornada, en una única sede y de escala pequeña o mediana.
- La empresa puede gestionar varios eventos, pero cada evento corresponde a un cliente contratante.
- Los usuarios del software son integrantes de la organizadora. Las comunicaciones con clientes y proveedores se realizan por fuera de la aplicación y sus resultados se registran en ella.
- El análisis se realiza sobre una sola empresa, con su funcionamiento particular.

### Alcance funcional obligatorio

| Área | Qué debe permitir el software | Hasta dónde llega |
| --- | --- | --- |
| Clientes y solicitudes | Registrar los datos de contacto del cliente y su solicitud: tipo de evento, fecha, sede prevista, cantidad estimada de asistentes, necesidades y preferencias relevantes. | Se registra la información necesaria para organizar el encargo. La cantidad de asistentes es un dato general; no se administra a cada invitado. |
| Propuesta y presupuesto | Preparar una propuesta con los servicios ofrecidos, sus importes y el total. Modificarla mientras se negocia y registrar su aceptación o rechazo. | Una propuesta vigente por solicitud, con cálculo sencillo de importes. Sin cotización automática, comparación de alternativas ni historial completo de versiones. |
| Confirmación del encargo | Registrar que el cliente confirmó la propuesta e identificar los servicios y condiciones acordados. | La aceptación se registra manualmente por el personal. No requiere firma digital ni contratación electrónica. |
| Servicios y proveedores | Mantener datos básicos de proveedores, vincularlos con los servicios del evento y registrar si su participación está pendiente o confirmada. | La disponibilidad se consulta fuera del software. Este registra lo informado y permite identificar compromisos pendientes. |
| Preparación y seguimiento | Registrar tareas del evento, responsables internos, fechas previstas y estados. Consultar los servicios pendientes de confirmación y las tareas pendientes o vencidas. | Seguimiento sencillo mediante una lista o tablero. Sin planificación automática, asignación óptima de recursos ni dependencias complejas entre tareas. |
| Consulta y cierre | Consultar eventos por fecha o estado, ver un resumen de cada encargo y registrar su realización o cancelación. | Cierre operativo básico, con observaciones. Sin liquidación económica ni evaluación estadística del evento. |

El software también deberá permitir registrar cambios relevantes, como una modificación de fecha o de un servicio acordado. El personal deberá poder revisar los compromisos afectados y actualizar su situación. No se exige que la aplicación renegocie o reprograme automáticamente esos compromisos.

La cancelación se registrará conservando la información del encargo y su motivo. Sus consecuencias económicas quedan fuera del alcance.

### Qué queda fuera

- Venta de entradas, inscripciones, acreditaciones, control de acceso, distribución de mesas y gestión individual de invitados.
- Funciones especializadas del rubro: evaluación de ponencias, emisión de certificados, gestión de actividades infantiles, campañas de lanzamiento u otras operaciones que añadan un proceso independiente.
- Cobros, pagos a proveedores, facturación, contabilidad, impuestos, liquidaciones y cálculo de rentabilidad. El presupuesto expresa el importe ofrecido al cliente.
- Inventario, compras, logística de transporte, alojamiento y administración de recursos físicos propios.
- Reservas automáticas de salones o proveedores, consulta de disponibilidad externa y resolución automática de conflictos entre eventos.
- Portales para clientes o proveedores e integraciones con WhatsApp, correo, calendarios, pasarelas de pago u otros servicios.
- Eventos de varios días o sedes y programación de actividades simultáneas que requiera coordinar múltiples salas.
- Configuración de procesos de negocio, permisos o estructuras organizacionales para empresas con funcionamientos diferentes.

### Qué debe descubrir cada grupo

Mediante el relevamiento con ChatGPT, cada grupo deberá determinar:

- Qué información necesita la organizadora y para qué la utiliza.
- Cómo prepara sus propuestas y qué condiciones permiten confirmar un encargo.
- Quién realiza cada actividad y quién necesita consultar o modificar la información.
- Qué estados, reglas y validaciones tienen sentido para esa empresa.
- Cómo trata los cambios, rechazos, cancelaciones y compromisos pendientes.

Estas particularidades deben mantenerse dentro del alcance común. Por ejemplo, una empresa puede trabajar con paquetes y otra con propuestas personalizadas. Ambas deberán producir una propuesta con servicios e importes; trabajar con paquetes no implica desarrollar un motor de configuración o precios.

### Criterio de cumplimiento común

Todos los grupos deberán poder demostrar un recorrido completo: registrar una solicitud, elaborar una propuesta, registrar su aceptación, coordinar servicios y tareas, consultar pendientes y cerrar el evento.

También deberán demostrar el tratamiento de una propuesta rechazada, un cambio relevante y una cancelación, conforme a las reglas relevadas.

El software deberá conservar los datos, validar las reglas relevantes y permitir el acceso identificado del personal, con permisos sencillos acordes con las responsabilidades descubiertas.

---

## 3. Trabajo práctico integrador — Sistemas de Información

### Objetivo

Realizar el **relevamiento, análisis y diseño conceptual** de una solución de software para una empresa organizadora de eventos, aplicando los contenidos trabajados sobre sistemas, información, sistemas de información y Domain-Driven Design.

El trabajo se realizará en los grupos asignados. En Sistemas de Información deberán comprender las necesidades del cliente y fundamentar las decisiones que orienten el desarrollo.

### Caso y alcance

Cada grupo trabajará para **una organizadora de eventos concreta**, cuya especialización será asignada. El proyecto de ChatGPT proporcionado por el docente representará a esa organización y permitirá consultar a personas que conocen su funcionamiento.

El **objetivo y alcance del software** se detalla en el documento *"Trabajo Práctico Integrador - Objetivos y alcance del software"*, disponible en el campus virtual.

Las particularidades de cada empresa, como sus responsabilidades, vocabulario, procesos, estados y reglas, deberán descubrirse mediante el **relevamiento**, respetando los límites comunes.

**El análisis se limitará a los aspectos relacionados con la solución de software.** Los componentes, procesos, información y aspectos del dominio que no intervengan ni condicionen esa solución quedan fuera del trabajo y no deberán identificarse ni analizarse.

Si las otras materias requieren que el software admita varias empresas, el análisis de esta asignatura seguirá correspondiendo a una **única organización de referencia**, con el funcionamiento relevado.

### Trabajo a realizar

Los siguientes aspectos forman parte de un mismo análisis. **No representan etapas que deban completarse por separado o en un orden obligatorio.**

#### Relevamiento

Organicen y conduzcan el relevamiento para comprender **cómo trabaja la empresa, qué problemas presenta y qué necesita del software**.

Deberán:

- Definir qué necesitan averiguar.
- Formular preguntas y repreguntas que permitan conocer procesos, responsabilidades, información, reglas y situaciones excepcionales.
- Aclarar las dudas y validar con el cliente sus interpretaciones y propuestas desde el funcionamiento del negocio.

**No deberán asumir ni inventar cómo funciona la organización.** Las hipótesis podrán orientar nuevas preguntas, pero deberán distinguirse de la información confirmada.

ChatGPT actuará como **cliente y conocedor del dominio**. El relevamiento, el análisis y las decisiones de diseño serán responsabilidad del grupo.

#### Análisis de sistema organizacional

Delimiten el sistema que necesitan comprender para desarrollar la solución e **identifiquen su propósito, límite, entorno, actores, elementos, relaciones, entradas, procesos y salidas relevantes**.

Analicen los **subsistemas, restricciones e interdependencias** que condicionen su funcionamiento. Consideren también **reservas, retroalimentaciones (bucles) y demoras** cuando ayuden a comprender el problema o fundamentar la solución.

**Mantengan la coherencia entre las decisiones**: el propósito, el límite y los componentes identificados deben corresponder al mismo sistema observado.

#### Análisis del sistema de información

Analicen qué datos e información necesita la empresa para desarrollar las actividades comprendidas en el alcance.

Deberán comprender:

- Quién produce, registra, consulta o modifica la información, y con qué responsabilidad.
- Qué información necesita cada actor y con qué finalidad (operar, controlar o tomar decisiones).
- Cuáles son sus fuentes, canales y destinatarios (flujos de información).

No olviden **diseñar la solución garantizando la calidad de la información, previniendo problemas frecuentes y aplicando reglas y mecanismos de control**.

**Expliquen qué parte del sistema de información será soportada por el software y cómo se relacionará con las personas y actividades que continúen realizándose fuera de él**.

#### Análisis y diseño orientado al dominio

Construyan un modelo conceptual que represente el conocimiento obtenido y permita orientar el desarrollo.

Deberán:

- Identificar los conceptos, procesos, responsabilidades y reglas de negocio relevantes.
- Construir y utilizar un lenguaje ubicuo, aclarando términos ambiguos o utilizados con diferentes significados.
- Identificar los subdominios pertinentes y justificar la delimitación de los Bounded Contexts.
- Representar los conceptos y relaciones necesarios para comprender la solución.

La delimitación deberá responder al negocio relevado. No se establece una cantidad obligatoria de contextos ni una correspondencia automática entre contextos, sectores de la empresa y componentes técnicos.

### Forma de trabajo

El trabajo será **iterativo e incremental**, desde la primera clase hasta el cierre del proyecto.

Construyan una comprensión inicial y profundícenla progresivamente. Una nueva respuesta del cliente, una dificultad de diseño o un problema encontrado durante el desarrollo puede requerir nuevas consultas y modificaciones del análisis.

Antes de implementar cada parte de la solución, deberán comprender suficientemente los procesos, la información y las reglas que necesita soportar. Durante el desarrollo, continuarán relevando y ajustando lo necesario.

### Registro y entregas

Cada grupo elegirá cómo organizar y representar su trabajo: textos, diagramas, esquemas, modelos u otros recursos que resulten útiles.

**No se exige seguir una plantilla.** Sí se exige que el trabajo permita comprender el análisis, sus fundamentos y su evolución.

Mantengan disponibles las conversaciones de relevamiento y las versiones de trabajo necesarias para explicar sus decisiones.

~~En las fechas indicadas por el docente, **presentarán el estado actual del análisis para recibir devolución**. Los avances podrán incluir borradores, cuestiones pendientes e interpretaciones todavía en revisión.~~ *(tachado en la versión del 14/10/2026)*

Al finalizar, deberán entregar una versión consolidada y formal que integre los resultados del relevamiento, el análisis realizado y el diseño conceptual de la solución desarrollada, un **documento formal escrito**.

### Evaluación y relación con las otras materias

La evaluación priorizará:

- El trabajo en clase y la participación de los integrantes.
- La pertinencia del relevamiento y la validación de la información.
- La aplicación de los conceptos al problema concreto.
- La coherencia y justificación de las decisiones.
- La revisión del análisis y la incorporación de las devoluciones.
- La correspondencia entre las necesidades relevadas, el modelo conceptual y la solución desarrollada.

Todos los integrantes deberán poder explicar las decisiones del grupo.

Las demás materias establecerán sus requisitos técnicos y criterios de evaluación. En Sistemas de Información se evaluará principalmente **el proceso de relevamiento, análisis y diseño**, acompañado por el resultado final.

El trabajo de esta asignatura continuará revisándose hasta su fecha de cierre, la fecha de entrega del documento formal.
