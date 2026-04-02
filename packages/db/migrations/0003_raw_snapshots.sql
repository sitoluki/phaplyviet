BEGIN;

CREATE TABLE IF NOT EXISTS raw_snapshots (
  raw_snapshot_id TEXT PRIMARY KEY,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  checksum TEXT NOT NULL,
  object_storage_uri TEXT NOT NULL,
  raw_content TEXT,
  content_checksum TEXT,
  retention_notes TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT raw_snapshots_checksum_unique UNIQUE (checksum)
);

CREATE INDEX IF NOT EXISTS raw_snapshots_source_url_idx ON raw_snapshots (source_url);
CREATE INDEX IF NOT EXISTS raw_snapshots_checksum_idx ON raw_snapshots (checksum);

COMMIT;
