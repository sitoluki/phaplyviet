# Official Source Adapter

## Adapter name
- VBPL official labor adapter.

## Purpose
- Fetch a curated VBPL labor-law source page.
- Resolve the official attachment link.
- Extract document text from the attachment.
- Pass the extracted text into the existing labor-law parser.
- Return traceable snapshot, parse, and citation artifacts.

## Runtime flow
1. Load a manifest entry.
2. Fetch the VBPL source page HTML.
3. Extract the attachment URL from the page markup.
4. Fetch the attachment bytes.
5. Extract text from the attachment.
6. Save the raw page snapshot immutably.
7. Parse the extracted text into document sections and chunks.
8. Compute an idempotency fingerprint.
9. Emit a structured log entry.

## Manifest contract
Each curated entry must include:
- `sampleId`
- `itemId`
- `code`
- `title`
- `documentType`
- `sourceType`
- `sourceUrl`
- `sourcePageUrl`
- `sourceYear`

## Quality checks
- Reject missing source pages.
- Reject missing attachments when the page advertises one.
- Treat empty extracted text as a review case.
- Keep parse warnings and unparsed fragments.
- Preserve chunk-to-section traceability.

## Current implementation notes
- PDF extraction is handled with `pdf-parse`.
- The adapter uses the labor parser already present in `packages/legal-core`.
- The coordinator only accepts the VBPL curated labor job type for this pilot.
