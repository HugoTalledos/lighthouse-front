# Project-Agent Relationship Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect real frontend projects, chat threads, agent state, and persisted resources through one backend project identity.

**Architecture:** The frontend creates a project shell with a client-generated `thread_id`; the backend generates `project_id`, validates the project-thread relationship for every chat turn, and persists metadata/resources through the project repository. The frontend consumes the backend project contract directly and refreshes that project after agent turns so the playground renders persisted resources instead of mock data.

**Tech Stack:** FastAPI, Pydantic 2, LangGraph, Firestore repository adapter, Nuxt 4, Vue 3, TypeScript strict mode, native `fetch`, Vitest, pytest.

## Global Constraints

- The frontend generates a `thread_id` before calling `POST /projects`.
- `POST /projects` receives only `{ "thread_id": "..." }`; the backend generates `project_id`.
- The frontend uses the backend names `project_id`, `thread_ids`, `business_name`, `value_proposition`, `status`, `resources`, `created_at`, and `updated_at`.
- The agent persists `business_name` and `value_proposition` only when it has enough context.
- Every chat message includes `project_id` and `thread_id`.
- The backend rejects a thread that does not belong to the requested project.
- New projects start with `status: "in_progress"`.
- A project is `"review"` when generated resources are waiting for review/approval and `"approved"` when all required resources are approved.
- The frontend refreshes `GET /projects/{project_id}` after relevant agent turns.
- The agent uses backend services/repositories directly and never calls its own HTTP API.
- The frontend transport model does not rename `business_name` or `value_proposition` to `name` or `description`.
- No production code is written before its corresponding failing test is observed.

## Repository Roots and File Map

This project uses two Git repositories:

- Frontend: `/Users/hugotalledos/programacion/proyectos/light_house/lighthouse-front`
- Backend: `/Users/hugotalledos/programacion/proyectos/light_house/lighthouse_back`

### Backend files

| File | Responsibility |
| --- | --- |
| `src/projects/domain/models.py` | Project status and persisted project contract. |
| `src/projects/domain/status.py` | Pure aggregate-status calculation. |
| `src/projects/domain/ports.py` | Project repository operations used by API and agent. |
| `src/projects/infrastructure/persistence/firestore_repository.py` | Create, query, summary, resource, and status persistence. |
| `src/projects/infrastructure/rest/routes.py` | `POST /projects`, list, and get endpoints. |
| `src/agent/infrastructure/rest/chat_routes.py` | Validated `POST /chat` request contract. |
| `src/agent/application/chat_service.py` | Passes both IDs into the graph and emits the final project ID. |
| `src/agent/state.py` | LangGraph state containing `project_id` and `thread_id`. |
| `src/agent/graph.py` | Uses the supplied project identity; no silent project creation. |
| `src/agent/tools/project_metadata_tool.py` | Persists agent-created `business_name` and `value_proposition`. |
| `src/agent/tools/*/*_tool.py` | Persists generated resource payloads as pending. |
| `src/agent/tools/*/approve*_tool.py` | Persists approved resource payloads. |
| `src/agent/config.py` | Registers the metadata tool with the agent. |
| `src/agent/utils/prompt.py` | Tells the agent when to persist metadata. |

### Frontend files

| File | Responsibility |
| --- | --- |
| `types/project.ts` | Exact project transport type returned by the backend. |
| `services/projects/backendProjectService.ts` | HTTP project service. |
| `services/projects/backendProjectService.test.ts` | HTTP contract and error tests. |
| `services/interfaces.ts` | Project and chat service interfaces. |
| `services/index.ts` | Production service selection. |
| `composables/useProjects.ts` | Project list/create state. |
| `pages/index.vue` | Generates `thread_id`, creates a real project, and navigates. |
| `services/chat/backendChatService.ts` | Sends `project_id` and `thread_id`. |
| `composables/useChat.ts` | Restores the initial thread and manages the turn lifecycle. |
| `pages/projects/[id].vue` | Loads the backend project and refreshes it after chat turns. |
| `components/molecule/ProjectCard.vue` | Renders backend field names and dates. |
| `components/cell/ProjectStatusBadge.vue` | Renders `in_progress`, `review`, and `approved`. |
| `components/organism/PlaygroundSidebar.vue` | Renders persisted project resources only. |
| `services/projects/projectResourceView.ts` | Maps backend resource payloads to existing display components. |

