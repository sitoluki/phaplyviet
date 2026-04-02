export type LegalStatus =
    | 'unknown'
    | 'draft'
    | 'in_force'
    | 'expired'
    | 'superseded'
    | 'repealed'
    | 'archived';

export type SourceType = 'official' | 'official_curated' | 'reference' | 'internal';

export type SectionType =
    | 'part'
    | 'chapter'
    | 'section'
    | 'article'
    | 'clause'
    | 'point'
    | 'heading_title'
    | 'plain_text';

export type IngestStatus =
    | 'pending'
    | 'discovered'
    | 'fetched'
    | 'parsed'
    | 'normalized'
    | 'chunked'
    | 'embedded'
    | 'indexed'
    | 'failed'
    | 'skipped';

export type ParseStatus = 'pending' | 'parsed' | 'needs_review' | 'failed';

export interface LegalSourceRecord {
    legalSourceId: string;
    sourceName: string;
    sourceType: SourceType;
    baseUrl: string;
    jurisdiction: string;
    isActive: boolean;
    curatedOnly: boolean;
    sourceNotes?: string;
    retentionNotes?: string;
}

export interface LegalDocumentRecord {
    legalDocumentId: string;
    sourceUrl: string;
    sourceName: string;
    sourceType: SourceType;
    documentType: string;
    title: string;
    numberSymbol?: string;
    issuingBody?: string;
    signedDate?: string;
    effectiveDate?: string;
    expiryDate?: string;
    legalStatus?: LegalStatus;
    rawContent?: string;
    normalizedContent?: string;
    language: string;
    metadataJson: Record<string, unknown>;
    checksum: string;
}

export interface LegalSectionRecord {
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
}

export interface LegalChunkRecord {
    legalDocumentChunkId: string;
    legalDocumentId: string;
    legalDocumentSectionId: string;
    chunkIndex: number;
    chunkText: string;
    citationLabel: string;
    citationMetadataJson: Record<string, unknown>;
    tokenCount?: number;
    contentHash: string;
}
