# Task 3 Report: Backend Chat UI Integration

## Scope delivered

`useChat(projectId)` now restores and persists `ChatSession` state, accepts an optional `IChatService` only for tests, saves optimistic and streaming updates, retains useful partial conversation on errors, and exposes its error state to the visible chat panel. The runtime chat service is always the backend service configured through public Nuxt runtime config.

## RED / GREEN evidence

### RED

Command:

```text
npm test -- composables/useChat.test.ts
```

Initial test execution exposed a Vitest-only module-alias resolution failure for `~/services`; `useChat` runtime imports were changed to relative imports so the composable could be exercised directly.

The subsequent RED execution produced the expected behavioral failures against the old composable:

```text
Test Files  1 failed (1)
Tests  2 failed (2)

continues a saved thread and updates the agent bubble while streaming
expected "vi.fn()" to be called with arguments ... Number of calls: 0

keeps the user message and partial response when streaming fails
expected "Respuesta parcial"
received the mock service's completed response
```

This showed that the prior implementation ignored the injected service and did not consume streaming callbacks or preserve streamed partial state.

### GREEN

Focused composable verification after implementation:

```text
npm test -- composables/useChat.test.ts
Test Files  1 passed (1)
Tests  2 passed (2)
```

The stream test pauses after its first chunk and waits for the service invocation condition, then verifies the partial agent bubble before releasing the final chunk. This avoids relying on arbitrary microtask timing introduced by the required initial session save.

## Files changed

- `composables/useChat.ts`
  - Restores `ChatSession`, persists optimistic user messages before requests, applies `onThreadId` and `onMessage` callbacks, serializes saves, retains messages on failure, and accepts an optional test service.
- `composables/useChat.test.ts`
  - Covers restored/saved thread state, chunk-by-chunk agent response updates, final session persistence, error state, retained user message, and retained partial agent message.
- `services/index.ts`
  - Selects `createBackendChatService` unconditionally for chat; project and playground mock service selection remains unchanged.
- `nuxt.config.ts`
  - Adds public `apiBaseUrl` and `apiKey` runtime config fields.
- `pages/projects/[id].vue`
  - Passes composable `error` into `OrganismChatPanel`.
- `components/organism/ChatPanel.vue`
  - Renders the error banner above the composer with `role="alert"`.

## Final verification

```text
npm test
Test Files  4 passed (4)
Tests  16 passed (16)

npx vue-tsc --noEmit
exit 0

git diff --check
exit 0
```

## Self-review

- The public `useChat(projectId)` API remains unchanged; the second `IChatService` parameter is optional and test-only.
- No `threadId` field was added to `ChatStreamHandlers`; the backend service reads the thread from the session saved before the request.
- The chat service no longer has a `useMocks` branch, while project and playground service behavior is unchanged.
- The first streamed chunk creates one empty agent message, later chunks append to it, and each callback persists the latest session.
- Send failures only set the error state; neither the optimistic user message nor streamed partial response is removed.

## Concerns

No open concerns. The direct Vitest environment does not resolve Nuxt `~` runtime aliases, so `useChat` now uses equivalent relative runtime imports to keep the composable independently testable.