---

### Task 1: Add the backend project status contract and pure status rules

**Files:**
- Create: `lighthouse_back/src/projects/domain/status.py`
- Create: `lighthouse_back/tests/unit/projects/test_status.py`
- Modify: `lighthouse_back/src/projects/domain/models.py`
- Modify: `lighthouse_back/tests/unit/domain/test_models.py`

**Interfaces:**
- Produces `ProjectStatus = Literal["in_progress", "review", "approved"]`.
- Produces `derive_project_status(resources: dict[ResourceKind, ResourceState]) -> ProjectStatus`.
- `Project.status` defaults to `"in_progress"`.

- [ ] **Step 1: Write failing status tests**

```python
from datetime import datetime, timezone

from src.projects.domain.models import Project, ResourceState
from src.projects.domain.status import derive_project_status


def test_new_project_starts_in_progress():
    project = Project(
        project_id="p-1", thread_ids=["t-1"],
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
    )

    assert project.status == "in_progress"


def test_generated_pending_resource_puts_project_in_review():
    resources = {
        "landing": ResourceState(status="pending", payload={"preview_url": "https://preview"}),
        "campaign": ResourceState(),
        "images": ResourceState(),
    }

    assert derive_project_status(resources) == "review"


def test_all_required_resources_approved_puts_project_in_approved():
    resources = {
        kind: ResourceState(status="approved", payload={"ready": True})
        for kind in ("landing", "campaign", "images")
    }

    assert derive_project_status(resources) == "approved"
```

Run from the backend repository:

```bash
pytest tests/unit/projects/test_status.py tests/unit/domain/test_models.py -q
```

Expected: FAIL because `Project.status` and `derive_project_status` do not yet exist.

- [ ] **Step 2: Implement the minimal domain contract**

Add the status literal and field to `Project`. Implement the pure rule with these exact branches:

```python
def derive_project_status(resources: dict[ResourceKind, ResourceState]) -> ProjectStatus:
    if all(resources[kind].status == "approved" for kind in REQUIRED_RESOURCES):
        return "approved"
    if any(state.payload and state.status == "pending" for state in resources.values()):
        return "review"
    return "in_progress"
```

Use `REQUIRED_RESOURCES = ("landing", "campaign", "images")` so the aggregate rule has one source of truth.

- [ ] **Step 3: Run the focused tests**

```bash
pytest tests/unit/projects/test_status.py tests/unit/domain/test_models.py -q
```

Expected: PASS.

- [ ] **Step 4: Commit the domain contract**

```bash
git add src/projects/domain/models.py src/projects/domain/status.py tests/unit/projects/test_status.py tests/unit/domain/test_models.py
git commit -m "feat: add project status contract"
```

### Task 2: Create projects from a thread and expose the backend contract

**Files:**
- Create: `lighthouse_back/tests/unit/projects/test_routes.py`
- Modify: `lighthouse_back/src/projects/domain/ports.py`
- Modify: `lighthouse_back/src/projects/infrastructure/persistence/firestore_repository.py`
- Modify: `lighthouse_back/src/projects/infrastructure/rest/routes.py`
- Modify: `lighthouse_back/src/main.py`

**Interfaces:**
- `ProjectRepositoryPort.create_for_thread(thread_id: str) -> Project`.
- `POST /projects` accepts `{ "thread_id": string }` and returns the serialized `Project`.
- Repeating `POST /projects` with an already-associated thread returns the existing project instead of creating a duplicate.

- [ ] **Step 1: Write failing route tests**

Use a small in-memory repository double in `test_routes.py` so the HTTP contract is tested without Firebase:

```python
class InMemoryProjectRepository:
    def __init__(self):
        self.projects = {}

    def create_for_thread(self, thread_id):
        existing = next((p for p in self.projects.values() if thread_id in p.thread_ids), None)
        if existing:
            return existing
        now = datetime.now(timezone.utc)
        project = Project(
            project_id=f"project-{len(self.projects) + 1}", thread_ids=[thread_id],
            created_at=now, updated_at=now,
        )
        self.projects[project.project_id] = project
        return project

    def get(self, project_id):
        return self.projects.get(project_id)

    def list(self):
        return list(self.projects.values())
```

