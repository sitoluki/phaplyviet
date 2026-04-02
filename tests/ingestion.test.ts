import { describe, expect, it } from 'vitest';
import { computeChecksum } from '../packages/legal-core/src/checksum.js';
import { createLegalChunkId, createLegalDocumentId, createLegalSectionPathKey } from '../packages/legal-core/src/ids.js';
import { validateCitationTrace } from '../packages/legal-core/src/citation.js';
import { buildSourceFingerprint } from '../packages/legal-core/src/idempotency.js';

describe('legal corpus foundation', () => {
    it('creates deterministic legal document ids', () => {
        const first = createLegalDocumentId({
            sourceUrl: 'https://example.gov.vn/doc/1',
            sourceName: 'Ministry of Labor',
            documentType: 'labor_law',
            numberSymbol: '01/2026/LD',
            signedDate: '2026-01-01',
            language: 'vi'
        });
        const second = createLegalDocumentId({
            sourceUrl: 'https://example.gov.vn/doc/1',
            sourceName: 'Ministry of Labor',
            documentType: 'labor_law',
            numberSymbol: '01/2026/LD',
            signedDate: '2026-01-01',
            language: 'vi'
        });

        expect(first).toBe(second);
    });

    it('creates deterministic section path keys', () => {
        const pathKey = createLegalSectionPathKey({
            legalDocumentId: 'ld_123',
            sectionType: 'article',
            sectionNumber: '12',
            parentPathKey: 'root',
            orderIndex: 1
        });
        const repeated = createLegalSectionPathKey({
            legalDocumentId: 'ld_123',
            sectionType: 'article',
            sectionNumber: '12',
            parentPathKey: 'root',
            orderIndex: 1
        });

        expect(pathKey).toBe(repeated);
    });

    it('creates deterministic chunk ids', () => {
        const chunkId = createLegalChunkId({
            legalDocumentId: 'ld_123',
            legalDocumentSectionId: 'sec_1',
            chunkIndex: 0,
            chunkText: '  Labor rights apply here. '
        });
        const repeated = createLegalChunkId({
            legalDocumentId: 'ld_123',
            legalDocumentSectionId: 'sec_1',
            chunkIndex: 0,
            chunkText: 'Labor rights apply here.'
        });

        expect(chunkId).toBe(repeated);
    });

    it('builds an idempotent ingestion fingerprint', () => {
        const fingerprint1 = buildSourceFingerprint({
            sourceUrl: 'https://example.gov.vn/doc/1',
            sourceName: 'Ministry of Labor',
            checksum: computeChecksum('abc'),
            parserVersion: 'v1'
        });
        const fingerprint2 = buildSourceFingerprint({
            sourceUrl: 'https://example.gov.vn/doc/1',
            sourceName: 'Ministry of Labor',
            checksum: computeChecksum('abc'),
            parserVersion: 'v1'
        });

        expect(fingerprint1).toBe(fingerprint2);
    });

    it('validates citation traceability links', () => {
        expect(
            validateCitationTrace({
                citationId: 'C1',
                chunkId: 'ck_1',
                sectionId: 'sec_1',
                documentId: 'ld_1',
                sourceUrl: 'https://example.gov.vn/doc/1',
                citationLabel: 'Article 1'
            })
        ).toBe(true);
    });
});
