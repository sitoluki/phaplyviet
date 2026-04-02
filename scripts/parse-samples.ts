import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
    parseLaborLawSampleDocument,
    summarizeChunkOutput,
    summarizeParsedOutput,
    type ParsedDocumentResult
} from '../packages/legal-core/src/parsing.js';

interface SampleManifestEntry {
    sampleId: string;
    filePath: string;
    sourceUrl: string;
    sourceName: string;
    sourceType: 'official_curated';
    documentType: string;
    language: string;
    parserVersion: string;
}

const root = process.cwd();
const manifestPath = path.join(root, 'fixtures', 'labor-law', 'manifest.json');
const parsedOutputDir = path.join(root, 'fixtures', 'labor-law', 'parsed');
const chunkOutputDir = path.join(root, 'fixtures', 'labor-law', 'chunks');

function usage(): never {
    console.log([
        'Usage:',
        '  npm run parse:samples -- parse-one <sampleId>',
        '  npm run parse:samples -- parse-all',
        '  npm run parse:samples -- inspect-parsed <parsed-json-file>',
        '  npm run parse:samples -- inspect-chunks <parsed-json-file>'
    ].join('\n'));
    process.exit(1);
}

async function loadManifest(): Promise<SampleManifestEntry[]> {
    const raw = await readFile(manifestPath, 'utf8');
    return JSON.parse(raw) as SampleManifestEntry[];
}

async function loadSample(entry: SampleManifestEntry): Promise<string> {
    return readFile(path.join(root, entry.filePath), 'utf8');
}

async function parseEntry(entry: SampleManifestEntry): Promise<ParsedDocumentResult> {
    const rawContent = await loadSample(entry);
    return parseLaborLawSampleDocument({
        sampleId: entry.sampleId,
        sourceUrl: entry.sourceUrl,
        sourceName: entry.sourceName,
        sourceType: entry.sourceType,
        documentType: entry.documentType,
        rawContent,
        language: entry.language,
        parserVersion: entry.parserVersion
    });
}

async function writeExampleOutputs(result: ParsedDocumentResult): Promise<void> {
    await mkdir(parsedOutputDir, { recursive: true });
    await mkdir(chunkOutputDir, { recursive: true });
    const sampleId = result.normalizedDocument.metadataJson.sampleId as string;
    await writeFile(path.join(parsedOutputDir, `${sampleId}.json`), JSON.stringify(result, null, 2), 'utf8');
    await writeFile(path.join(chunkOutputDir, `${sampleId}.json`), JSON.stringify(summarizeChunkOutput(result), null, 2), 'utf8');
}

async function commandParseOne(sampleId: string): Promise<void> {
    const manifest = await loadManifest();
    const entry = manifest.find((item) => item.sampleId === sampleId);
    if (!entry) {
        throw new Error(`Sample not found: ${sampleId}`);
    }
    const result = await parseEntry(entry);
    await writeExampleOutputs(result);
    console.log(JSON.stringify(result, null, 2));
}

async function commandParseAll(): Promise<void> {
    const manifest = await loadManifest();
    const results = await Promise.all(manifest.map((entry) => parseEntry(entry)));
    for (const result of results) {
        await writeExampleOutputs(result);
    }
    console.log(JSON.stringify(results, null, 2));
}

async function commandInspectParsed(filePath: string): Promise<void> {
    const raw = await readFile(path.isAbsolute(filePath) ? filePath : path.join(root, filePath), 'utf8');
    const result = JSON.parse(raw) as ParsedDocumentResult;
    console.log(summarizeParsedOutput(result));
    console.log(JSON.stringify(result.metadata, null, 2));
}

async function commandInspectChunks(filePath: string): Promise<void> {
    const raw = await readFile(path.isAbsolute(filePath) ? filePath : path.join(root, filePath), 'utf8');
    const result = JSON.parse(raw) as ParsedDocumentResult;
    console.log(JSON.stringify(summarizeChunkOutput(result), null, 2));
}

async function main(): Promise<void> {
    const [command, arg] = process.argv.slice(2);
    if (!command) {
        usage();
    }

    switch (command) {
        case 'parse-one':
            if (!arg) usage();
            await commandParseOne(arg);
            break;
        case 'parse-all':
            await commandParseAll();
            break;
        case 'inspect-parsed':
            if (!arg) usage();
            await commandInspectParsed(arg);
            break;
        case 'inspect-chunks':
            if (!arg) usage();
            await commandInspectChunks(arg);
            break;
        default:
            usage();
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
});