The helper may expose `with_project(project_id, thread_ids)` as a classmethod for the chat validation tests in Task 3. It must implement the same `get`, `list`, and `create_for_thread` methods used by the routes.

```python
def test_create_project_generates_project_id_and_starts_in_progress(monkeypatch):
    repo = InMemoryProjectRepository()
    client = TestClient(create_app(repo=repo, graph=FakeGraph()))

    response = client.post("/projects", json={"thread_id": "thread-1"})

    assert response.status_code == 201
    body = response.json()
    assert body["project_id"]
    assert body["thread_ids"] == ["thread-1"]
    assert body["business_name"] is None
    assert body["value_proposition"] is None
    assert body["status"] == "in_progress"


def test_create_project_is_idempotent_for_an_existing_thread():
    repo = InMemoryProjectRepository()
    client = TestClient(create_app(repo=repo, graph=FakeGraph()))

    first = client.post("/projects", json={"thread_id": "thread-1"}).json()
    second = client.post("/projects", json={"thread_id": "thread-1"}).json()

    assert second["project_id"] == first["project_id"]
    assert len(repo.projects) == 1
```

Run:

```bash
pytest tests/unit/projects/test_routes.py -q
```

Expected: FAIL because `POST /projects` and `create_for_thread` do not exist.

- [ ] **Step 2: Implement repository creation**

Add `create_for_thread` to the port. In the Firestore adapter, first query `thread_ids` with `array_contains`; return the existing project when found. Otherwise create a UUID, UTC timestamps, default resources, and `status="in_progress"`. Preserve `get_or_create_by_thread` only as a compatibility wrapper during the migration.

- [ ] **Step 3: Implement the request model and route**

Add a Pydantic request model with a required, non-blank `thread_id` and the existing maximum length convention. Mount:

```python
@router.post("/projects", status_code=201)
def create_project(request: CreateProjectRequest) -> dict:
    project = repo.create_for_thread(request.thread_id)
    return project.model_dump(mode="json")
```

Keep `GET /projects` and `GET /projects/{project_id}` returning the same serialized model, now including `status`.

- [ ] **Step 4: Run backend project tests and existing API tests**

```bash
pytest tests/unit/projects/test_routes.py tests/unit/test_main.py -q
```

Expected: PASS.

- [ ] **Step 5: Commit the project API**

```bash
git add src/projects src/main.py tests/unit/projects/test_routes.py tests/unit/test_main.py
git commit -m "feat: create projects from chat threads"
```

### Task 3: Require and validate project identity in chat

**Files:**
- Create: `lighthouse_back/tests/unit/agent/test_chat_service.py`
- Modify: `lighthouse_back/src/agent/infrastructure/rest/chat_routes.py`
- Modify: `lighthouse_back/src/agent/application/chat_service.py`
- Modify: `lighthouse_back/src/agent/state.py`
- Modify: `lighthouse_back/src/agent/graph.py`
- Modify: `lighthouse_back/src/main.py`
- Modify: `lighthouse_back/tests/unit/test_main.py`
- Modify: `lighthouse_back/tests/unit/agent/test_graph.py`

**Interfaces:**
- `ChatRequest` requires `project_id`, `thread_id`, and `message`.
- `build_chat_router(graph, repo)` validates project-thread membership before returning a stream.
- `stream_chat(graph, message, project_id, thread_id)` starts the graph with both IDs.

- [ ] **Step 1: Write failing request and propagation tests**

Add route tests for the required field and invalid association:

Reuse the `InMemoryProjectRepository` helper from Task 2 and the existing
`FakeGraph`/`_client` setup in `tests/unit/test_main.py`; update that setup to
pass the repository into `create_app` so route validation exercises the same
dependency as production.

```python
def test_chat_requires_project_id(monkeypatch):
    client = _client(monkeypatch)

    response = client.post("/chat", json={"thread_id": "t-1", "message": "hola"})

    assert response.status_code == 422


def test_chat_rejects_thread_not_belonging_to_project(monkeypatch):
    repo = InMemoryProjectRepository.with_project("p-1", ["other-thread"])
    client = TestClient(create_app(repo=repo, graph=FakeGraph()))

    response = client.post("/chat", json={
        "project_id": "p-1", "thread_id": "t-1", "message": "hola",
    })

    assert response.status_code == 409
```

