import { createHash } from 'node:crypto';

export function computeChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex');
}

export function normalizeText(content: string): string {
    return content.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
