import type { Request, Response } from 'express';
import { PostgreSQLRetrievalRepository } from '@legal/db/retrievalRepository';
import { AnswerContextOrchestrator } from '@legal/db/answerContextOrchestrator';
import { AnswerAssembler } from '@legal/ai/answerAssembler';
import { LegalAnswerService } from '@legal/ai/legalAnswerService';
import { AnswerSessionStorage } from '../answerSessionStorage.js';
import type { RetrievalContextRequest, RetrievalContextResponse } from '../types.js';

export function createRetrievalHandler(retrievalRepository: PostgreSQLRetrievalRepository) {
    const orchestrator = new AnswerContextOrchestrator(retrievalRepository);
    const assembler = new AnswerAssembler();
    const answerService = new LegalAnswerService(orchestrator, assembler);
    const sessionStorage = new AnswerSessionStorage();

    /**
     * Infer feedback type based on processing mode and escalation status.
     * - 'normal' mode + no escalation → 'helpful' 
     * - 'safer_response' mode + escalation → 'escalated'
     * - Otherwise → 'uncertain'
     */
    function inferFeedbackType(
        processingMode: 'normal' | 'safer_response',
        escalated: boolean
    ): 'helpful' | 'not_helpful' | 'escalated' | 'error' {
        if (processingMode === 'normal' && !escalated) {
            return 'helpful';
        }
        if (processingMode === 'safer_response' || escalated) {
            return 'escalated';
        }
        return 'not_helpful';
    }

    return async (req: Request, res: Response<RetrievalContextResponse>): Promise<void> => {
        try {
            // Validate request
            const body = req.body as RetrievalContextRequest;
            const queryText = body?.queryText?.trim();

            if (!queryText) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_REQUEST',
                        message: 'queryText is required and must not be empty.',
                    },
                });
                return;
            }

            // Generate answer
            const result = await answerService.generateAnswer(queryText, {
                topK: body.topK,
                minConfidence: body.minConfidence,
            });

            // Store session and citations
            const session = await sessionStorage.storeAnswerSession(result, body.userId);

            // Emit feedback event based on answer mode and escalation
            const feedbackType = inferFeedbackType(result.processingMode, result.escalated);
            await sessionStorage.recordFeedbackEvent(session.answerSessionId, feedbackType);

            // Return response
            res.status(200).json({
                success: true,
                data: {
                    answerSessionId: session.answerSessionId,
                    queryText: result.queryText,
                    answer: {
                        content: result.answer.content,
                        mode: result.answer.mode,
                        confidence: result.answer.confidence,
                        requiresReview: result.answer.requiresReview,
                        citationIds: result.answer.citationIds,
                    },
                    processingMode: result.processingMode,
                    escalated: result.escalated,
                    totalContextChunks: result.totalContextChunks,
                },
            });
        } catch (error) {
            const err = error as any;
            const code = err.code ?? 'INTERNAL_ERROR';
            const message = err.message ?? 'An unexpected error occurred.';

            res.status(500).json({
                success: false,
                error: {
                    code,
                    message,
                },
            });
        }
    };
}
