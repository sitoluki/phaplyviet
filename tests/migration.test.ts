import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const migrationPath = path.join(process.cwd(), 'packages', 'db', 'migrations', '0001_legal_corpus_base.sql');

describe('database migration', () => {
    it('contains the expected enums and tables', async () => {
        const sql = await readFile(migrationPath, 'utf8');

        expect(sql).toContain('CREATE TYPE legal_status AS ENUM');
        expect(sql).toContain('CREATE TYPE source_type AS ENUM');
        expect(sql).toContain('CREATE TYPE section_type AS ENUM');
        expect(sql).toContain('CREATE TYPE ingest_status AS ENUM');
        expect(sql).toContain('CREATE TYPE parse_status AS ENUM');
        expect(sql).toContain('CREATE TABLE IF NOT EXISTS legal_sources');
        expect(sql).toContain('CREATE TABLE IF NOT EXISTS legal_documents');
        expect(sql).toContain('CREATE TABLE IF NOT EXISTS legal_document_versions');
        expect(sql).toContain('CREATE TABLE IF NOT EXISTS legal_document_sections');
        expect(sql).toContain('CREATE TABLE IF NOT EXISTS legal_document_chunks');
        expect(sql).toContain('CREATE TABLE IF NOT EXISTS legal_document_relationships');
        expect(sql).toContain('CREATE TABLE IF NOT EXISTS ingestion_jobs');
        expect(sql).toContain('CREATE TABLE IF NOT EXISTS ingestion_errors');
    });
});
