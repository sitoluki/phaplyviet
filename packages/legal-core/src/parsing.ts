import { computeChecksum, normalizeText } from './checksum.js';
import { createLegalChunkId, createLegalDocumentId, createLegalSectionId, createLegalSectionPathKey } from './ids.js';
import type { ParseStatus, LegalDocumentRecord, LegalSectionRecord, LegalChunkRecord, LegalStatus, SectionType, SourceType } from './types.js';
import type { ParseResult } from './ingestion.js';

export interface RawSampleInput {
    sampleId: string;
    sourceUrl: string;
    sourceName: string;
    sourceType: SourceType;
    documentType: string;
    rawContent: string;
    language?: string;
    parserVersion?: string;
}

export interface ParserWarning {
    code: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    lineNumber?: number;
    fragmentId?: string;
}

export interface UnparsedFragment {
    fragmentId: string;
    text: string;
    reason: string;
    lineNumber?: number;
}

export interface ParsedCitationRecord {
    citationId: string;
    legalDocumentId: string;
    legalDocumentSectionId: string;
    legalDocumentChunkId: string;
    sourceUrl: string;
    sourceName: string;
    citationLabel: string;
    sectionType: SectionType;
    sectionNumber?: string;
    pathKey: string;
}

export interface ParsedSectionNode extends LegalSectionRecord {
    depth: number;
    childrenSectionIds: string[];
    parentPathKey?: string;
}

export interface ParsedChunkNode extends LegalChunkRecord {
    sectionPathKey: string;
    sourceUrl: string;
    sourceName: string;
}

export interface ParsedDocumentResult extends ParseResult<ParsedSectionNode, ParsedChunkNode, ParserWarning, UnparsedFragment> {
    rawContent: string;
    normalizedContent: string;
    parseConfidence: number;
    parserVersion: string;
    sourceType: SourceType;
    sourceUrl: string;
    sourceName: string;
    documentType: string;
    metadata: {
        title: string;
        numberSymbol?: string;
        issuingBody?: string;
        signedDate?: string;
        effectiveDate?: string;
        expiryDate?: string;
        legalStatus?: LegalStatus;
        language: string;
    };
    unparsedFragments: UnparsedFragment[];
    citations: ParsedCitationRecord[];
}

const hierarchyOrder: Record<SectionType, number> = {
    part: 1,
    chapter: 2,
    section: 3,
    article: 4,
    clause: 5,
    point: 6,
    heading_title: 0,
    plain_text: 7
};

const headingPatterns = {
    part: /^(?:phần|part)\s+([ivxlcdm0-9]+)\s*[.:]?\s*(.*)$/i,
    chapter: /^(?:chương|chapter)\s+([ivxlcdm0-9]+)\s*[.:]?\s*(.*)$/i,
    section: /^(?:mục|section)\s+([ivxlcdm0-9]+)\s*[.:]?\s*(.*)$/i,
    article: /^(?:điều|article)\s+([0-9]+[a-zA-Z]?)\s*[.:]?\s*(.*)$/i,
    clause: /^(\d+)\.\s*(.+)$/,
    point: /^([a-z])\)\s*(.+)$/i
} as const;

const metadataPatterns = {
    title: /^(?:luật|bộ luật|nghị định|thông tư|quyết định|sample labor law document).*/i,
    numberSymbol: /^(?:số|number)\s*[:\-]?\s*(.+)$/i,
    issuingBody: /^(?:cơ quan ban hành|ban hành bởi|issuing body)\s*[:\-]?\s*(.+)$/i,
    signedDate: /^(?:ngày ban hành|signed date|ngày ký)\s*[:\-]?\s*(.+)$/i,
    effectiveDate: /^(?:hiệu lực từ|effective date)\s*[:\-]?\s*(.+)$/i,
    expiryDate: /^(?:hết hiệu lực|expiry date|expires)\s*[:\-]?\s*(.+)$/i
} as const;

function decodeEntities(value: string): string {
    return value
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'");
}

export function normalizeRawLegalText(rawContent: string): string {
    const strippedHtml = rawContent
        .replace(/<\/(?:script|style)>/gi, '\n')
        .replace(/<script[\s\S]*?<\/script>/gi, '\n')
        .replace(/<style[\s\S]*?<\/style>/gi, '\n')
        .replace(/<[^>]+>/g, '\n');

    return normalizeText(decodeEntities(strippedHtml).replace(/\r\n/g, '\n'));
}

