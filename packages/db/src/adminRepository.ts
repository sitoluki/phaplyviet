import { getPool } from './connection.js';

export interface IngestJobSummary {
    ingestionJobId: string;
    legalSourceId: string | null;
    legalDocumentId: string | null;
    jobType: string;
    ingestStatus: string;
    sourceSnapshotUri: string | null;
    sourceSnapshotChecksum: string | null;
    parserVersion: string | null;
    attemptCount: number;
    startedAt: string | null;
    finishedAt: string | null;
    idempotencyKey: string;
    createdAt: string;
    updatedAt: string;
}

export interface IngestErrorRecord {
    ingestionErrorId: string;
    ingestionJobId: string;
    errorCode: string;
    errorMessage: string;
    stackTrace: string | null;
    payloadJson: Record<string, unknown>;
    createdAt: string;
}

export interface IngestOverview {
    totalJobs: number;
    pendingJobs: number;
    discoveredJobs: number;
    fetchedJobs: number;
    parsedJobs: number;
    normalizedJobs: number;
    chunkedJobs: number;
    embeddedJobs: number;
    indexedJobs: number;
    failedJobs: number;
    skippedJobs: number;
    recentFailures: number;
}

export class AdminRepository {
    async listIngestJobs(input?: {
        status?: string;
        limit?: number;
    }): Promise<IngestJobSummary[]> {
        const db = getPool();
        const limit = Math.min(Math.max(input?.limit ?? 25, 1), 100);

        const params: Array<string | number> = [limit];
        const whereClauses: string[] = [];

        if (input?.status) {
            params.unshift(input.status);
            whereClauses.push(`ingest_status = $1`);
        }

        const query = `
            SELECT
                ingestion_job_id as "ingestionJobId",
                legal_source_id as "legalSourceId",
                legal_document_id as "legalDocumentId",
                job_type as "jobType",
                ingest_status as "ingestStatus",
                source_snapshot_uri as "sourceSnapshotUri",
                source_snapshot_checksum as "sourceSnapshotChecksum",
                parser_version as "parserVersion",
                attempt_count as "attemptCount",
                started_at as "startedAt",
                finished_at as "finishedAt",
                idempotency_key as "idempotencyKey",
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM public.ingestion_jobs
            ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''}
            ORDER BY created_at DESC
            LIMIT $${params.length}
        `;

        const result = await db.query(query, params);
        return result.rows;
    }

    async listIngestErrors(limit: number = 25): Promise<IngestErrorRecord[]> {
        const db = getPool();
        const clampedLimit = Math.min(Math.max(limit, 1), 100);

        const result = await db.query(
            `
            SELECT
                ingestion_error_id as "ingestionErrorId",
                ingestion_job_id as "ingestionJobId",
                error_code as "errorCode",
                error_message as "errorMessage",
                stack_trace as "stackTrace",
                payload_json as "payloadJson",
                created_at as "createdAt"
            FROM public.ingestion_errors
            ORDER BY created_at DESC
            LIMIT $1
            `,
            [clampedLimit]
        );

        return result.rows;
    }

    async getIngestOverview(): Promise<IngestOverview> {
        const db = getPool();
        const result = await db.query<{
            total_jobs: number;
            pending_jobs: number;
            discovered_jobs: number;
            fetched_jobs: number;
            parsed_jobs: number;
            normalized_jobs: number;
            chunked_jobs: number;
            embedded_jobs: number;
            indexed_jobs: number;
            failed_jobs: number;
            skipped_jobs: number;
            recent_failures: number;
        }>(
            `
            SELECT
                count(*)::integer AS total_jobs,
                count(*) FILTER (WHERE ingest_status = 'pending')::integer AS pending_jobs,
                count(*) FILTER (WHERE ingest_status = 'discovered')::integer AS discovered_jobs,
                count(*) FILTER (WHERE ingest_status = 'fetched')::integer AS fetched_jobs,
                count(*) FILTER (WHERE ingest_status = 'parsed')::integer AS parsed_jobs,
                count(*) FILTER (WHERE ingest_status = 'normalized')::integer AS normalized_jobs,
                count(*) FILTER (WHERE ingest_status = 'chunked')::integer AS chunked_jobs,
                count(*) FILTER (WHERE ingest_status = 'embedded')::integer AS embedded_jobs,
                count(*) FILTER (WHERE ingest_status = 'indexed')::integer AS indexed_jobs,
                count(*) FILTER (WHERE ingest_status = 'failed')::integer AS failed_jobs,
                count(*) FILTER (WHERE ingest_status = 'skipped')::integer AS skipped_jobs,
                count(*) FILTER (
                    WHERE ingest_status = 'failed'
                      AND created_at >= now() - interval '7 days'
                )::integer AS recent_failures
            FROM public.ingestion_jobs
            `
        );

        return {
            totalJobs: result.rows[0]?.total_jobs ?? 0,
            pendingJobs: result.rows[0]?.pending_jobs ?? 0,
            discoveredJobs: result.rows[0]?.discovered_jobs ?? 0,
            fetchedJobs: result.rows[0]?.fetched_jobs ?? 0,
            parsedJobs: result.rows[0]?.parsed_jobs ?? 0,
            normalizedJobs: result.rows[0]?.normalized_jobs ?? 0,
            chunkedJobs: result.rows[0]?.chunked_jobs ?? 0,
            embeddedJobs: result.rows[0]?.embedded_jobs ?? 0,
            indexedJobs: result.rows[0]?.indexed_jobs ?? 0,
            failedJobs: result.rows[0]?.failed_jobs ?? 0,
            skippedJobs: result.rows[0]?.skipped_jobs ?? 0,
            recentFailures: result.rows[0]?.recent_failures ?? 0,
        };
    }
}

export default new AdminRepository();
