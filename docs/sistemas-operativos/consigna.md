# Sistemas Operativos — Consigna

Texto original de la cátedra, sin cambios. El resumen y el plan del grupo están en [plan.md](plan.md).

---

Desarrollar el sistema con la arquitectura designada por Programación 2 replicada en distintas máquinas (van a estar en contenedores), utilizando Nginx como balanceador de carga en una máquina que va a ser la de acceso y manteniendo una única base de datos exclusiva en una de las instancias que va a estar dockerizada (La SQL) y la otra vía web.

Tienen que mostrar lo siguiente:

- **Servicios en Docker:** Mostrar que todos los componentes y réplicas del servicio están corriendo correctamente dentro de contenedores Docker.
- **Docker Compose:** Presentar el archivo docker-compose.yml donde estructuraron la infraestructura, las réplicas y la red de la aplicación.
- **Configuración de Nginx:** Explicar el archivo de configuración de Nginx (nginx.conf) que realiza el balanceo de carga entre los distintos nodos de la aplicación.
