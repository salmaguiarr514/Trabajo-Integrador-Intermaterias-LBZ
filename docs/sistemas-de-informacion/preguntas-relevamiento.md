# Guía de preguntas para el relevamiento

Preguntas para el cliente del proyecto de ChatGPT. Salen de la [comparación entre el DOMINIO.md y el alcance](comparacion-dominio-alcance.md):
confirman, corrigen o descartan lo que planteamos (H = hipótesis) y cubren lo obligatorio que nos faltaba (O = omitido).

## Cómo usarla

- **Hablarle como a un cliente real.** Nada de "límite del sistema", "entorno", "actores" ni "bounded context".
- **Preguntas abiertas.** No meter la respuesta en la pregunta: "¿cómo confirman un encargo?", no "¿lo confirman con una seña?".
- **Repreguntar.** Las sub-preguntas son repreguntas posibles: usarlas según lo que conteste.
- **No hace falta seguir el orden.** Si el cliente salta a otro tema, seguirlo y volver después.
- **Anotar el vocabulario del cliente.** Si dice "encargo", "evento cerrado" o "seña", usar esas palabras de ahí en adelante.
- **Guardar cada conversación** con su fecha, y anotar al lado de cada pregunta qué respondió.
- **No preguntar lo que está fuera del alcance** (entradas, pagos, cartelera, festivales de varios días).
  Si el cliente lo menciona solo, anotarlo como algo que queda fuera del software.

---

## Bloque 1 — La empresa y su forma de trabajar

*Objetivo: confirmar o corregir quién es la empresa y qué hace (H1, H10). Primera sesión.*

1. ¿A qué se dedica la empresa? ¿Qué tipo de eventos organizan?
   - ¿Hay algún tipo de evento que no hagan?
   - ¿Qué tamaño suelen tener los eventos? ¿Cuánta gente, cuánto dura un evento?
2. ¿Quiénes son sus clientes? ¿Personas, empresas, otros?
3. ¿Cuántos eventos organizan por mes? ¿Cuántos en paralelo?
4. ¿Quiénes trabajan en la empresa? ¿Qué hace cada uno? *(O12)*
   - ¿Alguien coordina a los demás? ¿Quién toma las decisiones importantes?
5. Contame cómo es todo el recorrido de un evento, desde que alguien los contacta hasta que termina.
   - ¿Qué parte de ese recorrido es la que más trabajo les da?

## Bloque 2 — Cómo se organizan hoy y qué problemas tienen

*Objetivo: confirmar el problema (H2) y entender qué necesitan del software.*

6. Hoy, ¿dónde anotan lo que pide un cliente y lo que se acordó con él?
   - ¿Usan planillas, cuadernos, mensajes, mails? ¿Cada uno tiene lo suyo o hay algo compartido?
7. ¿Alguna vez se les pasó algo? ¿Qué pasó y por qué?
   - ¿Un proveedor que no estaba confirmado? ¿Una tarea que nadie hizo? ¿Un cambio que no le llegó a alguien?
8. Cuando alguien necesita saber cómo viene un evento, ¿cómo lo averigua?
9. ¿Qué esperan que les resuelva el sistema? ¿Qué les gustaría poder ver de un vistazo?

## Bloque 3 — El cliente y su pedido

*Objetivo: cubrir clientes y solicitudes (O1, O2) y corregir lo que planteamos del evento y del lugar (H3, H5, H6).*

10. ¿Cómo llega un cliente? ¿Quién lo atiende?
11. ¿Qué datos le toman al cliente?
    - ¿Les importa si es una persona o una empresa? ¿Le piden algún dato que lo identifique (DNI, CUIT)? *(H9)*
12. ¿Qué les cuenta el cliente sobre el evento que quiere? ¿Qué le preguntan ustedes?
    - Fecha, lugar, cantidad de gente, tipo de evento… ¿qué más?
    - ¿Qué pasa si el cliente todavía no sabe la fecha o el lugar?
13. ¿El lugar del evento lo elige el cliente o lo proponen ustedes? *(H5)*
    - ¿Trabajan siempre con los mismos lugares? ¿El lugar se contrata como un servicio más?
14. ¿Cómo manejan la cantidad de gente? ¿Es un número aproximado? ¿Cambia algo según cuánta gente va? *(H6)*
15. ¿Qué preferencias o necesidades especiales suele pedir un cliente? ¿Cuáles son importantes de anotar?
16. ¿Hay pedidos que rechazan? ¿Por qué?

## Bloque 4 — La propuesta y el presupuesto

*Objetivo: cubrir propuesta, presupuesto, aceptación y rechazo (O3, O4).*

17. Después de escuchar al cliente, ¿qué le presentan? ¿Cómo lo llaman ustedes?
18. ¿Cómo arman esa propuesta? ¿Quién la arma?
    - ¿Tienen paquetes armados o es todo a medida?
    - ¿Qué servicios suelen incluir?
19. ¿Cómo calculan el precio de cada servicio y el total?
    - ¿Hay descuentos o recargos? ¿Quién los autoriza?
20. ¿Alguien revisa o aprueba la propuesta antes de mandársela al cliente?
21. ¿Cómo se la hacen llegar al cliente?
22. ¿Qué pasa cuando el cliente pide cambios? ¿Cuántas veces puede ir y volver?
    - ¿Guardan las versiones anteriores o solo la última?
