# Real Ingestion Validation

This document describes the process and results of validating the VBPL official labor-law pilot adapter against the real PostgreSQL database.

## Goal

Validate that the VBPL official source adapter produces correct, reviewable legal corpus records when connected to the real database infrastructure.

## Architecture

### Database Layer

The integration uses PostgreSQL with the following components:

1. **Connection Management** (`packages/db/src/connection.ts`)
   - Pool-based connection management
   - Auto-migration runner
   - Graceful shutdown

2. **PostgreSQL Repository Implementations**
   - `PostgreSQLSourceRepository`: Manages legal source registration
   - `PostgreSQLIngestionRepository`: Tracks ingestion jobs and errors
   - `PostgreSQLSnapshotStorageWithContent`: Stores raw HTML snapshots

3. **Schema**
   - `0001_legal_corpus_base.sql`: Core tables (documents, versions, sections, chunks, jobs)
   - `0002_parsing_quality.sql`: Parse confidence and warnings
   - `0003_raw_snapshots.sql`: Raw snapshot storage

### Real Ingestion Flow

```
VBPL Source
    ↓
VbplOfficialLaborAdapter.ingestEntry()
    ↓ (fetch page HTML)
resolveAttachmentUrl() → attachment PDF
    ↓ (fetch PDF)
extractPdfText() → raw text
    ↓
saveRawSnapshot() → PostgreSQL raw_snapshots
    ↓
parseLaborLawSampleDocument() → ParsedDocumentResult
    ↓ (sections, chunks, warnings, confidence)
LegalIngestionCoordinator
    ↓
PostgreSQL repositories
    ├→ legal_sources
    ├→ legal_documents
    ├→ legal_document_versions
    ├→ legal_document_sections
    ├→ legal_document_chunks
    ├→ ingestion_jobs
    └→ ingestion_errors
```

## Execution

### Prerequisites

1. PostgreSQL installed and running locally
2. Environment variable: `DATABASE_URL` (defaults to `postgresql://localhost:5432/phaplyviet_legal`)
3. Dependencies installed: `npm install`

### Scripts

#### 1. Run Real Ingestion

```bash
tsx scripts/run-real-ingestion.ts
```

**What it does:**
- Initializes PostgreSQL connection
- Runs all migrations (0001, 0002, 0003)
- Creates source registry entry
- Ingests all 5 VBPL labor documents
- Logs status for each document

**Expected output:**
```
🔄 Initializing database...
📦 Running migrations...
✓ Migrated 0001_legal_corpus_base.sql
✓ Migrated 0002_parsing_quality.sql
✓ Migrated 0003_raw_snapshots.sql
...
📥 Starting real ingestion of 5 documents...

📄 Ingesting: Bộ luật Không số (ItemID: 10427)
✅ Successfully ingested Bộ luật Không số
...

📊 INGESTION SUMMARY
Total: 5, Successful: 5, Failed: 0
```

#### 2. Inspect Documents

```bash
tsx scripts/inspect-documents.ts
```

**What it does:**
- Queries PostgreSQL for all ingested documents
- Calculates aggregate statistics
- Reports parse confidence, warnings, sections, chunks
- Verifies citation traceability for each document
- Identifies documents needing fixes

**Sample output:**
```
📊 DOCUMENT INSPECTION REPORT
Total Documents: 5

📊 SUMMARY STATISTICS
Average Parse Confidence: 0.72
Low Confidence Documents (<0.7): 2
Total Sections: 47
Total Chunks: 142
All Documents Citation-Traceable: ✅ Yes

[1/5] Bộ luật Không số
    Source: https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=10427
    Number/Symbol: BLLD-1994
    Parse Status: needs_review
    ✅ Parse Confidence: 72.5%
    Warnings: 1
    Sections: 8
    Chunks: 24
    ✅ Citation Traceability: Complete
```

#### 3. Validate Idempotency

```bash
tsx scripts/validate-idempotency.ts
```

**What it does:**
- Ingests a test document twice using same idempotency key
- Verifies that idempotency key is unique (no duplicate jobs)
- Verifies no duplicate documents are created
- Confirms re-ingestion is safe

**Expected behavior:**
- First run: Creates job, documents, sections, chunks
- Second run: Succeeds but doesn't duplicate (same idempotency key prevents duplication)
- Result: ✅ PASS if idempotency protected against duplicates

## Database Schema Overview

### Core Tables

#### `legal_sources`
- Registry of source metadata
- Columns: legal_source_id, source_name, source_type, base_url, jurisdiction, is_active, curated_only, retention_notes

#### `legal_documents`
- Master document records
- Columns: legal_document_id, source_url, title, number_symbol, issuing_body, signed_date, effective_date, legal_status, parser_version, checksum

#### `legal_document_versions`
- Version history for documents
- Columns: legal_document_version_id, version_number, parse_status, parse_confidence, parser_warnings_json, unparsed_fragments_json

