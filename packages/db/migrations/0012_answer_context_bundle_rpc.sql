BEGIN;

CREATE OR REPLACE FUNCTION public.get_answer_context_bundle(
  p_query_text text,
  p_top_k integer DEFAULT 5,
  p_min_confidence numeric DEFAULT 0.70
)
RETURNS TABLE (
  rank_index integer,
  legal_document_chunk_id text,
  legal_document_id text,
  legal_document_version_id text,
  legal_document_section_id text,
  title text,
  number_symbol text,
  source_url text,
  effective_date date,
  citation_label text,
  chunk_text text,
  parse_confidence numeric,
  retrieval_rank real,
  traceability_complete boolean,
  low_confidence boolean
)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  WITH retrieved AS (
    SELECT
      row_number() OVER (ORDER BY s.rank DESC, s.legal_document_chunk_id)::integer AS rank_index,
      s.legal_document_chunk_id,
      s.legal_document_id,
      s.legal_document_version_id,
      s.legal_document_section_id,
      s.title,
      s.number_symbol,
      s.source_url,
      s.effective_date,
      s.citation_label,
      s.chunk_text,
      s.parse_confidence,
      s.rank AS retrieval_rank
    FROM public.search_legal_chunks(p_query_text, GREATEST(p_top_k, 1)) s
  )
  SELECT
    r.rank_index,
    r.legal_document_chunk_id,
    r.legal_document_id,
    r.legal_document_version_id,
    r.legal_document_section_id,
    r.title,
    r.number_symbol,
    r.source_url,
    r.effective_date,
    r.citation_label,
    r.chunk_text,
    r.parse_confidence,
    r.retrieval_rank,
    (
      c.legal_document_chunk_id IS NOT NULL
      AND sec.legal_document_section_id IS NOT NULL
      AND d.legal_document_id IS NOT NULL
      AND v.legal_document_version_id IS NOT NULL
      AND c.legal_document_id = d.legal_document_id
      AND c.legal_document_version_id = v.legal_document_version_id
      AND c.legal_document_section_id = sec.legal_document_section_id
    ) AS traceability_complete,
    (coalesce(r.parse_confidence, 0) < p_min_confidence) AS low_confidence
  FROM retrieved r
  LEFT JOIN public.legal_document_chunks c
    ON c.legal_document_chunk_id = r.legal_document_chunk_id
  LEFT JOIN public.legal_document_sections sec
    ON sec.legal_document_section_id = r.legal_document_section_id
  LEFT JOIN public.legal_documents d
    ON d.legal_document_id = r.legal_document_id
  LEFT JOIN public.legal_document_versions v
    ON v.legal_document_version_id = r.legal_document_version_id
  ORDER BY r.rank_index;
$$;

CREATE OR REPLACE FUNCTION public.summarize_answer_context_bundle(
  p_query_text text,
  p_top_k integer DEFAULT 5,
  p_min_confidence numeric DEFAULT 0.70
)
RETURNS TABLE (
  total_results integer,
  all_traceable boolean,
  has_low_confidence boolean,
  min_parse_confidence numeric,
  max_parse_confidence numeric
)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT
    count(*)::integer AS total_results,
    coalesce(bool_and(traceability_complete), false) AS all_traceable,
    coalesce(bool_or(low_confidence), false) AS has_low_confidence,
    min(parse_confidence) AS min_parse_confidence,
    max(parse_confidence) AS max_parse_confidence
  FROM public.get_answer_context_bundle(p_query_text, p_top_k, p_min_confidence);
$$;

COMMIT;