function splitLines(content: string): string[] {
    return content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

function guessTitle(lines: string[]): string {
    const exact = lines.find((line) => metadataPatterns.title.test(line));
    if (exact) {
        return exact;
    }
    return lines[0] ?? 'Untitled legal document';
}

function extractMetadata(lines: string[]): {
    title: string;
    numberSymbol?: string;
    issuingBody?: string;
    signedDate?: string;
    effectiveDate?: string;
    expiryDate?: string;
    legalStatus?: LegalStatus;
    language: string;
} {
    const metadata = {
        title: guessTitle(lines),
        language: 'vi'
    } as {
        title: string;
        numberSymbol?: string;
        issuingBody?: string;
        signedDate?: string;
        effectiveDate?: string;
        expiryDate?: string;
        legalStatus?: LegalStatus;
        language: string;
    };

    for (const line of lines.slice(0, 12)) {
        const numberMatch = line.match(metadataPatterns.numberSymbol);
        const issuingMatch = line.match(metadataPatterns.issuingBody);
        const signedMatch = line.match(metadataPatterns.signedDate);
        const effectiveMatch = line.match(metadataPatterns.effectiveDate);
        const expiryMatch = line.match(metadataPatterns.expiryDate);

        if (numberMatch && !metadata.numberSymbol) {
            metadata.numberSymbol = numberMatch[1].trim();
        }
        if (issuingMatch && !metadata.issuingBody) {
            metadata.issuingBody = issuingMatch[1].trim();
        }
        if (signedMatch && !metadata.signedDate) {
            metadata.signedDate = signedMatch[1].trim();
        }
        if (effectiveMatch && !metadata.effectiveDate) {
            metadata.effectiveDate = effectiveMatch[1].trim();
        }
        if (expiryMatch && !metadata.expiryDate) {
            metadata.expiryDate = expiryMatch[1].trim();
        }
    }

    return metadata;
}

function toHierarchyParent(stack: ParsedSectionNode[], sectionType: SectionType): ParsedSectionNode | undefined {
    const targetOrder = hierarchyOrder[sectionType];
    for (let index = stack.length - 1; index >= 0; index -= 1) {
        const candidate = stack[index];
        if (hierarchyOrder[candidate.sectionType] < targetOrder) {
            return candidate;
        }
    }
    return undefined;
}

function currentLeaf(stack: ParsedSectionNode[]): ParsedSectionNode | undefined {
    return stack[stack.length - 1];
}

function buildCitationLabel(node: Pick<ParsedSectionNode, 'sectionType' | 'sectionNumber' | 'heading' | 'title'>): string {
    const fragments = [node.sectionType === 'article' ? 'Article' : node.sectionType === 'clause' ? 'Clause' : node.sectionType === 'point' ? 'Point' : undefined, node.sectionNumber ?? node.title ?? node.heading]
        .filter((fragment): fragment is string => typeof fragment === 'string' && fragment.length > 0);
    return fragments.join(' ');
}

function createSectionNode(input: {
    legalDocumentId: string;
    parentNode?: ParsedSectionNode;
    sectionType: SectionType;
    sectionNumber?: string;
    heading?: string;
    title?: string;
    plainText?: string;
    orderIndex: number;
}): ParsedSectionNode {
    const parentPathKey = input.parentNode?.pathKey;
    const pathKey = createLegalSectionPathKey({
        legalDocumentId: input.legalDocumentId,
        sectionType: input.sectionType,
        sectionNumber: input.sectionNumber,
        parentPathKey,
        orderIndex: input.orderIndex
    });

    return {
        legalDocumentSectionId: createLegalSectionId({ legalDocumentId: input.legalDocumentId, pathKey }),
        legalDocumentId: input.legalDocumentId,
        parentSectionId: input.parentNode?.legalDocumentSectionId ?? null,
        sectionType: input.sectionType,
        sectionNumber: input.sectionNumber,
        heading: input.heading,
        title: input.title,
        plainText: input.plainText?.trim() ?? '',
        orderIndex: input.orderIndex,
        pathKey,
        citationLabel: buildCitationLabel({
            sectionType: input.sectionType,
            sectionNumber: input.sectionNumber,
            heading: input.heading,
            title: input.title
        }),
        metadataJson: {
            sourcePathKey: pathKey,
            parentPathKey,
            structured: true
        },
        depth: hierarchyOrder[input.sectionType],
        childrenSectionIds: [],
        parentPathKey
    };
}

function appendPlainText(node: ParsedSectionNode | undefined, line: string): void {
    if (!node) {
        return;
    }
    node.plainText = node.plainText.length > 0 ? `${node.plainText}\n${line}` : line;
}

function detectStructuralMatch(line: string): { sectionType: SectionType; sectionNumber?: string; heading?: string; title?: string } | null {
    const part = line.match(headingPatterns.part);
    if (part) {
        return { sectionType: 'part', sectionNumber: part[1].toUpperCase(), heading: part[2].trim() || undefined };
    }
    const chapter = line.match(headingPatterns.chapter);
    if (chapter) {
        return { sectionType: 'chapter', sectionNumber: chapter[1].toUpperCase(), heading: chapter[2].trim() || undefined };
    }
    const section = line.match(headingPatterns.section);
    if (section) {
        return { sectionType: 'section', sectionNumber: section[1].toUpperCase(), heading: section[2].trim() || undefined };
    }
    const article = line.match(headingPatterns.article);
    if (article) {
        return { sectionType: 'article', sectionNumber: article[1].toUpperCase(), heading: article[2].trim() || undefined };
    }
    const clause = line.match(headingPatterns.clause);
    if (clause) {
        return { sectionType: 'clause', sectionNumber: clause[1], heading: clause[2].trim() || undefined };
    }
    const point = line.match(headingPatterns.point);
    if (point) {
        return { sectionType: 'point', sectionNumber: point[1].toLowerCase(), heading: point[2].trim() || undefined };
    }
    return null;
}

function extractFragments(text: string, lineNumber: number): UnparsedFragment[] {
    return [
        {
            fragmentId: `frag_${lineNumber}_${computeChecksum(`${lineNumber}|${text}`).slice(0, 8)}`,
            text,
            reason: 'unrecognized_line_or_uncertain_structure',
            lineNumber
        }
    ];
}

function buildChunks(document: LegalDocumentRecord, sections: ParsedSectionNode[]): { chunks: ParsedChunkNode[]; citations: ParsedCitationRecord[] } {
    const chunks: ParsedChunkNode[] = [];
    const citations: ParsedCitationRecord[] = [];
    const chunkableSections = sections.filter((section) => section.sectionType === 'article' || section.sectionType === 'clause' || section.sectionType === 'point');

    for (const section of chunkableSections) {
        const chunkIndex = chunks.length;
        const chunkText = [section.heading ?? section.title ?? '', section.plainText].filter((part) => part.trim().length > 0).join('\n').trim();
        if (chunkText.length === 0) {
            continue;
        }
        const chunkId = createLegalChunkId({
            legalDocumentId: document.legalDocumentId,
            legalDocumentSectionId: section.legalDocumentSectionId,
            chunkIndex,
            chunkText
        });
        const contentHash = computeChecksum(chunkText);
        const chunk: ParsedChunkNode = {
            legalDocumentChunkId: chunkId,
            legalDocumentId: document.legalDocumentId,
            legalDocumentSectionId: section.legalDocumentSectionId,
            chunkIndex,
            chunkText,
            citationLabel: section.citationLabel,
            citationMetadataJson: {
                sourceUrl: document.sourceUrl,
                sourceName: document.sourceName,
                sectionPathKey: section.pathKey,
                sectionType: section.sectionType,
                sectionNumber: section.sectionNumber ?? null,
                parser: 'labor-curated-v1'
            },
            tokenCount: chunkText.split(/\s+/).filter(Boolean).length,
            contentHash,
            sectionPathKey: section.pathKey,
            sourceUrl: document.sourceUrl,
            sourceName: document.sourceName
        };
        chunks.push(chunk);
        citations.push({
            citationId: `C${chunks.length}`,
            legalDocumentId: document.legalDocumentId,
            legalDocumentSectionId: section.legalDocumentSectionId,
            legalDocumentChunkId: chunkId,
            sourceUrl: document.sourceUrl,
            sourceName: document.sourceName,
            citationLabel: section.citationLabel,
            sectionType: section.sectionType,
            sectionNumber: section.sectionNumber,
            pathKey: section.pathKey
        });
    }

    return { chunks, citations };
}

function scoreParseConfidence(input: {
    metadata: ReturnType<typeof extractMetadata>;
    warnings: ParserWarning[];
    unparsedFragments: UnparsedFragment[];
    sections: ParsedSectionNode[];
}): number {
    let confidence = 1;
    if (!input.metadata.title) confidence -= 0.1;
    if (!input.metadata.numberSymbol) confidence -= 0.05;
    if (!input.metadata.issuingBody) confidence -= 0.05;
    if (!input.metadata.signedDate) confidence -= 0.05;
    if (!input.metadata.effectiveDate) confidence -= 0.05;
    confidence -= Math.min(0.3, input.warnings.length * 0.04);
    confidence -= Math.min(0.3, input.unparsedFragments.length * 0.05);
    if (input.sections.length === 0) confidence -= 0.3;
    return Math.max(0, Math.min(1, Number(confidence.toFixed(2))));
}

function buildWarnings(input: {
    metadata: ReturnType<typeof extractMetadata>;
    unparsedFragments: UnparsedFragment[];
    sections: ParsedSectionNode[];
}): ParserWarning[] {
    const warnings: ParserWarning[] = [];
    if (!input.metadata.numberSymbol) {
        warnings.push({ code: 'MISSING_NUMBER', message: 'Document number or symbol was not detected.', severity: 'warning' });
    }
    if (!input.metadata.issuingBody) {
        warnings.push({ code: 'MISSING_ISSUING_BODY', message: 'Issuing body was not detected.', severity: 'warning' });
    }
    if (!input.metadata.signedDate) {
        warnings.push({ code: 'MISSING_SIGNED_DATE', message: 'Signed date was not detected.', severity: 'info' });
    }
    if (!input.metadata.effectiveDate) {
        warnings.push({ code: 'MISSING_EFFECTIVE_DATE', message: 'Effective date was not detected.', severity: 'info' });
    }
    if (input.unparsedFragments.length > 0) {
        warnings.push({
            code: 'UNPARSED_FRAGMENTS',
            message: `Parser captured ${input.unparsedFragments.length} unparsed fragment(s) for review.`,
            severity: 'warning',
            fragmentId: input.unparsedFragments[0]?.fragmentId
        });
    }
    if (input.sections.length === 0) {
        warnings.push({
            code: 'NO_STRUCTURED_SECTIONS',
            message: 'No structured legal sections were detected.',
            severity: 'error'
        });
    }
    return warnings;
}

function flattenNormalizedDocument(input: {
    document: LegalDocumentRecord;
    normalizedContent: string;
    metadata: ReturnType<typeof extractMetadata>;
    parseConfidence: number;
}): LegalDocumentRecord {
    return {
        ...input.document,
        normalizedContent: input.normalizedContent,
        metadataJson: {
            ...input.document.metadataJson,
            parserVersion: 'labor-curated-v1',
            parseConfidence: input.parseConfidence,
            title: input.metadata.title,
            numberSymbol: input.metadata.numberSymbol ?? null,
            issuingBody: input.metadata.issuingBody ?? null,
            signedDate: input.metadata.signedDate ?? null,
            effectiveDate: input.metadata.effectiveDate ?? null,
            expiryDate: input.metadata.expiryDate ?? null
        },
        checksum: computeChecksum(input.normalizedContent)
    };
}

export function parseLaborLawSampleDocument(input: RawSampleInput): ParsedDocumentResult {
    const normalizedContent = normalizeRawLegalText(input.rawContent);
    const lines = splitLines(normalizedContent);
    const metadata = extractMetadata(lines);
    metadata.language = input.language ?? 'vi';
    const sourceDocumentId = createLegalDocumentId({
        sourceUrl: input.sourceUrl,
        sourceName: input.sourceName,
        documentType: input.documentType,
        numberSymbol: metadata.numberSymbol,
        signedDate: metadata.signedDate,
        language: input.language ?? 'vi'
    });

    const baseDocument: LegalDocumentRecord = {
        legalDocumentId: sourceDocumentId,
        sourceUrl: input.sourceUrl,
        sourceName: input.sourceName,
        sourceType: input.sourceType,
        documentType: input.documentType,
        title: metadata.title,
        numberSymbol: metadata.numberSymbol,
        issuingBody: metadata.issuingBody,
        signedDate: metadata.signedDate,
        effectiveDate: metadata.effectiveDate,
        expiryDate: metadata.expiryDate,
        legalStatus: metadata.legalStatus ?? 'unknown',
        rawContent: input.rawContent,
        normalizedContent,
        language: input.language ?? 'vi',
        metadataJson: {
            sampleId: input.sampleId,
            parserVersion: input.parserVersion ?? 'labor-curated-v1'
        },
        checksum: computeChecksum(normalizedContent)
    };

    const sections: ParsedSectionNode[] = [];
    const stack: ParsedSectionNode[] = [];
    const unparsedFragments: UnparsedFragment[] = [];

    lines.forEach((line, index) => {
        const match = detectStructuralMatch(line);
        if (match) {
            const parent = toHierarchyParent(stack, match.sectionType);
            const nextOrderIndex = sections.filter((section) => section.sectionType === match.sectionType).length + 1;
            const node = createSectionNode({
                legalDocumentId: sourceDocumentId,
                parentNode: parent,
                sectionType: match.sectionType,
                sectionNumber: match.sectionNumber,
                heading: match.heading,
                title: match.heading,
                orderIndex: nextOrderIndex
            });
            sections.push(node);
            if (parent) {
                parent.childrenSectionIds.push(node.legalDocumentSectionId);
            }
            while (stack.length > 0 && hierarchyOrder[currentLeaf(stack)!.sectionType] >= hierarchyOrder[match.sectionType]) {
                stack.pop();
            }
            stack.push(node);
            return;
        }

        const leaf = currentLeaf(stack);
        if (leaf) {
            appendPlainText(leaf, line);
            return;
        }

        unparsedFragments.push(...extractFragments(line, index + 1));
    });

    const parserWarnings = buildWarnings({ metadata, unparsedFragments, sections });
    const parseConfidence = scoreParseConfidence({ metadata, warnings: parserWarnings, unparsedFragments, sections });
    const parseStatus: ParseStatus = parseConfidence >= 0.72 && sections.length > 0 ? 'parsed' : 'needs_review';
    const normalizedDocument = flattenNormalizedDocument({
        document: baseDocument,
        normalizedContent,
        metadata,
        parseConfidence
    });
    const { chunks, citations } = buildChunks(normalizedDocument, sections);

    return {
        parseStatus,
        normalizedDocument,
        sections,
        chunks,
        warnings: parserWarnings,
        parseConfidence,
        rawContent: input.rawContent,
        normalizedContent,
        parserVersion: input.parserVersion ?? 'labor-curated-v1',
        sourceType: input.sourceType,
        sourceUrl: input.sourceUrl,
        sourceName: input.sourceName,
        documentType: input.documentType,
        metadata,
        unparsedFragments,
        citations
    };
}

export function summarizeParsedOutput(result: ParsedDocumentResult): string {
    const sectionCounts = result.sections.reduce<Record<SectionType, number>>((counts, section) => {
        counts[section.sectionType] = (counts[section.sectionType] ?? 0) + 1;
        return counts;
    }, {
        part: 0,
        chapter: 0,
        section: 0,
        article: 0,
        clause: 0,
        point: 0,
        heading_title: 0,
        plain_text: 0
    });

    return [
        `title=${result.metadata.title}`,
        `confidence=${result.parseConfidence}`,
        `sections=${result.sections.length}`,
        `chunks=${result.chunks.length}`,
        `warnings=${result.warnings.length}`,
        `articles=${sectionCounts.article}`,
        `clauses=${sectionCounts.clause}`,
        `points=${sectionCounts.point}`
    ].join(' | ');
}

export function summarizeChunkOutput(result: ParsedDocumentResult): Array<{
    chunkId: string;
    sectionType: SectionType;
    citationLabel: string;
    chunkText: string;
}> {
    return result.chunks.map((chunk) => {
        const section = result.sections.find((item) => item.legalDocumentSectionId === chunk.legalDocumentSectionId);
        return {
            chunkId: chunk.legalDocumentChunkId,
            sectionType: section?.sectionType ?? 'plain_text',
            citationLabel: chunk.citationLabel,
            chunkText: chunk.chunkText
        };
    });
}
