import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { parseLaborLawSampleDocument } from '../packages/legal-core/src/parsing.js';

const root = process.cwd();
const manifestPath = path.join(root, 'fixtures', 'labor-law', 'manifest.json');

describe('labor-law parser pipeline', () => {
    it('parses article, clause, and point structures from the text sample', async () => {
        const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Array<{ sampleId: string; filePath: string; sourceUrl: string; sourceName: string; sourceType: 'official_curated'; documentType: string; language: string; parserVersion: string }>;
        const sample = manifest.find((item) => item.sampleId === 'labor_sample_01');
        if (!sample) {
            throw new Error('Missing labor_sample_01 fixture');
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

        expect(result.sections.some((section) => section.sectionType === 'part')).toBe(true);
        expect(result.sections.some((section) => section.sectionType === 'chapter')).toBe(true);
        expect(result.sections.some((section) => section.sectionType === 'section')).toBe(true);
        expect(result.sections.some((section) => section.sectionType === 'article')).toBe(true);
        expect(result.sections.some((section) => section.sectionType === 'clause')).toBe(true);
        expect(result.sections.some((section) => section.sectionType === 'point')).toBe(true);
    });

    it('preserves hierarchy integrity across parents and path keys', async () => {
        const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Array<{ sampleId: string; filePath: string; sourceUrl: string; sourceName: string; sourceType: 'official_curated'; documentType: string; language: string; parserVersion: string }>;
        const sample = manifest.find((item) => item.sampleId === 'labor_sample_01');
        if (!sample) {
            throw new Error('Missing labor_sample_01 fixture');
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

        const article = result.sections.find((section) => section.sectionType === 'article');
        const clause = result.sections.find((section) => section.sectionType === 'clause');
        expect(article).toBeTruthy();
        expect(clause?.parentSectionId).toBe(article?.legalDocumentSectionId);
        expect(article?.pathKey).toBeTruthy();
        expect(clause?.pathKey).toBeTruthy();
    });

    it('creates chunks that preserve citation metadata', async () => {
        const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Array<{ sampleId: string; filePath: string; sourceUrl: string; sourceName: string; sourceType: 'official_curated'; documentType: string; language: string; parserVersion: string }>;
        const sample = manifest.find((item) => item.sampleId === 'labor_sample_01');
        if (!sample) {
            throw new Error('Missing labor_sample_01 fixture');
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

        expect(result.chunks.length).toBeGreaterThan(0);
        expect(result.chunks[0]?.citationMetadataJson).toMatchObject({
            sourceUrl: sample.sourceUrl,
            sourceName: sample.sourceName
        });
        expect(result.citations[0]).toMatchObject({
            sourceUrl: sample.sourceUrl,
            sourceName: sample.sourceName
        });
    });

    it('emits warnings for uncertain cases', async () => {
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

        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.parseConfidence).toBeLessThan(1);
        expect(result.unparsedFragments.length).toBeGreaterThan(0);
    });

    it('does not drop content without reporting it', async () => {
        const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Array<{ sampleId: string; filePath: string; sourceUrl: string; sourceName: string; sourceType: 'official_curated'; documentType: string; language: string; parserVersion: string }>;
        const sample = manifest.find((item) => item.sampleId === 'labor_sample_01');
        if (!sample) {
            throw new Error('Missing labor_sample_01 fixture');
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

        const flattenedText = result.sections.map((section) => section.plainText).join('\n');
        expect(flattenedText.length).toBeGreaterThan(0);
        expect(result.warnings.every((warning) => typeof warning.message === 'string')).toBe(true);
    });
});
