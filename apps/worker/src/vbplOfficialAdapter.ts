import { Buffer } from 'node:buffer';
import { computeChecksum } from '../../../packages/legal-core/src/checksum.js';
import { buildSourceFingerprint } from '../../../packages/legal-core/src/idempotency.js';
import type { IngestionLogger, RawSnapshotArtifact, SnapshotStorage } from '../../../packages/legal-core/src/ingestion.js';
import { parseLaborLawSampleDocument, summarizeParsedOutput } from '../../../packages/legal-core/src/parsing.js';
import type { ParsedDocumentResult } from '../../../packages/legal-core/src/parsing.js';
import type { SourceType } from '../../../packages/legal-core/src/types.js';

export const VBPL_OFFICIAL_LABOR_JOB_TYPE = 'vbpl_official_labor_curated';
export const VBPL_OFFICIAL_SOURCE_NAME = 'vbpl.vn/TW';
export const VBPL_OFFICIAL_BASE_URL = 'https://vbpl.vn/TW';
export const VBPL_OFFICIAL_ATTACHMENT_RETENTION_NOTES = 'Retain the official VBPL source page snapshot plus attachment URL for re-fetchability and audit.';

export interface VbplLaborPilotEntry {
    sampleId: string;
    itemId: number;
    code: string;
    title: string;
    documentType: string;
    sourceType: SourceType;
    sourceUrl: string;
    sourcePageUrl: string;
    attachmentUrl?: string;
    sourceYear: number;
    remarks?: string;
}

export const VBPL_OFFICIAL_LABOR_PILOT: VbplLaborPilotEntry[] = [
    {
        sampleId: 'vbpl_labor_1994_code',
        itemId: 10427,
        code: 'BLLD-1994',
        title: 'Bộ luật Không số',
        documentType: 'labor_code',
        sourceType: 'official_curated',
        sourceUrl: `${VBPL_OFFICIAL_BASE_URL}/Pages/vbpq-van-ban-goc.aspx?ItemID=10427`,
        sourcePageUrl: `${VBPL_OFFICIAL_BASE_URL}/Pages/vbpq-van-ban-goc.aspx?ItemID=10427`,
        sourceYear: 1994,
        remarks: 'First labor-code anchor for the pilot.'
    },
    {
        sampleId: 'vbpl_labor_2012_code',
        itemId: 27615,
        code: '10/2012/QH13',
        title: 'Bộ luật 10/2012/QH13 Lao động',
        documentType: 'labor_code',
        sourceType: 'official_curated',
        sourceUrl: `${VBPL_OFFICIAL_BASE_URL}/Pages/vbpq-van-ban-goc.aspx?ItemID=27615`,
        sourcePageUrl: `${VBPL_OFFICIAL_BASE_URL}/Pages/vbpq-van-ban-goc.aspx?ItemID=27615`,
        sourceYear: 2012,
        remarks: 'Predecessor labor code in the official history chain.'
    },
    {
        sampleId: 'vbpl_labor_2019_code',
        itemId: 139264,
        code: '45/2019/QH14',
        title: 'Bộ luật 45/2019/QH14',
        documentType: 'labor_code',
        sourceType: 'official_curated',
        sourceUrl: `${VBPL_OFFICIAL_BASE_URL}/Pages/vbpq-van-ban-goc.aspx?ItemID=139264`,
        sourcePageUrl: `${VBPL_OFFICIAL_BASE_URL}/Pages/vbpq-van-ban-goc.aspx?ItemID=139264`,
        sourceYear: 2019,
        remarks: 'Main 2019 labor code anchor.'
    },
    {
        sampleId: 'vbpl_labor_2020_workers_abroad',
        itemId: 146643,
        code: '69/2020/QH14',
        title: 'Luật 69/2020/QH14',
        documentType: 'labor_related_law',
        sourceType: 'official_curated',
        sourceUrl: `${VBPL_OFFICIAL_BASE_URL}/Pages/vbpq-van-ban-goc.aspx?ItemID=146643`,
        sourcePageUrl: `${VBPL_OFFICIAL_BASE_URL}/Pages/vbpq-van-ban-goc.aspx?ItemID=146643`,
        sourceYear: 2020,
        remarks: 'Labor-market adjacent official law used to round out the pilot set.'
    },
    {
        sampleId: 'vbpl_labor_2024_union_law',
        itemId: 172553,
        code: '50/2024/QH15',
        title: 'Luật 50/2024/QH15',
        documentType: 'labor_related_law',
        sourceType: 'official_curated',
        sourceUrl: `${VBPL_OFFICIAL_BASE_URL}/Pages/vbpq-van-ban-goc.aspx?ItemID=172553`,
        sourcePageUrl: `${VBPL_OFFICIAL_BASE_URL}/Pages/vbpq-van-ban-goc.aspx?ItemID=172553`,
        sourceYear: 2024,
        remarks: 'Current labor-adjacent official law for the pilot.'
    }
];

