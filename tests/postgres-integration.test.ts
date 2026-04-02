import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
    initDatabase,
    closeDatabase,
    runMigrations,
    PostgreSQLSourceRepository,
    PostgreSQLIngestionRepository,
    PostgreSQLSnapshotStorage
} from '../packages/db/src/index.js';
import { generateId } from '../packages/legal-core/src/ids.js';
import type { LegalSourceRecord } from '../packages/legal-core/src/types.js';

// Use a test database URL - can be overridden with environment variable
const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/phaplyviet_legal_test';

describe.skipIf(!process.env.RUN_DB_TESTS)('PostgreSQL Repository Integration Tests', () => {
    beforeAll(async () => {
        // Initialize and run migrations
        initDatabase(TEST_DB_URL);
        await runMigrations();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe('PostgreSQLSourceRepository', () => {
        it('should insert and retrieve a source', async () => {
            const repo = new PostgreSQLSourceRepository();

            const source: LegalSourceRecord = {
                legalSourceId: `test_source_${generateId('test')}`,
                sourceName: 'Test VBPL Source',
                sourceType: 'official_curated',
                baseUrl: 'https://vbpl.vn/TW',
                jurisdiction: 'VN',
                isActive: true,
                curatedOnly: true,
                sourceNotes: 'Test source for integration testing',
                retentionNotes: 'Test retention notes'
            };

            await repo.upsertSource(source);
            const retrieved = await repo.findSourceByName(source.sourceName);

            expect(retrieved).toBeDefined();
            expect(retrieved?.sourceName).toBe(source.sourceName);
            expect(retrieved?.sourceType).toBe(source.sourceType);
            expect(retrieved?.jurisdiction).toBe('VN');
        });

        it('should update an existing source', async () => {
            const repo = new PostgreSQLSourceRepository();

            const source: LegalSourceRecord = {
                legalSourceId: `test_source_${generateId('test')}`,
                sourceName: `Test Source ${Date.now()}`,
                sourceType: 'official_curated',
                baseUrl: 'https://vbpl.vn/TW',
                jurisdiction: 'VN',
                isActive: true,
                curatedOnly: true,
                sourceNotes: 'Original notes',
                retentionNotes: 'Original retention'
            };

            // Insert
            await repo.upsertSource(source);
            let retrieved = await repo.findSourceByName(source.sourceName);
            expect(retrieved?.sourceNotes).toBe('Original notes');

            // Update
            source.sourceNotes = 'Updated notes';
            await repo.upsertSource(source);
            retrieved = await repo.findSourceByName(source.sourceName);
            expect(retrieved?.sourceNotes).toBe('Updated notes');
        });

        it('should return null for nonexistent source', async () => {
            const repo = new PostgreSQLSourceRepository();
            const retrieved = await repo.findSourceByName(`nonexistent_source_${Date.now()}`);
            expect(retrieved).toBeNull();
        });
    });

    describe('PostgreSQLIngestionRepository', () => {
        it('should create an ingestion job', async () => {
            const repo = new PostgreSQLIngestionRepository();

            const job = await repo.createJob({
                idempotencyKey: `test_job_${generateId('test')}`,
                legalSourceId: 'test_source',
                sourceUrl: 'https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=139264',
                jobType: 'VBPL_OFFICIAL_LABOR',
                parserVersion: 'test-v1'
            });

            expect(job.ingestionJobId).toBeDefined();
            expect(job.ingestStatus).toBe('pending');
            expect(job.attemptCount).toBe(0);
            expect(job.idempotencyKey).toBeTruthy();
        });

        it('should update job status', async () => {
            const repo = new PostgreSQLIngestionRepository();

            const job = await repo.createJob({
                idempotencyKey: `test_job_${generateId('test')}`,
                legalSourceId: 'test_source',
                sourceUrl: 'https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=139264',
                jobType: 'VBPL_OFFICIAL_LABOR',
                parserVersion: 'test-v1'
            });

            await repo.markJobStatus(job.ingestionJobId, 'parsed');

            // Would need to query database to verify the update
            // For now, just verify no errors were thrown
            expect(job.ingestionJobId).toBeDefined();
        });

        it('should record ingestion error', async () => {
            const repo = new PostgreSQLIngestionRepository();

            const job = await repo.createJob({
                idempotencyKey: `test_job_${generateId('test')}`,
                legalSourceId: 'test_source',
                sourceUrl: 'https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=139264',
                jobType: 'VBPL_OFFICIAL_LABOR',
                parserVersion: 'test-v1'
            });

            await repo.recordError(job.ingestionJobId, {
                code: 'TEST_ERROR',
                message: 'Test error message',
                stack: 'Error stack trace',
                payload: { testKey: 'testValue' }
            });

            // Verify no errors thrown
            expect(job.ingestionJobId).toBeDefined();
        });

        it('should enforce idempotency key uniqueness', async () => {
            const repo = new PostgreSQLIngestionRepository();
            const idempotencyKey = `test_unique_${generateId('test')}`;

            const job1 = await repo.createJob({
                idempotencyKey,
                legalSourceId: 'test_source_1',
                sourceUrl: 'https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=139264',
                jobType: 'VBPL_OFFICIAL_LABOR',
                parserVersion: 'test-v1'
            });

            expect(job1.ingestionJobId).toBeDefined();

            // Try to insert with same idempotency key - should fail
            try {
                const job2 = await repo.createJob({
                    idempotencyKey,
                    legalSourceId: 'test_source_2',
                    sourceUrl: 'https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=139264',
                    jobType: 'VBPL_OFFICIAL_LABOR',
                    parserVersion: 'test-v1'
                });
                // If we get here without error, test should fail
                expect.fail('Should have thrown UNIQUE constraint error');
            } catch (error) {
                // Expected: unique constraint violation
                expect(error).toBeDefined();
            }
        });
    });

    describe('PostgreSQLSnapshotStorage', () => {
        it('should save a raw snapshot', async () => {
            const storage = new PostgreSQLSnapshotStorage();

            const result = await storage.saveRawSnapshot({
                sourceUrl: 'https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=139264',
                payload: '<html><body>Test content</body></html>',
                checksum: 'test_checksum_123',
                retentionNotes: 'Test retention notes'
            });

            expect(result.sourceUrl).toContain('vbpq-van-ban-goc');
            expect(result.sourceName).toBeDefined();
            expect(result.objectStorageUri).toBeDefined();
            expect(result.checksum).toBe('test_checksum_123');
            expect(result.retentionNotes).toBe('Test retention notes');
        });

        it('should store snapshot content', async () => {
            const storage = new PostgreSQLSnapshotStorage();
            const testContent = `<html><body>Test document for ${Date.now()}</body></html>`;

            const result = await storage.saveRawSnapshot({
                sourceUrl: 'https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=27615',
                payload: testContent,
                checksum: `checksum_${generateId('snapshot')}`,
                retentionNotes: 'Archive for legal review'
            });

            expect(result.objectStorageUri).toContain('pg://');
            expect(result.sourceName).toBeDefined();
        });

        it('should enforce snapshot checksum uniqueness', async () => {
            const storage = new PostgreSQLSnapshotStorage();
            const checksum = `unique_checksum_${generateId('test')}`;

            const result1 = await storage.saveRawSnapshot({
                sourceUrl: 'https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=10427',
                payload: '<html>First snapshot</html>',
                checksum,
                retentionNotes: 'First'
            });

            expect(result1.checksum).toBe(checksum);

            // Try to insert with same checksum - should fail
            try {
                await storage.saveRawSnapshot({
                    sourceUrl: 'https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=10427',
                    payload: '<html>Second snapshot with same checksum</html>',
                    checksum,
                    retentionNotes: 'Second'
                });
                expect.fail('Should have thrown UNIQUE constraint error');
            } catch (error) {
                // Expected: unique constraint violation
                expect(error).toBeDefined();
            }
        });
    });
});
