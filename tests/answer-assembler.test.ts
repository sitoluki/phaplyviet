import { describe, it, expect } from 'vitest';
import { AnswerAssembler } from '../packages/ai/src/answerAssembler.js';
import type { AnswerContextBundleRow, AnswerContextSummary } from '../packages/db/src/retrievalRepository.js';

describe('AnswerAssembler', () => {
    const assembler = new AnswerAssembler();

    const mockBundle: AnswerContextBundleRow[] = [
        {
            rankIndex: 0,
            legalDocumentChunkId: 'chunk_dinh_nghia_lao_dong',
            legalDocumentId: 'doc_vbpl_139264',
            legalDocumentVersionId: 'v1',
            legalDocumentSectionId: 'sec_dinh_nghia',
            title: 'Điều 1',
            numberSymbol: '1',
            sourceUrl: 'https://example.com/vbpl_139264',
            effectiveDate: '2019-01-01',
            citationLabel: '[Luật 45/2019/QH14, Điều 1]',
            chunkText: 'Lao động là hoạt động của con người được thực hiện để sản xuất hàng hóa hoặc cung cấp dịch vụ.',
            parseConfidence: 0.92,
            retrievalRank: 1,
            traceabilityComplete: true,
            lowConfidence: false,
        },
        {
            rankIndex: 1,
            legalDocumentChunkId: 'chunk_tuoi_lao_dong',
            legalDocumentId: 'doc_vbpl_139264',
            legalDocumentVersionId: 'v1',
            legalDocumentSectionId: 'sec_tuoi',
            title: 'Điều 4',
            numberSymbol: '4',
            sourceUrl: 'https://example.com/vbpl_139264',
            effectiveDate: '2019-01-01',
            citationLabel: '[Luật 45/2019/QH14, Điều 4]',
            chunkText: 'Tuổi lao động tối thiểu là 15 tuổi trở lên.',
            parseConfidence: 0.85,
            retrievalRank: 2,
            traceabilityComplete: true,
            lowConfidence: false,
        },
    ];

    const mockSummaryGood: AnswerContextSummary = {
        totalResults: 2,
        allTraceable: true,
        hasLowConfidence: false,
        minParseConfidence: 0.85,
        maxParseConfidence: 0.92,
    };

    const mockSummaryBad: AnswerContextSummary = {
        totalResults: 1,
        allTraceable: false,
        hasLowConfidence: true,
        minParseConfidence: 0.6,
        maxParseConfidence: 0.7,
    };

    it('should assemble a normal legal answer with citations', () => {
        const result = assembler.assemble({
            queryText: 'tuổi lao động tối thiểu',
            contextBundle: mockBundle,
            contextSummary: mockSummaryGood,
            guardrailDecision: { mode: 'normal', shouldEscalate: false, reasons: [] },
            answerMode: 'normal',
            escalationRequired: false,
            escalationReasons: [],
        });

        expect(result.mode).toBe('normal');
        expect(result.requiresReview).toBe(false);
        expect(result.citationIds).toHaveLength(2);
        expect(result.citationIds).toContain('chunk_dinh_nghia_lao_dong');
        expect(result.content).toContain('Luật 45/2019/QH14');
        expect(result.confidence.min).toBe(0.85);
        expect(result.confidence.max).toBe(0.92);
    });

    it('should assemble safer_response with escalation message when guardrail triggers', () => {
        const result = assembler.assemble({
            queryText: 'không tìm được gì',
            contextBundle: [],
            contextSummary: { totalResults: 0, allTraceable: false, hasLowConfidence: false, minParseConfidence: null, maxParseConfidence: null },
            guardrailDecision: {
                mode: 'safer_response',
                shouldEscalate: true,
                reasons: ['NO_RETRIEVAL_RESULTS'],
            },
            answerMode: 'safer_response',
            escalationRequired: true,
            escalationReasons: ['No relevant legal documents found in corpus.'],
        });

        expect(result.mode).toBe('safer_response');
        expect(result.requiresReview).toBe(true);
        expect(result.citationIds).toHaveLength(0);
        expect(result.content).toContain('không thể cung cấp');
        expect(result.reviewMessage).toBeDefined();
    });

    it('should include confidence range in normal answer', () => {
        const result = assembler.assemble({
            queryText: 'test',
            contextBundle: mockBundle,
            contextSummary: mockSummaryGood,
            guardrailDecision: { mode: 'normal', shouldEscalate: false, reasons: [] },
            answerMode: 'normal',
            escalationRequired: false,
            escalationReasons: [],
        });

        expect(result.confidence.min).toBe(0.85);
        expect(result.confidence.max).toBe(0.92);
        expect(result.content).toContain('85%');
    });

    it('should handle empty context bundle in normal mode', () => {
        const result = assembler.assemble({
            queryText: 'any query',
            contextBundle: [],
            contextSummary: {
                totalResults: 0,
                allTraceable: false,
                hasLowConfidence: false,
                minParseConfidence: null,
                maxParseConfidence: null,
            },
            guardrailDecision: { mode: 'normal', shouldEscalate: false, reasons: [] },
            answerMode: 'normal',
            escalationRequired: false,
            escalationReasons: [],
        });

        expect(result.mode).toBe('normal');
        expect(result.content).toContain('Không tìm thấy');
        expect(result.citationIds).toHaveLength(0);
    });

    it('should build different escalation messages for different reasons', () => {
        const noCitationResult = assembler.assemble({
            queryText: 'test query',
            contextBundle: mockBundle,
            contextSummary: mockSummaryBad,
            guardrailDecision: {
                mode: 'safer_response',
                shouldEscalate: true,
                reasons: ['INCOMPLETE_TRACEABILITY'],
            },
            answerMode: 'safer_response',
            escalationRequired: true,
            escalationReasons: ['Some retrieved chunks lack complete citation traceability.'],
        });

        expect(noCitationResult.reviewMessage).toContain('truy vết');
    });

    it('should format chunk text with citations in normal answer', () => {
        const result = assembler.assemble({
            queryText: 'test',
            contextBundle: mockBundle.slice(0, 1),
            contextSummary: mockSummaryGood,
            guardrailDecision: { mode: 'normal', shouldEscalate: false, reasons: [] },
            answerMode: 'normal',
            escalationRequired: false,
            escalationReasons: [],
        });

        // Should include citation label and chunk text
        expect(result.content).toContain('[Luật 45/2019/QH14, Điều 1]');
        expect(result.content).toContain('Lao động là hoạt động');
    });
});
