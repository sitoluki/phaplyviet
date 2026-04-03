BEGIN;

-- Ensure views execute with caller privileges (security_invoker) to respect RLS.
ALTER VIEW public.answer_citation_audit_v
  SET (security_invoker = true);

ALTER VIEW public.answer_quality_feedback_summary_v
  SET (security_invoker = true);

-- Fix mutable search_path warnings on SQL functions.
ALTER FUNCTION public.search_legal_chunks(text, integer)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.run_retrieval_regression(integer)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.evaluate_answer_traceability(text)
  SET search_path = public, pg_temp;

COMMIT;
