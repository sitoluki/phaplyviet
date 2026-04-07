# Legal AI Vietnam

This repository contains **product docs** plus a **working backend foundation**: legal corpus schema and migrations, ingestion worker (labor-law pilot), PostgreSQL-backed **lexical** retrieval, guardrails, and a small **Express API** (`apps/api`) for legal answers with citation traceability. A **public Next.js web app** is not in the tree yet (see `TASKS.md` Phase 7).

## Product summary (from blueprint source of truth)

### Target users
- Citizens with common legal questions (land, labor, family, civil procedures).
- Small business owners and household businesses needing practical legal guidance.
- Basic HR and workers with labor/BHXH questions.
- Users with complex cases that require referral to real lawyers.

### Main jobs-to-be-done
- Understand legal rights and obligations in plain Vietnamese.
- Find legal basis quickly (law article/clause and source document).
- Get practical next-step guidance and document checklist.
- Know when to escalate to a licensed lawyer.

### Scope priorities
- P0 (must-have MVP): content hub, legal search, AI Q&A with citation, basic auth/quota, safety pages, event tracking.
- P1 (within 6 months): chat history, follow-up suggestions, subscription/payments, calculators, legal updates feed, PDF export.
- P2 (optional): lawyer marketplace features, affiliate/referral expansion, English support, lightweight B2B workspace.

### Core risks for Vietnam legal AI
- Wrong answer or fabricated citation causing trust and legal risk.
- Outdated legal corpus after law changes.
- Weak retrieval for Vietnamese legal phrasing and terminology.
- Misuse for high-risk disputes or unlawful intent.
- Poor legal review bandwidth in early-stage team.

## MVP architecture direction
- **Today:** TypeScript monorepo — `apps/api` (Express), `apps/worker`, `packages/db`, `packages/legal-core`, `packages/ai`.
- **Planned public product:** Next.js app (UI + routes) — to be added under `apps/web` when Phase 7 starts.
- Primary DB: PostgreSQL (migrations enable **pgvector**; embeddings and hybrid search are **not** wired in application code yet).
- Background jobs: ingestion + normalization + indexing workers.
- Object storage: raw legal source artifacts (html/pdf/text snapshots) and parser outputs.

See docs:
- `docs/architecture.md`
- `docs/legal-corpus-plan.md`
- `TASKS.md`
- `AGENTS.md`

## Explicit assumptions
- Assumption A1: Initial legal source ingestion starts from public official sources listed in blueprint.
- Assumption A2: Team can support daily ingest checks and weekly legal QA review.
- Assumption A3: MVP starts with 1-2 legal domains for depth, while keeping taxonomy ready for 4 domains.

## Non-goals (current scope)
- No public marketing site or authenticated user-facing UI (no `apps/web` yet).
- No embedding generation pipeline or hybrid vector retrieval in production paths yet.
- No advanced marketplace or enterprise functionality.
