import { describe, expect, it } from 'vitest';
import { computeChecksum } from '../packages/legal-core/src/checksum.js';
import { buildSourceFingerprint } from '../packages/legal-core/src/idempotency.js';

describe('idempotent ingestion logic', () => {
    it('produces the same fingerprint for the same source checksum and parser version', () => {
        const fingerprintA = buildSourceFingerprint({
            sourceUrl: 'https://example.gov.vn/doc/1',
            sourceName: 'Ministry of Labor',
            checksum: computeChecksum('same-content'),
            parserVersion: 'v1'
        });

        const fingerprintB = buildSourceFingerprint({
            sourceUrl: 'https://example.gov.vn/doc/1',
            sourceName: 'Ministry of Labor',
            checksum: computeChecksum('same-content'),
            parserVersion: 'v1'
        });

        expect(fingerprintA).toBe(fingerprintB);
    });
});
