import { computeChecksum } from './checksum.js';

export function buildSourceFingerprint(input: {
    sourceUrl: string;
    sourceName: string;
    checksum: string;
    parserVersion?: string;
}): string {
    return computeChecksum(
        [
            input.sourceUrl.trim().toLowerCase(),
            input.sourceName.trim().toLowerCase(),
            input.checksum.trim().toLowerCase(),
            input.parserVersion?.trim().toLowerCase() ?? ''
        ].join('|')
    );
}
