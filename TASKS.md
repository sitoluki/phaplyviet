# TASKS.md

Planning checklist focused on legal corpus quality first.

## Completed in this step
- [x] Lock pilot domain to labor law only.
- [x] Lock curated official-source-only intake strategy.
- [x] Define explicit enums for legal status, source type, section type, ingest status, and parse status.
- [x] Define deterministic ID strategy for legal documents, section path keys, and chunks.
- [x] Add retention notes for raw snapshots and parse artifacts.
- [x] Create legal corpus schema and migration foundation.
- [x] Create ingestion skeleton and parser interfaces.
- [x] Create traceability and idempotency utilities.
- [x] Add documentation for data model and ingestion flow.
- [x] Add foundation tests for migration sanity, citation traceability, and idempotent ingestion.
- [x] Add structured labor-law parsing pipeline for curated local samples.
- [x] Add article/clause/point-aware chunk generation.
- [x] Add parser warnings, confidence scoring, and unparsed fragment capture.
- [x] Add local sample fixtures and generated parsed/chunk examples.
- [x] Add parsing and chunking strategy docs.
- [x] Add sample parsing CLI for one/all/inspect flows.
- [x] Add parser hierarchy, chunk traceability, and no-loss parsing tests.

## Phase 0 - Repo foundation
- [x] Initialize minimal workspace structure for legal corpus foundation (`apps/worker`, `packages/*`, `docs`, `tests`).
- [x] Configure TypeScript, linting, and test runner.
- [ ] Add environment templates for local/staging/production.
- [ ] Set up PostgreSQL + pgvector extensions in development.
- [ ] Configure object storage bucket conventions for raw legal sources.
- [ ] Add baseline observability (structured logs, error tracking hooks).

## Phase 1 - Legal corpus and data model
- [x] Create schema for `source_document` equivalent raw snapshot and source registry records.
- [x] Create schema for `legal_document` (normalized canonical doc record).
- [x] Create schema for section hierarchy (`part`, `chapter`, `section`, `article`, `clause`, `point`, `heading_title`, `plain_text`).
- [x] Create schema for `document_chunk` with embedding and lexical fields.
- [x] Create schema for traceability records linking answer refs to chunk + section + source.
- [x] Add versioning fields for effective/expiry status and replacement relationships.

## Phase 2 - Ingestion pipeline
- [x] Implement source fetch jobs (scheduled + manual trigger) for the first official labor-law adapter.
- [x] Store immutable raw snapshots in object storage for official sources.
- [x] Persist source metadata and checksums for dedup/change detection.
- [x] Add ingest run logs and failure retry policy.
- [x] Add provenance fields: fetched_at, source_url, source_hash.
- [x] Implement the first official-source VBPL adapter for the labor-law pilot.

## Phase 3 - Parsing and normalization
- [x] Build parser adapters for the local labor-law sample dataset.
- [x] Normalize legal document metadata and structural sections.
- [x] Extract hierarchy with stable section IDs.
- [x] Validate parser outputs with schema and quality checks.
- [x] Route parse failures to review through warnings and unparsed fragments.
- [x] Implement PostgreSQL repository layer (SourceRepository, IngestionRepository, SnapshotStorage).
- [x] Create database connection management and migration runner.
- [x] Wire VBPL adapter to real PostgreSQL repositories.
- [x] Create real ingestion execution script (`run-real-ingestion.ts`).
- [x] Create document inspection and reporting tool (`inspect-documents.ts`).
- [x] Create re-ingestion validation script (`validate-idempotency.ts`).
- [x] Add PostgreSQL integration tests.
- [x] Create real-ingestion-validation.md documentation.
- [x] Create pilot-review-report.md template.
- [x] Validate idempotency guarantees with database constraints.

## Phase 4 - Search and retrieval
- [x] Implement lexical search (PostgreSQL full-text).
- [x] Implement retrieval confidence scoring via parse_confidence + retrieval_rank.
- [x] Add retrieval audit logs via answer_sessions/answer_citations tables.
- [x] Add full-text search index with citation-aware matching (migration 0007).
- [ ] Implement vector embeddings and pgvector index.
- [ ] Build hybrid retrieval and reranking pipeline.

## Phase 5 - AI answer layer
- [x] Implement guardrail decision logic (safer_response vs normal mode).
- [x] Implement low-confidence fallback response path with escalation.
- [x] Implement citation map linking to chunks and source documents.
- [x] Create AnswerContextOrchestrator (retrieval + guardrails bundling).
- [x] Create AnswerAssembler (normal/safer_response formatting with Vietnamese templates).
- [x] Create LegalAnswerService (orchestration + assembly pipeline).
- [x] Add answer feedback events mechanism via answer_quality_feedback_events.
- [ ] Build API endpoint to call LegalAnswerService.
- [ ] Implement risk routing for high-risk/legal-sensitive prompts.
- [ ] Implement mandatory disclaimer and next steps in answer templates.

## Phase 6 - Admin tools
- [ ] Build API endpoint for LegalAnswerService.generateAnswer() - POST /api/retrieval/context.
- [ ] Store answer_sessions and answer_citations records from API responses.
- [ ] Emit answer_quality_feedback_events for all queries (mode, escalation, user feedback).
- [ ] Admin view for ingest job status and parser failures.
- [ ] Admin tool to review and re-run failed documents.
- [ ] Admin view for flagged answers and citation trace audit.
- [ ] Manual re-index action for one document/version.
- [ ] Basic partner lead queue for legal escalation handoff.

## Phase 7 - Public website
- [ ] Ship content hub templates with legal basis section.
- [ ] Ship legal search page with filters and result highlighting.
- [ ] Ship AI Q&A page with citation cards and disclaimers.
- [ ] Implement guest/free/pro quotas and paywall trigger point.
- [ ] Add core analytics events from blueprint.
- [ ] Ensure mobile-first usability for P0 flows.

## Release gates (must pass)
- [ ] No fabricated citation in evaluation set.
- [ ] End-to-end traceability test passes.
- [ ] Legal update re-ingestion path verified.
- [ ] Privacy/terms/disclaimer pages published.
- [ ] Alerting enabled for ingestion and retrieval failures.
