export interface RetrievalContextRequest {
    queryText: string;
    topK?: number;
    minConfidence?: number;
    userId?: string;
}

export interface RetrievalContextResponse {
    success: boolean;
    data?: {
        answerSessionId: string;
        queryText: string;
        answer: {
            content: string;
            mode: 'normal' | 'safer_response';
            confidence: {
                min: number | null;
                max: number | null;
            };
            requiresReview: boolean;
            citationIds: string[];
        };
        processingMode: 'normal' | 'safer_response';
        escalated: boolean;
        totalContextChunks: number;
    };
    error?: {
        code: string;
        message: string;
    };
}
