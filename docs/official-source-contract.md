# Official Source Contract

## Scope
- Pilot domain: labor law only.
- Source family: VBPL Trung ương on `vbpl.vn`.
- Intake policy: curated official sources only.
- No broad crawling.

## Canonical source patterns
- Source page: `https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=<itemId>`.
- Detail page: `https://vbpl.vn/TW/Pages/vbpq-toanvan.aspx?ItemID=<itemId>`.
- Related-doc page: `https://vbpl.vn/TW/Pages/vbpq-vanbanlienquan.aspx?ItemID=<itemId>`.
- History page: `https://vbpl.vn/TW/Pages/vbpq-lichsu.aspx?ItemID=<itemId>`.

## Raw snapshot contract
- Persist the official VBPL source page HTML as the immutable raw snapshot.
- Preserve the attachment URL from the page so the document can be re-fetched later.
- Keep the source page checksum and attachment checksum in ingestion metadata.
- Retention is conservative: do not overwrite raw snapshots.

## Attachment handling
- Prefer the official attachment referenced by the source page.
- PDF attachments are extracted to text through a dedicated extractor before parsing.
- If the attachment cannot be extracted, the adapter falls back to the page snapshot and marks the parse for review.

## Idempotency
- Ingestion jobs use a fingerprint derived from source URL, source name, raw snapshot checksum, and parser version.
- If the checksum is unchanged, downstream re-chunking can be skipped.
- A parser version change forces re-ingestion even if the source page checksum is stable.

## Failure behavior
- Fetch failures must be recorded as structured ingestion errors.
- Parse failures must keep the raw snapshot for later audit.
- Low-confidence parse output is allowed, but it must be visible in the parser result and review flow.
