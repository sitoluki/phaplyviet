BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

DO $$ BEGIN
  CREATE TYPE legal_status AS ENUM (
    'unknown',
    'draft',
    'in_force',
    'expired',
    'superseded',
    'repealed',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE source_type AS ENUM (
    'official',
    'official_curated',
    'reference',
    'internal'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE section_type AS ENUM (
    'part',
    'chapter',
    'section',
    'article',
    'clause',
    'point',
    'heading_title',
    'plain_text'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ingest_status AS ENUM (
    'pending',
    'discovered',
    'fetched',
    'parsed',
    'normalized',
    'chunked',
    'embedded',
    'indexed',
    'failed',
    'skipped'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE parse_status AS ENUM (
    'pending',
    'parsed',
    'needs_review',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS legal_sources (
  legal_source_id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_type source_type NOT NULL,
  base_url TEXT NOT NULL,
  jurisdiction TEXT NOT NULL DEFAULT 'VN',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  curated_only BOOLEAN NOT NULL DEFAULT TRUE,
  source_notes TEXT,
  retention_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_documents (
  legal_document_id TEXT PRIMARY KEY,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_type source_type NOT NULL,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  number_symbol TEXT,
  issuing_body TEXT,
  signed_date DATE,
  effective_date DATE,
  expiry_date DATE,
  legal_status legal_status,
  raw_content TEXT,
  normalized_content TEXT,
  language TEXT NOT NULL DEFAULT 'vi',
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  checksum TEXT NOT NULL,
  source_snapshot_checksum TEXT,
  source_document_id TEXT,
  current_version_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT legal_documents_checksum_unique UNIQUE (checksum)
);

CREATE TABLE IF NOT EXISTS legal_document_versions (
  legal_document_version_id TEXT PRIMARY KEY,
  legal_document_id TEXT NOT NULL REFERENCES legal_documents (legal_document_id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_label TEXT,
  source_url TEXT NOT NULL,
  source_snapshot_uri TEXT,
  source_snapshot_checksum TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  parse_status parse_status NOT NULL DEFAULT 'pending',
  parsed_at TIMESTAMPTZ,
  normalized_at TIMESTAMPTZ,
  checksum TEXT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT legal_document_versions_unique UNIQUE (legal_document_id, version_number),
  CONSTRAINT legal_document_versions_checksum_unique UNIQUE (checksum)
);

ALTER TABLE legal_documents
  ADD CONSTRAINT legal_documents_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES legal_document_versions (legal_document_version_id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS legal_document_sections (
  legal_document_section_id TEXT PRIMARY KEY,
  legal_document_id TEXT NOT NULL REFERENCES legal_documents (legal_document_id) ON DELETE CASCADE,
  legal_document_version_id TEXT NOT NULL REFERENCES legal_document_versions (legal_document_version_id) ON DELETE CASCADE,
  parent_section_id TEXT REFERENCES legal_document_sections (legal_document_section_id) ON DELETE CASCADE,
  section_type section_type NOT NULL,
  section_number TEXT,
  heading TEXT,
  title TEXT,
  plain_text TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL,
  path_key TEXT NOT NULL,
  citation_label TEXT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT legal_document_sections_path_unique UNIQUE (legal_document_version_id, path_key)
);

CREATE TABLE IF NOT EXISTS legal_document_chunks (
  legal_document_chunk_id TEXT PRIMARY KEY,
  legal_document_id TEXT NOT NULL REFERENCES legal_documents (legal_document_id) ON DELETE CASCADE,
  legal_document_version_id TEXT NOT NULL REFERENCES legal_document_versions (legal_document_version_id) ON DELETE CASCADE,
  legal_document_section_id TEXT NOT NULL REFERENCES legal_document_sections (legal_document_section_id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  citation_label TEXT NOT NULL,
  citation_metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  token_count INTEGER,
  embedding vector(1536),
  content_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT legal_document_chunks_unique UNIQUE (legal_document_section_id, chunk_index),
  CONSTRAINT legal_document_chunks_hash_unique UNIQUE (content_hash)
);

CREATE TABLE IF NOT EXISTS legal_document_relationships (
  legal_document_relationship_id TEXT PRIMARY KEY,
  from_legal_document_id TEXT NOT NULL REFERENCES legal_documents (legal_document_id) ON DELETE CASCADE,
  to_legal_document_id TEXT NOT NULL REFERENCES legal_documents (legal_document_id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  relationship_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT legal_document_relationships_unique UNIQUE (from_legal_document_id, to_legal_document_id, relationship_type)
);

CREATE TABLE IF NOT EXISTS ingestion_jobs (
  ingestion_job_id TEXT PRIMARY KEY,
  legal_source_id TEXT REFERENCES legal_sources (legal_source_id) ON DELETE SET NULL,
  legal_document_id TEXT REFERENCES legal_documents (legal_document_id) ON DELETE SET NULL,
  job_type TEXT NOT NULL,
  ingest_status ingest_status NOT NULL DEFAULT 'pending',
  source_snapshot_uri TEXT,
  source_snapshot_checksum TEXT,
  parser_version TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ingestion_jobs_idempotency_unique UNIQUE (idempotency_key)
);

CREATE TABLE IF NOT EXISTS ingestion_errors (
  ingestion_error_id TEXT PRIMARY KEY,
  ingestion_job_id TEXT NOT NULL REFERENCES ingestion_jobs (ingestion_job_id) ON DELETE CASCADE,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS legal_sources_source_type_idx ON legal_sources (source_type);
CREATE INDEX IF NOT EXISTS legal_documents_source_type_idx ON legal_documents (source_type);
CREATE INDEX IF NOT EXISTS legal_documents_document_type_idx ON legal_documents (document_type);
CREATE INDEX IF NOT EXISTS legal_documents_legal_status_idx ON legal_documents (legal_status);
CREATE INDEX IF NOT EXISTS legal_document_versions_status_idx ON legal_document_versions (parse_status);
CREATE INDEX IF NOT EXISTS legal_document_sections_document_idx ON legal_document_sections (legal_document_id);
CREATE INDEX IF NOT EXISTS legal_document_sections_parent_idx ON legal_document_sections (parent_section_id);
CREATE INDEX IF NOT EXISTS legal_document_chunks_document_idx ON legal_document_chunks (legal_document_id);
CREATE INDEX IF NOT EXISTS legal_document_chunks_section_idx ON legal_document_chunks (legal_document_section_id);
CREATE INDEX IF NOT EXISTS legal_document_chunks_embedding_idx ON legal_document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS ingestion_jobs_status_idx ON ingestion_jobs (ingest_status);
CREATE INDEX IF NOT EXISTS ingestion_errors_job_idx ON ingestion_errors (ingestion_job_id);

COMMIT;
