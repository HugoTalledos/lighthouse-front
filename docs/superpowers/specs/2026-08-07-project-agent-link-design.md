# Relación entre proyectos y agente

## Objetivo

Conectar la entidad `Project` del frontend con la entidad persistida por el
backend y hacer que cada conversación del agente actualice el proyecto que el
usuario está viendo. El proyecto se crea antes de iniciar la conversación,
pero sus metadatos y recursos se completan progresivamente por el agente.

## Decisiones aprobadas

- El frontend genera un `thread_id` al pulsar **Crear proyecto**.
- El frontend crea el proyecto mediante `POST /projects`, enviando únicamente
  ese `thread_id`.
- El backend genera el `project_id` y asocia el thread al proyecto.
- El frontend usa los nombres del contrato del backend: `project_id`,
  `thread_ids`, `business_name`, `value_proposition`, `status`, `resources`,
  `created_at` y `updated_at`.
- El agente completa `business_name` y `value_proposition` cuando tiene
  suficiente contexto; no se rellenan con valores mock durante la creación.
- Cada mensaje del chat incluye `project_id` y `thread_id`.
- El backend valida que el thread pertenece al proyecto recibido.
- Las herramientas persisten sus resultados en el proyecto asociado.
- El estado del proyecto nace como `in_progress`, pasa a `review` cuando hay
  recursos generados pendientes de revisión/aprobación y llega a `approved`
  cuando todos los recursos requeridos están aprobados.
- El frontend vuelve a consultar el proyecto después de los turnos relevantes
  del agente y renderiza la respuesta persistida.

## Contrato de proyecto

El backend expone un proyecto con esta forma lógica:

```json
{
  "project_id": "project-uuid",
  "thread_ids": ["thread-uuid"],
  "business_name": null,
  "value_proposition": null,
  "status": "in_progress",
  "created_at": "2026-08-07T12:00:00Z",
  "updated_at": "2026-08-07T12:00:00Z",
  "resources": {
    "landing": { "status": "pending", "payload": {} },
    "campaign": { "status": "pending", "payload": {} },
    "images": { "status": "pending", "payload": {} }
  }
}
```

Los nombres `business_name` y `value_proposition` se conservan porque son los
conceptos usados por los briefs y por el agente. El frontend adapta sus
componentes para mostrar estos campos directamente; no introduce aliases
`name` ni `description` en el contrato de transporte.

Las fechas se reciben como strings ISO-8601. Si un componente necesita un
objeto `Date`, debe convertirlo únicamente en el límite de presentación.

## Flujo de creación

1. El frontend genera `thread_id` con un UUID criptográficamente aleatorio.
2. `createProject(threadId)` llama `POST /projects` con `{ "thread_id": "..." }`.
3. El backend crea un proyecto con un nuevo `project_id`, `thread_ids` con el
   thread recibido, metadatos nulos y `status: "in_progress"`.
4. La creación debe ser segura frente a reintentos: un thread ya asociado no
   debe crear un segundo proyecto.
5. El frontend navega a `/projects/{project_id}` y conserva el `thread_id` en
   la sesión de chat.

El backend deja de crear proyectos silenciosamente durante el primer mensaje.
El método existente de asociación por thread puede reutilizarse internamente
para implementar `POST /projects`, pero el flujo normal exige que el
`project_id` llegue desde el frontend.

## Flujo de chat

`POST /chat` recibe:

```json
{
  "project_id": "project-uuid",
  "thread_id": "thread-uuid",
  "message": "Quiero validar una idea..."
}
```

Antes de iniciar el grafo, el backend debe comprobar:

- que el proyecto existe;
- que el thread está incluido en `project.thread_ids`;
- que el mensaje no está vacío y respeta los límites existentes.

Una combinación inválida de proyecto y thread se rechaza sin ejecutar el
agente. El estado inicial del grafo contiene ambos valores. `project_id` se
propaga a las herramientas mediante `InjectedState`; `thread_id` continúa
siendo el identificador de memoria conversacional de LangGraph.