Add a stream test that captures the graph input and asserts:

```python
assert captured_state == {
    "messages": [{"role": "user", "content": "hola"}],
    "thread_id": "t-1",
    "project_id": "p-1",
}
```

Run:

```bash
pytest tests/unit/agent/test_chat_service.py tests/unit/test_main.py tests/unit/agent/test_graph.py -q
```

Expected: FAIL because the request does not require `project_id` and the stream does not pass it to the graph.

- [ ] **Step 2: Implement route validation and state propagation**

Make `thread_id` required in `ChatRequest`; remove UUID generation in the route. Look up the project before creating `StreamingResponse`. Return `404` for an unknown project and `409` for a thread that is not in `project.thread_ids`.

Change `stream_chat` to accept both IDs, emit `start_event(thread_id)`, and initialize the graph with both IDs. Keep `done_event(thread_id, project_id)` intact.

Remove the missing-project fallback from `graph.py`; the chatbot node must use `state["project_id"]` directly. Keep the thread in LangGraph config for checkpoint memory.

- [ ] **Step 3: Run focused and full backend tests**

```bash
pytest tests/unit/agent/test_chat_service.py tests/unit/test_main.py tests/unit/agent/test_graph.py -q
pytest -q
```

Expected: PASS with no fallback project creation assertions remaining.

- [ ] **Step 4: Commit chat identity enforcement**

```bash
git add src/agent src/main.py tests/unit/agent tests/unit/test_main.py
git commit -m "feat: bind chat turns to projects"
```

### Task 4: Persist agent metadata, generated resources, and aggregate status

**Files:**
- Create: `lighthouse_back/src/agent/tools/project_metadata_tool.py`
- Create: `lighthouse_back/tests/test_project_metadata_tool.py`
- Create: `lighthouse_back/tests/unit/projects/test_repository_status.py`
- Modify: `lighthouse_back/src/agent/config.py`
- Modify: `lighthouse_back/src/agent/utils/prompt.py`
- Modify: `lighthouse_back/src/agent/tools/image_builder/image_builder_tool.py`
- Modify: `lighthouse_back/src/agent/tools/campaign_builder/campaign_builder_tool.py`
- Modify: `lighthouse_back/src/agent/tools/landing_builder/landing_builder_tool.py`
- Modify: `lighthouse_back/src/projects/infrastructure/persistence/firestore_repository.py`
- Modify: `lighthouse_back/src/projects/domain/ports.py`
- Modify: `lighthouse_back/tests/test_image_builder_tool.py`
- Modify: `lighthouse_back/tests/test_campaign_builder_tool.py`
- Modify: `lighthouse_back/tests/test_landing_builder_tool.py`

**Interfaces:**
- `update_project_metadata_tool(business_name: str, value_proposition: str, state: InjectedState) -> dict`.
- Builder tools call `update_resource(project_id, resource, payload, "pending")` only after successful generation.
- Approval tools continue calling `update_resource(..., "approved")`.
- The repository recalculates project status after every resource update.

- [ ] **Step 1: Write failing metadata and resource persistence tests**

Add a metadata test:

```python
async def test_metadata_tool_persists_summary_for_the_project():
    with patch("src.agent.tools.project_metadata_tool.get_project_repository") as factory:
        repo = MagicMock()
        factory.return_value = repo

        from src.agent.tools.project_metadata_tool import update_project_metadata_tool
        result = await update_project_metadata_tool.ainvoke({
            "business_name": "Acme",
            "value_proposition": "Ahorra tiempo",
            "state": {"project_id": "p-1"},
        })

    assert result == {"status": "success", "project_id": "p-1"}
    repo.upsert_summary.assert_called_once_with("p-1", "Acme", "Ahorra tiempo")
```

Extend builder tests so successful results assert the pending payload:

```python
mock_repo.update_resource.assert_called_once_with(
    "proj-1", "campaign", {"config": _canned_campaign().model_dump(mode="json")}, "pending",
)
```

Add repository status tests for pending resource → `review` and all three approved → `approved`.

Run the focused tests and confirm they fail because builders only persist summaries and no metadata tool exists.

- [ ] **Step 2: Implement the metadata tool and register it**

