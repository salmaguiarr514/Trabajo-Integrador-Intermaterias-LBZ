# Alcance a resolver entre materias

El plan actual ([plan de desarrollo](../programacion-2/plan-desarrollo.md)) y el alcance de Sistemas de Información describen **dos negocios distintos**:

| | Plan de desarrollo + dominio (Prog. 2 y BD) | Sistemas de Información |
| --- | --- | --- |
| Empresa | Productora que arma **sus propios** recitales y festivales | Organizadora que organiza eventos **para un cliente contratante** |
| Usuarios | Superadmin, productoras y **público que compra** | Solo el **personal** de la organizadora |
| Núcleo | Line-up, tarifas, **venta de entradas**, pago, control de acceso | Solicitudes, propuestas, encargos, proveedores, tareas |
| Eventos | Festivales de **varias jornadas** y escenarios simultáneos | **Una jornada, una sede** |

Casi todo lo que el PLAN tiene como núcleo (venta de entradas, pasarela de pago, control de acceso, portal para el público,
eventos de varios días) aparece en la lista de **"Qué queda fuera"** de SI. Y lo obligatorio de SI (propuestas, proveedores,
tareas, cierre) no está en el PLAN.

Lo que sí es compatible: el multitenant (SI acepta que otras materias lo pidan), la tabla `empresas`, el login con roles
y todo el despliegue de Sistemas Operativos.

**Para decidir en grupo y consultar con los profesores:**
1. ¿El software es uno solo para las cuatro materias? Si es así, ¿manda el alcance de SI?
2. ¿Qué rubro le mandamos a la profesora de SI? Tiene que ser una organizadora que trabaja para clientes
   (por ejemplo, organizadora de recitales o shows privados para clientes), no una ticketera.
3. Según la respuesta, actualizar [plan de desarrollo](../programacion-2/plan-desarrollo.md) **después** del relevamiento, no antes:
   el dominio tiene que salir de la entrevista con el cliente.
