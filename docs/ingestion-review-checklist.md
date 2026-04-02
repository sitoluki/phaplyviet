# Ingestion Review Checklist

## Before running
- Confirm the source is on the curated VBPL labor list.
- Confirm the source page URL contains a stable `ItemID`.
- Confirm the manifest entry has the correct document type and year.

## During ingestion
- Verify the source page fetch succeeds.
- Verify the attachment URL is extracted from the page.
- Verify the attachment fetch succeeds.
- Verify raw snapshot storage returns a checksum and URI.
- Verify parser warnings are captured when confidence is low.

## After ingestion
- Confirm the document ID is stable across re-runs.
- Confirm section IDs and chunk IDs are stable across re-runs.
- Confirm traceability from chunk to section to document to source snapshot.
- Confirm low-confidence results are visible and not silently dropped.
- Confirm any failures are recorded in `ingestion_errors`.

## Escalation triggers
- Missing attachment on an official source page.
- Empty extracted text.
- Parse confidence below the review threshold.
- Unexpected document title or item ID mismatch.
- Any break in citation traceability.
