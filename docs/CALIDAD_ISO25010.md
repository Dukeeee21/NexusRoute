# Calidad de Software — NexusRoute (ISO/IEC 25010)

Este documento describe cómo NexusRoute aborda el modelo de calidad **ISO/IEC 25010**,
con foco en los dos puntos que pide explícitamente el roadmap del proyecto:
la **explicabilidad de las rutas generadas** y la **mitigación de riesgos de fallos**.
Al final se documentan las métricas de testing y las herramientas de análisis estático
usadas, junto con sus resultados reales a la fecha de esta fase.

> Alcance: este documento se escribió al cierre de la Fase 7 (Testing & Calidad) del
> roadmap, con el código tal como estaba en ese momento. Las cifras de cobertura y los
> resultados de las herramientas son verificables corriendo los comandos indicados en
> cada sección.

---

## 1. Explicabilidad de las rutas generadas

El motor de optimización (`backend/apps/routes/algorithms/astar.py`) usa el algoritmo
**A\*** con una heurística de árbol de expansión mínima (MST), que es **admisible**
(nunca sobreestima el costo restante). Esto tiene una consecuencia directa sobre la
calidad: **A\* con heurística admisible garantiza la ruta óptima**, no una aproximación.
Eso es lo que permite decir "esta es la mejor ruta posible" en lugar de "esta es una
ruta razonable" — la explicabilidad empieza en la garantía matemática del algoritmo,
no solo en cómo se presenta el resultado.

Sobre esa base, el sistema expone la explicación en tres capas:

### 1.1 A nivel de API (auditable programáticamente)

Tanto `POST /api/routes/optimize/` (vista previa) como `POST /api/routes/` (asignación
persistida) devuelven, además del resultado final, el desglose completo:

```json
{
  "order": [ { "label": "Depósito", "lat": ..., "lng": ... }, ... ],
  "legs": [ { "from_index": 0, "to_index": 2, "distance_km": 3.82 }, ... ],
  "total_distance_km": 16.11,
  "estimated_time_min": 24.16
}
```

Cada tramo (`leg`) es inspeccionable individualmente — no solo el total. Esto responde
a la pregunta "¿por qué el conductor va primero a esta parada y no a la otra?": porque
`legs[i].distance_km` es, por construcción de A*, el menor costo posible para llegar
a esa parada dado el estado del recorrido en ese punto.

### 1.2 A nivel de datos (persistente, no solo en el momento del cálculo)

A diferencia de la vista previa (`/optimize/`, que es efímera y cacheada por 1 hora),
la asignación real (`POST /api/routes/`) **persiste la geometría** en los modelos
`Route` y `RouteStop` (`backend/apps/routes/models.py`). Esto significa que la
explicación de una ruta sigue siendo consultable **días después** de haberse
calculado — vía `GET /api/routes/{id}/` o el admin de Django — sin depender de que
el caché siga vivo o de volver a ejecutar el algoritmo. Es una decisión de diseño
deliberada para la auditabilidad: la ruta que ve el dispatcher en el reporte es
exactamente la que se calculó, no una reconstrucción aproximada.

### 1.3 A nivel de interfaz (para personas, no solo para la API)

- El panel del dispatcher (`frontend/src/components/routes/RouteDetail.jsx`) muestra
  cada parada con su distancia parcial respecto a la anterior, en el mismo orden que
  A* determinó.
- El mapa interactivo (`frontend/src/components/routes/RouteMap.jsx`) dibuja la
  polilínea en el orden real de visita, con marcadores numerados — la explicación es
  visual, no solo tabular.
- La vista del conductor (`frontend/src/pages/driver/DriverView.jsx`) muestra el
  progreso como una lista secuencial de paradas, reforzando que el orden no es
  arbitrario sino el resultado de un cálculo específico.

### 1.4 Límite explícito de la explicabilidad

El algoritmo es exacto (no heurístico-aproximado) solo hasta `MAX_STOPS = 12` paradas
por ruta, documentado en `astar.py`. Por encima de ese límite el espacio de estados
(`O(n · 2ⁿ)`) crece de forma prohibitiva y el sistema **rechaza la solicitud
explícitamente** (`TooManyStopsError`, HTTP 400) en lugar de degradar silenciosamente
a una aproximación sin avisar. Preferimos un error claro a una "optimización" que en
realidad no lo es — eso también es parte de ser honestos sobre lo que el sistema
puede y no puede garantizar.

---

## 2. Mitigación de riesgos de fallos

