# Parsing Strategy

## Scope
- Pilot domain: labor law only.
- Source strategy: curated official-source list only.
- No broad web crawling.

## Pipeline stages
1. Raw input loader
- Load a local sample document from fixture files or a later official source adapter.
- Preserve source URL, source name, source type, and raw content.

2. Metadata extraction
- Detect title, number/symbol, issuing body, signed/effective dates, and expiry date if present.
- Use explicit labels when available.
- Fall back to conservative heuristics when labels are missing.

3. Text normalization
- Strip simple HTML tags.
- Decode common HTML entities.
- Normalize newlines and whitespace.

4. Section detection
- Detect `part`, `chapter`, `section`, `article`, `clause`, and `point` markers.
- Prefer structural headings over fixed-size splitting.
- Treat uncertain lines as warnings or unparsed fragments rather than dropping them.

5. Hierarchy construction
- Build a stable tree using deterministic `path_key` values.
- Preserve parent references for section ancestry.
- Maintain article/clause/point nesting whenever possible.

6. Chunk generation
- Generate chunks from article/clause/point nodes.
- Keep chunk text close to legal structure.
- Preserve citation metadata on every chunk.

7. Citation object generation
- Generate citation records that resolve to document, section, and chunk.
- Keep source URL and source name in citation metadata for auditability.

## Quality safeguards
- Emit parser warnings for missing metadata and uncertain structure.
- Capture unparsed fragments explicitly.
- Compute parse confidence so low-quality parses can be reviewed.
- Never silently drop text that is not structured.

## Output contract
- Structured sections.
- Retrieval-ready chunks.
- Citation trace links.
- Parse warnings.
- Unparsed fragments.
- Parse confidence.

## Assumptions
- Sample fixtures are intentionally small and human-curated.
- A later official-source adapter may need source-specific heuristics, but the output contract should remain stable.
