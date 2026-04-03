import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnswerContextOrchestrator } from '../packages/db/src/answerContextOrchestrator.js';
import type { PostgreSQLRetrievalRepository, AnswerContextBundleRow, AnswerContextSummary } from '../packages/db/src/retrievalRepository.js';

describe('AnswerContextOrchestrator', () => {
    let orchestrator: AnswerContextOrchestrator;
    let mockRepository: Pick<PostgreSQLRetrievalRepository, 'getAnswerContextBundle' | 'summarizeAnswerContextBundle'>;

    const mockBundle: AnswerContextBundleRow[] = [
        {
            rankIndex: 0,
            legalDocumentChunkId: 'chunk_1',
            legalDocumentId: 'doc_vbpl_139264',
            legalDocumentVersionId: 'v1',
            legalDocumentSectionId: 'sec_1',
            title: 'Điều 1',
            numberSymbol: '1',
            sourceUrl: 'https://example.com/doc1',
            effectiveDate: '2019-01-01',
            citationLabel: '[LĐ 2019, Điều 1]',
            chunkText: 'Lao động là hoạt động của con người...',
            parseConfidence: 0.92,
            retrievalRank: 1,
            traceabilityComplete: true,
            lowConfidence: false,
        },
    ];

    const mockSummaryNormal: AnswerContextSummary = {
        totalResults: 5,
        allTraceable: true,
        hasLowConfidence: false,
        minParseConfidence: 0.85,
        maxParseConfidence: 0.95,
    };

    const mockSummaryUnsafe: AnswerContextSummary = {
        totalResults: 1,
        allTraceable: false,
        hasLowConfidence: true,
        minParseConfidence: 0.6,
        maxParseConfidence: 0.7,
    };

    beforeEach(() => {
        mockRepository = {
            getAnswerContextBundle: vi.fn(),
            summarizeAnswerContextBundle: vi.fn(),
        };
        orchestrator = new AnswerContextOrchestrator(mockRepository as any);
    });

    it('should orchestrate normal mode when context is sufficient', async () => {
        (mockRepository.getAnswerContextBundle as any).mockResolvedValue(mockBundle);
        (mockRepository.summarizeAnswerContextBundle as any).mockResolvedValue(mockSummaryNormal);

        const result = await orchestrator.orchestrate('người lao động', { topK: 5, minConfidence: 0.7 });

        expect(result.answerMode).toBe('normal');
        expect(result.escalationRequired).toBe(false);
        expect(result.decision.reasons).toHaveLength(0);
        expect(result.bundle).toHaveLength(1);
        expect(result.summary.allTraceable).toBe(true);
    });

    it('should orchestrate safer_response mode when context is insufficient', async () => {
        (mockRepository.getAnswerContextBundle as any).mockResolvedValue([mockBundle[0]]);
        (mockRepository.summarizeAnswerContextBundle as any).mockResolvedValue(mockSummaryUnsafe);

        const result = await orchestrator.orchestrate('obscure legal term');

        expect(result.answerMode).toBe('safer_response');
        expect(result.escalationRequired).toBe(true);
        expect(result.decision.reasons).toContain('INCOMPLETE_TRACEABILITY');
        expect(result.decision.reasons).toContain('LOW_CONFIDENCE_CONTEXT');
        expect(result.escalationReasons).toContain('Some retrieved chunks lack complete citation traceability.');
        expect(result.escalationReasons).toContain('Retrieved chunks have confidence below normal threshold.');
    });

    it('should trigger NO_RETRIEVAL_RESULTS when query returns nothing', async () => {
        (mockRepository.getAnswerContextBundle as any).mockResolvedValue([]);
        (mockRepository.summarizeAnswerContextBundle as any).mockResolvedValue({
            totalResults: 0,
            allTraceable: false,
            hasLowConfidence: false,
            minParseConfidence: null,
            maxParseConfidence: null,
        });

        const result = await orchestrator.orchestrate('xyz nonsense query', { minResults: 1 });

        expect(result.answerMode).toBe('safer_response');
        expect(result.decision.reasons).toContain('NO_RETRIEVAL_RESULTS');
    });

    it('should respect custom minResults option', async () => {
        (mockRepository.getAnswerContextBundle as any).mockResolvedValue(mockBundle);
        (mockRepository.summarizeAnswerContextBundle as any).mockResolvedValue({
            ...mockSummaryNormal,
            totalResults: 3,
        });

        const result = await orchestrator.orchestrate('query', { minResults: 5 });

        expect(result.decision.reasons).toContain('NO_RETRIEVAL_RESULTS');
        expect(result.answerMode).toBe('safer_response');
    });

    it('should throw INVALID_ARGUMENT when queryText is empty', async () => {
        await expect(orchestrator.orchestrate('   ')).rejects.toMatchObject({
            message: 'queryText is required.',
            code: 'INVALID_ARGUMENT',
        });
    });

    it('should pass through topK and minConfidence to repository', async () => {
        (mockRepository.getAnswerContextBundle as any).mockResolvedValue(mockBundle);
        (mockRepository.summarizeAnswerContextBundle as any).mockResolvedValue(mockSummaryNormal);

        await orchestrator.orchestrate('test', { topK: 10, minConfidence: 0.85 });

        expect(mockRepository.getAnswerContextBundle).toHaveBeenCalledWith({
            queryText: 'test',
            topK: 10,
            minConfidence: 0.85,
        });
        expect(mockRepository.summarizeAnswerContextBundle).toHaveBeenCalledWith({
            queryText: 'test',
            topK: 10,
            minConfidence: 0.85,
        });
    });
});
