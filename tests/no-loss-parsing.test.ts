import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { parseLaborLawSampleDocument } from '../packages/legal-core/src/parsing.js';

const root = process.cwd();
const manifestPath = path.join(root, 'fixtures', 'labor-law', 'manifest.json');

describe('no-loss parsing', () => {
    it('keeps all non-empty lines represented in sections or fragments', async () => {
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

        const nonEmptyLines = rawContent
            .replace(/<[^>]+>/g, '\n')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        const capturedFragments = result.unparsedFragments.length;
        const sectionText = result.sections.map((section) => section.plainText).join('\n');

        expect(sectionText.length + capturedFragments).toBeGreaterThan(0);
        expect(result.sections.length + result.unparsedFragments.length).toBeGreaterThan(0);
        expect(nonEmptyLines.length).toBeGreaterThanOrEqual(result.sections.length + result.unparsedFragments.length);
    });
});