export interface VbplFetchResponse {
    ok: boolean;
    status: number;
    url: string;
    headers: { get(name: string): string | null };
    text(): Promise<string>;
    arrayBuffer(): Promise<ArrayBuffer>;
}

export interface VbplFetchClient {
    fetch(url: string): Promise<VbplFetchResponse>;
}

export interface VbplDocumentTextExtractor {
    extract(input: {
        entry: VbplLaborPilotEntry;
        attachmentUrl: string;
        attachmentFilename?: string;
        attachmentBytes: Buffer;
        attachmentContentType?: string | null;
        sourcePageHtml: string;
    }): Promise<string>;
}

export interface OfficialSourceIngestionResult {
    entry: VbplLaborPilotEntry;
    sourceSnapshot: RawSnapshotArtifact;
    attachmentUrl?: string;
    attachmentFilename?: string;
    attachmentChecksum?: string;
    extractedTextChecksum: string;
    parseResult: ParsedDocumentResult;
    idempotencyKey: string;
}

function resolveAttachmentUrl(sourcePageHtml: string, sourcePageUrl: string): { attachmentUrl?: string; attachmentFilename?: string } {
    const downloadMatch = sourcePageHtml.match(/downloadfile\('([^']+)','([^']+)'\)/i);
    if (downloadMatch) {
        return {
            attachmentFilename: downloadMatch[1],
            attachmentUrl: new URL(downloadMatch[2], sourcePageUrl).toString()
        };
    }

    const embeddedMatch = sourcePageHtml.match(/data="([^"]+)"/i);
    if (embeddedMatch) {
        const embeddedUrl = embeddedMatch[1].split('#')[0];
        return {
            attachmentUrl: new URL(embeddedUrl, sourcePageUrl).toString()
        };
    }

    return {};
}

async function extractPdfText(attachmentBytes: Buffer): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfModule: any = await import('pdf-parse');
    const parser = typeof pdfModule.default === 'function' ? pdfModule.default : pdfModule;
    const parsed = await parser(attachmentBytes);
    return parsed.text?.trim() ?? '';
}

export class VbplOfficialLaborDocumentTextExtractor implements VbplDocumentTextExtractor {
    async extract(input: {
        entry: VbplLaborPilotEntry;
        attachmentUrl: string;
        attachmentFilename?: string;
        attachmentBytes: Buffer;
        attachmentContentType?: string | null;
        sourcePageHtml: string;
    }): Promise<string> {
        const contentType = input.attachmentContentType?.toLowerCase() ?? '';
        if (contentType.includes('pdf') || input.attachmentUrl.toLowerCase().endsWith('.pdf') || input.attachmentFilename?.toLowerCase().endsWith('.pdf') === true) {
            return extractPdfText(input.attachmentBytes);
        }

        if (contentType.includes('text') || contentType.includes('html') || input.attachmentUrl.toLowerCase().endsWith('.txt') || input.attachmentUrl.toLowerCase().endsWith('.html')) {
            return input.attachmentBytes.toString('utf8').trim();
        }

        return input.attachmentBytes.toString('utf8').trim();
    }
}

export class VbplOfficialLaborAdapter {
    constructor(
        private readonly dependencies: {
            fetchClient: VbplFetchClient;
            snapshotStorage: SnapshotStorage;
            logger: IngestionLogger;
            textExtractor?: VbplDocumentTextExtractor;
            parserVersion?: string;
        }
    ) { }

    get manifest(): VbplLaborPilotEntry[] {
        return VBPL_OFFICIAL_LABOR_PILOT.slice();
    }

