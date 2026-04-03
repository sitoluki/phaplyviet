import { AnswerContextOrchestrator, type AnswerContextOrchestratorOptions } from '../../db/src/answerContextOrchestrator.js';
import { AnswerAssembler, type LegalAnswer } from './answerAssembler.js';
import { RiskDetector } from '../../legal-core/src/riskDetector.js';

export interface LegalAnswerServiceOptions extends AnswerContextOrchestratorOptions {
    userId?: string;
    sessionId?: string;
}

export interface LegalAnswerServiceResult {
    answer: LegalAnswer;
    queryText: string;
    processingMode: 'normal' | 'safer_response';
    contextBundle: any[];
    totalContextChunks: number;
    escalated: boolean;
}

export class LegalAnswerService {
    private riskDetector: RiskDetector;

    constructor(
        private orchestrator: AnswerContextOrchestrator,
        private assembler: AnswerAssembler
    ) {
        this.riskDetector = new RiskDetector();
    }

    async generateAnswer(
        queryText: string,
        options?: LegalAnswerServiceOptions
    ): Promise<LegalAnswerServiceResult> {
        // Step 0: Detect risk level
        const riskResult = this.riskDetector.detect(queryText);

        // Step 1: Orchestrate retrieval + guardrails
        // Force safer_response if high-risk
        const orchestrationResult = await this.orchestrator.orchestrate(queryText, {
            ...options,
            minResults: riskResult.riskLevel === 'high' ? 2 : options?.minResults,
        });

        // Step 2: Check if we need to override to safer_response
        const isForcedUnsafe = riskResult.riskLevel === 'high';
        const finalMode = isForcedUnsafe ? 'safer_response' : orchestrationResult.answerMode;
        const finalEscalated = isForcedUnsafe ? true : orchestrationResult.escalationRequired;
        const finalReasons = orchestrationResult.decision.reasons;

        // Step 3: Assemble answer based on orchestration result
        const answer = this.assembler.assemble({
            queryText,
            contextBundle: orchestrationResult.bundle,
            contextSummary: orchestrationResult.summary,
            guardrailDecision: {
                ...orchestrationResult.decision,
                mode: finalMode,
                shouldEscalate: finalEscalated,
                reasons: finalReasons,
            },
            answerMode: finalMode,
            escalationRequired: finalEscalated,
            escalationReasons: isForcedUnsafe
                ? [riskResult.escalationMessage || 'Câu hỏi liên quan đến đề tài pháp lý nhạy cảm']
                : orchestrationResult.escalationReasons,
            disclaimer: riskResult.escalationMessage,
        });

        return {
            answer,
            queryText,
            processingMode: finalMode,
            contextBundle: orchestrationResult.bundle,
            totalContextChunks: orchestrationResult.summary.totalResults,
            escalated: finalEscalated,
        };
    }
}
