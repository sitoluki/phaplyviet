-- Daily SQL smoke checklist for legal corpus retrieval + traceability.
-- Run via Supabase SQL editor or MCP execute_sql.

-- 1) Core row counts
select
  (select count(*) from public.legal_documents) as legal_documents,
  (select count(*) from public.legal_document_versions) as legal_document_versions,
  (select count(*) from public.legal_document_sections) as legal_document_sections,
  (select count(*) from public.legal_document_chunks) as legal_document_chunks,
  (select count(*) from public.ingestion_jobs) as ingestion_jobs,
  (select count(*) from public.answer_sessions) as answer_sessions,
  (select count(*) from public.answer_citations) as answer_citations;

-- 2) Retrieval regression
select * from public.run_retrieval_regression(5);
select
  count(*) as total_cases,
  sum(case when passed then 1 else 0 end) as passed_cases,
  round((sum(case when passed then 1 else 0 end)::numeric / nullif(count(*), 0)) * 100, 2) as pass_rate_percent
from public.run_retrieval_regression(5);

-- 3) Answer-level traceability audit
select
  answer_session_id,
  total_citations,
  traceable_citations,
  untraceable_citations,
  all_traceable
from public.evaluate_answer_traceability('ans_session_pilot_001');

-- 4) Context-bundle guardrail checks
select * from public.summarize_answer_context_bundle('người lao động', 5, 0.70);
select * from public.summarize_answer_context_bundle('đi làm việc ở nước ngoài theo hợp đồng', 5, 0.90);

-- 5) Feedback summary
select *
from public.answer_quality_feedback_summary_v
order by event_day desc
limit 7;
