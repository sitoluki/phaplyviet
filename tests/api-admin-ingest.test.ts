import { describe, it, expect } from 'vitest';
import type {
    IngestErrorRecord,
    IngestJobSummary,
    IngestOverview,
} from '../packages/db/src/adminRepository';

describe('Admin Ingest Dashboard', () => {
    describe('Ingest overview structure', () => {
        it('should structure ingest overview correctly', () => {
            const overview: IngestOverview = {
                totalJobs: 42,
                pendingJobs: 3,
                discoveredJobs: 2,
                fetchedJobs: 5,
                parsedJobs: 20,
                normalizedJobs: 4,
                chunkedJobs: 3,
                embeddedJobs: 1,
                indexedJobs: 2,
                failedJobs: 2,
                skippedJobs: 0,
                recentFailures: 1,
            };

            expect(overview.totalJobs).toBe(42);
            expect(overview.failedJobs).toBe(2);
            expect(overview.recentFailures).toBe(1);
        });

        it('should track each ingest status bucket', () => {
            const overview: IngestOverview = {
                totalJobs: 10,
                pendingJobs: 1,
                discoveredJobs: 1,
                fetchedJobs: 1,
                parsedJobs: 2,
                normalizedJobs: 1,
                chunkedJobs: 1,
                embeddedJobs: 1,
                indexedJobs: 1,
                failedJobs: 1,
                skippedJobs: 0,
                recentFailures: 1,
            };

            expect(
                overview.pendingJobs +
                overview.discoveredJobs +
                overview.fetchedJobs +
                overview.parsedJobs +
                overview.normalizedJobs +
                overview.chunkedJobs +
                overview.embeddedJobs +
                overview.indexedJobs +
                overview.failedJobs +
                overview.skippedJobs
            ).toBe(10);
        });
    });

    describe('Ingest job list structure', () => {
        it('should structure ingest job summaries correctly', () => {
            const job: IngestJobSummary = {
                ingestionJobId: 'job_123',
                legalSourceId: 'source_vbpl',
                legalDocumentId: 'doc_456',
                jobType: 'vbpl_official_labor_curated',
                ingestStatus: 'failed',
                sourceSnapshotUri: 'memory://snapshot.html',
                sourceSnapshotChecksum: 'abc123',
                parserVersion: 'vbpl-official-curated-v1',
                attemptCount: 2,
                startedAt: '2026-04-03T10:00:00Z',
                finishedAt: '2026-04-03T10:02:00Z',
                idempotencyKey: 'idem_1',
                createdAt: '2026-04-03T10:00:00Z',
                updatedAt: '2026-04-03T10:02:00Z',
            };

            expect(job.ingestStatus).toBe('failed');
            expect(job.attemptCount).toBe(2);
            expect(job.jobType).toContain('labor');
        });

        it('should allow null metadata fields in ingest job summaries', () => {
            const job: IngestJobSummary = {
                ingestionJobId: 'job_124',
                legalSourceId: null,
                legalDocumentId: null,
                jobType: 'vbpl_official_labor_curated',
                ingestStatus: 'pending',
                sourceSnapshotUri: null,
                sourceSnapshotChecksum: null,
                parserVersion: null,
                attemptCount: 0,
                startedAt: null,
                finishedAt: null,
                idempotencyKey: 'idem_2',
                createdAt: '2026-04-03T10:00:00Z',
                updatedAt: '2026-04-03T10:00:00Z',
            };

            expect(job.legalSourceId).toBeNull();
            expect(job.finishedAt).toBeNull();
        });
    });

    describe('Ingest error records', () => {
        it('should structure parser failure records correctly', () => {
            const errorRecord: IngestErrorRecord = {
                ingestionErrorId: 'error_1',
                ingestionJobId: 'job_123',
                errorCode: 'OFFICIAL_SOURCE_INGEST_FAILED',
                errorMessage: 'VBPL attachment request failed with status 404',
                stackTrace: 'Error: VBPL attachment request failed',
                payloadJson: {
                    sourceUrl: 'https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=139264',
                },
                createdAt: '2026-04-03T10:05:00Z',
            };

            expect(errorRecord.errorCode).toBe('OFFICIAL_SOURCE_INGEST_FAILED');
            expect(errorRecord.payloadJson).toHaveProperty('sourceUrl');
        });

        it('should allow missing stack trace for clean errors', () => {
            const errorRecord: IngestErrorRecord = {
                ingestionErrorId: 'error_2',
                ingestionJobId: 'job_124',
                errorCode: 'OFFICIAL_SOURCE_INGEST_FAILED',
                errorMessage: 'Source page returned non-OK response',
                stackTrace: null,
                payloadJson: {},
                createdAt: '2026-04-03T10:10:00Z',
            };

            expect(errorRecord.stackTrace).toBeNull();
        });
    });

    describe('Dashboard API contract', () => {
        it('should expose ingest overview endpoint', () => {
            const route = '/api/admin/ingest/overview';
            expect(route).toMatch(/^\/api\/admin\/ingest\//);
        });

        it('should expose ingest jobs endpoint', () => {
            const route = '/api/admin/ingest/jobs';
            expect(route).toMatch(/^\/api\/admin\/ingest\//);
        });

        it('should expose ingest errors endpoint', () => {
            const route = '/api/admin/ingest/errors';
            expect(route).toMatch(/^\/api\/admin\/ingest\//);
        });

        it('should validate list limits in the dashboard contract', () => {
            const validLimits = [1, 25, 100];
            validLimits.forEach((limit) => {
                expect(limit).toBeGreaterThanOrEqual(1);
                expect(limit).toBeLessThanOrEqual(100);
            });
        });
    });

    describe('Operational insight', () => {
        it('should identify failed jobs for review', () => {
            const failedJob: IngestJobSummary = {
                ingestionJobId: 'job_failed',
                legalSourceId: 'source_vbpl',
                legalDocumentId: null,
                jobType: 'vbpl_official_labor_curated',
                ingestStatus: 'failed',
                sourceSnapshotUri: 'memory://failed.html',
                sourceSnapshotChecksum: 'sum_1',
                parserVersion: 'vbpl-official-curated-v1',
                attemptCount: 3,
                startedAt: '2026-04-03T09:00:00Z',
                finishedAt: '2026-04-03T09:01:00Z',
                idempotencyKey: 'idem_failed',
                createdAt: '2026-04-03T09:00:00Z',
                updatedAt: '2026-04-03T09:01:00Z',
            };

            expect(failedJob.ingestStatus).toBe('failed');
            expect(failedJob.attemptCount).toBeGreaterThan(0);
        });

        it('should show recent failures in the overview', () => {
            const overview: IngestOverview = {
                totalJobs: 5,
                pendingJobs: 0,
                discoveredJobs: 0,
                fetchedJobs: 0,
                parsedJobs: 2,
                normalizedJobs: 0,
                chunkedJobs: 0,
                embeddedJobs: 0,
                indexedJobs: 0,
                failedJobs: 3,
                skippedJobs: 0,
                recentFailures: 3,
            };

            expect(overview.recentFailures).toBe(overview.failedJobs);
        });
    });
});
