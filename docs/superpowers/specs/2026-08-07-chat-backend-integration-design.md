# Integración del chat SSE con Lighthouse backend

## Objetivo

Conectar el chat del frontend de Lighthouse directamente con `POST /chat` del
backend para que el usuario pueda conversar con el agente real. El frontend
quedará siempre conectado al backend; no se añadirá un selector de mocks.

## Contexto y contrato

El backend recibe:

```json
{ "message": "...", "thread_id": "..." }
```

Y responde `text/event-stream` con eventos SSE:

- `start`: contiene el `thread_id` asignado al turno.
- `message`: contiene `{ "content": "..." }`.
- `tool_call` y `tool_result`: describen el trabajo interno del agente.
- `done`: contiene el `thread_id` y, cuando existe, `project_id`.
- `error`: contiene `{ "message": "..." }`.

El endpoint es un `POST`, por lo que el transporte se implementará con
`fetch` y lectura de `Response.body`, no con `EventSource`.

## Diseño

### Servicio de transporte

Se añadirá una implementación real de `IChatService` que:

1. Envía el texto y el `thread_id` conocido.
2. Lee el stream SSE línea por línea y reconstruye cada evento `event` + `data`.
3. Entrega los mensajes del agente de forma incremental mediante un callback.
4. Actualiza el `thread_id` al recibir `start` o `done`.
5. Convierte errores HTTP, de red y eventos `error` en errores utilizables por
   el composable.

El servicio conservará la separación entre transporte y estado de UI. Los
eventos `tool_call` y `tool_result` se procesarán para mantener el parser
correcto, pero no se convertirán en burbujas visibles porque `ChatMessage` no
los representa.

### Estado del chat

`useChat` seguirá siendo responsable de mensajes, carga y errores. Al enviar:

1. Añade el mensaje del usuario de forma optimista.
2. Crea una burbuja de agente vacía o acumula el contenido recibido.
3. Actualiza esa burbuja conforme llegan eventos `message`.
4. Finaliza el turno en `done` y desactiva el indicador de escritura.
5. Si falla el turno, muestra el error y conserva el historial local útil.

El `thread_id` y los mensajes se guardarán en `localStorage`, bajo una clave
derivada del proyecto. Esto permite mantener la conversación visible después
de recargar, ya que el backend actualmente no ofrece un endpoint de historial.

### Configuración

Se incorporará configuración pública de Nuxt:

- `NUXT_PUBLIC_API_BASE_URL`, con valor local por defecto `http://localhost:8000`.
- `NUXT_PUBLIC_API_KEY`, opcional; cuando exista se enviará como `x-api-key`.

La fábrica de servicios devolverá siempre el servicio real. La configuración
`useMocks` dejará de controlar el chat para respetar el requisito de conexión
permanente al backend.

## Manejo de errores y límites

- Un status HTTP distinto de 2xx produce un error antes de leer el stream.
- Una respuesta sin `body` se considera inválida.
- Un SSE mal formado se ignora si no contiene un evento completo; el turno
  terminará con error si el backend informa un evento `error` o se interrumpe
  la conexión antes de completar el turno.
- El frontend no mostrará detalles internos del backend más allá del mensaje
  entregado por el contrato de error.
- No se añadirá en esta iteración un endpoint de historial ni persistencia
  remota.

## Verificación

Se comprobará el comportamiento del parser y del servicio con pruebas que
cubran eventos SSE, conservación del `thread_id`, acumulación de mensajes y
errores. Finalmente se ejecutará el chequeo de tipos y el build de Nuxt.