#### `legal_document_sections`
- Document structure: parts, chapters, articles, clauses, points
- Columns: section_type, section_number, title, plain_text, path_key, citation_label, order_index, parent_section_id

#### `legal_document_chunks`
- Text chunks for retrieval
- Columns: chunk_index, chunk_text, citation_label, token_count, embedding (NULL until vector phase), content_hash

#### `raw_snapshots`
- Raw HTML snapshots from VBPL
- Columns: raw_snapshot_id, source_url, checksum, object_storage_uri, raw_content, retention_notes

#### `ingestion_jobs`
- Job tracking for auditing
- Columns: ingestion_job_id, job_type, ingest_status, parser_version, attempt_count, idempotency_key, metadata_json

#### `ingestion_errors`
- Error logging for failed jobs
- Columns: ingestion_error_id, error_code, error_message, stack_trace, payload_json

## Citation Traceability Verification

A document is considered **citation-traceable** if:

1. ✅ It has a `legal_document` record
2. ✅ It has at least one `legal_document_version`
3. ✅ It has at least one `legal_document_section`
4. ✅ It has at least one `legal_document_chunk`

**Chain:** Final answer → Retrieved chunk → Section → Document → Raw snapshot → VBPL ItemID

## Data Quality Metrics

### Parse Confidence

Scale: 0.0 to 1.0
- `>= 0.8`: ✅ High confidence (ready)
- `>= 0.7`: ⚠️ Medium confidence (needs review)
- `< 0.7`: ❌ Low confidence (needs fixes)

### Parse Status

- `pending`: Not parsed yet
- `parsed`: Successfully parsed
- `needs_review`: Parsed but low confidence
- `failed`: Parsing error

### Warnings

Parser emits warnings for:
- Partial patterns matched (e.g., section number found but no text)
- Unusual structure (e.g., document without chapters)
- Encoding issues (e.g., corrupted PDF text)

## Idempotency Guarantees

The adapter implements idempotency via:

1. **Unique Idempotency Key**: `vbpl-{itemId}-v{parserVersion}`
2. **Database Constraint**: `UNIQUE (idempotency_key)` on `ingestion_jobs`
3. **Fingerprinting**: Source URL + snapshot checksum + parser version
4. **Safe Re-ingestion**: Same source + same parser = guaranteed no duplication

**Example:**
```
Ingest #1: vbpl-139264-v1 → Creates job_1, doc_1, 20 sections, 45 chunks
Ingest #2: vbpl-139264-v1 → UNIQUE constraint prevents duplicate job
Result: job_1 status updated, no document duplication
```

## Pilot Document Set

| ItemID | Code | Title | Year | Status |
|---|---|---|---|---|
| 10427 | BLLD-1994 | Bộ luật Không số | 1994 | In pilot |
| 27615 | 10/2012/QH13 | Bộ luật 10/2012/QH13 Lao động | 2012 | In pilot |
| 139264 | 45/2019/QH14 | Bộ luật 45/2019/QH14 | 2019 | In pilot |
| 146643 | 69/2020/QH14 | Luật 69/2020/QH14 | 2020 | In pilot |
| 172553 | 50/2024/QH15 | Luật 50/2024/QH15 | 2024 | In pilot |

## Acceptance Criteria

- [x] Database connection successful
- [x] Migrations run without errors
- [x] All 5 documents ingest without crashes
- [x] Sources registered in legal_sources table
- [x] Documents created with proper citations
- [x] Sections and chunks linked correctly
- [x] Jobs tracked with status and errors
- [x] Snapshots stored with checksums
- [x] Idempotency tested and verified
- [x] Parse confidence and warnings available
- [x] Citation traceability complete for all docs

## Next Steps (Not in Scope)

1. **Vector Embedding** (Phase 4): Add embeddings to chunks for semantic search
2. **Vector Search** (Phase 5): Implement retrieval and ranking
3. **LLM Integration** (Phase 6): Add answer generation
4. **UI Monitor** (Phase 6): Build admin dashboard for job inspection

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL is running
psql postgresql://localhost:5432/phaplyviet_legal
```

### Migration Errors

- Ensure database is empty or migrations are idempotent
- Check migrations/0003_raw_snapshots.sql syntax
- Run migrations manually:
  ```bash
  psql postgresql://localhost:5432/phaplyviet_legal < packages/db/migrations/0001_legal_corpus_base.sql
  ```

### Low Parse Confidence

- Review parser warnings in inspection report
- May indicate PDF extraction issues
- Needs manual review and parser tuning

### Missing Citation Traceability

- Document may not have sections extracted
- Chunk creation may have failed
- Check ingestion_errors table for details

## References

- [VBPL Official Labor Adapter](./official-source-adapter.md)
- [Ingestion Coordinator](../apps/worker/src/ingestCoordinator.ts)
- [Database Schema](../packages/db/migrations/0001_legal_corpus_base.sql)
- [Legal Core Types](../packages/legal-core/src/types.ts)
