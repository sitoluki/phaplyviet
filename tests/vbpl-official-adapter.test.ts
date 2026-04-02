import { describe, expect, it } from 'vitest';
import { ConsoleIngestionLogger } from '../apps/worker/src/logger.js';
import { LegalIngestionCoordinator } from '../apps/worker/src/ingestCoordinator.js';
import {
    VBPL_OFFICIAL_LABOR_JOB_TYPE,
    VBPL_OFFICIAL_LABOR_PILOT,
    VbplOfficialLaborAdapter,
    type VbplFetchClient,
    type VbplFetchResponse,
    type VbplDocumentTextExtractor
} from '../apps/worker/src/vbplOfficialAdapter.js';
import type { IngestionJobInput, IngestionJobRecord, IngestionRepository, RawSnapshotArtifact, SnapshotStorage, SourceRepository } from '../packages/legal-core/src/ingestion.js';
import type { LegalSourceRecord } from '../packages/legal-core/src/types.js';

class InMemorySnapshotStorage implements SnapshotStorage {
    public readonly snapshots: RawSnapshotArtifact[] = [];

    async saveRawSnapshot(input: { sourceUrl: string; payload: string; checksum: string; retentionNotes: string }): Promise<RawSnapshotArtifact> {
        const snapshot: RawSnapshotArtifact = {
            sourceUrl: input.sourceUrl,
            sourceName: `snapshot_${this.snapshots.length + 1}`,
            objectStorageUri: `memory://${this.snapshots.length + 1}.html`,
            checksum: input.checksum,
            fetchedAt: new Date().toISOString(),
            retentionNotes: input.retentionNotes
        };
        this.snapshots.push(snapshot);
        return snapshot;
    }
}

class StaticSourceRepository implements SourceRepository {
    private readonly sources = new Map<string, LegalSourceRecord>();

    async upsertSource(source: LegalSourceRecord): Promise<void> {
        this.sources.set(source.sourceName, source);
    }

    async findSourceByName(sourceName: string): Promise<LegalSourceRecord | null> {
        return this.sources.get(sourceName) ?? null;
    }
}

class MockResponse implements VbplFetchResponse {
    constructor(
        public readonly ok: boolean,
        public readonly status: number,
        public readonly url: string,
        private readonly body: string,
        private readonly contentType: string
    ) { }

    headers = {
        get: (name: string) => (name.toLowerCase() === 'content-type' ? this.contentType : null)
    };

    async text(): Promise<string> {
        return this.body;
    }

    async arrayBuffer(): Promise<ArrayBuffer> {
        return new TextEncoder().encode(this.body).buffer;
    }
}

class MockFetchClient implements VbplFetchClient {
    constructor(private readonly responses: Map<string, MockResponse>) { }

    async fetch(url: string): Promise<VbplFetchResponse> {
        const response = this.responses.get(url);
        if (!response) {
            throw new Error(`Missing mock response for ${url}`);
        }
        return response;
    }
}

