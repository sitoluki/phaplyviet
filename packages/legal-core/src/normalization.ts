import { normalizeText } from './checksum.js';
import type { LegalDocumentRecord } from './types.js';

export function normalizeDocumentContent(rawContent: string): string {
    return normalizeText(rawContent);
}

export function buildNormalizedDocument(input: LegalDocumentRecord): LegalDocumentRecord {
    return {
        ...input,
        normalizedContent: input.normalizedContent ?? normalizeDocumentContent(input.rawContent ?? '')
    };
}
