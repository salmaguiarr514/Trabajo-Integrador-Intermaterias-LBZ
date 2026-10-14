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
| [entrevista-1-2026-10-13.md](relevamiento/entrevista-1-2026-10-13.md) | Transcripción de la primera entrevista (faltan los intercambios de validación) |
| [preguntas-entrevista-2.md](relevamiento/preguntas-entrevista-2.md) | Lista de preguntas de la entrevista 2, con ✅ las ya respondidas |
| [respuestas-enrevista-2.md](relevamiento/respuestas-enrevista-2.md) | Conversación de la entrevista 2 (en curso) |
| **analisis/** | |
| [comparacion-dominio-alcance.md](analisis/comparacion-dominio-alcance.md) | Versión 0: el dominio que mandamos, la devolución de la profesora (09/10) y qué sobraba, faltaba o era hipótesis |
| [analisis-v1.md](analisis/analisis-v1.md) | Versión 1 del análisis, a partir de la entrevista 1: hechos F01–F33, sistema organizacional, SI, dominio, dudas |
| [notas-entrevista-2.md](analisis/notas-entrevista-2.md) | Qué aporta cada respuesta de la entrevista 2; se vuelca en la v2 |

**Convención de versiones:** cada versión nueva del análisis es un archivo nuevo (`analisis-v2.md`, …) que empieza con
"Cambios respecto de la versión anterior" y el porqué de cada uno. Las anteriores no se editan: son la evidencia de la evolución.
Cada entrevista se guarda textual en `relevamiento/entrevista-N-AAAA-MM-DD.md`.

---

## 2. Qué hay que cumplir y cómo vamos

✅ hecho · 🟡 parcial · ⬜ falta

### 2.1 Relevamiento

| Exigencia | Estado | Dónde / qué falta |
| --- | --- | --- |
| Definir qué necesitamos averiguar | ✅ | [guia-preguntas.md](relevamiento/guia-preguntas.md), a partir de "Qué debe descubrir cada grupo" |
| Preguntas y repreguntas sobre procesos, responsabilidades, información y reglas | ✅ | [Entrevista 1](relevamiento/entrevista-1-2026-10-13.md) |
| Preguntas sobre **situaciones excepcionales** | 🟡 | Se vio rechazo, cancelación y proveedor que no puede. Falta: proveedor que se baja ya confirmado, tarea atrasada, cambio que afecta a un proveedor confirmado |
| Aclarar dudas | 🟡 | D1, D4, D5 y D8 resueltas en la entrevista 2 ([notas](analisis/notas-entrevista-2.md)); el resto en curso |
| **Validar con el cliente nuestras interpretaciones y propuestas** | 🟡 | Resumen de la entrevista 1 validado; faltan las preguntas 13, 22, 24 y 28 | → [entrevista 2](relevamiento/preguntas-entrevista-2.md) |
| No inventar; distinguir hipótesis de lo confirmado | ✅ | En el análisis: F# (hecho), D# (duda), *(interpretación)* |
| Conversaciones disponibles | 🟡 | Faltan pegar los intercambios que respaldan F15, F17–F19, F21 |

### 2.2 Sistema organizacional

| Exigencia | Estado | Dónde / qué falta |
| --- | --- | --- |
| Propósito, límite, entorno, actores, elementos, relaciones | ✅ | [v1 §2.1–2.4](analisis/analisis-v1.md#2-sistema-organizacional) |
| Entradas, procesos y salidas | ✅ | v1 §2.5 |
| Subsistemas, restricciones, interdependencias | ✅ | v1 §2.6–2.7 |
| Reservas, bucles y demoras | ✅ | v1 §2.8 |
| Coherencia entre propósito, límite y componentes | 🟡 | Revisar en v2 con las respuestas nuevas |

### 2.3 Sistema de información

| Exigencia | Estado | Dónde / qué falta |
| --- | --- | --- |
| Quién produce, registra, consulta o modifica cada dato, y con qué responsabilidad | 🟡 | v1 §3.1. Faltan D2 (Administración) y D7 (quién confirma, cancela y cierra) |
| Qué información necesita **cada actor** y para qué (operar, controlar, decidir) | 🟡 | v1 §3.1 está ordenado por dato. Falta la vista por actor |
| Fuentes, canales y destinatarios (**flujos de información**) | 🟡 | v1 §3.2 es muy corto. Falta un diagrama de flujos |
| Diseño de la solución: calidad de la información, prevención de problemas, reglas y controles | 🟡 | v1 §3.3 tiene controles **propuestos, sin validar**. Faltan validaciones concretas: datos obligatorios por etapa y transiciones de estado permitidas |
| Qué soporta el software y cómo se relaciona con lo que sigue fuera | ✅ | v1 §3.4 |

### 2.4 Diseño orientado al dominio

| Exigencia | Estado | Dónde / qué falta |
| --- | --- | --- |
| Conceptos, procesos, responsabilidades y reglas | 🟡 | v1 §4. 12 reglas; faltan las que salgan de D1, D3, D4 y D6 |
| Lenguaje ubicuo, con términos ambiguos aclarados | ✅ | v1 §4.1 ("confirmado", "pendiente", "servicio", "evento") |
| Subdominios y Bounded Contexts **justificados** | 🟡 | v1 §4.5 es una propuesta inicial. Falta validar el doble sentido de "servicio" y describir la relación entre contextos |
| Modelo conceptual | 🟡 | v1 §4.2. Depende de D1 y D6; faltan los atributos principales |
| Estados del evento y de la tarea | 🟡 | Evento en v1 §4.3 (sin rechazo, D1). Tarea sin definir (D3) |

### 2.5 Lo que debe descubrir el grupo (consigna de alcance)

| Qué descubrir | Estado |
| --- | --- |
| Qué información necesita la organizadora y para qué | 🟡 |
| Cómo prepara las propuestas y qué condiciones permiten confirmar | 🟡 (D4, D5) |
| Quién hace cada actividad y quién consulta o modifica | 🟡 (D2, D7, D10) |
| Qué estados, reglas y validaciones tienen sentido | 🟡 (D1, D3, D8) |
| Cómo trata cambios, rechazos, cancelaciones y pendientes | 🟡 (D1, D6, D9) |

### 2.6 Recorridos que el análisis tiene que explicar

El criterio de cumplimiento pide demostrarlos en el software. En el análisis tienen que estar descritos con las reglas relevadas.

| Recorrido | Estado |
| --- | --- |
| Solicitud → propuesta → aceptación → servicios y tareas → pendientes → cierre | 🟡 Disperso en v1; falta escribirlo como escenario |
| Propuesta rechazada | ⬜ Depende de D1 |
| Cambio relevante | ⬜ Depende de D6 |
| Cancelación | 🟡 Falta D7 y D9 |
| Acceso identificado del personal con permisos sencillos | 🟡 Falta D2 |

### 2.7 Entrega

| Exigencia | Estado |
| --- | --- |
| Evolución visible del análisis (versiones y fundamentos) | 🟡 v0 y v1. Seguir la convención de versiones |
| Incorporar las devoluciones | ✅ La devolución del 09/10 está en la versión 0 |
| **Informe final** con el análisis completo (ver [§5](#5-informe-final)) | ⬜ Sin fecha todavía |

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

---

## 4. Plan de iteración

Cada vuelta tiene la misma forma: **preguntar → registrar → analizar → detectar dudas → volver a preguntar**.

| # | Paso | Resultado | Estado |
| --- | --- | --- | --- |
| 1 | Recuperar del chat los intercambios de validación que faltan y pegarlos en la entrevista 1 | F15, F17–F19, F21 con respaldo | ⬜ |
| 2 | Hacer la [entrevista 2](relevamiento/preguntas-entrevista-2.md): dudas, excepciones y validación de propuestas | `entrevista-2-….md` | ⬜ |
| 3 | Volcar las respuestas: hechos nuevos (F34…), dudas cerradas, propuestas confirmadas o descartadas | Tabla de respuestas completa | ⬜ |
| 4 | Escribir `analisis-v2.md` con "Cambios respecto de la v1" | Versión 2 | ⬜ |
| 5 | Completar lo que falta en v2: vista por actor, diagrama de flujos, datos obligatorios y transiciones, estados de la tarea, escenarios de los recorridos, relación entre contextos, atributos del modelo | Los 🟡 de la sección 2 pasan a ✅ | ⬜ |
| 6 | Si aparecen dudas nuevas, entrevista 3 y versión 3 (repetir 2–5) | — | ⬜ |
| 7 | Revisión de coherencia completa (propósito ↔ límite ↔ componentes ↔ modelo ↔ alcance) | — | ⬜ |
| 8 | Escribir el [informe final](#5-informe-final) a partir de la última versión del análisis | Entregable final | ⬜ |

**Pendientes del grupo:** la fecha de entrega del informe todavía no está definida.

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