23. ¿La propuesta tiene un plazo de validez? ¿Qué pasa si vence?
24. ¿Qué pasa cuando el cliente la rechaza? ¿Anotan el motivo? ¿Queda algo registrado?

## Bloque 5 — La confirmación del encargo

*Objetivo: cubrir la confirmación (O5) y descubrir qué condiciones la permiten.*

25. ¿Cuándo consideran que un evento "está cerrado" con el cliente?
    - ¿Qué tiene que pasar? ¿Quién lo decide?
26. ¿Cómo les confirma el cliente? ¿Queda algo por escrito?
27. Una vez confirmado, ¿qué queda acordado? ¿Servicios, condiciones, algo más?
28. ¿Qué cambia en el trabajo de ustedes cuando un evento se confirma? ¿Qué es lo primero que hacen?

## Bloque 6 — Servicios y proveedores

*Objetivo: cubrir proveedores (O6) y aclarar si los artistas y los lugares son servicios contratados (H4, H5).*

29. ¿Con qué proveedores trabajan? ¿Qué tipo de servicios contratan afuera?
    - ¿Los artistas o bandas se contratan como un servicio más? ¿Cómo? *(H4)*
30. ¿Qué datos de cada proveedor necesitan tener a mano?
31. ¿Trabajan siempre con los mismos o cambia según el evento?
32. ¿Cómo le piden un servicio a un proveedor y cómo saben que está confirmado?
    - ¿Quién se encarga de eso?
33. ¿Qué pasa si un proveedor no confirma o se baja?
    - ¿Cómo se enteran? ¿Con cuánta anticipación necesitan saberlo?
34. ¿Cómo saben qué servicios de un evento todavía no están confirmados?

## Bloque 7 — Preparación y tareas

*Objetivo: cubrir tareas, responsables y pendientes (O7, O8).*

35. Una vez confirmado el evento, ¿qué cosas hay que hacer para prepararlo?
    - ¿Son siempre las mismas o cambian según el evento?
36. ¿Cómo se reparten esas tareas? ¿Quién las asigna?
37. ¿Cada tarea tiene una fecha límite? ¿Quién la fija?
38. ¿Cómo saben si una tarea está hecha, en curso o atrasada?
39. ¿Qué hacen cuando una tarea se atrasa? ¿Quién se entera?
40. ¿Quién necesita ver cómo viene la preparación de un evento? ¿Qué necesita ver cada uno?

## Bloque 8 — Cambios

*Objetivo: cubrir los cambios relevantes y los compromisos afectados (O9).*

41. ¿Qué cambios suelen pedir los clientes después de confirmar?
42. ¿Qué pasa si cambia la fecha del evento?
    - ¿Qué tienen que revisar? ¿Proveedores, tareas, el presupuesto?
43. ¿Y si cambia o se saca un servicio acordado?
44. ¿Quién puede aceptar un cambio? ¿Queda registrado qué cambió y por qué?
45. ¿Les pasó que un cambio no le llegó a alguien? ¿Qué pasó?

## Bloque 9 — Cancelación y cierre

*Objetivo: cubrir cancelación y cierre (O10, O11) y confirmar que se conserva la información (H7).*

46. ¿Pasa que un cliente cancele un evento? ¿En qué momento suele pasar?
47. Cuando se cancela, ¿qué hacen? ¿Qué guardan? ¿Anotan el motivo?
48. ¿La empresa puede cancelar un evento? ¿En qué casos?
49. Cuando termina un evento, ¿hacen algo para "cerrarlo"? ¿Qué anotan?
    - ¿Registran cómo salió, problemas, observaciones?
50. ¿Qué información de un evento terminado o cancelado necesitan consultar después? ¿Para qué?

## Bloque 10 — Consultas, situaciones de un evento y responsabilidades

*Objetivo: descubrir estados, reglas y permisos (H8, O12, O13).*

51. Si les pregunto "¿cómo está tal evento?", ¿qué respuestas posibles hay?
    - ¿En qué situaciones puede estar un evento, desde el primer contacto hasta el final? *(H8)*
52. ¿Cómo buscan un evento? ¿Por fecha, por cliente, por cómo viene?
53. ¿Qué necesita ver cada persona de la empresa en su día a día?
54. ¿Hay información que no todos deberían poder modificar? ¿Quién puede cambiar qué?
55. ¿Hay cosas que nunca deberían pasar? Por ejemplo, ¿hay algo que no se pueda hacer si antes no pasó otra cosa?

---

## Preguntas de validación

Para usar al final de cada sesión, o al empezar la siguiente, con lo que hayamos entendido.

- "Entonces, si entendí bien, [resumen con las palabras del cliente]. ¿Es así?"
- "Cuando dicen [término], ¿se refieren a [interpretación]? ¿O hay casos en que significa otra cosa?"
- "¿Hay algún caso en que esto no se cumpla?"
- "Pensábamos que [hipótesis H#]. ¿Es así como trabajan ustedes?"

## Qué NO preguntar

Está fuera del alcance (ver la [comparación](comparacion-dominio-alcance.md#1-lo-que-incorporamos-y-está-fuera-del-alcance)):

- Venta de entradas, precios por sector, abonos, QR, control de acceso.
- Cobros, pagos a proveedores, comisiones, facturación, rentabilidad.
- Cartelera pública, registro de público, portales para clientes o proveedores.
- Festivales de varios días, varios escenarios simultáneos, superposición de shows.
- Plataforma para muchas productoras, superadmin.
- Términos de analista: límite, entorno, actores, elementos, subsistemas.
