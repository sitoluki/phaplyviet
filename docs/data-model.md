# Data Model

## Pilot decisions locked
- Pilot domain: labor law only.
- Initial source strategy: curated official sources only.
- No broad web crawling in MVP.

## Explicit enums
- `legal_status`: `unknown`, `draft`, `in_force`, `expired`, `superseded`, `repealed`, `archived`.
- `source_type`: `official`, `official_curated`, `reference`, `internal`.
- `section_type`: `part`, `chapter`, `section`, `article`, `clause`, `point`, `heading_title`, `plain_text`.
- `ingest_status`: `pending`, `discovered`, `fetched`, `parsed`, `normalized`, `chunked`, `embedded`, `indexed`, `failed`, `skipped`.
- `parse_status`: `pending`, `parsed`, `needs_review`, `failed`.

## Deterministic ID strategy
- `legal_document_id`: stable SHA-256 hash from source URL, source name, document type, number symbol, signed date, and language.
- `legal_document_sections.path_key`: stable SHA-256 hash from document ID, parent path, section type, section number, and order index.
- `legal_document_chunk_id`: stable SHA-256 hash from document ID, section ID, chunk index, and normalized chunk text.

## Raw and parsed artifact retention
- Raw snapshots must be immutable.
- Parse artifacts must be retained for audit and re-ingestion.
- Retention policy starts conservative: keep raw snapshots and parse outputs until explicit policy review.

## Core entities
### legal_sources
Curated source registry with source type, base URL, and retention notes.

### legal_documents
Canonical legal record with source metadata, legal status, content fields, and checksum.

### legal_document_versions
Versioned record for each fetched/parsed document snapshot.

### legal_document_sections
Hierarchical structural tree for part/chapter/section/article/clause/point and plain text nodes.

### legal_document_chunks
Retrieval-ready chunk records linked to exact document and section.

### legal_document_relationships
Explicit links between legal documents, such as amended-by, replaces, or supersedes.

### ingestion_jobs
Idempotent ingestion execution records.

### ingestion_errors
Structured error capture for traceable failures.

## Traceability rule
An answer citation must resolve in this order:
1. citation reference in the answer
2. legal_document_chunk
3. legal_document_sections path
4. legal_document
5. original source snapshot URL and artifact
