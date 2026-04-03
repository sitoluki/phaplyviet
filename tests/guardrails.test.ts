import { describe, expect, it } from 'vitest';
import { decideAnswerModeFromContext } from '../packages/legal-core/src/guardrails.js';

describe('answer guardrails', () => {
    it('returns normal mode when retrieval context is sufficient and traceable', () => {
        const decision = decideAnswerModeFromContext({
            totalResults: 5,
            allTraceable: true,
            hasLowConfidence: false,
            minParseConfidence: 0.83,
            maxParseConfidence: 0.92
        });

        expect(decision.mode).toBe('normal');
        expect(decision.shouldEscalate).toBe(false);
        expect(decision.reasons).toHaveLength(0);
    });

    it('returns safer_response when no retrieval result is available', () => {
        const decision = decideAnswerModeFromContext({
            totalResults: 0,
            allTraceable: false,
            hasLowConfidence: true
        });

        expect(decision.mode).toBe('safer_response');
        expect(decision.shouldEscalate).toBe(true);
        expect(decision.reasons).toContain('NO_RETRIEVAL_RESULTS');
        expect(decision.reasons).toContain('INCOMPLETE_TRACEABILITY');
        expect(decision.reasons).toContain('LOW_CONFIDENCE_CONTEXT');
    });

    it('allows custom minimum required results', () => {
        const decision = decideAnswerModeFromContext(
            {
                totalResults: 2,
                allTraceable: true,
                hasLowConfidence: false
            },
            { minResults: 3 }
        );

        expect(decision.mode).toBe('safer_response');
        expect(decision.reasons).toEqual(['NO_RETRIEVAL_RESULTS']);
    });
});