El evento `done` sigue indicando el final del turno y debe incluir
`project_id`. No sustituye la consulta del proyecto: el frontend hará
`GET /projects/{project_id}` para obtener los metadatos, recursos y estado
actualizados.

## Metadatos creados por el agente

El agente ya considera `business_name` y `value_proposition` campos
obligatorios de la fase de descubrimiento. Se añadirá una operación explícita
del agente para persistir ambos campos cuando haya reunido contexto suficiente
antes de construir recursos. Esa operación:

- recibe `business_name` y `value_proposition`;
- usa el `project_id` del estado inyectado;
- actualiza el proyecto mediante el servicio/repositorio interno;
- no cambia el proyecto a `review` mientras no exista un recurso pendiente;
- no debe inventar valores cuando aún falte información.

El agente puede continuar haciendo preguntas si no puede producir ambos
campos con confianza.

## Persistencia y estado de recursos

Cada herramienta de construcción persiste su resultado serializable en el
recurso correspondiente con estado pendiente de aprobación. Las herramientas
de aprobación cambian ese recurso a `approved` y conservan el payload
aprobado.

El backend calcula el estado agregado del proyecto:

- `in_progress`: no hay un recurso generado pendiente de revisión, o el agente
  sigue recopilando contexto/construyendo el siguiente recurso;
- `review`: al menos un recurso tiene un payload generado y aún requiere
  revisión o aprobación;
- `approved`: los recursos requeridos están aprobados.

El resultado de una herramienta fallida no se presenta como recurso aprobado.
La información de error sigue viajando en el resultado del agente y en los
eventos SSE existentes.

## Responsabilidades del frontend

El servicio de proyectos real reemplazará al mock para listar, consultar y
crear proyectos. Su interfaz usará `createProject(threadId)` y el tipo de
proyecto del backend.

La página de proyectos:

- crea el thread antes de invocar el servicio;
- usa el `project_id` retornado para navegar;
- no inventa nombre, descripción ni estado inicial.

La página de detalle:

- carga el proyecto real;
- pasa `project_id` y `thread_id` al servicio de chat;
- muestra `business_name`, `value_proposition` y `status` del backend;
- actualiza el playground desde `resources` después de terminar un turno que
  pueda haber modificado el proyecto;
- no muestra el plan fijo de `mockPlaygroundService`.

Los mocks pueden permanecer para pruebas aisladas, pero no deben seleccionarse
en el flujo de producción del proyecto ni del chat.

## Responsabilidades del backend

- Implementar `POST /projects` y devolver el proyecto creado.
- Ampliar `ChatRequest` con `project_id`.
- Validar la relación proyecto-thread antes de ejecutar el grafo.
- Propagar `project_id` al estado del agente.
- Persistir metadatos y resultados de herramientas en el repositorio.
- Calcular y devolver `status` en las respuestas de proyecto.
- Mantener el API HTTP como frontera del frontend; el agente usa servicios y
  repositorios internos, no una llamada HTTP al propio backend.

## No incluido

- Historial remoto de mensajes; por ahora el frontend conserva la sesión de
  chat localmente.
- Un nuevo sistema de usuarios o autorización por propietario.
- Renombrar `business_name` o `value_proposition`.
- Mostrar el JSON crudo de `tool_result` como burbuja del chat.

## Verificación

El cambio debe probar:

- creación de proyecto y generación de `project_id`;
- asociación e idempotencia de `thread_id`;
- rechazo de un thread que no pertenece al proyecto;
- propagación de `project_id` al grafo y a las herramientas;
- persistencia de metadatos y recursos;
- transiciones `in_progress`, `review` y `approved`;
- creación desde el frontend usando el servicio real;
- envío de mensajes con ambos identificadores;
- recarga de recursos al finalizar un turno;
- ausencia del plan mock en el flujo real.

La verificación final incluirá las suites de backend y frontend, el chequeo de
tipos y el build de Nuxt.
