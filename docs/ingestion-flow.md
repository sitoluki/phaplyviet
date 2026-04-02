# Ingestion Flow

## Scope
- Labor law pilot only.
- Curated official-source list only.
- No broad crawling.

## Flow overview
1. Scheduler picks a curated source.
2. Ingestion job is created with an idempotency key.
3. Raw source is fetched or loaded from a snapshot.
4. Raw artifact is stored immutably in object storage.
5. Parser adapter normalizes the content into legal structure.
6. Section hierarchy is built.
7. Chunks are generated from section text.
8. Chunk metadata is stored for citation traceability.
9. Embeddings can be generated later without changing IDs.
10. Job status and errors are persisted.

## Retention notes
- Raw snapshots are never overwritten.
- Parse artifacts are retained to support audit and reprocessing.
- Keep checksum fields so the pipeline can skip unchanged sources.

## Failure handling
- Parse failures are recorded in `ingestion_errors`.
- Failed jobs remain queryable for review.
- The same source can be re-run safely because of idempotency keys.

## Re-ingestion rules
- If checksum changes, create a new version.
- If content is identical, skip downstream re-chunking and re-embedding.
- If parser version changes, re-run parse and normalization for affected sources.

## Minimum test cases
- Same source + same checksum does not duplicate records.
- Citation trace resolves from chunk to section to document to source.
- Parser failure is captured with a structured error record.
