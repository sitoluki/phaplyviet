export interface CitationTraceLink {
    citationId: string;
    chunkId: string;
    sectionId: string;
    documentId: string;
    sourceUrl: string;
    citationLabel: string;
}

export function validateCitationTrace(link: CitationTraceLink): boolean {
    return (
        link.citationId.length > 0 &&
        link.chunkId.length > 0 &&
        link.sectionId.length > 0 &&
        link.documentId.length > 0 &&
        link.sourceUrl.length > 0 &&
        link.citationLabel.length > 0
    );
}
