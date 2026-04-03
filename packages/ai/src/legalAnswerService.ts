import { AnswerContextOrchestrator, type AnswerContextOrchestratorOptions } from '../../db/src/answerContextOrchestrator.js';
import { AnswerAssembler, type LegalAnswer } from './answerAssembler.js';

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
    constructor(
        private orchestrator: AnswerContextOrchestrator,
        private assembler: AnswerAssembler
    ) { }

    async generateAnswer(
        queryText: string,
        options?: LegalAnswerServiceOptions
    ): Promise<LegalAnswerServiceResult> {
        // Step 1: Orchestrate retrieval + guardrails
        const orchestrationResult = await this.orchestrator.orchestrate(queryText, options);

        // Step 2: Assemble answer based on orchestration result
        const answer = this.assembler.assemble({
            queryText,
            contextBundle: orchestrationResult.bundle,
            contextSummary: orchestrationResult.summary,
            guardrailDecision: orchestrationResult.decision,
            answerMode: orchestrationResult.answerMode,
            escalationRequired: orchestrationResult.escalationRequired,
            escalationReasons: orchestrationResult.escalationReasons,
        });

        return {
            answer,
            queryText,
            processingMode: orchestrationResult.answerMode,
            contextBundle: orchestrationResult.bundle,
            totalContextChunks: orchestrationResult.summary.totalResults,
            escalated: orchestrationResult.escalationRequired,
        };
    }
}
