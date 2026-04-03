import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LegalAnswerService } from '../packages/ai/src/legalAnswerService.js';
import { AnswerContextOrchestrator } from '../packages/db/src/answerContextOrchestrator.js';
import { AnswerAssembler } from '../packages/ai/src/answerAssembler.js';
import type { AnswerContextOrchestrationResult } from '../packages/db/src/answerContextOrchestrator.js';

describe('LegalAnswerService', () => {
    let service: LegalAnswerService;
    let mockOrchestrator: AnswerContextOrchestrator;
    let mockAssembler: AnswerAssembler;

    const mockBundle = [
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
            chunkText: 'Lao động là hoạt động...',
            parseConfidence: 0.92,
            retrievalRank: 1,
            traceabilityComplete: true,
            lowConfidence: false,
        },
    ];

    const mockOrchestrationResult: AnswerContextOrchestrationResult = {
        bundle: mockBundle,
        summary: {
            totalResults: 1,
            allTraceable: true,
            hasLowConfidence: false,
            minParseConfidence: 0.92,
            maxParseConfidence: 0.92,
        },
        decision: {
            mode: 'normal',
            shouldEscalate: false,
            reasons: [],
        },
        answerMode: 'normal',
        escalationRequired: false,
        escalationReasons: [],
    };

    beforeEach(() => {
        mockOrchestrator = {
            orchestrate: vi.fn().mockResolvedValue(mockOrchestrationResult),
        } as any;

        mockAssembler = new AnswerAssembler();
        service = new LegalAnswerService(mockOrchestrator, mockAssembler);
    });

    it('should generate a legal answer by combining orchestration and assembly', async () => {
        const result = await service.generateAnswer('tuổi lao động tối thiểu');

        expect(result.queryText).toBe('tuổi lao động tối thiểu');
        expect(result.processingMode).toBe('normal');
        expect(result.totalContextChunks).toBe(1);
        expect(result.answer.mode).toBe('normal');
        expect(result.answer.requiresReview).toBe(false);
    });

    it('should pass options to orchestrator', async () => {
        await service.generateAnswer('test query', {
            topK: 10,
            minConfidence: 0.85,
            minResults: 2,
        });

        expect(mockOrchestrator.orchestrate).toHaveBeenCalledWith('test query', {
            topK: 10,
            minConfidence: 0.85,
            minResults: 2,
        });
    });

    it('should include escalation info in result', async () => {
        const escalonationResult: AnswerContextOrchestrationResult = {
            ...mockOrchestrationResult,
            answerMode: 'safer_response',
            escalationRequired: true,
            escalationReasons: ['No relevant legal documents found in corpus.'],
            decision: {
                mode: 'safer_response',
                shouldEscalate: true,
                reasons: ['NO_RETRIEVAL_RESULTS'],
            },
            bundle: [],
            summary: {
                totalResults: 0,
                allTraceable: false,
                hasLowConfidence: false,
                minParseConfidence: null,
                maxParseConfidence: null,
            },
        };

        (mockOrchestrator.orchestrate as any).mockResolvedValueOnce(escalonationResult);

        const result = await service.generateAnswer('impossible query');

        expect(result.processingMode).toBe('safer_response');
        expect(result.escalated).toBe(true);
        expect(result.answer.requiresReview).toBe(true);
        expect(result.totalContextChunks).toBe(0);
    });

    it('should assemble answer with all context from orchestrator', async () => {
        const result = await service.generateAnswer('lao động');

        expect(result.answer.citationIds).toContain('chunk_1');
        expect(result.answer.content).toContain('[LĐ 2019, Điều 1]');
        expect(result.answer.confidence.min).toBe(0.92);
        expect(result.answer.confidence.max).toBe(0.92);
    });

    it('should handle empty context gracefully', async () => {
        const emptyResult: AnswerContextOrchestrationResult = {
            bundle: [],
            summary: {
                totalResults: 0,
                allTraceable: false,
                hasLowConfidence: false,
                minParseConfidence: null,
                maxParseConfidence: null,
            },
            decision: {
                mode: 'normal',
                shouldEscalate: false,
                reasons: [],
            },
            answerMode: 'normal',
            escalationRequired: false,
            escalationReasons: [],
        };

        (mockOrchestrator.orchestrate as any).mockResolvedValueOnce(emptyResult);

        const result = await service.generateAnswer('test');

        expect(result.totalContextChunks).toBe(0);
        expect(result.answer.citationIds).toHaveLength(0);
        expect(result.answer.content).toContain('Không tìm thấy');
    });

    it('should preserve query text in result', async () => {
        const queries = ['muốn hỏi gì', 'luật lao động', 'điều khoản'];

        for (const query of queries) {
            const result = await service.generateAnswer(query);
            expect(result.queryText).toBe(query);
        }
    });
});