Create the tool using `InjectedState`, validate both strings as non-blank, call `get_project_repository().upsert_summary`, and return a serializable `{ "status": "success", "project_id": project_id }`. Add it to `src/agent/config.py` before the builder tools.

Update the system prompt: after the four shared discovery fields are known and before any builder call, invoke the metadata tool once; continue asking questions if either persisted field is not reliable.

- [ ] **Step 3: Persist successful builder payloads as pending**

Use these exact payloads:

```python
# images
{"creatives": serialized_creatives_without_image_bytes}

# campaign
{"config": result.campaign.model_dump(mode="json")}

# landing
{"composition": result.composition, "preview_url": result.preview_url}
```

Do not write a resource for failed generation. Keep the existing summary update where it is useful, but metadata persistence must no longer depend on a builder running.

- [ ] **Step 4: Recalculate status inside resource persistence**

When Firestore writes a resource, read the current resource map, apply the new payload/status, derive the aggregate status, and write `resources.<kind>.*` and `status` together. Keep `upsert_summary` from changing status. Ensure approval tools still preserve their current approved payload behavior.

- [ ] **Step 5: Run backend tool and status tests**

```bash
pytest tests/test_project_metadata_tool.py tests/test_image_builder_tool.py tests/test_campaign_builder_tool.py tests/test_landing_builder_tool.py tests/unit/projects/test_repository_status.py -q
pytest -q
```

Expected: PASS.

- [ ] **Step 6: Commit agent persistence**

```bash
git add src/agent src/projects tests/test_project_metadata_tool.py tests/test_image_builder_tool.py tests/test_campaign_builder_tool.py tests/test_landing_builder_tool.py tests/unit/projects
git commit -m "feat: persist agent metadata and resources"
```

### Task 5: Add the real frontend project service and backend-shaped types

**Files:**
- Create: `lighthouse-front/services/projects/backendProjectService.ts`
- Create: `lighthouse-front/services/projects/backendProjectService.test.ts`
- Modify: `lighthouse-front/types/project.ts`
- Modify: `lighthouse-front/services/interfaces.ts`
- Modify: `lighthouse-front/services/index.ts`

**Interfaces:**
- `BackendProjectServiceConfig = { baseUrl: string; apiKey?: string; fetch?: typeof globalThis.fetch }`.
- `createBackendProjectService(config: BackendProjectServiceConfig): IProjectService`.
- `IProjectService.createProject(threadId: string): Promise<Project>`.
- `Project` exactly contains `project_id`, `thread_ids`, nullable `business_name`/`value_proposition`, `status`, ISO date strings, and typed resource states.

- [ ] **Step 1: Write failing project-service tests**

```ts
const projectJson = {
  project_id: 'project-1', thread_ids: ['thread-1'],
  business_name: null, value_proposition: null, status: 'in_progress',
  created_at: '2026-08-07T12:00:00Z', updated_at: '2026-08-07T12:00:00Z',
  resources: {
    landing: { status: 'pending', payload: {} },
    campaign: { status: 'pending', payload: {} },
    images: { status: 'pending', payload: {} },
  },
}

function responseFetcher(body: unknown) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }))
}

it('creates a project with only the thread ID', async () => {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(projectJson), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  }))
  const service = createBackendProjectService({ baseUrl: 'http://localhost:8000/', fetch: fetcher })

  await service.createProject('thread-1')

  expect(fetcher).toHaveBeenCalledWith('http://localhost:8000/projects', expect.objectContaining({
    method: 'POST',
    body: JSON.stringify({ thread_id: 'thread-1' }),
  }))
})

it('uses backend project fields without inventing UI aliases', async () => {
  const service = createBackendProjectService({ fetch: responseFetcher(projectJson) })

  await expect(service.getProject('project-1')).resolves.toMatchObject({
    project_id: 'project-1', business_name: null, value_proposition: null,
    status: 'in_progress', resources: expect.any(Object),
  })
})
```

Also test non-2xx responses produce an error containing the HTTP status.

Run: `npm test -- services/projects/backendProjectService.test.ts`

Expected: FAIL because the service and backend-shaped type do not exist.

- [ ] **Step 2: Implement the transport model and service**

