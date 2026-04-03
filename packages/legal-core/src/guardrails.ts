export type AnswerMode = 'normal' | 'safer_response';

export interface AnswerContextSummaryInput {
    totalResults: number;
    allTraceable: boolean;
    hasLowConfidence: boolean;
    minParseConfidence?: number | null;
    maxParseConfidence?: number | null;
}

export type GuardrailReasonCode =
    | 'NO_RETRIEVAL_RESULTS'
    | 'INCOMPLETE_TRACEABILITY'
    | 'LOW_CONFIDENCE_CONTEXT';

export interface GuardrailDecision {
    mode: AnswerMode;
    shouldEscalate: boolean;
    reasons: GuardrailReasonCode[];
}

export function decideAnswerModeFromContext(
    summary: AnswerContextSummaryInput,
    options?: { minResults?: number }
): GuardrailDecision {
    const minResults = options?.minResults ?? 1;
    const reasons: GuardrailReasonCode[] = [];

    if (summary.totalResults < minResults) {
        reasons.push('NO_RETRIEVAL_RESULTS');
    }

    if (!summary.allTraceable) {
        reasons.push('INCOMPLETE_TRACEABILITY');
    }

    if (summary.hasLowConfidence) {
        reasons.push('LOW_CONFIDENCE_CONTEXT');
    }

    const mode: AnswerMode = reasons.length > 0 ? 'safer_response' : 'normal';

    return {
        mode,
        shouldEscalate: mode === 'safer_response',
        reasons
    };
}
