import { closeDatabase, initDatabase, PostgreSQLRetrievalRepository } from '@legal/db/index.js';

async function main() {
    const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/phaplyviet_legal';
    initDatabase(dbUrl);

    try {
        const retrieval = new PostgreSQLRetrievalRepository();
        const bundle = await retrieval.getAnswerContextBundle({
            queryText: 'nguoi lao dong',
            topK: 5,
            minConfidence: 0.7
        });

        const summary = await retrieval.summarizeAnswerContextBundle({
            queryText: 'nguoi lao dong',
            topK: 5,
            minConfidence: 0.7
        });

        const regression = await retrieval.runRetrievalRegression(5);
        const traceability = await retrieval.evaluateAnswerTraceability('ans_session_pilot_001');

        console.log('Bundle rows:', bundle.length);
        console.log('Summary:', summary);
        console.log('Regression cases:', regression.length);
        console.log('Traceability:', traceability);
    } finally {
        await closeDatabase();
    }
}

await main();