Define resource payloads as JSON-compatible backend values, with resource-specific optional fields for landing, images, and campaign. Normalize trailing slashes, send `Content-Type` and optional `x-api-key`, and implement `listProjects`, `getProject`, and `createProject`. Do not parse dates into `Date` in the transport model.

- [ ] **Step 3: Select the real project service**

Make `getProjectService()` build the backend service from `useRuntimeConfig().public.apiBaseUrl` and `apiKey`. Do not route project creation/listing through `mockProjectService` in production. Remove `updateProjectStatus` from `IProjectService` because the agreed backend contract has no generic status mutation endpoint.

- [ ] **Step 4: Run focused frontend tests and commit**

```bash
npm test -- services/projects/backendProjectService.test.ts
git add services/projects types/project.ts services/interfaces.ts services/index.ts
git commit -m "feat: connect frontend projects to backend"
```

Expected: PASS.

### Task 6: Wire project creation and backend-shaped project UI

**Files:**
- Create: `lighthouse-front/composables/useProjects.test.ts`
- Modify: `lighthouse-front/composables/useProjects.ts`
- Modify: `lighthouse-front/pages/index.vue`
- Modify: `lighthouse-front/pages/projects/[id].vue`
- Modify: `lighthouse-front/components/molecule/ProjectCard.vue`
- Modify: `lighthouse-front/components/organism/ProjectGrid.vue`
- Modify: `lighthouse-front/components/cell/ProjectStatusBadge.vue`

**Interfaces:**
- `useProjects().createProject(threadId: string)` calls the real project service and prepends the returned project.
- `pages/index.vue` creates `thread_id` with `crypto.randomUUID()` before navigation.
- Detail page stores the loaded backend project and uses `project_id` as the route identity.

- [ ] **Step 1: Write the failing composable test**

```ts
function projectFixture(overrides: Partial<Project> = {}): Project {
  return {
    project_id: 'project-1',
    thread_ids: ['thread-1'],
    business_name: null,
    value_proposition: null,
    status: 'in_progress',
    created_at: '2026-08-07T12:00:00Z',
    updated_at: '2026-08-07T12:00:00Z',
    resources: {
      landing: { status: 'pending', payload: {} },
      campaign: { status: 'pending', payload: {} },
      images: { status: 'pending', payload: {} },
    },
    ...overrides,
  } as Project
}

it('creates a project using a generated thread ID and stores the backend project', async () => {
  const project = projectFixture({ project_id: 'project-1', thread_ids: ['thread-1'] })
  const service = {
    listProjects: vi.fn(),
    getProject: vi.fn(),
    createProject: vi.fn().mockResolvedValue(project),
  } satisfies IProjectService
  const projects = useProjects(service)

  await expect(projects.createProject('thread-1')).resolves.toEqual(project)

  expect(service.createProject).toHaveBeenCalledWith('thread-1')
  expect(projects.projects.value).toEqual([project])
})
```

Run: `npm test -- composables/useProjects.test.ts`

Expected: FAIL because the composable still accepts `name`/`description` and the service dependency is not injectable.

- [ ] **Step 2: Implement the real creation flow**

Allow `useProjects(service = getProjectService())`. Change `createProject` to accept only `threadId`. In `pages/index.vue`, generate the ID at click time:

```ts
async function handleCreateProject() {
  const project = await createProject(crypto.randomUUID())
  await router.push(`/projects/${project.project_id}`)
}
```

- [ ] **Step 3: Adapt project components to backend fields**

Replace `project.id`, `project.name`, `project.description`, `project.updatedAt`, and old status values with `project.project_id`, `project.business_name`, `project.value_proposition`, `project.updated_at`, and the three backend statuses. Format `updated_at` only inside the card. Display a neutral title such as `Proyecto sin nombre` while `business_name` is null; do not persist that placeholder.

- [ ] **Step 4: Remove mock approval behavior from the detail page**

Remove the `approveProject`/`updateProjectStatus` call path. The agent approval tools remain conversational. Keep the project status badge driven by the loaded backend project.

- [ ] **Step 5: Run typecheck/build and commit**

```bash
npm test -- composables/useProjects.test.ts
npx vue-tsc --noEmit
git add composables/useProjects.ts composables/useProjects.test.ts pages/index.vue pages/projects/[id].vue components types
git commit -m "feat: create backend projects from frontend"
```

