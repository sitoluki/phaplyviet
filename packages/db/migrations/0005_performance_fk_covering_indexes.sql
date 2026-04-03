BEGIN;

-- Cover foreign keys reported by the Supabase performance advisor.
CREATE INDEX IF NOT EXISTS ingestion_jobs_legal_source_id_idx
  ON public.ingestion_jobs (legal_source_id);

CREATE INDEX IF NOT EXISTS ingestion_jobs_legal_document_id_idx
  ON public.ingestion_jobs (legal_document_id);

CREATE INDEX IF NOT EXISTS legal_document_chunks_legal_document_version_id_idx
  ON public.legal_document_chunks (legal_document_version_id);

CREATE INDEX IF NOT EXISTS legal_document_relationships_to_legal_document_id_idx
  ON public.legal_document_relationships (to_legal_document_id);

CREATE INDEX IF NOT EXISTS legal_documents_current_version_id_idx
  ON public.legal_documents (current_version_id);

COMMIT;
