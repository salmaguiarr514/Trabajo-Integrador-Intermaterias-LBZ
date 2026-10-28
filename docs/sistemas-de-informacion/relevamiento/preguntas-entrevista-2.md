# Guía para la entrevista 2

✅ = ya preguntada o ya respondida. Lo que aportó cada respuesta está en las [notas](../analisis/notas-entrevista-2.md).
Una pregunta por mensaje; las repreguntas se usan solo si la respuesta no alcanza.

---

## Estado al 28/10/2026

La conversación está en [entrevista-2-2026-10-14.md](entrevista-2-2026-10-14.md). **23 de 32 preguntas respondidas; faltan 8** (y la 21, opcional, que está en parte respondida).

| # | Tema | Estado | Dónde está la respuesta |
| --- | --- | --- | --- |
| Apertura | Resumen de la entrevista 1 | ✅ | Inicio de la conversación |
| 1 | Cómo queda un pedido rechazado | ✅ | línea 38 |
| 2 | Nombre del estado del rechazo | ⬜ | — |
| 3 | Desistir antes de aceptar: ¿rechazo o cancelación? (contradicción) | ⬜ | — |
| 4 | Backstage cancela un evento | ✅ | línea 153 |
| 5 | Primera propuesta = negociación | ✅ | línea 47 |
| 6 | Datos para presentar y para confirmar | ✅ | línea 60 |
| 7 | Cómo deciden servicios e importes | ✅ | línea 83 |
| 8 | Pedir cambios no es rechazo | ✅ | línea 47 |
| 9 | Combinaciones habituales | ✅ | línea 163 |
| 10 | Asistentes y condiciones al aceptar | ✅ | línea 176 |
| 11 | Quién registra cancelación y realización | ✅ | línea 187 |
| 12 | Dato anterior y motivo del cambio | ✅ | línea 97 |
| 13 | Ver compromisos al registrar un cambio | ✅ | línea 198 |
| 14 | Confirmado ≠ proveedores confirmados | ✅ | Apertura |
| 15 | Datos del proveedor | ✅ | [Entrevista 1 §7b](entrevista-1-2026-10-13.md#7b-datos-de-los-proveedores) |
| 16 | Proveedor que se baja | ✅ | línea 208 |
| 17 | Cambio de fecha con proveedor confirmado | ✅ | línea 97 |
| 18 | Servicio vencido y su fecha | ✅ | línea 219 |
| 18b | Servicio indispensable | ✅ | línea 232 |
| 19 | Estados de la tarea | ✅ | línea 106 |
| 20 | Responsable: persona | ✅ | línea 123 |
| 21 | Qué hacen con una tarea atrasada *(opcional)* | 🟡 | En parte, líneas 106 y 123. Se puede omitir |
| 21b | Tarea en curso que pasa su fecha: ¿en curso o vencida? | ⬜ | — |
| 22 | Cargar tareas y proveedores antes de confirmar | ⬜ | — |
| 23 | Qué hace Administración | ✅ | línea 134 |
| 24 | Pendientes de todos los eventos o evento por evento | ⬜ | — |
| 25–27 | "Pedido = solicitud", dos "confirmado", todo en un lugar | ✅ | Apertura |
| 28 | "Servicio" con dos sentidos (propuesta y preparación) | ⬜ | — |
| 29 | Cierre: recorrido completo | ⬜ | Se redacta con las respuestas de arriba |
| 30 | La sede: quién la consigue | ⬜ | — |

### Qué falta preguntar, en este orden

Una por mensaje, como cliente real. El orden pone primero lo que cambia el análisis (estados y sistema) y deja el cierre para el final,
porque el resumen se arma con todas las respuestas.

| Orden | # | Qué se logra | Texto para pegar en el chat |
| --- | --- | --- | --- |
| 1 | 30 | Corrige la v1 ("la sede la trae el cliente" nunca se preguntó). Define el límite del sistema | La sede del concierto, ¿la consigue el cliente o la consiguen ustedes? ¿Se contrata como un servicio más? ¿Quién se comunica con la sede? |
| 2 | 3 | Resuelve la contradicción de la cancelación. Define las transiciones del estado | Si un cliente desiste antes de aceptar, por ejemplo mientras todavía preparan la propuesta, ¿eso lo consideran un rechazo o una cancelación? ¿Se puede cancelar un pedido que todavía no fue confirmado? |
| 3 | 2 | Nombre del estado del rechazo. Cierra los estados del evento | Cuando un pedido queda cerrado porque el cliente rechazó la propuesta, ¿cómo lo llaman ustedes? ¿Lo manejan como un estado más del evento, como "rechazado"? |
| 4 | 21b | Decide si "vencida" es un estado o una condición calculada | Si una tarea ya está en curso y pasa su fecha prevista, ¿la consideran en curso o vencida? ¿Y una tarea pendiente que pasa su fecha? |
| 5 | 22 | Qué se puede cargar antes de confirmar. Regla de datos | ¿Tiene sentido cargar tareas o proveedores en un evento que todavía no está confirmado, o eso se hace recién cuando el cliente acepta? |
| 6 | 24 | Información por actor y vista de pendientes | Para controlar los pendientes, ¿Coordinación y Producción necesitan ver juntos los de todos los eventos, o los miran evento por evento? |
| 7 | 28 | Valida el doble sentido de "servicio": base de los Bounded Contexts | En la propuesta, un servicio es lo que le ofrecen al cliente con su importe; en la preparación, es algo que hay que cubrir con un proveedor. ¿Lo ven así, o para ustedes son cosas distintas? |
| 8 | 29 | Validación final de todo el recorrido | Se redacta con lo respondido (ver abajo) |

**Cierre (29):** se escribe cuando estén las 7 anteriores. Resume el recorrido con las palabras del cliente: pedido → propuesta → aceptación o rechazo →
servicios y proveedores → tareas → cambios → realización o cancelación, con los estados, las condiciones atrasadas y el servicio indispensable.
Termina con: "¿Es así? ¿Falta algo o hay algún caso que no se cumpla?". Si agrega algo, se hace una repregunta y se actualiza.

**Después de cada respuesta:** pegarla textual en la entrevista, marcar ✅ acá y volcar lo que aporta en las [notas](../analisis/notas-entrevista-2.md).

---

## Apertura

✅ Resumen de la entrevista 1 para que el cliente lo confirme.

## Rechazo y cancelación

1. ✅ Cuando un cliente rechaza la propuesta, ¿cómo queda ese pedido para ustedes?

2. Cuando un pedido queda cerrado por un rechazo, ¿cómo lo llaman? ¿Es un estado más, como "rechazado"?

3. Si un cliente desiste antes de aceptar, por ejemplo mientras todavía preparan la propuesta, ¿eso es un rechazo o una cancelación?  
   ↳ *Repregunta:* ¿Se puede cancelar un pedido que todavía no fue confirmado?

4. ✅ ¿Hay casos en que sea Backstage quien cancela un evento?  
   ↳ *Repregunta:* ¿Por ejemplo, si no consiguen un proveedor?

## Propuesta y confirmación

5. ✅ Cuando le presentan la primera propuesta al cliente, ¿el pedido ya está en negociación, o recién cuando pide un ajuste?

6. ✅ ¿Qué datos tienen que estar definidos para presentar una propuesta? ¿Y para confirmar el encargo?

7. ✅ ¿Cómo deciden qué servicios incluir en una propuesta y su importe?

8. ✅ Cuando el cliente pide cambios a la propuesta, ¿eso cuenta como un rechazo?

9. ✅ Esas combinaciones habituales de servicios, ¿las tienen anotadas en algún lado? ¿Les serviría arrancar una propuesta a partir de una de ellas? *(opcional)*  
   ↳ *Repregunta:* ¿Quién las mantiene?

10. ✅ Cuando el cliente acepta, además de los servicios, los importes, la fecha y la sede, ¿quedan fijas también la cantidad de asistentes y las condiciones particulares?

11. ✅ ¿Quién registra la cancelación de un evento? ¿Y que el evento se realizó, con sus observaciones?

30. La sede del concierto, ¿la consigue el cliente o la consiguen ustedes? ¿Se contrata como un servicio más?  
    ↳ *Repregunta:* ¿Quién se comunica con la sede?

## Cambios

12. ✅ Cuando cambia algo ya acordado, por ejemplo la fecha, ¿necesitan saber después cuál era la fecha anterior y por qué cambió?  
    ↳ *Repregunta:* ¿Quién pidió el cambio? ¿Cuándo se registró?

13. ✅ Cuando registran un cambio, ¿les serviría ver en ese momento las tareas y los proveedores del evento para revisar cuáles se afectan?

## Proveedores

14. ✅ Si el encargo ya está confirmado, ¿quiere decir que los proveedores también lo están?

15. ✅ ¿Qué datos necesitan tener de cada proveedor? *(respondida en la entrevista 1)*

16. ✅ ¿Qué pasa si un proveedor que ya había confirmado se baja?  
    ↳ *Repregunta:* ¿Cómo se enteran? ¿El servicio vuelve a quedar pendiente?

17. ✅ Cuando cambia la fecha y vuelven a consultar a un proveedor que ya había confirmado, ¿cómo queda su participación mientras esperan la respuesta?  
    ↳ *Repregunta:* ¿Vuelve a "pendiente"?

18. ✅ Un servicio que todavía no tiene proveedor confirmado, ¿puede estar "vencido"? ¿Tiene una fecha para resolverse?  
    ↳ *Repregunta:* ¿O se controla con una tarea de confirmarlo?

18b. ✅ ¿Cómo saben si un servicio es indispensable para el concierto? ¿Lo definen en algún momento?  
    ↳ *Repregunta:* ¿Queda anotado en la propuesta o en lo acordado?

## Tareas

19. ✅ Además de pendiente y vencida, ¿en qué otras situaciones puede estar una tarea?  
    ↳ *Repregunta:* ¿Se puede cancelar una tarea, por ejemplo después de un cambio? ¿Quién la marca como completada?

20. ✅ El responsable de una tarea, ¿es una persona o un área?  
    ↳ *Repregunta:* ¿Puede cambiar de responsable?

21. ¿Qué hacen cuando una tarea se atrasa? *(opcional: en parte respondida en la 19 y la 20)*  
    ↳ *Repregunta:* ¿Quién se entera? ¿Se cambia la fecha o el responsable?

21b. Si una tarea ya está en curso y pasa su fecha prevista, ¿la consideran en curso o vencida?  
    ↳ *Repregunta:* ¿Y una pendiente que pasa su fecha?

22. ¿Tendría sentido cargar tareas o proveedores en un evento que todavía no está confirmado?

## Personal y seguimiento

23. ✅ ¿Qué información carga o modifica Administración?  
    ↳ *Repregunta:* ¿Puede tocar propuestas o tareas?

24. Para controlar pendientes, ¿Coordinación y Producción necesitan ver juntos los de todos los eventos, o los miran evento por evento?

## Lenguaje

25. ✅ ¿"Pedido" y "solicitud" son lo mismo para ustedes?

26. ✅ ¿"Evento confirmado" y "participación confirmada" son cosas distintas?

27. ✅ ¿Todo lo de un evento debería estar en un mismo lugar?

28. En la propuesta, un servicio es lo que le ofrecen al cliente con su importe; en la preparación es algo que hay que cubrir con un proveedor. ¿Lo ven así?

## Cierre

29. Resumir con sus palabras el recorrido completo (pedido → propuesta → aceptación o rechazo → proveedores y tareas → cambios → realización o cancelación) y preguntar: "¿Es así? ¿Falta algo o hay algún caso que no se cumpla?"

---

**Reglas:** hablarle como a un cliente real, con preguntas abiertas, sin términos de analista ("límite", "entorno", "actores").
Guardar la conversación textual y pasarla para volcarla al análisis.