describe('VBPL official labor adapter', () => {
    it('contains a curated five-document labor pilot manifest', () => {
        expect(VBPL_OFFICIAL_LABOR_PILOT).toHaveLength(5);
        expect(new Set(VBPL_OFFICIAL_LABOR_PILOT.map((entry) => entry.itemId)).size).toBe(5);
        expect(VBPL_OFFICIAL_LABOR_PILOT.every((entry) => entry.sourceType === 'official_curated')).toBe(true);
        expect(VBPL_OFFICIAL_LABOR_PILOT.every((entry) => entry.sourceUrl.includes('vbpq-van-ban-goc.aspx?ItemID='))).toBe(true);
    });

    it('ingests a curated VBPL source page and parses the attached document text', async () => {
        const entry = VBPL_OFFICIAL_LABOR_PILOT.find((item) => item.itemId === 139264);
        expect(entry).toBeDefined();
        const sourcePageHtml = `
            <html>
              <body>
                <a href="javascript:downloadfile('VanBanGoc_BO LUAT 45 QH14.pdf','/FileData/TW/Lists/vbpq/Attachments/139264/VanBanGoc_BO LUAT 45 QH14.pdf');">BO LUAT 45 QH14.pdf</a>
              </body>
            </html>
        `;
        const extractedText = `
            BỘ LUẬT 45/2019/QH14
            Bộ Luật lao động
            Số: 45/2019/QH14
            Cơ quan ban hành: Quốc hội
            Ngày ban hành: 20/11/2019
            Hiệu lực từ: 01/01/2021

            Điều 1. Phạm vi điều chỉnh
            1. Bộ luật này quy định ...
            a) Người lao động ...
        `;
        const attachmentUrlWithSpaces = 'https://vbpl.vn/FileData/TW/Lists/vbpq/Attachments/139264/VanBanGoc_BO LUAT 45 QH14.pdf';
        const attachmentUrlEncoded = 'https://vbpl.vn/FileData/TW/Lists/vbpq/Attachments/139264/VanBanGoc_BO%20LUAT%2045%20QH14.pdf';
        const responses = new Map<string, MockResponse>([
            [
                entry!.sourcePageUrl,
                new MockResponse(true, 200, entry!.sourcePageUrl, sourcePageHtml, 'text/html; charset=utf-8')
            ],
            [
                attachmentUrlEncoded,
                new MockResponse(true, 200, attachmentUrlEncoded, extractedText, 'application/pdf')
            ]
        ]);

        const snapshotStorage = new InMemorySnapshotStorage();
        const adapter = new VbplOfficialLaborAdapter({
            fetchClient: new MockFetchClient(responses),
            snapshotStorage,
            logger: new ConsoleIngestionLogger(),
            textExtractor: {
                async extract(input) {
                    return input.attachmentBytes.toString('utf8');
                }
            } satisfies VbplDocumentTextExtractor,
            parserVersion: 'vbpl-official-curated-v1'
        });

        const result = await adapter.ingestEntry(entry!);

        expect(result.entry.itemId).toBe(139264);
        expect(result.attachmentUrl).toContain('VanBanGoc_BO');
        expect(result.sourceSnapshot.sourceUrl).toBe(entry!.sourcePageUrl);
        // Parser may return 'parsed' or 'needs_review' depending on confidence
        expect(['parsed', 'needs_review']).toContain(result.parseResult.parseStatus);
        expect(result.parseResult.metadata.title).toBeTruthy();
        expect(result.parseResult.sections.length).toBeGreaterThan(0);
        expect(snapshotStorage.snapshots).toHaveLength(1);
        expect(result.idempotencyKey).toBeTruthy();
        expect(result.extractedTextChecksum).toBeTruthy();
    });

    it('routes curated VBPL ingestion jobs through the coordinator', async () => {
        const entry = VBPL_OFFICIAL_LABOR_PILOT.find((item) => item.itemId === 139264);
        expect(entry).toBeDefined();
        const sourcePageHtml = `
            <html>
              <body>
                <a href="javascript:downloadfile('VanBanGoc_BO LUAT 45 QH14.pdf','/FileData/TW/Lists/vbpq/Attachments/139264/VanBanGoc_BO LUAT 45 QH14.pdf');">BO LUAT 45 QH14.pdf</a>
              </body>
            </html>
        `;
        const extractedText = `
            BỘ LUẬT 45/2019/QH14
            Bộ Luật lao động
            Số: 45/2019/QH14
            Cơ quan ban hành: Quốc hội
            Ngày ban hành: 20/11/2019
            Hiệu lực từ: 01/01/2021

            Điều 1. Phạm vi điều chỉnh
            1. Bộ luật này quy định ...
        `;
        const attachmentUrlEncoded = 'https://vbpl.vn/FileData/TW/Lists/vbpq/Attachments/139264/VanBanGoc_BO%20LUAT%2045%20QH14.pdf';
        const responses = new Map<string, MockResponse>([
            [
                entry!.sourcePageUrl,
                new MockResponse(true, 200, entry!.sourcePageUrl, sourcePageHtml, 'text/html; charset=utf-8')
            ],
            [
                attachmentUrlEncoded,
                new MockResponse(true, 200, attachmentUrlEncoded, extractedText, 'application/pdf')
            ]
        ]);

        class TrackingIngestionRepository implements IngestionRepository {
            public readonly jobs = new Map<string, IngestionJobRecord>();
            public readonly errors: Array<{ ingestionJobId: string; code: string; message: string }> = [];

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

            async markJobStatus(ingestionJobId: string, status: 'pending' | 'discovered' | 'fetched' | 'parsed' | 'normalized' | 'chunked' | 'embedded' | 'indexed' | 'failed' | 'skipped'): Promise<void> {
                const job = this.jobs.get(ingestionJobId);
                if (job) {
                    job.ingestStatus = status;
                }
            }

            async recordError(ingestionJobId: string, error: { code: string; message: string }): Promise<void> {
                this.errors.push({ ingestionJobId, code: error.code, message: error.message });
            }
        }

        const ingestionRepository = new TrackingIngestionRepository();
        const coordinator = new LegalIngestionCoordinator(
            {
                sources: new StaticSourceRepository(),
                ingestion: ingestionRepository
            },
            new VbplOfficialLaborAdapter({
                fetchClient: new MockFetchClient(responses),
                snapshotStorage: new InMemorySnapshotStorage(),
                logger: new ConsoleIngestionLogger(),
                textExtractor: {
                    async extract(input) {
                        return input.attachmentBytes.toString('utf8');
                    }
                } satisfies VbplDocumentTextExtractor,
                parserVersion: 'vbpl-official-curated-v1'
            }),
            new ConsoleIngestionLogger()
        );

        await coordinator.ingest({
            idempotencyKey: 'vbpl-139264',
            legalSourceId: 'vbpl_official_labor',
            sourceUrl: entry!.sourcePageUrl,
            jobType: VBPL_OFFICIAL_LABOR_JOB_TYPE,
            parserVersion: 'vbpl-official-curated-v1'
        });

        expect(ingestionRepository.errors).toHaveLength(0);
        expect(Array.from(ingestionRepository.jobs.values())[0]?.ingestStatus).toBe('parsed');
    });
});
