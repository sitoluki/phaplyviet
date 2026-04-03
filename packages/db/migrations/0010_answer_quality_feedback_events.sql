BEGIN;

CREATE TABLE IF NOT EXISTS public.answer_quality_feedback_events (
  feedback_event_id text PRIMARY KEY,
  answer_session_id text NOT NULL REFERENCES public.answer_sessions (answer_session_id) ON DELETE CASCADE,
  feedback_type text NOT NULL,
  score integer,
  is_helpful boolean,
  issue_tags_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  comment_text text,
  reviewer_role text NOT NULL DEFAULT 'end_user',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT answer_quality_feedback_type_chk CHECK (
    feedback_type IN (
      'thumbs_up',
      'thumbs_down',
      'citation_missing',
      'citation_incorrect',
      'outdated_law',
      'unsafe_or_uncertain',
      'other'
    )
  ),
  CONSTRAINT answer_quality_feedback_score_chk CHECK (
    score IS NULL OR (score >= 1 AND score <= 5)
  )
);

CREATE INDEX IF NOT EXISTS answer_quality_feedback_session_idx
  ON public.answer_quality_feedback_events (answer_session_id);

CREATE INDEX IF NOT EXISTS answer_quality_feedback_created_at_idx
  ON public.answer_quality_feedback_events (created_at DESC);

CREATE INDEX IF NOT EXISTS answer_quality_feedback_type_idx
  ON public.answer_quality_feedback_events (feedback_type);

CREATE OR REPLACE VIEW public.answer_quality_feedback_summary_v AS
SELECT
  date_trunc('day', created_at)::date AS event_day,
  count(*)::integer AS total_events,
  count(*) FILTER (WHERE is_helpful IS true)::integer AS helpful_events,
  count(*) FILTER (WHERE is_helpful IS false)::integer AS not_helpful_events,
  round(avg(score)::numeric, 3) AS avg_score,
  count(*) FILTER (WHERE feedback_type = 'citation_missing')::integer AS citation_missing_events,
  count(*) FILTER (WHERE feedback_type = 'citation_incorrect')::integer AS citation_incorrect_events,
  count(*) FILTER (WHERE feedback_type = 'outdated_law')::integer AS outdated_law_events,
  count(*) FILTER (WHERE feedback_type = 'unsafe_or_uncertain')::integer AS unsafe_or_uncertain_events
FROM public.answer_quality_feedback_events
GROUP BY date_trunc('day', created_at)::date
ORDER BY event_day DESC;

ALTER TABLE public.answer_quality_feedback_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY answer_quality_feedback_events_service_role_all
  ON public.answer_quality_feedback_events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
