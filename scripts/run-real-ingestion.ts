import { initDatabase, runMigrations, closeDatabase } from '@legal/db/index.js';
import { PostgreSQLSourceRepository } from '@legal/db/sourceRepository.js';
import { PostgreSQLIngestionRepository } from '@legal/db/ingestionRepository.js';
import { PostgreSQLSnapshotStorageWithContent } from '@legal/db/snapshotStorage.js';
import { LegalIngestionCoordinator } from '@legal/worker/ingestCoordinator.js';
import { ConsoleIngestionLogger } from '@legal/worker/logger.js';
import { VbplOfficialLaborAdapter, VBPL_OFFICIAL_LABOR_PILOT, VBPL_OFFICIAL_LABOR_JOB_TYPE } from '@legal/worker/vbplOfficialAdapter.js';

async function runRealIngestion() {
    // Get database URL from environment or use default
    const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/phaplyviet_legal';

    console.log('🔄 Initializing database...');
    const db = initDatabase(dbUrl);

    try {
        console.log('📦 Running migrations...');
        await runMigrations();

        console.log('⚙️  Setting up repositories...');
        const sourceRepository = new PostgreSQLSourceRepository();
        const ingestionRepository = new PostgreSQLIngestionRepository();
        const snapshotStorage = new PostgreSQLSnapshotStorageWithContent();
        const logger = new ConsoleIngestionLogger();

        console.log('🔗 Creating VBPL official labor adapter...');
        const adapter = new VbplOfficialLaborAdapter({
            fetchClient: {
                async fetch(url: string) {
                    const response = await fetch(url);
                    return response as any;
                }
            },
            snapshotStorage,
            logger,
            textExtractor: undefined as any, // Will use default
            parserVersion: 'vbpl-official-curated-v1'
        });

        console.log('📋 Coordinator created with real repositories');
        const coordinator = new LegalIngestionCoordinator(
            {
                sources: sourceRepository,
                ingestion: ingestionRepository
            },
            adapter,
            logger
        );

        console.log(`\n📥 Starting real ingestion of ${VBPL_OFFICIAL_LABOR_PILOT.length} documents...\n`);

        const results: Array<{
            itemId: number;
            title: string;
            success: boolean;
            jobId?: string;
            error?: string;
        }> = [];

        for (const entry of VBPL_OFFICIAL_LABOR_PILOT) {
            try {
                console.log(`\n📄 Ingesting: ${entry.title} (ItemID: ${entry.itemId})`);

                const job = await ingestionRepository.createJob({
                    idempotencyKey: `vbpl-${entry.itemId}-v1`,
                    legalSourceId: `vbpl_labor_${entry.itemId}`,
                    sourceUrl: entry.sourceUrl,
                    jobType: VBPL_OFFICIAL_LABOR_JOB_TYPE,
                    parserVersion: 'vbpl-official-curated-v1'
                });

                await coordinator.ingest({
                    idempotencyKey: `vbpl-${entry.itemId}-v1`,
                    legalSourceId: `vbpl_labor_${entry.itemId}`,
                    sourceUrl: entry.sourceUrl,
                    jobType: VBPL_OFFICIAL_LABOR_JOB_TYPE,
                    parserVersion: 'vbpl-official-curated-v1'
                });

                results.push({
                    itemId: entry.itemId,
                    title: entry.title,
                    success: true,
                    jobId: job.ingestionJobId
                });

                console.log(`✅ Successfully ingested ${entry.title}`);
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                console.error(`❌ Failed to ingest ${entry.title}: ${errorMsg}`);
                results.push({
                    itemId: entry.itemId,
                    title: entry.title,
                    success: false,
                    error: errorMsg
                });
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('📊 INGESTION SUMMARY');
        console.log('='.repeat(80));
        const successCount = results.filter((r) => r.success).length;
        console.log(`Total: ${results.length}, Successful: ${successCount}, Failed: ${results.length - successCount}\n`);

        for (const result of results) {
            const status = result.success ? '✅' : '❌';
            console.log(`${status} ItemID ${result.itemId}: ${result.title}`);
            if (!result.success) {
                console.log(`   Error: ${result.error}`);
            }
        }

        console.log('\n✨ Real ingestion validation complete!');
    } catch (error) {
        console.error('\n❌ Fatal error during ingestion:', error);
        process.exit(1);
    } finally {
        console.log('\n🔌 Closing database connection...');
        await closeDatabase();
    }
}

await runRealIngestion();
