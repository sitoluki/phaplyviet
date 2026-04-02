import type { IngestionJobInput, IngestionJobRecord, IngestionRepository } from '../../../packages/legal-core/src/ingestion.js';
import type { IngestStatus } from '../../../packages/legal-core/src/types.js';

export class InMemoryIngestionRepository implements IngestionRepository {
    private readonly jobs = new Map<string, IngestionJobRecord>();

    async createJob(job: IngestionJobInput): Promise<IngestionJobRecord> {
        const record: IngestionJobRecord = {
            ...job,
            ingestionJobId: `job_${this.jobs.size + 1}`,
            ingestStatus: 'pending',
            attemptCount: 0,
            createdAt: new Date().toISOString()
        };
        this.jobs.set(record.ingestionJobId, record);
        return record;
    }

    async markJobStatus(ingestionJobId: string, status: IngestStatus): Promise<void> {
        const job = this.jobs.get(ingestionJobId);
        if (!job) {
            return;
        }
        job.ingestStatus = status;
    }

    async recordError(): Promise<void> {
        return;
    }
}
