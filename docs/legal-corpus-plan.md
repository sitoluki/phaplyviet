# Legal Corpus Plan and Knowledge Layer

## 1) Principles
- Corpus quality first, UI second.
- Every answer must be auditable to official source.
- Version awareness is mandatory for legal validity.
- Re-ingestion must be repeatable and deterministic.

## 2) Knowledge layer architecture

### 2.1 Raw source storage
Purpose:
- Preserve immutable evidence of what was fetched and when.

Storage:
- Object storage path pattern:
  - `raw/{source}/{yyyy}/{mm}/{dd}/{document_key}/{fetch_ts}.{ext}`
- Metadata in DB:
  - source_url, fetch_time, mime_type, checksum, source_status.

Rules:
- Never overwrite raw snapshots.
- Keep checksum for change detection.
- Keep fetch provenance for legal audit.

### 2.2 Normalized document storage
Purpose:
- Canonical legal record independent of source formatting.

Core entity: legal_document
- legal_document_id (internal canonical ID)
- source_document_id (latest raw snapshot ref)
- title
- document_number
- document_type
- issuing_body
- issue_date
- effective_date
- expiry_date
- legal_status (effective, expired, superseded, unknown)
- language
- version_group_id

Rules:
- One canonical record per legal version.
- Link superseded/replaced relationships across versions.

### 2.3 Section hierarchy storage
Purpose:
- Preserve legal structure for accurate retrieval and citation.

Core entity: legal_section
- section_id
- legal_document_id
- parent_section_id (nullable)
- section_type (part, chapter, section, article, clause, point)
- section_number
- heading
- body_text
- order_index
- path_key (for deterministic traversal)

Rules:
- Keep hierarchy stable across re-index runs where possible.
- Do not flatten away article/clause boundaries.

### 2.4 Chunk storage
Purpose:
- Retrieval unit optimized for search and AI context windows.

Core entity: document_chunk
- chunk_id
- legal_document_id
- section_id
- chunk_order
- chunk_text
- normalized_text
- token_count
- embedding_vector (pgvector)
- lexical_tsv
- citation_label (example: "Article 12, Clause 3")

Chunking strategy:
- Prefer article/clause boundaries first.
- Split long sections only after preserving section labels.
- Store deterministic chunk IDs to reduce churn in re-index.

### 2.5 Citation traceability
Purpose:
- Ensure every answer claim can be traced end-to-end.

Core entity: citation_trace
- citation_id (rendered in answer, example C1, C2)
- answer_id
- chunk_id
- section_id
- legal_document_id
- source_document_id
- source_url
- quote_span_start, quote_span_end (optional)

Required behavior:
- Answer renderer only displays citations that exist in citation_trace.
- No synthetic citations allowed.

## 3) Re-ingestion and update flow
1. Detect source delta
- Compare checksum and metadata.

2. Create new source_document snapshot
- Immutable insertion only.

3. Parse and normalize
- Build/refresh legal_document and legal_section entries.

4. Version link update
- Mark previous version superseded if applicable.

5. Re-chunk and embed affected document only
- Avoid full-corpus rebuild unless schema changed.

6. Reindex search artifacts
- Update lexical and vector indexes.

7. Run validation suite
- Section integrity checks.
- Citation chain integrity checks.

8. Publish update state
- Record re-ingestion run status and audit logs.

## 4) Minimal tables for MVP
- source_document
- legal_document
- legal_section
- document_chunk
- citation_trace
- ingest_run
- parse_error_log
- retrieval_log
- answer_log

## 5) Quality gates
- Reject parse output if article numbering integrity fails.
- Reject indexing if citation_label missing on chunk.
- Block answer generation if retrieval evidence is empty.
- Flag answer if confidence below threshold.

## 6) Operational cadence
- Daily source check job.
- Immediate re-ingest on detected change.
- Weekly corpus QA for top queried topics.
- Monthly schema/data integrity review.

## 7) Assumptions and open items
- Assumption C1: Official source terms permit storage of text snapshots for internal retrieval use.
- Assumption C2: Section patterns are regular enough to parse with source-specific adapters.
- Open item O1: Define legal reviewer SLA for urgent law changes.
- Open item O2: Define retention policy for raw snapshots by source type.
