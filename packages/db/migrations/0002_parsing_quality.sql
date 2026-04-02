BEGIN;

ALTER TABLE legal_document_versions
  ADD COLUMN IF NOT EXISTS parse_confidence NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parser_warnings_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS unparsed_fragments_json JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE legal_documents
  ADD COLUMN IF NOT EXISTS parser_version TEXT;

COMMIT;
