import { initDatabase, closeDatabase, getPool } from '@legal/db/index.js';

interface DocumentInspectionReport {
    itemId?: number;
    sourceUrl: string;
    title: string;
    numberSymbol?: string;
    issuingBody?: string;
    signedDate?: string;
    effectiveDate?: string;
    parseConfidence: number;
    parseStatus: string;
    warningsCount: number;
    sectionCount: number;
    chunkCount: number;
    citationTraceability: boolean;
}

async function inspectAndReportDocuments() {
    const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/phaplyviet_legal';

    console.log('🔍 Connecting to database...');
    const db = initDatabase(dbUrl);

    try {
        console.log('📊 Generating document inspection report...\n');

        // Get all documents with their metadata
        const query = `
            SELECT
                ld.legal_document_id,
                ld.source_url,
                ld.title,
                ld.number_symbol,
                ld.issuing_body,
                ld.signed_date,
                ld.effective_date,
                ld.current_version_id,
                ldv.parse_confidence,
                ldv.parse_status,
                ldv.parser_warnings_json,
                COUNT(DISTINCT lds.legal_document_section_id) as section_count,
                COUNT(DISTINCT ldc.legal_document_chunk_id) as chunk_count
            FROM legal_documents ld
            LEFT JOIN legal_document_versions ldv ON ld.current_version_id = ldv.legal_document_version_id
            LEFT JOIN legal_document_sections lds ON ld.legal_document_id = lds.legal_document_id
            LEFT JOIN legal_document_chunks ldc ON ld.legal_document_id = ldc.legal_document_id
            GROUP BY
                ld.legal_document_id,
                ld.source_url,
                ld.title,
                ld.number_symbol,
                ld.issuing_body,
                ld.signed_date,
                ld.effective_date,
                ld.current_version_id,
                ldv.parse_confidence,
                ldv.parse_status,
                ldv.parser_warnings_json
            ORDER BY ld.created_at ASC
        `;

        const result = await db.query(query);
        const documents = result.rows;

        if (documents.length === 0) {
            console.log('⚠️  No documents found in database.\n');
            return;
        }

        const reports: DocumentInspectionReport[] = [];

        for (const doc of documents) {
            const warningsCount = Array.isArray(doc.parser_warnings_json) ? doc.parser_warnings_json.length : 0;

            // Check citation traceability: document should have sections and chunks with proper links
            const hasSections = doc.section_count > 0;
            const hasChunks = doc.chunk_count > 0;
            const hasVersion = !!doc.current_version_id;
            const citationTraceability = hasSections && hasChunks && hasVersion;

            const report: DocumentInspectionReport = {
                sourceUrl: doc.source_url,
                title: doc.title,
                numberSymbol: doc.number_symbol,
                issuingBody: doc.issuing_body,
                signedDate: doc.signed_date,
                effectiveDate: doc.effective_date,
                parseConfidence: doc.parse_confidence ?? 0,
                parseStatus: doc.parse_status ?? 'unknown',
                warningsCount,
                sectionCount: doc.section_count || 0,
                chunkCount: doc.chunk_count || 0,
                citationTraceability
            };

            reports.push(report);
        }

        console.log('📋 DOCUMENT INSPECTION REPORT');
        console.log('='.repeat(120));
        console.log(`\nTotal Documents: ${reports.length}\n`);

        // Summary statistics
        const avgConfidence = (reports.reduce((sum, r) => sum + r.parseConfidence, 0) / reports.length).toFixed(2);
        const lowConfidenceCount = reports.filter((r) => r.parseConfidence < 0.7).length;
        const totalSections = reports.reduce((sum, r) => sum + r.sectionCount, 0);
        const totalChunks = reports.reduce((sum, r) => sum + r.chunkCount, 0);
        const allTraceable = reports.every((r) => r.citationTraceability);

        console.log('📊 SUMMARY STATISTICS');
        console.log('-'.repeat(120));
        console.log(`Average Parse Confidence: ${avgConfidence}`);
        console.log(`Low Confidence Documents (<0.7): ${lowConfidenceCount}`);
        console.log(`Total Sections: ${totalSections}`);
        console.log(`Total Chunks: ${totalChunks}`);
        console.log(`All Documents Citation-Traceable: ${allTraceable ? '✅ Yes' : '❌ No'}\n`);

        // Detailed report
        console.log('📄 DETAILED DOCUMENT REPORTS');
        console.log('-'.repeat(120));

        for (let i = 0; i < reports.length; i++) {
            const report = reports[i];
            const confidenceColor = report.parseConfidence >= 0.8 ? '✅' : report.parseConfidence >= 0.7 ? '⚠️ ' : '❌';
            const traceableIcon = report.citationTraceability ? '✅' : '❌';

            console.log(`\n[${i + 1}/${reports.length}] ${report.title}`);
            console.log(`    Source: ${report.sourceUrl}`);
            if (report.numberSymbol) {
                console.log(`    Number/Symbol: ${report.numberSymbol}`);
            }
            if (report.issuingBody) {
                console.log(`    Issuing Body: ${report.issuingBody}`);
            }
            if (report.signedDate) {
                console.log(`    Signed Date: ${report.signedDate}`);
            }
            if (report.effectiveDate) {
                console.log(`    Effective Date: ${report.effectiveDate}`);
            }
            console.log(`    Parse Status: ${report.parseStatus}`);
            console.log(`    ${confidenceColor} Parse Confidence: ${(report.parseConfidence * 100).toFixed(1)}%`);
            console.log(`    Warnings: ${report.warningsCount}`);
            console.log(`    Sections: ${report.sectionCount}`);
            console.log(`    Chunks: ${report.chunkCount}`);
            console.log(`    ${traceableIcon} Citation Traceability: ${report.citationTraceability ? 'Complete' : 'Incomplete'}`);
        }

        console.log('\n' + '='.repeat(120));
        console.log('📋 ANALYSIS');
        console.log('='.repeat(120));

        const withWarnings = reports.filter((r) => r.warningsCount > 0);
        if (withWarnings.length > 0) {
            console.log(`\n⚠️  Documents with warnings (${withWarnings.length}):`);
            for (const report of withWarnings) {
                console.log(`   - ${report.title} (${report.warningsCount} warnings)`);
            }
        }

        const lowConfidence = reports.filter((r) => r.parseConfidence < 0.7);
        if (lowConfidence.length > 0) {
            console.log(`\n⚠️  Low confidence documents (<0.7, ${lowConfidence.length}):`);
            for (const report of lowConfidence) {
                console.log(`   - ${report.title} (${(report.parseConfidence * 100).toFixed(1)}%)`);
            }
        }

        const notTraceable = reports.filter((r) => !r.citationTraceability);
        if (notTraceable.length > 0) {
            console.log(`\n❌ Documents missing citation traceability (${notTraceable.length}):`);
            for (const report of notTraceable) {
                console.log(`   - ${report.title}`);
                if (report.sectionCount === 0) console.log(`     → Missing sections`);
                if (report.chunkCount === 0) console.log(`     → Missing chunks`);
            }
        } else {
            console.log(`\n✅ All documents have complete citation traceability`);
        }

        console.log(`\n📈 Corpus Status: ${allTraceable ? '✅ Ready for retrieval implementation' : '⚠️  Needs parser/source fixes'}\n`);
    } catch (error) {
        console.error('\n❌ Fatal error during document inspection:', error);
        process.exit(1);
    } finally {
        console.log('🔌 Closing database connection...');
        await closeDatabase();
    }
}

await inspectAndReportDocuments();
