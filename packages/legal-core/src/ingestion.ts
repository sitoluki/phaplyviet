import type { IngestStatus, ParseStatus, LegalDocumentRecord, LegalSourceRecord } from './types.js';

export interface IngestionJobInput {
    idempotencyKey: string;
    legalSourceId: string;
    sourceUrl: string;
    jobType: string;
    sourceSnapshotUri?: string;
    sourceSnapshotChecksum?: string;
    parserVersion?: string;
}

export interface IngestionJobRecord extends IngestionJobInput {
    ingestionJobId: string;
    ingestStatus: IngestStatus;
    attemptCount: number;
    createdAt: string;
}

export interface ParseResult<TSection = unknown, TChunk = unknown, TWarning = string, TFragment = Record<string, unknown>> {
    parseStatus: ParseStatus;
    parseConfidence?: number;
    normalizedDocument: LegalDocumentRecord;
    sections: TSection[];
    chunks: TChunk[];
    warnings: TWarning[];
    unparsedFragments: TFragment[];
}

export interface RawSnapshotArtifact {
    sourceUrl: string;
    sourceName: string;
    objectStorageUri: string;
    checksum: string;
    fetchedAt: string;
    retentionNotes: string;
}

export interface IngestionLogger {
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    error(message: string, context?: Record<string, unknown>): void;
}

export interface SourceRepository {
    upsertSource(source: LegalSourceRecord): Promise<void>;
    findSourceByName(sourceName: string): Promise<LegalSourceRecord | null>;
}

export interface IngestionRepository {
    createJob(job: IngestionJobInput): Promise<IngestionJobRecord>;
    markJobStatus(ingestionJobId: string, status: IngestStatus): Promise<void>;
    recordError(ingestionJobId: string, error: { code: string; message: string; stack?: string; payload?: Record<string, unknown> }): Promise<void>;
}

export interface SnapshotStorage {
    saveRawSnapshot(input: { sourceUrl: string; payload: string; checksum: string; retentionNotes: string }): Promise<RawSnapshotArtifact>;
}

export interface ParseAdapter<TParsed = unknown> {
    sourceType: string;
    parse(input: { rawContent: string; sourceUrl: string; sourceName: string }): Promise<ParseResult<TParsed>>;
}

export interface IngestionCoordinator {
    ingest(input: IngestionJobInput): Promise<void>;
}
