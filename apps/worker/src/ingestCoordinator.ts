import type {
    IngestionCoordinator,
    IngestionJobInput,
    IngestionLogger,
    IngestionRepository,
    SourceRepository
} from '../../../packages/legal-core/src/ingestion.js';
import { VBPL_OFFICIAL_ATTACHMENT_RETENTION_NOTES, VBPL_OFFICIAL_BASE_URL, VBPL_OFFICIAL_LABOR_JOB_TYPE, VBPL_OFFICIAL_SOURCE_NAME, VbplOfficialLaborAdapter } from './vbplOfficialAdapter.js';

export class LegalIngestionCoordinator implements IngestionCoordinator {
    constructor(
        private readonly repositories: {
            sources: SourceRepository;
            ingestion: IngestionRepository;
        },
        private readonly officialLaborAdapter: VbplOfficialLaborAdapter,
        private readonly logger: IngestionLogger
    ) { }

    async ingest(input: IngestionJobInput): Promise<void> {
        const job = await this.repositories.ingestion.createJob(input);
        try {
            if (input.jobType !== VBPL_OFFICIAL_LABOR_JOB_TYPE) {
                throw new Error(`Unsupported jobType: ${input.jobType}`);
            }

            await this.repositories.sources.upsertSource({
                legalSourceId: input.legalSourceId,
                sourceName: VBPL_OFFICIAL_SOURCE_NAME,
                sourceType: 'official_curated',
                baseUrl: VBPL_OFFICIAL_BASE_URL,
                jurisdiction: 'VN',
                isActive: true,
                curatedOnly: true,
                sourceNotes: 'Curated VBPL labor-law pilot source.',
                retentionNotes: VBPL_OFFICIAL_ATTACHMENT_RETENTION_NOTES
            });

            const result = await this.officialLaborAdapter.ingestEntry(
                this.officialLaborAdapter.findEntryBySourceUrl(input.sourceUrl) ?? (() => {
                    throw new Error(`No curated VBPL manifest entry matched sourceUrl ${input.sourceUrl}`);
                })()
            );

            await this.repositories.ingestion.markJobStatus(job.ingestionJobId, 'parsed');
            this.logger.info('Official VBPL labor document ingested.', {
                ingestionJobId: job.ingestionJobId,
                sourceUrl: input.sourceUrl,
                parseStatus: result.parseResult.parseStatus,
                parseConfidence: result.parseResult.parseConfidence,
                attachmentUrl: result.attachmentUrl,
                idempotencyKey: result.idempotencyKey
            });
            return;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown ingestion failure';
            await this.repositories.ingestion.recordError(job.ingestionJobId, {
                code: 'OFFICIAL_SOURCE_INGEST_FAILED',
                message,
                stack: error instanceof Error ? error.stack : undefined,
                payload: {
                    sourceUrl: input.sourceUrl,
                    legalSourceId: input.legalSourceId,
                    jobType: input.jobType,
                    parserVersion: input.parserVersion ?? null
                }
            });
            await this.repositories.ingestion.markJobStatus(job.ingestionJobId, 'failed');
            this.logger.error('Official VBPL labor ingestion failed.', {
                ingestionJobId: job.ingestionJobId,
                sourceUrl: input.sourceUrl,
                errorMessage: message
            });
            throw error instanceof Error ? error : new Error(message);
        }
    }
}
