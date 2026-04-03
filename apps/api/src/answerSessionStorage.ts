import { getPool } from '@legal/db/connection';
import type { LegalAnswerServiceResult } from '@legal/ai/index';

export interface StoredAnswerSession {
    answerSessionId: string;
    queryText: string;
    processingMode: 'normal' | 'safer_response';
    escalated: boolean;
    citationCount: number;
    createdAt: string;
}

export class AnswerSessionStorage {
    async storeAnswerSession(
        result: LegalAnswerServiceResult,
        userId?: string
    ): Promise<StoredAnswerSession> {
        const db = getPool();
        const answerSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const now = new Date().toISOString();

        // Store answer session
        const sessionResult = await db.query(
            `
            INSERT INTO public.answer_sessions (
                answer_session_id, query_text, answer_mode, 
                escalated, context_chunk_count, user_id, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (answer_session_id) DO NOTHING
            RETURNING answer_session_id, query_text, answer_mode, escalated, context_chunk_count, created_at
            `,
            [
                answerSessionId,
                result.queryText,
                result.processingMode,
                result.escalated,
                result.totalContextChunks,
                userId ?? null,
                now,
            ]
        );

        if (sessionResult.rows.length === 0) {
            throw new Error(`Failed to store answer session ${answerSessionId}`);
        }

        const session = sessionResult.rows[0];

        // Store citations if there are any
        if (result.answer.citationIds && result.answer.citationIds.length > 0) {
            for (const citationId of result.answer.citationIds) {
                await db.query(
                    `
                    INSERT INTO public.answer_citations (
                        answer_session_id, legal_document_chunk_id, citation_order
                    ) VALUES ($1, $2, $3)
                    ON CONFLICT DO NOTHING
                    `,
                    [answerSessionId, citationId, result.answer.citationIds.indexOf(citationId) + 1]
                );
            }
        }

        return {
            answerSessionId: session.answer_session_id,
            queryText: session.query_text,
            processingMode: session.answer_mode,
            escalated: session.escalated,
            citationCount: result.answer.citationIds?.length ?? 0,
            createdAt: session.created_at,
        };
    }

    async recordFeedbackEvent(
        answerSessionId: string,
        feedback: 'helpful' | 'not_helpful' | 'escalated' | 'error',
        userComment?: string
    ): Promise<void> {
        const db = getPool();
        const now = new Date().toISOString();

        await db.query(
            `
            INSERT INTO public.answer_quality_feedback_events (
                answer_session_id, feedback_type, user_comment, recorded_at
            ) VALUES ($1, $2, $3, $4)
            `,
            [answerSessionId, feedback, userComment ?? null, now]
        );
    }
}
