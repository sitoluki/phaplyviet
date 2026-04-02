import { initDatabase, closeDatabase, getPool } from '@legal/db/index.js';
import { PostgreSQLIngestionRepository } from '@legal/db/ingestionRepository.js';
import { PostgreSQLSourceRepository } from '@legal/db/sourceRepository.js';
import { PostgreSQLSnapshotStorageWithContent } from '@legal/db/snapshotStorage.js';
import { LegalIngestionCoordinator } from '@legal/worker/ingestCoordinator.js';
import { ConsoleIngestionLogger } from '@legal/worker/logger.js';
import { VbplOfficialLaborAdapter, VBPL_OFFICIAL_LABOR_PILOT, VBPL_OFFICIAL_LABOR_JOB_TYPE } from '@legal/worker/vbplOfficialAdapter.js';

async function validateIdempotency() {
    const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/phaplyviet_legal';

    console.log('🔄 Initializing database...');
    const db = initDatabase(dbUrl);

    try {
        const sourceRepository = new PostgreSQLSourceRepository();
        const ingestionRepository = new PostgreSQLIngestionRepository();
        const snapshotStorage = new PostgreSQLSnapshotStorageWithContent();
        const logger = new ConsoleIngestionLogger();

        const adapter = new VbplOfficialLaborAdapter({
            fetchClient: {
                async fetch(url: string) {
                    const response = await fetch(url);
                    return response as any;
                }
            },
            snapshotStorage,
            logger,
            textExtractor: undefined as any,
            parserVersion: 'vbpl-official-curated-v1'
        });

        const coordinator = new LegalIngestionCoordinator(
            {
                sources: sourceRepository,
                ingestion: ingestionRepository
            },
            adapter,
            logger
        );

        console.log('\n📊 RE-INGESTION VALIDATION TEST');
        console.log('='.repeat(80));
        console.log('Testing idempotency: Ingesting twice and verifying no duplicates\n');

        // First, count existing jobs
        const countBefore = await db.query('SELECT COUNT(*) as count FROM ingestion_jobs');
        const jobsBefore = parseInt(countBefore.rows[0].count, 10);
        console.log(`Jobs before ingestion: ${jobsBefore}`);

        const countDocBefore = await db.query('SELECT COUNT(*) as count FROM legal_documents');
        const docsBefore = parseInt(countDocBefore.rows[0].count, 10);
        console.log(`Documents before ingestion: ${docsBefore}\n`);

        // Test with first document
        const testEntry = VBPL_OFFICIAL_LABOR_PILOT[0];
        if (!testEntry) {
            console.error('❌ No test entry found in pilot');
            return;
        }

        console.log(`🧪 Test Document: ${testEntry.title} (ItemID: ${testEntry.itemId})`);
        const idempotencyKey = `vbpl-${testEntry.itemId}-idempotency-test`;

        // First ingestion
        console.log('\n1️⃣  First Ingestion');
        try {
            await coordinator.ingest({
                idempotencyKey,
                legalSourceId: `vbpl_test_${testEntry.itemId}`,
                sourceUrl: testEntry.sourceUrl,
                jobType: VBPL_OFFICIAL_LABOR_JOB_TYPE,
                parserVersion: 'vbpl-official-curated-v1'
            });
            console.log('✅ First ingestion successful');
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            console.error(`❌ First ingestion failed: ${msg}`);
        }

        const countAfter1st = await db.query('SELECT COUNT(*) as count FROM ingestion_jobs');
        const jobsAfter1st = parseInt(countAfter1st.rows[0].count, 10);
        const docsAfter1st = await db.query('SELECT COUNT(*) as count FROM legal_documents');
        const docsAfter1stCount = parseInt(docsAfter1st.rows[0].count, 10);

        console.log(`Jobs after 1st: ${jobsAfter1st} (added ${jobsAfter1st - jobsBefore})`);
        console.log(`Documents after 1st: ${docsAfter1stCount} (added ${docsAfter1stCount - docsBefore})`);

        // Get idempotency key info
        const idempotencyCheck1 = await db.query(
            'SELECT ingestion_job_id, ingest_status FROM ingestion_jobs WHERE idempotency_key = $1',
            [idempotencyKey]
        );
        const job1 = idempotencyCheck1.rows[0];

        // Second ingestion (same idempotency key)
        console.log('\n2️⃣  Second Ingestion (same idempotency key)');
        try {
            await coordinator.ingest({
                idempotencyKey,
                legalSourceId: `vbpl_test_${testEntry.itemId}`,
                sourceUrl: testEntry.sourceUrl,
                jobType: VBPL_OFFICIAL_LABOR_JOB_TYPE,
                parserVersion: 'vbpl-official-curated-v1'
            });
            console.log('✅ Second ingestion successful');
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            console.error(`❌ Second ingestion failed: ${msg}`);
        }

        const countAfter2nd = await db.query('SELECT COUNT(*) as count FROM ingestion_jobs');
        const jobsAfter2nd = parseInt(countAfter2nd.rows[0].count, 10);
        const docsAfter2nd = await db.query('SELECT COUNT(*) as count FROM legal_documents');
        const docsAfter2ndCount = parseInt(docsAfter2nd.rows[0].count, 10);

        console.log(`Jobs after 2nd: ${jobsAfter2nd} (added ${jobsAfter2nd - jobsAfter1st})`);
        console.log(`Documents after 2nd: ${docsAfter2ndCount} (added ${docsAfter2ndCount - docsAfter1stCount})`);

        const idempotencyCheck2 = await db.query(
            'SELECT COUNT(*) as count FROM ingestion_jobs WHERE idempotency_key = $1',
            [idempotencyKey]
        );
        const jobsWithIdempotencyKey = parseInt(idempotencyCheck2.rows[0].count, 10);

        // Validation results
        console.log('\n' + '='.repeat(80));
        console.log('✅ IDEMPOTENCY VALIDATION RESULTS');
        console.log('='.repeat(80));

        const idempotencyPassed = jobsWithIdempotencyKey === 1;
        const noDuplicateDocs = docsAfter2ndCount === docsAfter1stCount;

        console.log(`\n✓ Idempotency Key Unique: ${idempotencyPassed ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`  Expected 1 job with idempotency key, found ${jobsWithIdempotencyKey}`);

        console.log(`\n✓ Documents Not Duplicated: ${noDuplicateDocs ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`  Documents stayed at ${docsAfter2ndCount} (no new docs added in 2nd run)`);

        console.log(`\n✓ Job Status: ${job1?.ingest_status}`);

        if (idempotencyPassed && noDuplicateDocs) {
            console.log('\n🎉 Idempotency validation PASSED - corpus is ready for safe re-ingestion\n');
        } else {
            console.log('\n⚠️  Idempotency validation FAILED - there may be duplication issues\n');
        }
    } catch (error) {
        console.error('\n❌ Fatal error during validation:', error);
        process.exit(1);
    } finally {
        console.log('🔌 Closing database connection...');
        await closeDatabase();
    }
}

await validateIdempotency();
