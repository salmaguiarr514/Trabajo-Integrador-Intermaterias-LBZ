# Guía para la entrevista 2

Sale del [análisis versión 1](../analisis/analisis-v1.md). Tiene tres objetivos: cerrar las dudas abiertas (D1–D10), respaldar los hechos
que no quedaron en la transcripción (⚠) y **validar con el cliente nuestras interpretaciones y propuestas**, como pide la consigna.

Mismas reglas que la [guía general](guia-preguntas.md#cómo-usarla): hablarle como a un cliente real, con preguntas abiertas, sin términos de analista
y usando su vocabulario ("pedido", "propuesta vigente", "encargo", "participación").

Al terminar: guardar la conversación textual en `entrevista-2-AAAA-MM-DD.md` y anotar en la última columna qué contestó.

---

## A. Dudas abiertas

| # | Pregunta | Repregunta posible | Duda | Respuesta |
| --- | --- | --- | --- | --- |
| 1 | Cuando un cliente rechaza la propuesta, ¿cómo queda ese pedido para ustedes? | ¿Lo siguen considerando un evento? ¿Puede volver a activarse más adelante? | D1 | |
| 2 | ¿Qué tiene que pasar para que un pedido pase de "en solicitud" a "en negociación"? | ¿Es cuando le presentan la primera propuesta? | D8 | |
| 3 | ¿Qué datos tienen que estar definidos para poder presentarle una propuesta al cliente? ¿Y para confirmar el encargo? | ¿Se puede confirmar sin sede o sin fecha definida? | D4 | |
| 4 | ¿Cómo deciden qué servicios incluir en una propuesta y su importe? | ¿Tienen combinaciones habituales o es siempre a medida? | D5 | |
| 5 | Cuando hay un cambio después de confirmar, ¿qué pasa con lo que se había acordado antes? | ¿Necesitan saber cuál era el dato anterior? ¿Y el motivo del cambio? | D6 | |
| 6 | ¿Cuándo consideran que una tarea está vencida? ¿En qué situaciones puede estar una tarea? | ¿Una tarea vencida sigue pendiente? ¿Se puede cancelar una tarea? | D3 | |
| 7 | El responsable de una tarea, ¿es una persona o un área? | ¿Puede cambiar de responsable? | D10 | |
| 8 | ¿Qué información carga o modifica Administración? | ¿Puede tocar propuestas o tareas? | D2 | |
| 9 | ¿Quién deja registrada la confirmación, la cancelación y el cierre de un evento? | | D7 | |
| 10 | ¿Hay casos en que sea Backstage quien cancela un evento? | ¿Por ejemplo, si no consiguen un proveedor? | D9 | |

## B. Hechos sin respaldo

Usarlas **solo si no se recupera** el intercambio original del chat (ver [entrevista 1](entrevista-1-2026-10-13.md#validación-falta-pegar)).

| # | Pregunta | Hecho |
| --- | --- | --- |
| 11 | Cuando el cliente acepta la propuesta, ¿qué queda acordado? | F17, F18 |
| 12 | Si el encargo ya está confirmado, ¿quiere decir que los proveedores también lo están? | F19 |
| 13 | ¿Qué datos necesitan tener de cada proveedor? | F21 |
| 14 | Cuando el cliente pide cambios a la propuesta, ¿eso cuenta como un rechazo? | F15 |
| 15 | ¿"Pedido" y "solicitud" son lo mismo para ustedes? | Lenguaje |

## C. Validar interpretaciones y propuestas

Salen de los controles propuestos en el [análisis §3.3](../analisis/analisis-v1.md#33-problemas-de-calidad-de-la-información-y-controles).
Se plantean como forma de trabajar, no como funciones del sistema.

| # | Pregunta | Qué valida |
| --- | --- | --- |
| 16 | Entendimos que todo lo de un evento (pedido, propuesta, lo acordado, proveedores, tareas y cambios) debería estar en un mismo lugar. ¿Es así? | Registro único por evento |
| 17 | Cuando registran un cambio, ¿les serviría ver en ese momento las tareas y los proveedores del evento para revisar cuáles se afectan? | Revisión de compromisos afectados |
| 18 | ¿Tendría sentido cargar tareas o proveedores en un evento que todavía no está confirmado? | Restricción: preparación solo con encargo confirmado |
| 19 | Para controlar pendientes, ¿qué les gustaría ver juntos? ¿Las tareas vencidas y los servicios sin confirmar de todos los eventos, o evento por evento? | Lista de pendientes |
| 20 | Entendimos que un "evento confirmado" y una "participación confirmada" son cosas distintas: una es que el cliente aceptó y la otra que el proveedor puede. ¿Es así como lo usan? | Término ambiguo "confirmado" |
| 21 | En la propuesta, un servicio es lo que le ofrecen al cliente con su importe; en la preparación es algo que hay que cubrir con un proveedor. ¿Lo ven así? | Doble significado de "servicio" (base de los contextos) |

## Validación de cierre

Al final, resumir con sus palabras el recorrido completo (pedido → propuesta → aceptación o rechazo → proveedores y tareas → cambios → realización o cancelación)
y preguntar: "¿Es así? ¿Falta algo o hay algún caso que no se cumpla?"
