import express, { Express } from 'express';
import { initDatabase, PostgreSQLRetrievalRepository } from '@legal/db/index';
import { createRetrievalHandler } from './routes/retrieval';

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
        console.log(`  GET /health - Health check`);
    });
}