| Riesgo | Mitigación | Dónde |
|---|---|---|
| Redis caído o inalcanzable | `IGNORE_EXCEPTIONS=True` en `django-redis`: el sistema calcula la ruta igual, sin caché, en vez de devolver un error 500 | `backend/config/settings/base.py` |
| Se borra un conductor o vehículo con historial | `on_delete=SET_NULL` en `Delivery.driver/vehicle` y `Route.driver/vehicle`: el historial de entregas y rutas **no se pierde**, solo queda sin ese conductor asignado | `backend/apps/deliveries/models.py`, `backend/apps/routes/models.py` |
| Transición de estado inválida (ej. saltar de Pendiente a Entregado) | `DeliveryStatusSerializer.validate_status` rechaza la transición con 400 antes de tocar la base de datos | `backend/apps/deliveries/serializers.py` |
| Un conductor intenta modificar la entrega de otro | Permiso `IsAssignedDriverOrAdmin` + `queryset` filtrado por conductor: la entrega ajena ni siquiera aparece (404), no se filtra su existencia con un 403 | `backend/apps/users/permissions.py`, `backend/apps/deliveries/views.py` |
| Se intenta asignar como conductor a un usuario que no tiene ese rol | Validación explícita en los serializers de `Vehicle`, `Delivery` y `Route` (`validate_driver` / queryset filtrado a `role=DRIVER`) | `backend/apps/vehicles/serializers.py`, `backend/apps/deliveries/serializers.py`, `backend/apps/routes/serializers.py` |
| Ruta con demasiadas paradas (costo computacional exponencial) | Límite duro `MAX_STOPS=12`, verificado antes de ejecutar el algoritmo; error explícito, no timeout silencioso | `backend/apps/routes/algorithms/astar.py` |
| Entregas re-asignadas por error a una ruta ya cubierta | `validate_delivery_ids` rechaza IDs duplicados, inexistentes, o entregas que ya tienen conductor asignado | `backend/apps/routes/serializers.py` |
| Token JWT expirado durante el uso | Interceptor de Axios reintenta automáticamente con el refresh token antes de forzar el logout | `frontend/src/api/axiosConfig.js` |
| Fallo de un solo servicio en Docker | Cada contenedor tiene `healthcheck`; el backend espera a que Postgres/Redis estén saludables antes de arrancar (`depends_on: condition: service_healthy`) | `docker-compose.yml` |

### Autenticación y autorización como mitigación de riesgo

Todo el sistema exige JWT válido (`IsAuthenticated` por defecto en
`REST_FRAMEWORK.DEFAULT_PERMISSION_CLASSES`), y cada endpoint sensible tiene además
una política de rol explícita (`IsAdmin`, `IsAdminOrReadOnly`,
`IsAssignedDriverOrAdmin`). El módulo de reportes es exclusivamente para el rol
`ADMIN` — un conductor autenticado recibe 403 al intentar acceder, lo cual está
verificado en `backend/apps/reports/tests/test_views.py::test_performance_requires_admin`.
Esto no es solo una decisión de UX (mantener la app del conductor liviana, como pide
el roadmap) sino también de seguridad: los datos de rendimiento de otros conductores
no deben ser visibles para pares.

---

## 3. Otras características de ISO/IEC 25010 cubiertas

| Característica | Cómo se aborda |
|---|---|
| **Eficiencia de desempeño** | SLA de <2s para `/routes/optimize/`; verificado en ~60ms sin caché y ~55ms con caché (Fase 3). Caché Redis para evitar recomputar rutas idénticas. |
| **Compatibilidad** | API REST estándar (JSON), documentada con OpenAPI/Swagger en `/api/docs/` (drf-spectacular) — cualquier cliente HTTP puede integrarse sin acoplarse al frontend. |
| **Usabilidad** | Interfaces separadas por rol: el dispatcher tiene dashboard, mapa y reportes; el conductor solo ve su ruta del día, sin ruido. Estados de carga/vacío/error explícitos en cada vista (no pantallas en blanco silenciosas). |
| **Seguridad** | JWT con rotación de refresh token; contraseñas con `set_password` (hasheadas, nunca en texto plano); permisos por rol en cada endpoint de escritura; CORS restringido a orígenes conocidos (`CORS_ALLOWED_ORIGINS`). |
| **Mantenibilidad** | Apps Django modulares por dominio (`users`, `deliveries`, `vehicles`, `routes`, `reports`); serializers/vistas/tests separados; ver Sección 4 para métricas concretas (cobertura, complejidad, linting). |
| **Portabilidad** | Todo el stack corre vía Docker Compose (Postgres, Redis, backend, frontend) — el entorno de desarrollo es reproducible con `docker compose up` sin instalar dependencias en el host. |

---

## 4. Testing y análisis estático — resultados verificables

### 4.1 Cobertura de pruebas

```bash
cd backend
pytest
```

