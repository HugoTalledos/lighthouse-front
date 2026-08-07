# Backend Chat Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the Lighthouse frontend chat to the backend `POST /chat` SSE endpoint so users can converse with the real agent and continue the same conversation after reloads.

**Architecture:** Keep the SSE transport in a focused chat service. A small async SSE reader will parse `event`/`data` frames, while the service maps backend events to chat callbacks and HTTP/domain errors. `useChat` owns UI state and uses the service's conversation persistence to restore messages and `thread_id` per project.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript strict mode, native `fetch`/`ReadableStream`, `localStorage`, Vitest.

## Global Constraints

- The frontend always uses the real chat backend; the mock chat service must not be selected by configuration.
- The backend contract is `POST /chat` with `{ message: string, thread_id: string | null }` and `text/event-stream` events `start`, `message`, `tool_call`, `tool_result`, `done`, and `error`.
- Use `http://localhost:8000` as the default `NUXT_PUBLIC_API_BASE_URL`.
- Send `NUXT_PUBLIC_API_KEY` as `x-api-key` only when it is configured.
- Persist the chat session locally because the backend has no history endpoint.
- Do not expose `tool_call` or `tool_result` as `ChatMessage` bubbles in this iteration.
- No production code is written before its corresponding failing test is observed.

---

## File Map

| File | Responsibility |
| --- | --- |
| `services/chat/sse.ts` | Parse a `ReadableStream<Uint8Array>` into typed SSE events. |
| `services/chat/sse.test.ts` | Test complete, split, malformed, and Unicode SSE frames. |
| `services/chat/chatStorage.ts` | Serialize and restore `ChatSession` values from browser storage. |
| `services/chat/chatStorage.test.ts` | Test storage round-tripping and SSR-safe empty state. |
| `services/chat/backendChatService.ts` | POST to `/chat`, process backend events, and expose conversation persistence. |
| `services/chat/backendChatService.test.ts` | Test request shape, headers, callbacks, thread propagation, and errors. |
| `services/interfaces.ts` | Define the conversation and streaming callback interfaces. |
| `services/index.ts` | Return the backend chat service unconditionally. |
| `services/mock/mockChatService.ts` | Keep the mock conforming to the updated interface for isolated callers. |
| `composables/useChat.ts` | Restore/persist conversation state and update the UI during streaming. |
| `components/organism/ChatPanel.vue` | Render a chat error supplied by the page. |
| `pages/projects/[id].vue` | Pass `useChat`'s error state into the chat panel. |
| `nuxt.config.ts` | Expose backend URL and optional API key through public runtime config. |
| `package.json` / `package-lock.json` | Add Vitest and test scripts. |

### Task 1: Add the tested SSE reader and conversation storage

**Files:**
- Create: `services/chat/sse.ts`
- Create: `services/chat/sse.test.ts`
- Create: `services/chat/chatStorage.ts`
- Create: `services/chat/chatStorage.test.ts`
- Modify: `services/interfaces.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces `readSseEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<ChatSseEvent>`.
- Produces `ChatSseEvent = { event: string; data: Record<string, unknown> }`.
- Produces `ChatSession = { threadId: string | null; messages: ChatMessage[] }`.
- Produces `loadChatSession(projectId: string): ChatSession` and `saveChatSession(projectId: string, session: ChatSession): void`.

- [ ] **Step 1: Add the test runner and write the failing SSE tests**

Run:

```bash
npm install --save-dev vitest
npm pkg set scripts.test="vitest run"
```

Add tests that feed a `ReadableStream` in separate chunks and assert that the
reader returns two events, including a JSON payload containing a newline and
Unicode text:

```ts
it('reassembles SSE frames split across stream chunks', async () => {
  const events = await collect(readSseEvents(streamFrom([
    'event: start\\ndata: {"thread_id":"t-1"}\\n\\n',
    'event: message\\ndata: {"content":"línea 1\\nlínea 2"}\\n\\n',
  ])))

  expect(events).toEqual([
    { event: 'start', data: { thread_id: 't-1' } },
    { event: 'message', data: { content: 'línea 1\\nlínea 2' } },
  ])
})