Expected: PASS.

### Task 7: Send project and thread identity with every chat turn

**Files:**
- Create: `lighthouse-front/composables/useChat.test.ts` test cases if not already present in the current file.
- Modify: `lighthouse-front/services/chat/backendChatService.ts`
- Modify: `lighthouse-front/services/chat/backendChatService.test.ts`
- Modify: `lighthouse-front/composables/useChat.ts`
- Modify: `lighthouse-front/pages/projects/[id].vue`

**Interfaces:**
- `backendChatService.sendMessage(projectId, content, options)` posts `{ project_id: projectId, thread_id: options.threadId, message: content }`.
- `useChat.fetchMessages(initialThreadId?: string)` uses the stored local thread when present and otherwise falls back to the project’s `thread_ids[0]`.

- [ ] **Step 1: Write failing chat-contract tests**

Update the existing request assertion:

```ts
expect(fetcher).toHaveBeenCalledWith('http://localhost:8000/chat', expect.objectContaining({
  body: JSON.stringify({
    project_id: 'p-1', message: 'Hola', thread_id: null,
  }),
}))
```

Add a test that `fetchMessages('thread-1')` followed by `sendMessage('Hola')` sends `thread_id: 'thread-1'` when local storage has no saved session.

Run: `npm test -- services/chat/backendChatService.test.ts composables/useChat.test.ts`

Expected: FAIL because the request omits `project_id` and the initial project thread is not restored.

- [ ] **Step 2: Implement the chat request and initial thread fallback**

Add `project_id` to the JSON body. Change `fetchMessages(initialThreadId)` so the restored session wins when it contains a thread; otherwise use the passed project thread. Keep saving the selected thread in the local chat session.

- [ ] **Step 3: Load the project before restoring chat on the detail page**

Change the detail page mount sequence to load `GET /projects/{id}` first, then call `fetchMessages(project.value?.thread_ids[0])`. Do not start a chat turn until both the project and local conversation restoration are ready.

- [ ] **Step 4: Refresh the backend project after a completed turn**

Wrap the page send handler:

```ts
async function handleSend(content: string) {
  await sendMessage(content)
  project.value = await getProjectService().getProject(projectId)
}
```

Bind `@send="handleSend"` and update the project only after `sendMessage` resolves. A failed turn should leave the last known project visible and display the existing chat error.

- [ ] **Step 5: Run frontend chat tests and commit**

```bash
npm test -- services/chat/backendChatService.test.ts composables/useChat.test.ts
npx vue-tsc --noEmit
git add services/chat/backendChatService.ts services/chat/backendChatService.test.ts composables/useChat.ts composables/useChat.test.ts pages/projects/[id].vue
git commit -m "feat: bind chat turns to frontend projects"
```

Expected: PASS.

### Task 8: Render persisted backend resources instead of the mock playground

**Files:**
- Create: `lighthouse-front/services/projects/projectResourceView.ts`
- Create: `lighthouse-front/services/projects/projectResourceView.test.ts`
- Modify: `lighthouse-front/types/project.ts`
- Modify: `lighthouse-front/components/organism/PlaygroundSidebar.vue`
- Modify: `lighthouse-front/pages/projects/[id].vue`
- Modify: `lighthouse-front/components/molecule/CampaignCreativesGallery.vue`
- Modify: `lighthouse-front/components/molecule/CampaignConfigForm.vue`
- Modify: `lighthouse-front/services/interfaces.ts`
- Modify: `lighthouse-front/services/index.ts`

**Interfaces:**
- `toGeneratedPlan(project: Project): GeneratedPlan | null` maps only populated backend resource payloads to the existing display components.
- Empty or failed resources produce `null`/empty sections rather than mock values.

- [ ] **Step 1: Write failing resource-mapping tests**

