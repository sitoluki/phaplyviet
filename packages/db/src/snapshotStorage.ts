import type { RawSnapshotArtifact, SnapshotStorage } from '../../legal-core/src/ingestion.js';
import { getPool } from './connection.js';
import { generateId } from '../../legal-core/src/ids.js';
import { createHash } from 'crypto';

export class PostgreSQLSnapshotStorage implements SnapshotStorage {
    async saveRawSnapshot(input: {
        sourceUrl: string;
        payload: string;
        checksum: string;
        retentionNotes: string;
    }): Promise<RawSnapshotArtifact> {
        const db = getPool();
        const snapshotId = generateId('snapshot');

        // Create a safe name from the source URL
        const safeName = new URL(input.sourceUrl).hostname
            .toLowerCase()
            .replace(/[^a-z0-9]+/gi, '_');

        const objectStorageUri = `pg://${snapshotId}`;

        // Note: In a real system, you might store the actual snapshot payload
        // in a separate storage service (S3, GCS, etc.) and just store the reference here.
        // For this implementation, we're storing metadata about the snapshot.
        // You could add a 'raw_snapshot_content' TEXT column to store the actual content.

        const query = `
            INSERT INTO raw_snapshots (
                raw_snapshot_id, source_url, source_name, checksum, retention_notes, object_storage_uri
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING
                raw_snapshot_id as "id",
                source_url as "sourceUrl",
                source_name as "sourceName",
                checksum,
                fetched_at as "fetchedAt",
                retention_notes as "retentionNotes",
                object_storage_uri as "objectStorageUri"
        `;

        const result = await db.query(query, [
            snapshotId,
            input.sourceUrl,
            safeName,
            input.checksum,
            input.retentionNotes,
            objectStorageUri
        ]);

        const row = result.rows[0];
        return {
            sourceUrl: row.sourceUrl,
            sourceName: row.sourceName,
            objectStorageUri: row.objectStorageUri,
            checksum: row.checksum,
            fetchedAt: row.fetchedAt,
            retentionNotes: row.retentionNotes
        };
    }
}

export class PostgreSQLSnapshotStorageWithContent extends PostgreSQLSnapshotStorage {
    async saveRawSnapshot(input: {
        sourceUrl: string;
        payload: string;
        checksum: string;
        retentionNotes: string;
    }): Promise<RawSnapshotArtifact> {
        const db = getPool();
        const snapshotId = generateId('snapshot');
        const safeName = new URL(input.sourceUrl).hostname
            .toLowerCase()
            .replace(/[^a-z0-9]+/gi, '_');
        const objectStorageUri = `pg://${snapshotId}`;

        // Compute content checksum separately
        const contentChecksum = createHash('sha256').update(input.payload).digest('hex');

        const query = `
            INSERT INTO raw_snapshots (
                raw_snapshot_id, source_url, source_name, checksum, retention_notes,
                object_storage_uri, raw_content, content_checksum
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING
                raw_snapshot_id as "id",
                source_url as "sourceUrl",
                source_name as "sourceName",
                checksum,
                fetched_at as "fetchedAt",
                retention_notes as "retentionNotes",
                object_storage_uri as "objectStorageUri"
        `;

        const result = await db.query(query, [
            snapshotId,
            input.sourceUrl,
            safeName,
            input.checksum,
            input.retentionNotes,
            objectStorageUri,
            input.payload,
            contentChecksum
        ]);

        const row = result.rows[0];
        return {
            sourceUrl: row.sourceUrl,
            sourceName: row.sourceName,
            objectStorageUri: row.objectStorageUri,
            checksum: row.checksum,
            fetchedAt: row.fetchedAt,
            retentionNotes: row.retentionNotes
        };
    }
}
