BEGIN;

-- Baseline keyword retrieval with full citation/source traceability.
ALTER TABLE public.legal_document_chunks
  ADD COLUMN IF NOT EXISTS chunk_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', coalesce(chunk_text, ''))) STORED;

CREATE INDEX IF NOT EXISTS legal_document_chunks_chunk_tsv_idx
  ON public.legal_document_chunks
  USING GIN (chunk_tsv);

CREATE OR REPLACE FUNCTION public.search_legal_chunks(
  query_text text,
  match_count integer DEFAULT 10
)
RETURNS TABLE (
  legal_document_chunk_id text,
  legal_document_id text,
  legal_document_version_id text,
  legal_document_section_id text,
  title text,
  number_symbol text,
  source_url text,
  effective_date date,
  parse_confidence numeric,
  citation_label text,
  chunk_text text,
  rank real
)
LANGUAGE sql
STABLE
AS $$
  WITH q AS (
    SELECT websearch_to_tsquery('simple', coalesce(query_text, '')) AS tsq
  )
  SELECT
    c.legal_document_chunk_id,
    c.legal_document_id,
    c.legal_document_version_id,
    c.legal_document_section_id,
    d.title,
    d.number_symbol,
    d.source_url,
    d.effective_date,
    v.parse_confidence,
    c.citation_label,
    c.chunk_text,
    ts_rank(c.chunk_tsv, q.tsq)::real AS rank
  FROM public.legal_document_chunks c
  JOIN public.legal_documents d
    ON d.legal_document_id = c.legal_document_id
  LEFT JOIN public.legal_document_versions v
    ON v.legal_document_version_id = c.legal_document_version_id
  CROSS JOIN q
  WHERE
    query_text IS NOT NULL
    AND btrim(query_text) <> ''
    AND c.chunk_tsv @@ q.tsq
  ORDER BY rank DESC, c.legal_document_chunk_id
  LIMIT GREATEST(match_count, 1);
$$;

COMMIT;
