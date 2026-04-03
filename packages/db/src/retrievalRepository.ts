import { getPool } from './connection.js';

export interface AnswerContextBundleRow {
    rankIndex: number;
    legalDocumentChunkId: string;
    legalDocumentId: string;
    legalDocumentVersionId: string;
    legalDocumentSectionId: string;
    title: string;
    numberSymbol: string | null;
    sourceUrl: string;
    effectiveDate: string | null;
    citationLabel: string;
    chunkText: string;
    parseConfidence: number | null;
    retrievalRank: number;
    traceabilityComplete: boolean;
    lowConfidence: boolean;
}

export interface AnswerContextSummary {
    totalResults: number;
    allTraceable: boolean;
    hasLowConfidence: boolean;
    minParseConfidence: number | null;
    maxParseConfidence: number | null;
}

export interface RetrievalRegressionRow {
    retrievalCaseId: string;
    queryText: string;
    expectedLegalDocumentId: string;
    expectedCitationLabel: string | null;
    passed: boolean;
    matchedRank: number | null;
    matchedChunkId: string | null;
    matchedCitationLabel: string | null;
    topResultDocumentId: string | null;
    topResultCitationLabel: string | null;
    topResultRank: number | null;
}

export interface AnswerTraceabilitySummary {
    answerSessionId: string;
    totalCitations: number;
    traceableCitations: number;
    untraceableCitations: number;
    allTraceable: boolean;
}

function parsePositiveInt(value: number | undefined, fallback: number): number {
    if (value === undefined) {
        return fallback;
    }
    if (!Number.isInteger(value) || value <= 0) {
        const error = new Error('topK must be a positive integer.');
        Object.assign(error, { code: 'INVALID_ARGUMENT' });
        throw error;
    }
    return value;
}

function parseConfidence(value: number | undefined, fallback: number): number {
    if (value === undefined) {
        return fallback;
    }
    if (Number.isNaN(value) || value < 0 || value > 1) {
        const error = new Error('minConfidence must be between 0 and 1.');
        Object.assign(error, { code: 'INVALID_ARGUMENT' });
        throw error;
    }
    return value;
}

export class PostgreSQLRetrievalRepository {
    async getAnswerContextBundle(input: {
        queryText: string;
        topK?: number;
        minConfidence?: number;
    }): Promise<AnswerContextBundleRow[]> {
        const queryText = input.queryText?.trim();
        if (!queryText) {
            const error = new Error('queryText is required.');
            Object.assign(error, { code: 'INVALID_ARGUMENT' });
            throw error;
        }

        const topK = parsePositiveInt(input.topK, 5);
        const minConfidence = parseConfidence(input.minConfidence, 0.7);
        const db = getPool();

        const result = await db.query(
            `
                SELECT
                    rank_index as "rankIndex",
                    legal_document_chunk_id as "legalDocumentChunkId",
                    legal_document_id as "legalDocumentId",
                    legal_document_version_id as "legalDocumentVersionId",
                    legal_document_section_id as "legalDocumentSectionId",
                    title,
                    number_symbol as "numberSymbol",
                    source_url as "sourceUrl",
                    effective_date as "effectiveDate",
                    citation_label as "citationLabel",
                    chunk_text as "chunkText",
                    parse_confidence as "parseConfidence",
                    retrieval_rank as "retrievalRank",
                    traceability_complete as "traceabilityComplete",
                    low_confidence as "lowConfidence"
                FROM public.get_answer_context_bundle($1, $2, $3)
            `,
            [queryText, topK, minConfidence]
        );

        return result.rows;
    }

    async summarizeAnswerContextBundle(input: {
        queryText: string;
        topK?: number;
        minConfidence?: number;
    }): Promise<AnswerContextSummary | null> {
        const queryText = input.queryText?.trim();
        if (!queryText) {
            const error = new Error('queryText is required.');
            Object.assign(error, { code: 'INVALID_ARGUMENT' });
            throw error;
        }

        const topK = parsePositiveInt(input.topK, 5);
        const minConfidence = parseConfidence(input.minConfidence, 0.7);
        const db = getPool();

        const result = await db.query(
            `
                SELECT
                    total_results as "totalResults",
                    all_traceable as "allTraceable",
                    has_low_confidence as "hasLowConfidence",
                    min_parse_confidence as "minParseConfidence",
                    max_parse_confidence as "maxParseConfidence"
                FROM public.summarize_answer_context_bundle($1, $2, $3)
            `,
            [queryText, topK, minConfidence]
        );

        return result.rows[0] ?? null;
    }

    async runRetrievalRegression(topK: number = 5): Promise<RetrievalRegressionRow[]> {
        const limit = parsePositiveInt(topK, 5);
        const db = getPool();

        const result = await db.query(
            `
                SELECT
                    retrieval_case_id as "retrievalCaseId",
                    query_text as "queryText",
                    expected_legal_document_id as "expectedLegalDocumentId",
                    expected_citation_label as "expectedCitationLabel",
                    passed,
                    matched_rank as "matchedRank",
                    matched_chunk_id as "matchedChunkId",
                    matched_citation_label as "matchedCitationLabel",
                    top_result_document_id as "topResultDocumentId",
                    top_result_citation_label as "topResultCitationLabel",
                    top_result_rank as "topResultRank"
                FROM public.run_retrieval_regression($1)
            `,
            [limit]
        );

        return result.rows;
    }

    async evaluateAnswerTraceability(answerSessionId: string): Promise<AnswerTraceabilitySummary | null> {
        const id = answerSessionId?.trim();
        if (!id) {
            const error = new Error('answerSessionId is required.');
            Object.assign(error, { code: 'INVALID_ARGUMENT' });
            throw error;
        }

        const db = getPool();
        const result = await db.query(
            `
                SELECT
                    answer_session_id as "answerSessionId",
                    total_citations as "totalCitations",
                    traceable_citations as "traceableCitations",
                    untraceable_citations as "untraceableCitations",
                    all_traceable as "allTraceable"
                FROM public.evaluate_answer_traceability($1)
            `,
            [id]
        );

        return result.rows[0] ?? null;
    }
}
