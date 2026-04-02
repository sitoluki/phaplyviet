import type { SourceRepository } from '../../legal-core/src/ingestion.js';
import type { LegalSourceRecord } from '../../legal-core/src/types.js';
import { getPool } from './connection.js';
import { generateId } from '../../legal-core/src/ids.js';

export class PostgreSQLSourceRepository implements SourceRepository {
    async upsertSource(source: LegalSourceRecord): Promise<void> {
        const db = getPool();
        const sourceId = source.legalSourceId || generateId('source');

        const query = `
            INSERT INTO legal_sources (
                legal_source_id, source_name, source_type, base_url,
                jurisdiction, is_active, curated_only, source_notes, retention_notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (legal_source_id) DO UPDATE SET
                source_name = $2,
                source_type = $3,
                base_url = $4,
                jurisdiction = $5,
                is_active = $6,
                curated_only = $7,
                source_notes = $8,
                retention_notes = $9,
                updated_at = NOW()
        `;

        await db.query(query, [
            sourceId,
            source.sourceName,
            source.sourceType,
            source.baseUrl,
            source.jurisdiction,
            source.isActive,
            source.curatedOnly,
            source.sourceNotes ?? null,
            source.retentionNotes ?? null,
        ]);
    }

    async findSourceByName(sourceName: string): Promise<LegalSourceRecord | null> {
        const db = getPool();

        const query = `
            SELECT
                legal_source_id as "legalSourceId",
                source_name as "sourceName",
                source_type as "sourceType",
                base_url as "baseUrl",
                jurisdiction,
                is_active as "isActive",
                curated_only as "curatedOnly",
                source_notes as "sourceNotes",
                retention_notes as "retentionNotes"
            FROM legal_sources
            WHERE source_name = $1
        `;

        const result = await db.query(query, [sourceName]);
        return result.rows[0] || null;
    }
}
