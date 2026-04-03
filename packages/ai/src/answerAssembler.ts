import type { AnswerContextBundleRow, AnswerContextSummary } from '../../db/src/retrievalRepository.js';
import type { AnswerMode, GuardrailDecision } from '../../legal-core/src/guardrails.js';

export interface AnswerAssemblyInput {
    queryText: string;
    contextBundle: AnswerContextBundleRow[];
    contextSummary: AnswerContextSummary;
    guardrailDecision: GuardrailDecision;
    answerMode: AnswerMode;
    escalationRequired: boolean;
    escalationReasons: string[];
    disclaimer?: string;
}

export interface LegalAnswer {
    mode: AnswerMode;
    content: string;
    citationIds: string[];
    confidence: {
        min: number | null;
        max: number | null;
    };
    requiresReview: boolean;
    reviewMessage?: string;
}

export class AnswerAssembler {
    /**
     * Assembles a legal answer based on retrieval context and guardrail decision.
     *
     * For 'normal' mode: generates a comprehensive legal answer with citations.
     * For 'safer_response' mode: returns a templated response with escalation notice.
     */
    assemble(input: AnswerAssemblyInput): LegalAnswer {
        if (input.answerMode === 'normal') {
            return this.assembleNormalAnswer(input);
        } else {
            return this.assembleSaferResponse(input);
        }
    }

    private assembleNormalAnswer(input: AnswerAssemblyInput): LegalAnswer {
        // Extract citation IDs from context bundle
        const citationIds = input.contextBundle.map((chunk) => chunk.legalDocumentChunkId);

        // Build the answer content by joining context chunks with citations
        const baseContent = this.formatLegalAnswerContent(
            input.queryText,
            input.contextBundle,
            input.contextSummary
        );

        // Prepend disclaimer if provided
        const answerContent = input.disclaimer
            ? `${input.disclaimer}\n\n---\n\n${baseContent}`
            : baseContent;

        return {
            mode: 'normal',
            content: answerContent,
            citationIds,
            confidence: {
                min: input.contextSummary.minParseConfidence,
                max: input.contextSummary.maxParseConfidence,
            },
            requiresReview: false,
        };
    }

    private assembleSaferResponse(input: AnswerAssemblyInput): LegalAnswer {
        const reviewMessage = this.buildEscalationMessage(
            input.queryText,
            input.escalationReasons,
            input.guardrailDecision
        );

        return {
            mode: 'safer_response',
            content: `Xin lỗi, tôi không thể cung cấp một câu trả lời đầy đủ cho câu hỏi này vào lúc này. ${reviewMessage}`,
            citationIds: [],
            confidence: {
                min: input.contextSummary.minParseConfidence,
                max: input.contextSummary.maxParseConfidence,
            },
            requiresReview: true,
            reviewMessage,
        };
    }

    private formatLegalAnswerContent(
        queryText: string,
        contextBundle: AnswerContextBundleRow[],
        summary: AnswerContextSummary
    ): string {
        if (contextBundle.length === 0) {
            return 'Không tìm thấy kết quả liên quan trong cơ sở dữ liệu pháp luật.';
        }

        // Build sections for each retrieved chunk
        const sections = contextBundle.map((chunk, index) => {
            return this.formatChunkAsSection(chunk, index + 1);
        });

        const disclaimer =
            summary.allTraceable && summary.minParseConfidence
                ? `(Độ tin cậy: ${Math.round((summary.minParseConfidence as number) * 100)}%)`
                : '(Một số phần có thể cần xác minh thêm)';

        return `Dựa trên các quy định pháp luật hiện hành:\n\n${sections.join('\n\n')}\n\n${disclaimer}`;
    }

    private formatChunkAsSection(chunk: AnswerContextBundleRow, rank: number): string {
        const citation =
            chunk.numberSymbol && chunk.title
                ? `${chunk.numberSymbol} của ${chunk.citationLabel}`
                : chunk.citationLabel;

        return `**${rank}. ${citation}**\n\n${chunk.chunkText}`;
    }

    private buildEscalationMessage(
        queryText: string,
        reasons: string[],
        decision: GuardrailDecision
    ): string {
        const reasonList = reasons.length > 0 ? ` Lý do: ${reasons.join('; ')}.` : '';

        if (decision.reasons.includes('NO_RETRIEVAL_RESULTS')) {
            return `Vấn đề "${queryText}" không có kết quả phù hợp trong cơ sở dữ liệu.${reasonList} Vui lòng liên hệ với đội pháp lý để tìm kiếm thêm thông tin.`;
        }

        if (decision.reasons.includes('INCOMPLETE_TRACEABILITY')) {
            return `Kết quả tìm được không đầy đủ truy vết. Cần xác minh thêm từ các chuyên gia pháp luật.${reasonList}`;
        }

        return `Kết quả tìm kiếm có độ tin cậy thấp. Vui lòng xác minh với đội pháp lý.${reasonList}`;
    }
}
