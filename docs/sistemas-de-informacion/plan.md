# Sistemas de Información — resumen y plan del grupo

**Qué evalúa:** el **proceso** de relevamiento, análisis y diseño conceptual, más el resultado final.
No hay plantilla obligatoria, pero el trabajo tiene que mostrar el análisis, sus fundamentos y cómo fue cambiando.
Todos los integrantes tienen que poder explicar las decisiones.
Texto completo de la cátedra: [consigna.md](consigna.md).

> **Ojo con el dominio.** [comun/dominio.md](../comun/dominio.md) describe Backstage como plataforma de venta de entradas,
> que es justo lo que esta materia deja **fuera** del alcance. No sirve como entregable de SI tal como está:
> el dominio de SI tiene que salir del relevamiento. Ver [alcance entre materias](../comun/alcance-entre-materias.md).

## El caso

Una **empresa organizadora de eventos** que le organiza eventos **a sus clientes** y coordina los servicios necesarios
(proveedores). El software lo usa **solo el personal de la organizadora**.

**Objetivo del software:** centralizar los requerimientos del cliente, la propuesta acordada y los compromisos de preparación,
para que el personal sepa qué se acordó, quién tiene que hacer qué y qué falta resolver.

**Límites:** eventos de **una jornada**, en **una sede**, de escala chica o mediana. Cada evento es de un cliente contratante.
Las comunicaciones con clientes y proveedores pasan por fuera de la app; en la app se registra el resultado.
El análisis es sobre **una sola empresa**, aunque otras materias pidan que el software sea multiempresa.

## Alcance obligatorio del software

| Área | Qué tiene que permitir |
| --- | --- |
| Clientes y solicitudes | Datos de contacto y solicitud: tipo de evento, fecha, sede prevista, asistentes estimados, necesidades y preferencias |
| Propuesta y presupuesto | Servicios con importes y total; modificarla mientras se negocia; registrar aceptación o rechazo. **Una propuesta vigente por solicitud** |
| Confirmación del encargo | Registrar a mano que el cliente confirmó, con los servicios y condiciones acordados |
| Servicios y proveedores | Datos básicos de proveedores, vinculados a los servicios del evento, con estado pendiente o confirmado |
| Preparación y seguimiento | Tareas con responsable interno, fecha prevista y estado; ver servicios sin confirmar y tareas pendientes o vencidas |
| Consulta y cierre | Buscar eventos por fecha o estado, ver el resumen del encargo, registrar realización o cancelación con observaciones |
| Cambios y cancelaciones | Registrar cambios relevantes (fecha, servicio) y revisar los compromisos afectados; cancelar conservando la información y el motivo |

**Queda fuera:** venta de entradas, control de acceso, gestión de invitados, cobros y pagos, facturación, inventario y logística,
reservas automáticas, portales para clientes o proveedores, integraciones (WhatsApp, mail, pasarelas de pago),
**eventos de varios días o sedes** y coordinación de varias salas simultáneas.

**Demo obligatoria:** solicitud → propuesta → aceptación → servicios y tareas → pendientes → cierre.
Además: una propuesta rechazada, un cambio relevante y una cancelación. Con login del personal y permisos sencillos.

## Qué hay que hacer

Las partes no son etapas separadas: se trabajan juntas y de forma iterativa.

1. **Relevamiento** con el "cliente" de ChatGPT que arma la profesora.
   - Se pregunta **cómo funciona la empresa**. No vale preguntarle por el límite del sistema, el entorno o los elementos: eso lo deducimos nosotros.
   - No inventar cómo funciona la organización. Las hipótesis sirven para nuevas preguntas, pero se marcan como hipótesis.
   - Validar con el cliente nuestras interpretaciones.
2. **Sistema organizacional:** propósito, límites, entorno, actores, elementos, relaciones, entradas, procesos y salidas;
   subsistemas, restricciones e interdependencias; reservas, bucles y demoras cuando sirvan.
3. **Sistema de información:** quién produce, registra, consulta o modifica cada dato y para qué (operar, controlar, decidir);
   fuentes, canales y destinatarios; controles de calidad de la información; qué parte cubre el software y qué sigue fuera.
4. **DDD:** conceptos, procesos, responsabilidades y reglas; lenguaje ubicuo; subdominios y Bounded Contexts justificados; modelo conceptual.

Solo se analiza lo que interviene en la solución de software.

## Plan

| # | Tarea | Estado |
| --- | --- | --- |
| 1 | Enviar a la profesora: rubro, integrantes y correo de ChatGPT de cada uno | Pendiente |
| 2 | Preparar la entrevista inicial (clase 7) a partir de "Qué debe descubrir cada grupo" | Pendiente |
| 3 | Relevar con el cliente de ChatGPT y **guardar las conversaciones** (se piden para justificar decisiones) | Pendiente |
| 4 | Primer borrador del análisis organizacional, del SI y del modelo de dominio para la devolución en clase | Pendiente |
| 5 | Iterar: incorporar devoluciones y lo que aparezca al desarrollar | Continuo |
| 6 | Documento formal escrito consolidado | Al cierre |