- **63 tests**, **100% de cobertura de líneas** sobre `apps/` y `config/` (medido con
  `pytest-cov`, configuración en `backend/pytest.ini` y `backend/setup.cfg`).
- Muy por encima del mínimo del 80% pedido por el roadmap.
- Dos líneas están explícitamente excluidas con `# pragma: no cover`, documentadas en
  el propio código (`astar.py`): una es un `RuntimeError` matemáticamente inalcanzable
  para un grafo completamente conexo (red de seguridad, no una ruta de ejecución real),
  y la otra es una optimización de "salteo de entradas obsoletas" en la cola de
  prioridad cuya activación depende del orden interno de procesamiento y no está
  garantizada para un grafo de prueba específico — la corrección del algoritmo no
  depende de que esa rama se ejecute (se verificó exhaustivamente contra fuerza bruta
  en `test_astar.py`).
- Cobertura por tipo de test: modelos (incluye `__str__` y lógica de negocio como
  `Delivery.save()` sincronizando `delivered_at`), serializers (validaciones de rol,
  transiciones de estado, edición anidada), vistas/endpoints (autenticación,
  permisos por rol, casos límite), y el algoritmo A* (comparado contra fuerza bruta
  para garantizar optimalidad, no solo "que no rompa").

### 4.2 Linting y formato

```bash
cd backend
flake8 apps config conftest.py   # estilo + complejidad ciclomática (max-complexity=10)
isort --check apps config conftest.py   # orden de imports
black --check apps config conftest.py   # formato consistente
```

Los tres pasan sin hallazgos. `max-complexity=10` en `flake8` es la métrica más
cercana a lo que SonarScanner reportaría como *code smell* de complejidad ciclomática
sin necesitar un servidor SonarQube/SonarCloud real — ninguna función del proyecto
la excede.

### 4.3 SonarScanner

`backend/sonar-project.properties` está configurado (fuentes, exclusiones, ruta del
reporte de cobertura). **Nota honesta**: correr SonarScanner "de verdad" requiere un
servidor SonarQube o una cuenta de SonarCloud con token — infraestructura que este
proyecto no tiene provisionada. Lo que sí se hizo, y es una aproximación real (no
simulada) a lo que Sonar reportaría, es correr las herramientas de análisis estático
equivalentes disponibles localmente (sección 4.2), que cubren los mismos tipos de
hallazgo que más le importan a un gate de calidad: complejidad, imports/duplicación
de estilo, y errores de convención. Si se dispone de un servidor Sonar, correrlo es:

```bash
sonar-scanner -Dsonar.host.url=<url-del-servidor> -Dsonar.login=<token>
```

### 4.4 Qué se corrigió durante esta fase (no solo qué se midió)

- Se eliminó `IsDriver`, una clase de permiso definida en la Fase 1 pero nunca
  utilizada por ningún endpoint (código muerto real, detectado buscando referencias,
  no solo por cobertura).
- Se detectó y corrigió un problema de **aislamiento de tests**: como Redis persiste
  entre ejecuciones y el `pytest` local (fuera de Docker) apunta al mismo Redis que
  expone el contenedor en `localhost:6379`, una corrida de test podía cachear un
  resultado que "contaminaba" corridas posteriores, ocultando la rama de código que
  realmente calcula la ruta. Se agregó `backend/conftest.py` con un fixture
  `autouse` que limpia la caché antes y después de cada test.
- Se corrigieron 5 violaciones reales de `flake8` (líneas largas, nombre de variable
  ambiguo `l`) y se normalizó el orden de imports en 3 archivos con `isort`.
- Se configuró `black` (que no tenía `pyproject.toml`, por lo que corría con su
  ancho de línea por defecto de 88 en vez de los 100 ya usados en el resto del
  proyecto) y se aplicó una única pasada de formateo a todo el código Python.

---

## 5. Limitaciones conocidas (honestidad, no venta)

- El límite de 12 paradas por ruta es una decisión de ingeniería explícita, no un
  descuido: es el punto donde el algoritmo exacto deja de ser práctico en tiempo real.
  Una ruta con más paradas requeriría un solver heurístico no-exacto (fuera del
  alcance de este proyecto), y el sistema lo comunica con un error claro en vez de
  fingir una solución.
- SonarScanner no corrió contra un servidor real (ver 4.3) — se documenta como tal,
  no se presenta como si hubiera corrido.
- La rama de "salteo de entradas obsoletas" del A* (pragma: no cover) no tiene
  garantía de ejecutarse en cualquier entorno; se decidió no forzarla con un test
  artificial que dependiera de detalles de implementación del heap, porque eso
  haría el test frágil sin agregar garantías reales de comportamiento.
