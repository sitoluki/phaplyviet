import type { IngestionJobInput, IngestionJobRecord, IngestionRepository } from '../../legal-core/src/ingestion.js';
import type { IngestStatus } from '../../legal-core/src/types.js';
import { getPool } from './connection.js';
import { generateId } from '../../legal-core/src/ids.js';

export class PostgreSQLIngestionRepository implements IngestionRepository {
    async createJob(job: IngestionJobInput): Promise<IngestionJobRecord> {
        const db = getPool();
        const ingestionJobId = generateId('ingest_job');

        const query = `
            INSERT INTO ingestion_jobs (
                ingestion_job_id, legal_source_id, job_type, ingest_status,
                source_snapshot_uri, source_snapshot_checksum, parser_version,
                attempt_count, idempotency_key, metadata_json
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING
                ingestion_job_id as "ingestionJobId",
                legal_source_id as "legalSourceId",
                job_type as "jobType",
                ingest_status as "ingestStatus",
                source_snapshot_uri as "sourceSnapshotUri",
                source_snapshot_checksum as "sourceSnapshotChecksum",
                parser_version as "parserVersion",
                attempt_count as "attemptCount",
                created_at as "createdAt",
                idempotency_key as "idempotencyKey"
        `;

        const result = await db.query(query, [
            ingestionJobId,
            job.legalSourceId,
            job.jobType,
            'pending',
            job.sourceSnapshotUri ?? null,
            job.sourceSnapshotChecksum ?? null,
            job.parserVersion ?? null,
            0,
            job.idempotencyKey,
            JSON.stringify({ sourceUrl: job.sourceUrl })
        ]);

        const row = result.rows[0];
        return {
            idempotencyKey: job.idempotencyKey,
            legalSourceId: job.legalSourceId,
            sourceUrl: job.sourceUrl,
            jobType: job.jobType,
            sourceSnapshotUri: job.sourceSnapshotUri,
            sourceSnapshotChecksum: job.sourceSnapshotChecksum,
            parserVersion: job.parserVersion,
            ingestionJobId: row.ingestionJobId,
            ingestStatus: row.ingestStatus,
            attemptCount: row.attemptCount,
            createdAt: row.createdAt
        };
    }

    async markJobStatus(ingestionJobId: string, status: IngestStatus): Promise<void> {
        const db = getPool();

        const query = `
            UPDATE ingestion_jobs
            SET ingest_status = $1, updated_at = NOW()
            WHERE ingestion_job_id = $2
        `;

        await db.query(query, [status, ingestionJobId]);
    }

    async recordError(
        ingestionJobId: string,
        error: { code: string; message: string; stack?: string; payload?: Record<string, unknown> }
    ): Promise<void> {
        const db = getPool();
        const errorId = generateId('error');

        const query = `
            INSERT INTO ingestion_errors (
                ingestion_error_id, ingestion_job_id, error_code, error_message,
                stack_trace, payload_json
            ) VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await db.query(query, [
            errorId,
            ingestionJobId,
            error.code,
            error.message,
            error.stack ?? null,
            JSON.stringify(error.payload ?? {})
        ]);
    }
}
