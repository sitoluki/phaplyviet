import express, { Express } from 'express';
import { initDatabase, PostgreSQLRetrievalRepository } from '@legal/db/index';
import { createRetrievalHandler } from './routes/retrieval';
import { createAnalyticsHandler } from './routes/analytics';
import { createAdminHandler } from './routes/admin';

export async function createApp(): Promise<Express> {
    const app = express();

    // Middleware
    app.use(express.json());

    // Initialize database
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is not set.');
    }
    await initDatabase(databaseUrl);
    const repository = new PostgreSQLRetrievalRepository();

    // Routes
    const handleRetrieval = createRetrievalHandler(repository);
    app.post('/api/retrieval/context', handleRetrieval);

    const analyticsHandler = createAnalyticsHandler();
    app.get('/api/analytics/quality', (req, res) =>
        analyticsHandler.getQualityMetrics(req, res)
    );
    app.get('/api/analytics/escalated', (req, res) =>
        analyticsHandler.getEscalatedAnswers(req, res)
    );
    app.get('/api/analytics/quality-by-mode', (req, res) =>
        analyticsHandler.getQualityByMode(req, res)
    );

    const adminHandler = createAdminHandler();
    app.get('/api/admin/ingest/overview', (req, res) =>
        adminHandler.getIngestOverview(req, res)
    );
    app.get('/api/admin/ingest/jobs', (req, res) =>
        adminHandler.listIngestJobs(req, res)
    );
    app.get('/api/admin/ingest/errors', (req, res) =>
        adminHandler.listIngestErrors(req, res)
    );

    // Health check
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // 404
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: 'Endpoint not found.',
            },
        });
    });

    return app;
}

export async function startServer(port: number = 3000) {
    const app = await createApp();

    app.listen(port, () => {
        console.log(`Legal Answer API server running on port ${port}`);
        console.log(`  POST /api/retrieval/context - Generate legal answer with citations`);
        console.log(`  GET /api/analytics/quality - Daily quality metrics`);
        console.log(`  GET /api/analytics/escalated - Recent escalated answers`);
        console.log(`  GET /api/analytics/quality-by-mode - Quality by answer mode`);
        console.log(`  GET /api/admin/ingest/overview - Ingest overview`);
        console.log(`  GET /api/admin/ingest/jobs - Ingest jobs`);
        console.log(`  GET /api/admin/ingest/errors - Ingest errors`);
        console.log(`  GET /health - Health check`);
    });
}