it('ignores an SSE block with invalid JSON data', async () => {
  const events = await collect(readSseEvents(streamFrom([
    'event: message\\ndata: {not-json}\\n\\n',
  ])))

  expect(events).toEqual([])
})
```

Run: `npm test -- services/chat/sse.test.ts`

Expected: FAIL because `services/chat/sse.ts` does not exist yet.

- [ ] **Step 2: Implement the minimal async SSE reader**

Implement `readSseEvents` with a `TextDecoder`, a buffer split on blank lines,
`event:` and `data:` line parsing, JSON decoding, and a final buffer flush
when the stream closes. Ignore blocks with no event name or invalid JSON. Do
not assume that one `read()` call contains one SSE event.

- [ ] **Step 3: Run the SSE tests and verify green**

Run: `npm test -- services/chat/sse.test.ts`

Expected: PASS, including the split-chunk and invalid-JSON cases.

- [ ] **Step 4: Write failing storage tests**

Add a fake `localStorage` and assert that saving then loading a session
restores the thread ID, message fields, and `Date` instances. Also assert
that storage access is safe when `window` is unavailable:

```ts
it('round-trips a chat session and restores message dates', () => {
  const session = {
    threadId: 'thread-1',
    messages: [{
      id: 'm-1', projectId: 'p-1', role: 'agent', content: 'Hola',
      timestamp: new Date('2026-08-07T12:00:00.000Z'),
    }],
  } satisfies ChatSession

  saveChatSession('p-1', session)
  expect(loadChatSession('p-1')).toEqual(session)
  expect(loadChatSession('p-1').messages[0]?.timestamp).toBeInstanceOf(Date)
})
```

Run: `npm test -- services/chat/chatStorage.test.ts`

Expected: FAIL because the storage module is not implemented.

- [ ] **Step 5: Implement storage and update shared interfaces**

Add `ChatSession`, `ChatStreamHandlers`, and the expanded `IChatService`
types:

```ts
export interface ChatSession {
  threadId: string | null
  messages: ChatMessage[]
}

export interface ChatStreamHandlers {
  onThreadId?: (threadId: string) => void
  onMessage?: (content: string) => void
}

