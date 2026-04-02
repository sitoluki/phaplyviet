import type { LegalStatus, SectionType, SourceType } from './types.js';

export interface RawSampleInput {
    sampleId: string;
    sourceUrl: string;
    sourceName: string;
    sourceType: SourceType;
    documentType: string;
    rawContent: string;
    language?: string;
    parserVersion?: string;
}

export interface ParserWarning {
    code: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    lineNumber?: number;
    fragmentId?: string;
}

export interface UnparsedFragment {
    fragmentId: string;
    text: string;
    reason: string;
    lineNumber?: number;
}

export interface ParsedCitationRecord {
    citationId: string;
    legalDocumentId: string;
    legalDocumentSectionId: string;
    legalDocumentChunkId: string;
    sourceUrl: string;
    sourceName: string;
    citationLabel: string;
    sectionType: SectionType;
    sectionNumber?: string;
    pathKey: string;
}

export interface ParsedSectionNode {
    legalDocumentSectionId: string;
    legalDocumentId: string;
    parentSectionId?: string | null;
    sectionType: SectionType;
    sectionNumber?: string;
    heading?: string;
    title?: string;
    plainText: string;
    orderIndex: number;
    pathKey: string;
    citationLabel: string;
    metadataJson: Record<string, unknown>;
    depth: number;
    childrenSectionIds: string[];
    parentPathKey?: string;
}

export interface ParsedChunkNode {
    legalDocumentChunkId: string;
    legalDocumentId: string;
    legalDocumentSectionId: string;
    chunkIndex: number;
    chunkText: string;
    citationLabel: string;
    citationMetadataJson: Record<string, unknown>;
    tokenCount?: number;
    contentHash: string;
    sectionPathKey: string;
    sourceUrl: string;
    sourceName: string;
}

export interface ParsedDocumentMetadata {
    title: string;
    numberSymbol?: string;
    issuingBody?: string;
    signedDate?: string;
    effectiveDate?: string;
    expiryDate?: string;
    legalStatus?: LegalStatus;
    language: string;
}
