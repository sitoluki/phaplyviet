import type { ParseResult } from '../../../packages/legal-core/src/ingestion.js';
import type { ParsedChunkNode, ParsedSectionNode, ParserWarning, UnparsedFragment } from '../../../packages/legal-core/src/parsing-types.js';
import { parseLaborLawSampleDocument } from '../../../packages/legal-core/src/parsing.js';

export interface ParserInput {
    rawContent: string;
    sourceUrl: string;
    sourceName: string;
}

export interface LegalParser {
    sourceType: string;
    parse(input: ParserInput): Promise<ParseResult<ParsedSectionNode, ParsedChunkNode, ParserWarning, UnparsedFragment>>;
}

export class LaborLawParser implements LegalParser {
    sourceType = 'official_curated';

    async parse(input: ParserInput): Promise<ParseResult<ParsedSectionNode, ParsedChunkNode, ParserWarning, UnparsedFragment>> {
        return parseLaborLawSampleDocument({
            sampleId: 'labor-sample-inline',
            sourceUrl: input.sourceUrl,
            sourceName: input.sourceName,
            sourceType: 'official_curated',
            documentType: 'labor_law',
            rawContent: input.rawContent,
            language: 'vi',
            parserVersion: 'labor-curated-v1'
        });
    }
}
