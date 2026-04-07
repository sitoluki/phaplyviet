# MVP Architecture (Practical, Small-Team)

## 0) Current implementation vs target (this repo)

| Area | Target (blueprint / below) | Status in code today |
|------|---------------------------|----------------------|
| Public web | Next.js UI + content/search/chat | **Not started** (no `apps/web`). |
| Answer API | Persisted answers + citations | **Yes** — `apps/api`: `POST /api/retrieval/context`, sessions, feedback events. |
| Retrieval | Hybrid lexical + vector + rerank | **Lexical only** — `search_legal_chunks` / `get_answer_context_bundle` (PostgreSQL FTS). |
| Embeddings | Chunk vectors in pgvector | **Schema ready** (`embedding` column, extension in migrations); **no** TS job to populate vectors. |
| Admin | Dashboards + tools | **REST only** — analytics + ingest overview/jobs/errors; **no** admin UI. |

The sections below describe the **end-state** architecture; keep the table above as the source of truth for gaps.

## 1) Goals and constraints
- Build a legally safer MVP fast, without overbuilding.
- Prioritize legal corpus integrity and citation traceability.
- Keep architecture operable by a small startup team.

## 2) Stack (required)
- Next.js: public web app + lightweight API endpoints (**planned**; API today is Express under `apps/api`).
- PostgreSQL: primary relational storage.
- pgvector: embedding vectors for legal chunk retrieval (**extension present in migrations; embedding pipeline TBD**).
- Background jobs: ingestion, parsing, chunking, embedding, re-index.
- Object storage: immutable raw snapshots and parse artifacts.

## 3) High-level components
1. Web app (Next.js)
- Public content pages, legal search UI, chat UI, pricing, disclaimer pages.
- Server actions/API routes for user requests.

2. Application DB (PostgreSQL + pgvector)
- User/account/subscription tables.
- Legal corpus normalized tables.
- Chunk and vector indexes.
- Retrieval and answer audit logs.

3. Worker service (background jobs)
- Scheduled source discovery.
- Fetch and snapshot raw legal documents.
- Parse + normalize section hierarchy.
- Chunk + embed + index.
- Re-ingest changed documents.

4. Object storage
- Raw source snapshots (html/pdf/text) as immutable artifacts.
- Parser intermediate JSON for reproducibility.

5. AI orchestration layer
- Retrieval pipeline (target: hybrid lexical + vector + rerank; **current: FTS + guardrails in `packages/db` / `packages/ai`**).
- Prompt assembly from approved evidence only.
- Answer guardrails + citation mapping + fallback behavior.

## 4) Request flow (chat)
1. User question received in API (today: Express; target: Next.js route).
2. Normalize and classify intent/risk.
3. Retrieve top legal chunks (**today: PostgreSQL full-text**; target: hybrid search).
4. Score confidence and apply guardrail policy.
5. Build evidence-constrained prompt.
6. Generate answer with mandatory citation IDs.
7. Persist answer log, retrieval refs, and feedback event hooks.

## 5) Ingestion flow (background)
1. Scheduler discovers source updates.
2. Fetch source and save immutable raw snapshot.
3. Detect delta via checksum/version metadata.
4. Parse to normalized legal structure.
5. Build section tree and chunks.
6. Generate embeddings and update pgvector index.
7. Mark prior document versions superseded when applicable.

## 6) Suggested minimal deployment model
- Next.js app on one web platform deployment.
- One PostgreSQL instance with pgvector enabled.
- One worker process/cron runner.
- One object storage bucket with lifecycle policy.

## 7) Data quality and safety controls
- Parser validation rules before indexing.
- Confidence threshold for uncertain retrieval.
- Disallow answer generation without evidence chunks.
- Traceability check: answer citation -> chunk -> section -> source file.
- Daily ingest health dashboard + alerting for failures.

## 8) Assumptions to validate early
- Assumption B1: Source formats are parseable with stable adapters.
- Assumption B2: Hybrid retrieval latency can stay <2s for MVP corpus size.
- Assumption B3: Legal reviewer can audit top traffic answer clusters weekly.

## 9) What not to build yet
- Distributed microservices per domain.
- Real-time marketplace matching.
- Complex workflow engines.
- Multi-tenant enterprise controls.
