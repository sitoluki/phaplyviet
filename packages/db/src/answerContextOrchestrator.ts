import { PostgreSQLRetrievalRepository, AnswerContextBundleRow, AnswerContextSummary } from './retrievalRepository.js';
import { decideAnswerModeFromContext, GuardrailDecision, AnswerMode, GuardrailReasonCode } from '../../legal-core/src/guardrails.js';

export interface AnswerContextOrchestrationResult {
    bundle: AnswerContextBundleRow[];
    summary: AnswerContextSummary;
    decision: GuardrailDecision;
    answerMode: AnswerMode;
    escalationRequired: boolean;
    escalationReasons: string[];
}

export interface AnswerContextOrchestratorOptions {
    topK?: number;
    minConfidence?: number;
    minResults?: number;
}

export class AnswerContextOrchestrator {
    constructor(private retrievalRepository: PostgreSQLRetrievalRepository) { }

    async orchestrate(
        queryText: string,
        options?: AnswerContextOrchestratorOptions
    ): Promise<AnswerContextOrchestrationResult> {
        // Validate input
        const trimmedQuery = queryText?.trim();
        if (!trimmedQuery) {
            const error = new Error('queryText is required.');
            Object.assign(error, { code: 'INVALID_ARGUMENT' });
            throw error;
        }

        const topK = options?.topK ?? 5;
        const minConfidence = options?.minConfidence ?? 0.7;

        // Step 1: Retrieve full context bundle
        const bundle = await this.retrievalRepository.getAnswerContextBundle({
            queryText: trimmedQuery,
            topK,
            minConfidence,
        });

        // Step 2: Get summary statistics
        const summary = await this.retrievalRepository.summarizeAnswerContextBundle({
            queryText: trimmedQuery,
            topK,
            minConfidence,
        });

        if (!summary) {
            const error = new Error('Failed to retrieve summary for query.');
            Object.assign(error, { code: 'INTERNAL' });
            throw error;
        }

        // Step 3: Apply guardrail decision logic
        const decision = decideAnswerModeFromContext(summary, {
            minResults: options?.minResults ?? 1,
        });

        // Step 4: Map decision reasons to human-readable escalation messages
        const escalationMessages: Record<string, string> = {
            NO_RETRIEVAL_RESULTS: 'No relevant legal documents found in corpus.',
            INCOMPLETE_TRACEABILITY: 'Some retrieved chunks lack complete citation traceability.',
            LOW_CONFIDENCE_CONTEXT: 'Retrieved chunks have confidence below normal threshold.',
        };

        const escalationReasons = decision.reasons.map(
            (reason: GuardrailReasonCode) => escalationMessages[reason] ?? `Unknown reason: ${reason}`
        );

        return {
            bundle,
            summary,
            decision,
            answerMode: decision.mode,
            escalationRequired: decision.shouldEscalate,
            escalationReasons,
        };
    }
}
