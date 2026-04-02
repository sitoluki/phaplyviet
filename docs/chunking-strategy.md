# Chunking Strategy

## Principles
- Prefer legal structure over arbitrary token windows.
- Preserve traceability from chunk back to the exact legal section.
- Avoid naive fixed-size chunking as the default.

## Priority order
1. Article-aware chunking
- Chunk by article when the article is self-contained.

2. Clause-aware chunking
- If an article has clauses, chunk by clause when that yields cleaner retrieval units.

3. Point-aware chunking
- If a clause has points that carry distinct meaning, chunk by point.

4. Controlled fallback
- Only use shorter splits inside a legal unit if the text is too long for retrieval or model context.
- Keep the original legal section reference attached to every split chunk.

## Traceability requirements
Every chunk must include:
- chunk id
- legal document id
- legal section id
- section path key
- citation label
- source URL and source name in metadata

## Chunk content rules
- Keep headings if they are needed to preserve legal meaning.
- Do not strip clause or point markers from the text.
- Do not merge unrelated legal units just to fill token counts.

## Sample dataset behavior
- The curated labor-law sample should produce article/clause/point-aware chunks.
- Ambiguous or malformed lines should surface warnings, not disappear.

## Future expansion
- Later official-source adapters can reuse the same chunk contract.
- Embeddings and reranking can be added without changing the chunk identity strategy.
