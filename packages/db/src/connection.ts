import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function initDatabase(connectionString: string): pg.Pool {
    if (pool) {
        return pool;
    }

    pool = new Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err: Error) => {
        console.error('Unexpected error on idle client', err);
    });

    return pool;
}

export function getPool(): pg.Pool {
    if (!pool) {
        throw new Error('Database pool not initialized. Call initDatabase() first.');
    }
    return pool;
}

export async function closeDatabase(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

export async function runMigrations(migrationDir: string = './packages/db/migrations'): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const db = getPool();

    // Get all .sql files in the migrations directory, sorted by name
    const files = await fs.readdir(migrationDir);
    const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
        const filePath = path.join(migrationDir, file);
        const sql = await fs.readFile(filePath, 'utf-8');
        try {
            await db.query(sql);
            console.log(`✓ Migrated ${file}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error(`✗ Failed to migrate ${file}: ${message}`);
            throw error;
        }
    }
}