```ts
const project: Project = {
  project_id: 'project-1',
  thread_ids: ['thread-1'],
  business_name: 'Acme',
  value_proposition: 'Ahorra tiempo',
  status: 'review',
  created_at: '2026-08-07T12:00:00Z',
  updated_at: '2026-08-07T12:00:00Z',
  resources: {
    landing: { status: 'pending', payload: { preview_url: 'https://preview', composition: {} } },
    images: { status: 'pending', payload: { creatives: [
      { variant_index: 0, storage_url: 'https://img/0.png', headline: 'Ahorra tiempo', cta_text: 'Prueba' },
    ] } },
    campaign: { status: 'pending', payload: { config: {
      name: 'Acme', objective: 'OUTCOME_TRAFFIC', ad_sets: [],
    } } },
  },
}

it('maps persisted backend resources to the playground view', () => {
  const plan = toGeneratedPlan(project)

  expect(plan?.landing).toEqual({ url: 'https://preview', title: 'Acme' })
  expect(plan?.creatives[0]).toMatchObject({ id: '0', imageUrl: 'https://img/0.png' })
})

it('does not fabricate a plan when resources are empty', () => {
  const emptyProject: Project = {
    ...project,
    business_name: null,
    value_proposition: null,
    status: 'in_progress',
    resources: {
      landing: { status: 'pending', payload: {} },
      campaign: { status: 'pending', payload: {} },
      images: { status: 'pending', payload: {} },
    },
  }

  expect(toGeneratedPlan(emptyProject)).toBeNull()
})
```

Run: `npm test -- services/projects/projectResourceView.test.ts`

Expected: FAIL because the mapper and backend resource types do not exist.

- [ ] **Step 2: Implement backend-shaped resource types and mapper**

Map `landing.payload.preview_url`, image `creatives[].storage_url`/`headline`, and campaign `config` fields. The mapper may derive display-only values such as a creative ID or campaign summary, but it must never insert the fixed mock URL, sample images, or NutriRecetas copy. Return `null` when no resource payload contains displayable data.

- [ ] **Step 3: Make the sidebar consume the loaded project**

Replace `usePlayground().fetchPlan()` with a computed plan from `project.resources`. Keep the empty-state copy until the backend returns populated resources. Show `project.status` and remove the mock `approvePlan` action; instruct users to approve through the agent conversation while resource approval remains agent-driven.

- [ ] **Step 4: Remove production mock selection**

`getPlaygroundService()` must not be called by the project detail page. The mock files may remain for isolated tests, but no production route may load `mockPlaygroundService` or its fixed `defaultPlan`.

- [ ] **Step 5: Run resource tests and build**

```bash
npm test -- services/projects/projectResourceView.test.ts
npx vue-tsc --noEmit
npm run build
git add services/projects/projectResourceView.ts services/projects/projectResourceView.test.ts types/project.ts components pages/projects/[id].vue services/interfaces.ts services/index.ts
git commit -m "feat: render persisted project resources"
```

Expected: PASS and a successful Nuxt build.

### Task 9: Full verification and integration handoff

**Files:**
- Modify only tests or documentation if a verification finding requires a focused correction.

- [ ] **Step 1: Run backend verification from `lighthouse_back`**

```bash
pytest -q
```

Expected: all backend tests pass, including project creation, project-thread validation, metadata persistence, resource persistence, and status transitions.

- [ ] **Step 2: Run frontend verification from `lighthouse-front`**

```bash
npm test
npx vue-tsc --noEmit
npm run build
```

Expected: all frontend tests pass, TypeScript reports no errors, and Nuxt builds successfully.

- [ ] **Step 3: Inspect production mock references**

```bash
rg -n "mockProjectService|mockPlaygroundService|defaultPlan|NutriRecetas|project\.name|project\.description|project\.id" \
  --glob '!package-lock.json' --glob '!docs/**' .
```

Expected: remaining mock references are limited to mock implementations/tests and no production page/service path selects them.

- [ ] **Step 4: Review both repository diffs**

```bash
git status --short
git diff --check HEAD~1
```

Confirm the pre-existing modification to `lighthouse_back/config/llm.dev.json` is preserved and not included in any feature commit.

## Self-Review Checklist

- [x] Every approved design decision maps to at least one task.
- [x] The project creation contract is explicit and idempotent.
- [x] The chat request carries and validates both identifiers.
- [x] Metadata timing and persistence are explicit.
- [x] Resource persistence and aggregate status transitions are explicit.
- [x] The frontend does not invent backend project aliases.
- [x] Mock playground data is excluded from production rendering.
- [x] Each implementation task starts with a failing test.
- [x] Every task has concrete files, commands, expected outcomes, and commit boundaries.
