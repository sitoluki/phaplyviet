import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';

function sha256Hex(input: string): string {
    return createHash('sha256').update(input).digest('hex');
}

export function createLegalDocumentId(input: {
    sourceUrl: string;
    sourceName: string;
    documentType: string;
    numberSymbol?: string;
    signedDate?: string;
    language?: string;
}): string {
    const stableInput = [
        input.sourceUrl.trim().toLowerCase(),
        input.sourceName.trim().toLowerCase(),
        input.documentType.trim().toLowerCase(),
        input.numberSymbol?.trim().toLowerCase() ?? '',
        input.signedDate?.trim() ?? '',
        input.language?.trim().toLowerCase() ?? 'vi'
    ].join('|');

    return `ld_${sha256Hex(stableInput).slice(0, 32)}`;
}

export function createLegalSectionId(input: {
    legalDocumentId: string;
    pathKey: string;
}): string {
    return `sec_${sha256Hex([input.legalDocumentId, input.pathKey].join('|')).slice(0, 32)}`;
}

export function createLegalSectionPathKey(input: {
    legalDocumentId: string;
    sectionType: string;
    sectionNumber?: string;
    parentPathKey?: string;
    orderIndex: number;
}): string {
    const stableInput = [
        input.legalDocumentId,
        input.parentPathKey ?? 'root',
        input.sectionType,
        input.sectionNumber ?? '',
        String(input.orderIndex)
    ].join('|');

    return `sp_${sha256Hex(stableInput).slice(0, 24)}`;
}

export function createLegalChunkId(input: {
    legalDocumentId: string;
    legalDocumentSectionId: string;
    chunkIndex: number;
    chunkText: string;
}): string {
    const stableInput = [
        input.legalDocumentId,
        input.legalDocumentSectionId,
        String(input.chunkIndex),
        input.chunkText.trim().replace(/\s+/g, ' ')
    ].join('|');

    return `ck_${sha256Hex(stableInput).slice(0, 32)}`;
}

export function generateId(prefix: string = ''): string {
    const uuid = randomUUID().replace(/-/g, '');
    return prefix ? `${prefix}_${uuid.slice(0, 16)}` : uuid.slice(0, 24);
}