export interface IChatService {
  getConversation(projectId: string): Promise<ChatSession>
  saveConversation(projectId: string, session: ChatSession): Promise<void>
  sendMessage(projectId: string, content: string, options?: ChatStreamHandlers): Promise<ChatMessage>
}
```

Store JSON under `lighthouse:chat:${projectId}`. Return an empty session for
missing, malformed, or non-browser storage. Convert stored timestamps back to
`Date` objects and never throw solely because storage is unavailable.

- [ ] **Step 6: Run the task tests and commit**

Run: `npm test -- services/chat/sse.test.ts services/chat/chatStorage.test.ts`

Expected: PASS with zero failed tests.

Commit:

```bash
git add services/chat services/interfaces.ts package.json package-lock.json
git commit -m "test: add chat stream and session primitives"
```

### Task 2: Implement and test the backend chat service

**Files:**
- Create: `services/chat/backendChatService.ts`
- Create: `services/chat/backendChatService.test.ts`
- Modify: `services/mock/mockChatService.ts`

**Interfaces:**
- Consumes `readSseEvents`, `ChatSession`, `ChatStreamHandlers`, and `IChatService` from Task 1.
- Produces `createBackendChatService(config: BackendChatServiceConfig): IChatService`.
- `BackendChatServiceConfig` contains `baseUrl: string`, optional `apiKey?: string`, and optional injected `fetch?: typeof globalThis.fetch` for tests.

- [ ] **Step 1: Write failing service tests**

Mock only the injected fetch and return a real `ReadableStream` body. Assert
the request and callbacks:

```ts
it('posts the message and streams the backend response', async () => {
  const fetcher = vi.fn().mockResolvedValue(responseFrom([
    'event: start\\ndata: {"thread_id":"thread-2"}\\n\\n',
    'event: message\\ndata: {"content":"Respuesta"}\\n\\n',
    'event: done\\ndata: {"thread_id":"thread-2","project_id":"p-1"}\\n\\n',
  ]))
  const onThreadId = vi.fn()
  const onMessage = vi.fn()
  const service = createBackendChatService({
    baseUrl: 'http://localhost:8000/', apiKey: 'secret', fetch: fetcher,
  })

  const result = await service.sendMessage('p-1', 'Hola', { onThreadId, onMessage })

  expect(fetcher).toHaveBeenCalledWith('http://localhost:8000/chat', expect.objectContaining({
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': 'secret' },
    body: JSON.stringify({ message: 'Hola', thread_id: null }),
  }))
  expect(onThreadId).toHaveBeenCalledWith('thread-2')
  expect(onMessage).toHaveBeenCalledWith('Respuesta')
  expect(result.content).toBe('Respuesta')
})
```

Also add tests that a non-OK response throws, a backend `error` event throws
its message, and a `tool_call`/`tool_result` pair does not invoke
`onMessage`.

Run: `npm test -- services/chat/backendChatService.test.ts`

Expected: FAIL because the backend service is not implemented.

- [ ] **Step 2: Implement the backend service**

Normalize the base URL by removing trailing slashes. Call
`fetch(`${baseUrl}/chat`)` with `POST`, JSON headers, an optional
`x-api-key`, and the existing thread ID from the conversation returned by
`getConversation`. Process events:

```text
start     -> options.onThreadId(data.thread_id)
message   -> options.onMessage(data.content), append content to final response
error     -> throw new Error(data.message)
done      -> options.onThreadId(data.thread_id), mark the stream complete
```

Reject non-2xx responses, missing response bodies, and streams that finish
without `done`. Return an agent `ChatMessage` with a generated ID, the
supplied project ID, the accumulated content, and the current timestamp.
Delegate `getConversation`/`saveConversation` to the storage module.

Update `mockChatService` to satisfy the new interface without changing its
existing fake response behavior.

- [ ] **Step 3: Run service tests and commit**

Run: `npm test -- services/chat/backendChatService.test.ts`

Expected: PASS with zero failed tests.

Commit:

```bash
git add services/chat/backendChatService.ts services/chat/backendChatService.test.ts services/mock/mockChatService.ts
git commit -m "feat: add SSE backend chat service"
```

### Task 3: Wire the real service into `useChat` and the visible UI

**Files:**
- Modify: `services/index.ts`
- Modify: `composables/useChat.ts`
- Create: `composables/useChat.test.ts`
- Modify: `components/organism/ChatPanel.vue`
- Modify: `pages/projects/[id].vue`

**Interfaces:**
- Consumes `createBackendChatService` and `ChatSession` from Tasks 1–2.
- Produces the existing `useChat(projectId)` API plus a visible error state in `ChatPanel`.

- [ ] **Step 1: Write the failing composable behavior test**

Add a test harness around a fake `IChatService` and assert that sending a
message passes the restored thread ID, appends streamed agent content, and
saves the resulting session. The test must first fail because the current
composable does not accept stream callbacks or session state.

```ts
it('continues a saved thread and updates the agent bubble while streaming', async () => {
  const service = fakeChatService({ threadId: 'saved-thread' })
  const chat = useChat('p-1', service)

  await chat.fetchMessages()
  const sending = chat.sendMessage('Sigue')
  await flushPromises()

  expect(service.sendMessage).toHaveBeenCalledWith('p-1', 'Sigue', expect.objectContaining({
    onThreadId: expect.any(Function), onMessage: expect.any(Function),
  }))
  expect(chat.messages.value.at(-1)?.content).toBe('Respuesta en streaming')
  await sending
  expect(chat.isTyping.value).toBe(false)
})
```

Run: `npm test -- composables/useChat.test.ts`

Expected: FAIL against the current non-streaming composable.

- [ ] **Step 2: Implement session-aware streaming state**

Change `useChat` to accept an optional service dependency for testing while
defaulting to `getChatService()`. On fetch, load
`getConversation(projectId)`. On send:

1. Clear the previous error and add the optimistic user message.
2. Save the session immediately.
3. Pass the current thread ID through the service options.
4. On the first `onMessage`, add an empty agent message; append each content
   value to that message and save the session.
5. Update `threadId` from `onThreadId`, save after the final result, and do
   not delete the user's message if the request fails.
6. Set `isTyping` false in `finally`.

- [ ] **Step 3: Connect the runtime service and error display**

Before wiring the service, add these public runtime config fields to
`nuxt.config.ts` so the service factory is type-safe:

```ts
apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000',
apiKey: process.env.NUXT_PUBLIC_API_KEY ?? '',
```

Update `getChatService()` to return one backend service created from
`useRuntimeConfig().public.apiBaseUrl` and `.apiKey`; remove the
`useMocks` branch for chat. Pass `error` from `[id].vue` to
`OrganismChatPanel`, add an optional `error` prop to `ChatPanel`, and
render a concise error banner above the composer with `role="alert"`.

- [ ] **Step 4: Run composable tests and commit**

Run: `npm test -- composables/useChat.test.ts`

Expected: PASS with the streaming and error-state assertions.

Commit:

```bash
git add services/index.ts composables/useChat.ts composables/useChat.test.ts components/organism/ChatPanel.vue pages/projects/'[id].vue'
git commit -m "feat: connect chat UI to streaming service"
```

### Task 4: Add runtime configuration and run full verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document local startup and runtime variables**

Document local startup in `README.md`, including the backend command and the
optional `NUXT_PUBLIC_API_BASE_URL` and `NUXT_PUBLIC_API_KEY` variables. Keep
the frontend's existing mock project and playground services unchanged; only
chat is forced to the backend.

- [ ] **Step 2: Run the complete verification suite**

Run:

```bash
npm test
npm run build
```

Expected: Vitest exits with zero failures and Nuxt build exits with code 0.
Inspect the output for TypeScript errors, failed route generation, or runtime
config warnings.

- [ ] **Step 3: Review the final diff and commit**

Run:

```bash
git diff --check
git status --short
git log -4 --oneline
```

Confirm only the documented frontend integration files changed, then commit:

```bash
git add README.md
git commit -m "chore: configure backend chat endpoint"
```
