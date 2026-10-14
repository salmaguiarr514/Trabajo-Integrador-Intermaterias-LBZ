# Comparación: DOMINIO.md vs. "Objetivo y alcance del software"

Revisión del [DOMINIO.md](../../comun/dominio.md) que le enviamos a la profesora, a partir de su devolución (2026-10-09):

> "El dominio que plantearon incorpora cuestiones que están fuera del alcance y omite otras que sí deben contemplarse.
> El análisis debe respetar ese documento. […] Pueden usar lo que me pasaste como punto de partida para formular preguntas
> a ChatGPT para confirmar, corregir o descartar lo planteado."

Referencia: [Objetivo y alcance del software](../consigna.md#2-objetivo-y-alcance-del-software).
Las preguntas que salen de esta comparación están en [guía de preguntas](../relevamiento/guia-preguntas.md).

---

## 0. El problema de fondo

Antes que el contenido, hay dos diferencias de enfoque:

| | DOMINIO.md | Lo que pide el alcance |
| --- | --- | --- |
| **Qué empresa se analiza** | Backstage, una **plataforma SaaS** que usan muchas productoras | **Una sola organizadora de eventos**, con su funcionamiento particular |
| **Qué hace esa empresa** | Les da a las productoras una herramienta para producir y **vender entradas al público** | **Le organiza un evento a un cliente que la contrata** y coordina los servicios necesarios |
| **Quién usa el software** | Superadmin, productoras, público comprador y visitantes | **Solo el personal** de la organizadora |
| **De dónde salen las reglas** | Las definimos nosotros (RN-01 a RN-30, varias marcadas como *propuesta*) | Se **descubren en el relevamiento** con el cliente |

Por eso la profesora dice que presentamos "procesos, reglas de negocio y funcionalidades como si ya estuvieran definidos".

---

## 1. Lo que incorporamos y está fuera del alcance

| # | En el DOMINIO.md | Dónde aparece | Qué dice el alcance |
| --- | --- | --- | --- |
| F1 | Venta de entradas: tarifas, abonos, compras, disponibilidad, cupo por sector, máximo de entradas por compra | §1.2, §3, §4, P5, RN-22 a RN-30 | *Queda fuera:* "Venta de entradas, inscripciones, acreditaciones…" |
| F2 | Control de acceso con QR e ingresos por jornada | §4, P6, RN-24, RN-29 | *Queda fuera:* "…control de acceso…" |
| F3 | Service charge, reparto de la plata, liquidación a la productora, recaudación | §3, P8, RN-05, RN-27 | *Queda fuera:* "Cobros, pagos a proveedores, facturación, contabilidad, impuestos, liquidaciones y cálculo de rentabilidad" |
| F4 | Pasarela de pago (simulada) | §2, P5 | *Queda fuera:* "…integraciones con […] pasarelas de pago" |
| F5 | Cartelera pública, cliente que compra, visitante, registro de público, "mis entradas" | §1.2, §2, P5, §8 | *Queda fuera:* "Portales para clientes o proveedores". *Límite:* "Los usuarios del software son integrantes de la organizadora" |
| F6 | Festivales de varios días: jornadas, abonos | §4, P3, RN-19, RN-23 | *Límite:* "eventos de una jornada". *Queda fuera:* "Eventos de varios días o sedes" |
| F7 | Varios escenarios simultáneos y line-up por escenario y horario | §4, P3, RN-13 a RN-16 | *Queda fuera:* "programación de actividades simultáneas que requiera coordinar múltiples salas" |
| F8 | Control automático de superposiciones (artista o escenario en dos shows a la vez) | §1.1, RN-14, RN-15 | *Queda fuera:* "resolución automática de conflictos entre eventos" |
| F9 | Plataforma multiempresa: superadmin, alta de productoras, datos aislados por productora, % distinto por productora | §1, §2, P1, RN-01 a RN-05 | *Límite:* "El análisis se realiza sobre una sola empresa". *Queda fuera:* "Configuración de procesos […] para empresas con funcionamientos diferentes" |
| F10 | Catálogo de lugares de la plataforma, lugares propios, sectores con capacidad, plano del lugar | §4, P2, RN-06 a RN-11 | El alcance solo pide la **sede prevista** como dato de la solicitud. La sectorización solo sirve para vender por sector (F1) |
| F11 | Publicación del evento y estado "agotado" | P4, §6.1, RN-20 | Dependen de la venta al público (F1, F5) |
| F12 | Cancelación con reintegro al público | P7 | *Alcance:* "Sus consecuencias económicas quedan fuera del alcance" |
| F13 | Indicadores: ocupación, tasa de asistencia, ventas por tarifa, recaudación | §9 | *Alcance:* "Sin liquidación económica ni evaluación estadística del evento" |
| F14 | Misión, visión, objetivos del primer año, propuesta de valor | §1.2, §1.3 | Describen a la plataforma, no a la organizadora. *Consigna SI:* "lo que no interviene ni condiciona la solución no deberá identificarse ni analizarse" |

**Conclusión:** casi todo el núcleo del DOMINIO.md (vender, cobrar, controlar el acceso, festivales multi-día) cae en "Qué queda fuera".

---

## 2. Lo que omitimos y es obligatorio

| # | Área obligatoria | Qué exige el alcance | Qué había en el DOMINIO.md |
| --- | --- | --- | --- |
| O1 | **Cliente contratante** | Registrar sus datos de contacto | Nada. "Cliente" significaba el público que compra entradas |
| O2 | **Solicitud** | Tipo de evento, fecha, sede prevista, cantidad estimada de asistentes, necesidades y preferencias | Nada |
| O3 | **Propuesta y presupuesto** | Servicios ofrecidos, importes y total. Modificarla mientras se negocia. Una vigente por solicitud | Nada (había precios de entradas, que es otra cosa) |
| O4 | **Aceptación o rechazo** de la propuesta | Registrarlo, y demostrar el caso de una propuesta rechazada | Nada |
| O5 | **Confirmación del encargo** | Registrar a mano que el cliente confirmó, con los servicios y condiciones acordados | Nada |
| O6 | **Servicios y proveedores** | Datos básicos de proveedores, vinculados a los servicios del evento, con estado pendiente o confirmado | Nada. Artistas y lugares eran datos cargados, no proveedores con un compromiso |
| O7 | **Tareas de preparación** | Tareas con responsable interno, fecha prevista y estado; ver las pendientes y vencidas | Nada |
| O8 | **Consulta de pendientes** | Servicios sin confirmar y tareas pendientes o vencidas | Nada |
| O9 | **Cambios relevantes** | Registrar un cambio (fecha, servicio acordado) y revisar los compromisos afectados | Nada |
| O10 | **Cancelación** | Conservar la información del encargo **y su motivo** | P7 existía, pero orientada a anular entradas y reintegrar al público, y sin motivo |
| O11 | **Cierre** | Registrar la realización del evento, con observaciones | Solo un estado automático "finalizado" al pasar la fecha |
| O12 | **Personal y permisos** | Acceso identificado del personal, con permisos sencillos según las responsabilidades descubiertas | §10 decía lo contrario: un solo tipo de usuario por productora, sin sub-roles |
| O13 | **Lo que hay que descubrir** | Qué información usan y para qué; cómo preparan propuestas; quién hace cada actividad; estados y reglas; cómo tratan cambios, rechazos, cancelaciones y pendientes | Lo planteamos ya resuelto, sin relevar |

---

## 3. Lo que se puede usar como hipótesis

Esto no se puede afirmar todavía: se convierte en preguntas para **confirmar, corregir o descartar** con el cliente.

| # | En el DOMINIO.md | Hipótesis para preguntar |
| --- | --- | --- |
| H1 | Rubro: recitales y música en vivo | La organizadora se especializa en eventos musicales. ¿Qué tipo de eventos hace y para qué clientes? |
| H2 | §1.1: "organizan con planillas, mensajes…" | Hoy la información está dispersa y se pierden compromisos |
| H3 | Evento con nombre, tipo, fecha y lugar | Son datos de la solicitud (tipo, fecha, sede prevista) |
| H4 | Artistas | Pueden ser un **servicio** contratado a un proveedor |
| H5 | Lugar | Puede ser la **sede prevista**, y quizás un proveedor más (el salón) |
| H6 | Capacidad del lugar | Se relaciona con la **cantidad estimada de asistentes** (dato general) |
| H7 | RN-04: no se borra, se da de baja y se conserva el historial | Al cancelar se conserva la información del encargo |
| H8 | §6.1: estados del evento (borrador, cancelado, finalizado) | Hay estados, pero tienen que salir del cliente. "Publicado" y "agotado" no aplican |
| H9 | RN-02: CUIT único | Puede aplicar a los datos del cliente o del proveedor |
| H10 | Recital de un día, en un lugar | Encaja con el límite de una jornada y una sede |

---

## 4. Cómo seguir

1. No editar el DOMINIO.md para "arreglarlo" sin relevar: queda como **versión 1**, y esta comparación muestra cómo incorporamos la devolución.
2. Hacer las preguntas de [guía de preguntas](../relevamiento/guia-preguntas.md) en el chat del proyecto.
3. Por cada fila de la sección 3 y de la sección 2, anotar si quedó **confirmada**, **corregida** o **descartada**, con la cita de la conversación.
4. Con eso, escribir la versión 2 del dominio, en la que cada afirmación tenga respaldo en el relevamiento.
