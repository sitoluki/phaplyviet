import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { parseLaborLawSampleDocument } from '../packages/legal-core/src/parsing.js';

const root = process.cwd();
const manifestPath = path.join(root, 'fixtures', 'labor-law', 'manifest.json');

describe('parser warnings', () => {
    it('surfaces uncertainty for malformed sample input', async () => {
        const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Array<{ sampleId: string; filePath: string; sourceUrl: string; sourceName: string; sourceType: 'official_curated'; documentType: string; language: string; parserVersion: string }>;
        const sample = manifest.find((item) => item.sampleId === 'labor_sample_02');
        if (!sample) {
            throw new Error('Missing labor_sample_02 fixture');
        }
        const rawContent = await readFile(path.join(root, sample.filePath), 'utf8');
        const result = parseLaborLawSampleDocument({
            sampleId: sample.sampleId,
            sourceUrl: sample.sourceUrl,
            sourceName: sample.sourceName,
            sourceType: sample.sourceType,
            documentType: sample.documentType,
            rawContent,
            language: sample.language,
            parserVersion: sample.parserVersion
        });

        expect(result.warnings.some((warning) => warning.code === 'UNPARSED_FRAGMENTS' || warning.code === 'MISSING_NUMBER')).toBe(true);
        expect(result.parseConfidence).toBeLessThan(1);
    });
});
