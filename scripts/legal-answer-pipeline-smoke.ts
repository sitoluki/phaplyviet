#!/usr/bin/env tsx
/**
 * Legal Answer Pipeline Smoke Test
 *
 * Demonstrates the complete pipeline:
 * Query -> Orchestration (retrieval + guardrails) -> Assembly (answer generation)
 *
 * This is a design/architecture reference, not a live integration test.
 * It shows how the LegalAnswerService ties everything together.
 */

import { AnswerContextOrchestrator } from '../packages/db/src/answerContextOrchestrator.js';
import { AnswerAssembler } from '../packages/ai/src/answerAssembler.js';
import { LegalAnswerService } from '../packages/ai/src/legalAnswerService.js';
import type { PostgreSQLRetrievalRepository } from '../packages/db/src/retrievalRepository.js';

// Mock repository for demonstration
const mockRepository: PostgreSQLRetrievalRepository = {
    async getAnswerContextBundle(input: any) {
        console.log(`[Retrieval] Query: "${input.queryText}" | topK=${input.topK} | minConf=${input.minConfidence}`);
        return [
            {
                rankIndex: 0,
                legalDocumentChunkId: 'chunk_labor_law_2019_article_1',
                legalDocumentId: 'doc_vbpl_139264',
                legalDocumentVersionId: 'v1',
                legalDocumentSectionId: 'sec_definition',
                title: 'Điều 1',
                numberSymbol: '1',
                sourceUrl: 'https://vbpl.vn/TW/Pages/vbpq-van-ban-goc.aspx?ItemID=139264',
                effectiveDate: '2019-01-01',
                citationLabel: '[Luật 45/2019/QH14 - Bộ Luật Lao Động]',
                chunkText:
                    'Lao động là hoạt động của con người được thực hiện để sản xuất hàng hóa hoặc cung cấp dịch vụ nhằm tạo ra giá trị, từ đó tạo điều kiện cho sự phát triển của xã hội.',
                parseConfidence: 0.92,
                retrievalRank: 1,
                traceabilityComplete: true,
                lowConfidence: false,
            },
        ];
    },

    async summarizeAnswerContextBundle(input: any) {
        console.log(`[Summarize] Aggregating results for query: "${input.queryText}"`);
        return {
            totalResults: 1,
            allTraceable: true,
            hasLowConfidence: false,
            minParseConfidence: 0.92,
            maxParseConfidence: 0.92,
        };
    },

    async runRetrievalRegression() {
        return [];
    },

    async evaluateAnswerTraceability() {
        return { answerSessionId: '', totalCitations: 0, traceableCitations: 0, untraceableCitations: 0, allTraceable: false };
    },
} as any;

async function main() {
    console.log('='.repeat(70));
    console.log('LEGAL ANSWER SERVICE SMOKE TEST');
    console.log('='.repeat(70));
    console.log();

    // Initialize services
    const orchestrator = new AnswerContextOrchestrator(mockRepository);
    const assembler = new AnswerAssembler();
    const answerService = new LegalAnswerService(orchestrator, assembler);

    // Test query
    const testQuery = 'Lao động là gì theo luật pháp Việt Nam?';
    console.log(`📝 Query: "${testQuery}"`);
    console.log();

    try {
        // Generate answer
        console.log('[Step 1/3] Retrieving legal context...');
        const result = await answerService.generateAnswer(testQuery, {
            topK: 5,
            minConfidence: 0.7,
            minResults: 1,
        });

        console.log(`[Step 2/3] Applying guardrails...`);
        console.log(`  - Processing Mode: ${result.processingMode}`);
        console.log(`  - Escalation Required: ${result.escalated}`);
        console.log(`  - Context Chunks Retrieved: ${result.totalContextChunks}`);

        console.log(`[Step 3/3] Assembling legal answer...`);
        console.log();
        console.log('-'.repeat(70));
        console.log('GENERATED LEGAL ANSWER');
        console.log('-'.repeat(70));
        console.log();
        console.log(result.answer.content);
        console.log();
        console.log('-'.repeat(70));
        console.log(`MODE: ${result.answer.mode.toUpperCase()}`);
        console.log(`CONFIDENCE: ${Math.round((result.answer.confidence.min ?? 0) * 100)}% - ${Math.round((result.answer.confidence.max ?? 0) * 100)}%`);
        console.log(`REQUIRES REVIEW: ${result.answer.requiresReview}`);
        console.log(`CITATION IDS: ${result.answer.citationIds.join(', ') || '(none)'}`);
        console.log('-'.repeat(70));
        console.log();

        console.log('✅ Legal Answer Service working correctly');
        console.log();
        console.log('Next steps:');
        console.log('  1. Deploy LegalAnswerService in API endpoint');
        console.log('  2. Store result to answer_sessions table');
        console.log('  3. Link citations to answer_citations table');
        console.log('  4. Emit analytics event to answer_quality_feedback_events');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

main().catch(console.error);
