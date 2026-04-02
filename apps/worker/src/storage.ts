import type { RawSnapshotArtifact, SnapshotStorage } from '../../../packages/legal-core/src/ingestion.js';

export class FileSystemSnapshotStorage implements SnapshotStorage {
    constructor(private readonly rootUri: string) { }

    async saveRawSnapshot(input: { sourceUrl: string; payload: string; checksum: string; retentionNotes: string }): Promise<RawSnapshotArtifact> {
        const safeName = input.sourceUrl.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
        return {
            sourceUrl: input.sourceUrl,
            sourceName: safeName,
            objectStorageUri: `${this.rootUri}/${safeName}/${input.checksum}.html`,
            checksum: input.checksum,
            fetchedAt: new Date().toISOString(),
            retentionNotes: input.retentionNotes
        };
    }
}
