# Sistemas de Información — qué hay que cumplir, estado y plan

**Qué evalúa:** el **proceso** de relevamiento, análisis y diseño conceptual, más un **documento formal escrito** al cierre.
No hay plantilla obligatoria, pero el trabajo tiene que mostrar el análisis, sus fundamentos y **cómo fue cambiando**.
Todos los integrantes tienen que poder explicar las decisiones. Texto completo de la cátedra: [consigna.md](consigna.md).

> **Este trabajo es independiente de la app.** El análisis, las entrevistas y el modelo de esta carpeta sirven solo para la materia.
> No cambian el código ni el DER (ver [alcance entre materias](../comun/alcance-entre-materias.md)).

---

## 1. Archivos

| Archivo | Qué es |
| --- | --- |
| [consigna.md](consigna.md) | Consignas de la cátedra: anuncio, objetivo y alcance del software, trabajo práctico integrador |
| **relevamiento/** | |
| [guia-preguntas.md](relevamiento/guia-preguntas.md) | Guía general de la entrevista: 55 preguntas por bloque, preguntas de validación y qué no preguntar |
| [entrevista-1-2026-10-13.md](relevamiento/entrevista-1-2026-10-13.md) | Transcripción completa de la primera entrevista |
| [preguntas-entrevista-2.md](relevamiento/preguntas-entrevista-2.md) | Lista de preguntas de la entrevista 2, con ✅ las ya respondidas |
| [entrevista-2-2026-10-14.md](relevamiento/entrevista-2-2026-10-14.md) | Conversación de la entrevista 2, pegada textual (en curso: se completa con las preguntas que faltan) |
| **analisis/** | |
| [comparacion-dominio-alcance.md](analisis/comparacion-dominio-alcance.md) | Versión 0: el dominio que mandamos, la devolución de la profesora (09/10) y qué sobraba, faltaba o era hipótesis |
| [analisis-v1.md](analisis/analisis-v1.md) | Versión 1 del análisis, a partir de la entrevista 1: hechos F01–F33, sistema organizacional, SI, dominio, dudas |
| [notas-entrevista-2.md](analisis/notas-entrevista-2.md) | Qué aporta cada respuesta de la entrevista 2; se volcó en la v2 |
| [analisis-v2.md](analisis/analisis-v2.md) | Versión 2 del análisis (28/10): cambios respecto de la v1, hechos F34 a F68, sistema organizacional, sistema de información, dominio, recorridos, permisos, coherencia, hipótesis y dudas D11 a D15 |

**Convención de versiones:** cada versión nueva del análisis es un archivo nuevo (`analisis-v2.md`, …) que empieza con
"Cambios respecto de la versión anterior" y el porqué de cada uno. Las anteriores no se editan: son la evidencia de la evolución.
Cada entrevista se guarda textual en `relevamiento/entrevista-N-AAAA-MM-DD.md`.

---

## 2. Qué hay que cumplir y cómo vamos

> Las tablas de esta sección se escribieron antes de la v2. Al 28/10 la [v2](analisis/analisis-v2.md) cubre los puntos marcados parcial o pendiente; su [§6.1](analisis/analisis-v2.md#61-cobertura-contra-el-alcance-del-software) muestra la cobertura. Quedan las dudas D11 a D15 y la revisión de la profesora.

✅ hecho · 🟡 parcial · ⬜ falta

### 2.1 Relevamiento

| Exigencia | Estado | Dónde / qué falta |
| --- | --- | --- |
| Definir qué necesitamos averiguar | ✅ | [guia-preguntas.md](relevamiento/guia-preguntas.md), a partir de "Qué debe descubrir cada grupo" |
| Preguntas y repreguntas sobre procesos, responsabilidades, información y reglas | ✅ | Entrevistas [1](relevamiento/entrevista-1-2026-10-13.md) y [2](relevamiento/entrevista-2-2026-10-14.md) |
| Preguntas sobre **situaciones excepcionales** | ✅ | Rechazo, cancelación por el cliente y por Backstage, proveedor que no puede o se baja, servicio atrasado, cambio de fecha con proveedor confirmado, tarea cancelada o reasignada |
| Aclarar dudas | 🟡 | D1–D10 respondidas ([notas](analisis/notas-entrevista-2.md)). Quedan: nombre del estado del rechazo y la **contradicción sobre la cancelación** (preguntas 2 y 3), "vencida" como estado o condición (21b) |
| **Validar con el cliente nuestras interpretaciones y propuestas** | 🟡 | Validados: resumen de la entrevista 1, "confirmado", "pedido = solicitud", registro centralizado, ver compromisos al registrar un cambio. Faltan las preguntas 22, 24, 28 y el cierre (29) |
| No inventar; distinguir hipótesis de lo confirmado | 🟡 | Se cumple en general. Excepción: v1 dice que la sede "es un dato que trae el cliente", y nunca se preguntó (nueva pregunta 30) |
| Conversaciones disponibles | ✅ | Entrevista 1 completa; entrevista 2 en curso |

### 2.2 Sistema organizacional

| Exigencia | Estado | Dónde / qué falta |
| --- | --- | --- |
| Propósito, límite, entorno, actores, elementos, relaciones | 🟡 | [v1 §2.1–2.4](analisis/analisis-v1.md#2-sistema-organizacional). En v2: quitar el pendiente de D7, ubicar la sede según la pregunta 30, agregar que un proveedor trabaja en varios eventos |
| Entradas, procesos y salidas | 🟡 | v1 §2.5. En v2: el rechazo como salida ("pedido cerrado sin concretarse") y la cancelación por Backstage |
| Subsistemas, restricciones, interdependencias | 🟡 | v1 §2.6–2.7. En v2: restricción "no se confirma sin fecha y sede concretas"; dependencia de servicios indispensables |
| Reservas, bucles y demoras | 🟡 | v1 §2.8. En v2: el bucle del proveedor que se baja (vuelve a pendiente) y el servicio atrasado como demora |
| Coherencia entre propósito, límite y componentes | ⬜ | Revisión completa al escribir v2 |

### 2.3 Sistema de información

| Exigencia | Estado | Dónde / qué falta |
| --- | --- | --- |
| Quién produce, registra, consulta o modifica cada dato, y con qué responsabilidad | 🟡 | Ya relevado (D2, D7). Falta volcarlo en v2: Administración registra participaciones, aceptación y rechazo; Coordinación registra cancelación y realización |
| Qué información necesita **cada actor** y para qué (operar, controlar, decidir) | ⬜ | Falta la vista por actor. Hay información suficiente para armarla |
| Fuentes, canales y destinatarios (**flujos de información**) | ⬜ | v1 §3.2 es muy corto. Falta el diagrama de flujos |
| Diseño de la solución: calidad de la información, prevención de problemas, reglas y controles | 🟡 | Ya hay controles concretos con respaldo: datos mínimos para presentar y para confirmar, cambios con dato anterior, nuevo y motivo, nada se borra, compromisos atrasados. Falta escribirlos como controles en v2 |
| Qué soporta el software y cómo se relaciona con lo que sigue fuera | ✅ | v1 §3.4. Sumar en v2: combinaciones habituales como punto de partida, el indispensable como decisión del equipo |

### 2.4 Diseño orientado al dominio

| Exigencia | Estado | Dónde / qué falta |
| --- | --- | --- |
| Conceptos, procesos, responsabilidades y reglas | 🟡 | v1 §4.4 tiene 12 reglas. Hay 12 reglas nuevas con respaldo para v2 (ver [§6](#6-revisión-general-14102026)) |
| Lenguaje ubicuo, con términos ambiguos aclarados | 🟡 | v1 §4.1. Agregar: compromiso atrasado, servicio indispensable, combinación habitual, observación. Validar "servicio" (pregunta 28) |
| Subdominios y Bounded Contexts **justificados** | 🟡 | v1 §4.5. El doble sentido de "servicio" falta validarlo (28). Revisar: Administración trabaja en los dos contextos |
| Modelo conceptual | 🟡 | v1 §4.2 desactualizado: faltan atributos del cambio, fecha prevista del servicio, estados de la tarea y combinación habitual |
| Estados del evento y de la tarea | 🟡 | Tarea: relevada (D3), falta 21b. Evento: falta el rechazo y resolver la contradicción de la cancelación (2 y 3) |

### 2.5 Lo que debe descubrir el grupo (consigna de alcance)

| Qué descubrir | Estado |
| --- | --- |
| Qué información necesita la organizadora y para qué | ✅ Relevado; falta la vista por actor en el análisis |
| Cómo prepara las propuestas y qué condiciones permiten confirmar | ✅ |
| Quién hace cada actividad y quién consulta o modifica | ✅ |
| Qué estados, reglas y validaciones tienen sentido | 🟡 Faltan las preguntas 2, 3 y 21b |
| Cómo trata cambios, rechazos, cancelaciones y pendientes | 🟡 Falta la contradicción de la cancelación (3) |

### 2.6 Recorridos que el análisis tiene que explicar

El criterio de cumplimiento pide demostrarlos en el software. En el análisis tienen que estar descritos con las reglas relevadas.

| Recorrido | Estado |
| --- | --- |
| Solicitud → propuesta → aceptación → servicios y tareas → pendientes → cierre | 🟡 Relevado completo; falta escribirlo como escenario |
| Propuesta rechazada | 🟡 Relevado (D1); falta el nombre del estado (2) |
| Cambio relevante | 🟡 Relevado (D6, 13, 17); falta escribirlo |
| Cancelación | 🟡 Relevada por cliente y por Backstage; falta la contradicción (3) |
| Acceso identificado del personal con permisos sencillos | 🟡 Relevado (F31, D2, D7, D10); falta la matriz de permisos |

### 2.7 Entrega

| Exigencia | Estado |
| --- | --- |
| Evolución visible del análisis (versiones y fundamentos) | 🟡 v0, v1 y notas de la entrevista 2. Falta v2 |
| Incorporar las devoluciones | ✅ La devolución del 09/10 está en la versión 0 |
| **Informe final** con el análisis completo (ver [§5](#5-informe-final)), presentado como artifact con gráficos | ⬜ Sin fecha todavía |

---

## 3. Historia del trabajo

| Fecha | Qué pasó | Resultado |
| --- | --- | --- |
| antes del 09/10 | Le mandamos a la profesora el dominio de Backstage (plataforma de entradas) | [comun/dominio.md](../comun/dominio.md) |
| 09/10 | Devolución: el dominio incluye cosas fuera del alcance y omite obligatorias | [Versión 0](analisis/comparacion-dominio-alcance.md) |
| — | Guía de preguntas armada a partir de la comparación | [guia-preguntas.md](relevamiento/guia-preguntas.md) |
| 13/10 | Entrevista 1 con el cliente | [Transcripción](relevamiento/entrevista-1-2026-10-13.md) |
| 13/10 | Análisis versión 1: 33 hechos, 10 dudas | [analisis-v1.md](analisis/analisis-v1.md) |
| 14/10 | Consigna actualizada; carpeta reorganizada; guía de la entrevista 2 | Este documento |
| 14/10 | Entrevista 2 (en curso): el cliente valida el resumen; se responden D1–D10 y las excepciones; aparece una contradicción sobre la cancelación | [Respuestas](relevamiento/entrevista-2-2026-10-14.md), [notas](analisis/notas-entrevista-2.md) |
| 14/10 | Se completa la entrevista 1 con los datos de los proveedores (F21) | [§7b](relevamiento/entrevista-1-2026-10-13.md#7b-datos-de-los-proveedores) |
| 14/10 | Revisión general contra la consigna | [§6](#6-revisión-general-14102026) |

---

## 4. Plan de iteración

Cada vuelta tiene la misma forma: **preguntar → registrar → analizar → detectar dudas → volver a preguntar**.

| # | Paso | Resultado | Estado |
| --- | --- | --- | --- |
| 1 | Recuperar del chat los intercambios de validación que faltan y pegarlos en la entrevista 1 | F15, F17–F19, F21 con respaldo | ✅ |
| 2 | Hacer la [entrevista 2](relevamiento/preguntas-entrevista-2.md): dudas, excepciones y validación de propuestas | `entrevista-2-….md` | ✅ Terminada el 28/10, con transcripción ordenada |
| 3 | Volcar las respuestas: hechos nuevos (F34…), dudas cerradas, propuestas confirmadas o descartadas | [Notas de la entrevista 2](analisis/notas-entrevista-2.md) | 🟡 Al día con lo respondido |
| 4 | Escribir `analisis-v2.md` con "Cambios respecto de la v1" | [Versión 2](analisis/analisis-v2.md) | ✅ |
| 5 | Completar lo que falta en v2: vista por actor, diagrama de flujos, datos obligatorios y transiciones, estados de la tarea, escenarios de los recorridos, relación entre contextos, atributos del modelo | Cubierto en la v2. La cobertura contra el alcance está en su §6.1 | ✅ |
| 6 | Si aparecen dudas nuevas, entrevista 3 y versión 3 (repetir 2–5) | La v2 deja cinco dudas, D11 a D15. No bloquean el informe | ⬜ A decidir |
| 7 | Revisión de coherencia completa (propósito ↔ límite ↔ componentes ↔ modelo ↔ alcance) | — | ⬜ |
| 8 | Escribir el [informe final](#5-informe-final) a partir de la última versión del análisis | [Informe final (docx)](Informe%20final%20-%20Sistemas%20de%20Información%20-%20Backstage.docx), con la carátula y el índice de la plantilla. Falta revisarlo con el grupo y actualizar el índice en Word | 🟡 Primera versión del 28/10 |

**Pendientes del grupo:** la fecha de entrega del informe todavía no está definida.

### Ruta para cerrar (28/10/2026)

Meta: **terminar las entrevistas y completar la consigna** sin abrir alcance nuevo.

| # | Qué se hace | Cómo | Resultado |
| --- | --- | --- | --- |
| 1 | Terminar la entrevista 2 | Hecho el 28/10: cierre (29) y pregunta 31 respondidas. Transcripción con el formato de la entrevista 1 | Cancelación resuelta, estados cerrados, sede ubicada, "servicio" validado |
| 2 | Volcar las respuestas | Hecho: [notas](analisis/notas-entrevista-2.md) al día | Notas al día |
| 3 | Escribir `analisis-v2.md` | Hecho: [v2](analisis/analisis-v2.md), con "Cambios respecto de la v1" | Versión 2 |
| 4 | Completar las partes 🟡 y ⬜ de la §2 dentro de v2 | Hecho: vista por actor, flujos, controles, recorridos, permisos, estados y modelo | Consigna cubierta |
| 5 | Revisión de coherencia | Hecha en la v2 §6. Falta releerla con el grupo y decidir qué hacer con D11 a D15 | Lista para el informe |
| 6 | Informe final | Artifact con gráficos, a partir de v2 (§5) | Entregable |

**Qué parte de la consigna resuelve cada pregunta que falta:**

| Pregunta | Cierra |
| --- | --- |
| 30 (sede) | "No inventar": la v1 afirmaba algo no preguntado. Límite y entorno del sistema |
| 3 y 2 (cancelación y nombre del rechazo) | Estados del evento y recorridos de cancelación y rechazo |
| 21b (tarea vencida) | Estados de la tarea: ¿estado o condición calculada? |
| 22 (cargar antes de confirmar) | Reglas y controles de calidad de la información |
| 24 (pendientes juntos o por evento) | Información que necesita cada actor y vista de pendientes |
| 28 (servicio) | Lenguaje ubicuo y justificación de los Bounded Contexts |
| 29 (cierre) | Validar con el cliente el recorrido completo y los términos clave |

**Qué se escribe en v2 sin necesidad de preguntar más** (ya hay respaldo en las entrevistas): vista por actor, diagrama de flujos de información,
controles de calidad (datos mínimos, cambios con dato anterior y motivo, nada se borra, compromisos atrasados), escenarios de los cinco recorridos,
matriz de permisos, estados de la tarea y atributos del modelo conceptual.

---

## 5. Informe final

Es el documento formal que se entrega al cierre: **el análisis completo, según lo relevado**.

**Incluye:**
- Sistema organizacional: propósito, límite, entorno, actores, elementos y relaciones, entradas, procesos y salidas, subsistemas, restricciones e interdependencias, reservas, bucles y demoras.
- Sistema de información: datos y responsables, información por actor y finalidad, flujos, problemas de calidad y controles, qué cubre el software y qué queda fuera.
- Diseño orientado al dominio: lenguaje ubicuo, procesos y reglas, estados, subdominios y Bounded Contexts con su justificación, modelo conceptual.
- Recorridos que la solución tiene que soportar: el completo, la propuesta rechazada, el cambio relevante y la cancelación.

**No incluye** el relevamiento propiamente dicho: ni las preguntas al chat, ni las respuestas, ni las transcripciones.
Por eso el informe no cita los códigos F# y D#: esos quedan en las versiones de trabajo (`analisis/`), que siguen siendo el respaldo
de cada afirmación si la profesora pregunta de dónde sale algo. Las conversaciones se conservan igual, porque la consigna pide tenerlas disponibles.

Se escribe al final, cuando las dudas estén cerradas. Hasta entonces, todo se trabaja en las versiones del análisis.

---

## 6. Revisión general (14/10/2026)

**Dónde estamos.** El relevamiento está casi completo: las dos entrevistas cubren todas las áreas del alcance y todas las situaciones
que el criterio de cumplimiento pide demostrar. El análisis escrito, en cambio, quedó atrás: la v1 es del 13/10 y no tiene nada de la entrevista 2.
**El siguiente paso grande es escribir `analisis-v2.md`.**

### Qué de la v1 quedó desactualizado o mal

| v1 | Problema | Corrección en v2 |
| --- | --- | --- |
| §4.3 Estados del evento | Permite cancelar desde "en solicitud" y "en negociación"; no tiene el rechazo; el paso a negociación no estaba claro | Paso a negociación al presentar la primera propuesta. Agregar el cierre por rechazo. La cancelación, según lo que responda la pregunta 3 |
| §2.2 Entorno | "La sede es un dato que trae el cliente": no se preguntó nunca | Según la pregunta 30 |
| §3.1 y F31 | Producción registra las participaciones de proveedores | También Administración. Los permisos van por tipo de dato, no por área estricta |
| §2.3 y §3.1 | "Quién registra la confirmación, cancelación y cierre" pendiente (D7) | Aceptación y rechazo: Administración. Cancelación y realización: Coordinación, con información de Producción |
| §4.2 Modelo | Faltan atributos y conceptos | Cambio con dato anterior, nuevo y motivo. Servicio acordado con fecha prevista de resolución. Tarea con estado y observación. Combinación habitual. Proveedor en muchos eventos |
| §4.4 Reglas | 12 reglas | Sumar las de la lista de abajo |
| §5 Dudas | D1–D10 abiertas | Cerradas; quedan solo las nuevas |

### Reglas nuevas con respaldo (para v2)

1. Un pedido pasa a negociación cuando se presenta la primera propuesta.
2. Para presentar una propuesta hacen falta contacto, tipo, fecha y sede previstas, asistentes estimados y necesidades principales.
3. No se confirma un encargo sin fecha y sede concretas.
4. Al confirmar quedan registrados servicios, importes, fecha, sede, asistentes estimados y condiciones particulares.
5. Un rechazo cierra el pedido sin concretarse; si el cliente vuelve, es un pedido nuevo.
6. Un cambio relevante registra el dato anterior, el nuevo y el motivo si se conoce.
7. Si un proveedor confirmado se baja o debe reconsultarse, el servicio vuelve a pendiente y queda una observación.
8. Un servicio pendiente con su fecha prevista de resolución vencida es un compromiso atrasado.
9. Una tarea tiene un responsable que es una persona; Coordinación la asigna y la reasigna.
10. Una tarea que deja de ser necesaria se cancela con observación; no se borra ni cuenta como pendiente.
11. Backstage puede cancelar un evento si no consigue proveedor para un servicio indispensable.
12. Nada se borra: rechazos, cancelaciones y tareas canceladas se conservan con su motivo u observación.

### Riesgos frente a la consigna

- **"No inventar":** revisar en v2 cada afirmación sin F#. La sede (pregunta 30) es el caso detectado.
- **"Coherencia":** la v1 separa los contextos por área (Coordinación ↔ Propuestas, Producción ↔ Preparación), pero Administración
  trabaja en los dos. La consigna dice que no tiene que haber correspondencia automática entre contextos y sectores: justificar
  la separación por el lenguaje ("servicio") y por el momento (la confirmación), no por quién trabaja.
- **"Limitarse a lo que interviene en la solución":** no hace falta analizar cómo se consulta la disponibilidad ni cómo se negocia: eso queda fuera del software.
- **Gráficos:** el informe va como artifact. Los diagramas que el grupo haga conviene hacerlos después de la v2, salvo el del sistema y el de bucles, que ya están estables.

### Orden para retomar

1. Terminar la entrevista 2: preguntas **2, 3 y 30** primero; después 21b, 22, 24, 28 y el cierre.
2. ~~Renombrar las respuestas a `entrevista-2-2026-10-14.md`~~ (hecho el 28/10). Falta darle el mismo formato que la entrevista 1 cuando termine.
3. Escribir `analisis-v2.md` con la tabla de cambios de arriba.
4. Hacer los gráficos y armar el informe.
