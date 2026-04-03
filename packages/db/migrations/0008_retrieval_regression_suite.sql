BEGIN;

CREATE TABLE IF NOT EXISTS public.retrieval_regression_cases (
  retrieval_case_id text PRIMARY KEY,
  query_text text NOT NULL,
  expected_legal_document_id text NOT NULL REFERENCES public.legal_documents (legal_document_id) ON DELETE CASCADE,
  expected_citation_label text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS retrieval_regression_cases_is_active_idx
  ON public.retrieval_regression_cases (is_active);

CREATE OR REPLACE FUNCTION public.run_retrieval_regression(top_k integer DEFAULT 5)
RETURNS TABLE (
  retrieval_case_id text,
  query_text text,
  expected_legal_document_id text,
  expected_citation_label text,
  passed boolean,
  matched_rank integer,
  matched_chunk_id text,
  matched_citation_label text,
  top_result_document_id text,
  top_result_citation_label text,
  top_result_rank real
)
LANGUAGE sql
STABLE
AS $$
  WITH active_cases AS (
    SELECT
      c.retrieval_case_id,
      c.query_text,
      c.expected_legal_document_id,
      c.expected_citation_label
    FROM public.retrieval_regression_cases c
    WHERE c.is_active = true
  ),
  ranked AS (
    SELECT
      c.retrieval_case_id,
      c.query_text,
      c.expected_legal_document_id,
      c.expected_citation_label,
      s.legal_document_chunk_id,
      s.legal_document_id,
      s.citation_label,
      s.rank,
      row_number() OVER (
        PARTITION BY c.retrieval_case_id
        ORDER BY s.rank DESC, s.legal_document_chunk_id
      )::integer AS retrieved_rank
    FROM active_cases c
    LEFT JOIN LATERAL public.search_legal_chunks(c.query_text, GREATEST(top_k, 1)) s
      ON true
  ),
  matched AS (
    SELECT DISTINCT ON (r.retrieval_case_id)
      r.retrieval_case_id,
      r.retrieved_rank AS matched_rank,
      r.legal_document_chunk_id AS matched_chunk_id,
      r.citation_label AS matched_citation_label
    FROM ranked r
    WHERE
      r.legal_document_id = r.expected_legal_document_id
      AND (
        r.expected_citation_label IS NULL
        OR r.citation_label = r.expected_citation_label
      )
    ORDER BY r.retrieval_case_id, r.retrieved_rank
  ),
  top_result AS (
    SELECT
      r.retrieval_case_id,
      r.legal_document_id AS top_result_document_id,
      r.citation_label AS top_result_citation_label,
      r.rank AS top_result_rank
    FROM ranked r
    WHERE r.retrieved_rank = 1
  )
  SELECT
    c.retrieval_case_id,
    c.query_text,
    c.expected_legal_document_id,
    c.expected_citation_label,
    (m.matched_rank IS NOT NULL) AS passed,
    m.matched_rank,
    m.matched_chunk_id,
    m.matched_citation_label,
    t.top_result_document_id,
    t.top_result_citation_label,
    t.top_result_rank
  FROM active_cases c
  LEFT JOIN matched m
    ON m.retrieval_case_id = c.retrieval_case_id
  LEFT JOIN top_result t
    ON t.retrieval_case_id = c.retrieval_case_id
  ORDER BY c.retrieval_case_id;
$$;

ALTER TABLE public.retrieval_regression_cases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY retrieval_regression_cases_service_role_all
  ON public.retrieval_regression_cases
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO public.retrieval_regression_cases (
  retrieval_case_id,
  query_text,
  expected_legal_document_id,
  expected_citation_label,
  notes,
  is_active
)
VALUES
  (
    'rr_vbpl_10427_scope',
    'khung quyền và nghĩa vụ cơ bản',
    'doc_vbpl_10427',
    'Điều 1',
    'Expect 1994 labor code scope chunk to appear in top-k.',
    true
  ),
  (
    'rr_vbpl_27615_state_management',
    'cơ quan quản lý nhà nước liên quan',
    'doc_vbpl_27615',
    'Điều 2',
    'Expect 2012 labor code applicability chunk to match.',
    true
  ),
  (
    'rr_vbpl_139264_standards',
    'tiêu chuẩn lao động quyền nghĩa vụ',
    'doc_vbpl_139264',
    'Điều 1',
    'Expect 2019 labor code standards chunk to rank in top-k.',
    true
  ),
  (
    'rr_vbpl_146643_abroad',
    'đi làm việc ở nước ngoài theo hợp đồng',
    'doc_vbpl_146643',
    'Điều 1',
    'Expect workers-abroad law scope chunk.',
    true
  ),
  (
    'rr_vbpl_172553_union',
    'tổ chức công đoàn trong quan hệ lao động',
    'doc_vbpl_172553',
    'Điều 1',
    'Expect union law scope chunk.',
    true
  )
ON CONFLICT (retrieval_case_id) DO UPDATE
SET
  query_text = EXCLUDED.query_text,
  expected_legal_document_id = EXCLUDED.expected_legal_document_id,
  expected_citation_label = EXCLUDED.expected_citation_label,
  notes = EXCLUDED.notes,
  is_active = EXCLUDED.is_active,
  updated_at = now();

COMMIT;
