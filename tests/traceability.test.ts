import { describe, expect, it } from 'vitest';
import { validateCitationTrace } from '../packages/legal-core/src/citation.js';

describe('citation traceability constraints', () => {
    it('requires every citation to link chunk, section, document, and source', () => {
        const valid = validateCitationTrace({
            citationId: 'C1',
            chunkId: 'ck_1',
            sectionId: 'sec_1',
            documentId: 'ld_1',
            sourceUrl: 'https://example.gov.vn/doc/1',
            citationLabel: 'Article 1'
        });

        const invalid = validateCitationTrace({
            citationId: '',
            chunkId: 'ck_1',
            sectionId: 'sec_1',
            documentId: 'ld_1',
            sourceUrl: 'https://example.gov.vn/doc/1',
            citationLabel: 'Article 1'
        });

        expect(valid).toBe(true);
        expect(invalid).toBe(false);
    });
});
