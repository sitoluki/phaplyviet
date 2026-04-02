# Legal AI Vietnam - MVP Planning Repo

This repository currently contains planning and execution documentation only.
No full product implementation is included in this step.

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
- Frontend/API: Next.js.
- Primary DB: PostgreSQL.
- Vector retrieval: pgvector.
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

## Non-goals in this step
- No production feature implementation.
- No final UI polish or brand design.
- No advanced marketplace or enterprise functionality.