    findEntryBySourceUrl(sourceUrl: string): VbplLaborPilotEntry | undefined {
        return VBPL_OFFICIAL_LABOR_PILOT.find((entry) => entry.sourceUrl === sourceUrl);
    }

    async ingestEntry(entry: VbplLaborPilotEntry): Promise<OfficialSourceIngestionResult> {
        const sourcePageResponse = await this.dependencies.fetchClient.fetch(entry.sourcePageUrl);
        if (!sourcePageResponse.ok) {
            throw new Error(`VBPL source page request failed with status ${sourcePageResponse.status} for ${entry.sourcePageUrl}`);
        }

        const sourcePageHtml = await sourcePageResponse.text();
        const resolvedAttachment = resolveAttachmentUrl(sourcePageHtml, entry.sourcePageUrl);
        const attachmentUrl = entry.attachmentUrl ?? resolvedAttachment.attachmentUrl;
        const attachmentFilename = resolvedAttachment.attachmentFilename;
        let attachmentBytes = Buffer.from('');
        let attachmentChecksum: string | undefined;
        let attachmentContentType: string | null | undefined;
        let extractedText = '';

        if (attachmentUrl) {
            const attachmentResponse = await this.dependencies.fetchClient.fetch(attachmentUrl);
            if (!attachmentResponse.ok) {
                throw new Error(`VBPL attachment request failed with status ${attachmentResponse.status} for ${attachmentUrl}`);
            }

            attachmentContentType = attachmentResponse.headers.get('content-type');
            attachmentBytes = Buffer.from(await attachmentResponse.arrayBuffer());
            attachmentChecksum = computeChecksum(attachmentBytes.toString('binary'));
            extractedText = this.dependencies.textExtractor
                ? await this.dependencies.textExtractor.extract({
                    entry,
                    attachmentUrl,
                    attachmentFilename,
                    attachmentBytes,
                    attachmentContentType,
                    sourcePageHtml
                })
                : await new VbplOfficialLaborDocumentTextExtractor().extract({
                    entry,
                    attachmentUrl,
                    attachmentFilename,
                    attachmentBytes,
                    attachmentContentType,
                    sourcePageHtml
                });
        }

        const fallbackContent = extractedText.length > 0 ? extractedText : sourcePageHtml;
        const sourceSnapshot = await this.dependencies.snapshotStorage.saveRawSnapshot({
            sourceUrl: entry.sourcePageUrl,
            payload: sourcePageHtml,
            checksum: computeChecksum(sourcePageHtml),
            retentionNotes: VBPL_OFFICIAL_ATTACHMENT_RETENTION_NOTES
        });

        const parseResult = parseLaborLawSampleDocument({
            sampleId: entry.sampleId,
            sourceUrl: entry.sourcePageUrl,
            sourceName: VBPL_OFFICIAL_SOURCE_NAME,
            sourceType: 'official_curated',
            documentType: entry.documentType,
            rawContent: fallbackContent,
            language: 'vi',
            parserVersion: this.dependencies.parserVersion ?? 'vbpl-official-curated-v1'
        });

        const idempotencyKey = buildSourceFingerprint({
            sourceUrl: entry.sourcePageUrl,
            sourceName: VBPL_OFFICIAL_SOURCE_NAME,
            checksum: sourceSnapshot.checksum,
            parserVersion: this.dependencies.parserVersion ?? 'vbpl-official-curated-v1'
        });

        this.dependencies.logger.info('VBPL official document ingested.', {
            sampleId: entry.sampleId,
            itemId: entry.itemId,
            attachmentUrl,
            parseSummary: summarizeParsedOutput(parseResult),
            sourceSnapshotUri: sourceSnapshot.objectStorageUri,
            idempotencyKey
        });

        return {
            entry,
            sourceSnapshot,
            attachmentUrl,
            attachmentFilename,
            attachmentChecksum,
            extractedTextChecksum: computeChecksum(fallbackContent),
            parseResult,
            idempotencyKey
        };
    }

    async ingestAll(entries: VbplLaborPilotEntry[] = VBPL_OFFICIAL_LABOR_PILOT): Promise<OfficialSourceIngestionResult[]> {
        const results: OfficialSourceIngestionResult[] = [];
        for (const entry of entries) {
            results.push(await this.ingestEntry(entry));
        }
        return results;
    }
}
