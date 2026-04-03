BEGIN;

CREATE TABLE IF NOT EXISTS public.answer_sessions (
  answer_session_id text PRIMARY KEY,
  query_text text NOT NULL,
  answer_text text NOT NULL,
  answer_mode text NOT NULL DEFAULT 'normal',
  confidence_score numeric(5,2) NOT NULL DEFAULT 0,
  response_status text NOT NULL DEFAULT 'draft',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.answer_citations (
  answer_citation_id text PRIMARY KEY,
  answer_session_id text NOT NULL REFERENCES public.answer_sessions (answer_session_id) ON DELETE CASCADE,
  legal_document_chunk_id text NOT NULL REFERENCES public.legal_document_chunks (legal_document_chunk_id) ON DELETE RESTRICT,
  citation_order integer NOT NULL,
  quote_text text,
  rationale text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT answer_citations_order_unique UNIQUE (answer_session_id, citation_order)
);

CREATE INDEX IF NOT EXISTS answer_sessions_created_at_idx
  ON public.answer_sessions (created_at DESC);

CREATE INDEX IF NOT EXISTS answer_citations_session_idx
  ON public.answer_citations (answer_session_id);

CREATE INDEX IF NOT EXISTS answer_citations_chunk_idx
  ON public.answer_citations (legal_document_chunk_id);

CREATE OR REPLACE VIEW public.answer_citation_audit_v AS
SELECT
  ac.answer_citation_id,
  ac.answer_session_id,
  ac.citation_order,
  ac.quote_text,
  ac.rationale,
  c.legal_document_chunk_id,
  c.chunk_text,
  c.citation_label,
  s.legal_document_section_id,
  s.section_type,
  s.section_number,
  s.heading,
  s.title AS section_title,
  d.legal_document_id,
  d.title AS document_title,
  d.number_symbol,
  d.source_url,
  d.effective_date,
  d.legal_status,
  v.legal_document_version_id,
  v.parse_confidence,
  (c.legal_document_section_id = s.legal_document_section_id
   AND c.legal_document_id = d.legal_document_id
   AND c.legal_document_version_id = v.legal_document_version_id
  ) AS traceability_complete
FROM public.answer_citations ac
JOIN public.legal_document_chunks c
  ON c.legal_document_chunk_id = ac.legal_document_chunk_id
JOIN public.legal_document_sections s
  ON s.legal_document_section_id = c.legal_document_section_id
JOIN public.legal_documents d
  ON d.legal_document_id = c.legal_document_id
LEFT JOIN public.legal_document_versions v
  ON v.legal_document_version_id = c.legal_document_version_id;

CREATE OR REPLACE FUNCTION public.evaluate_answer_traceability(p_answer_session_id text)
RETURNS TABLE (
  answer_session_id text,
  total_citations integer,
  traceable_citations integer,
  untraceable_citations integer,
  all_traceable boolean
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p_answer_session_id AS answer_session_id,
    count(*)::integer AS total_citations,
    count(*) FILTER (WHERE traceability_complete)::integer AS traceable_citations,
    count(*) FILTER (WHERE NOT traceability_complete)::integer AS untraceable_citations,
    bool_and(traceability_complete) AS all_traceable
  FROM public.answer_citation_audit_v
  WHERE answer_citation_audit_v.answer_session_id = p_answer_session_id;
$$;

ALTER TABLE public.answer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_citations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY answer_sessions_service_role_all
  ON public.answer_sessions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY answer_citations_service_role_all
  ON public.answer_citations
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
