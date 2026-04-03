import { getPool } from './connection.js';

export interface DailyQualityMetric {
    eventDay: string;
    totalEvents: number;
    helpfulEvents: number;
    notHelpfulEvents: number;
    helpfulRate: number;
    avgScore: number | null;
    citationMissingEvents: number;
    citationIncorrectEvents: number;
    outdatedLawEvents: number;
    unsafeOrUncertainEvents: number;
}

export interface QualityTrendData {
    dateRange: {
        start: string;
        end: string;
    };
    metrics: DailyQualityMetric[];
    summary: {
        totalAnswers: number;
        helpfulRate: number;
        citationIssueRate: number;
        escalationRate: number;
        avgScore: number | null;
    };
}

export class AnalyticsRepository {
    /**
     * Get daily quality metrics for a date range.
     * Uses the answer_quality_feedback_summary_v view.
     */
    async getDailyQualityMetrics(daysBack: number = 30): Promise<QualityTrendData> {
        const db = getPool();

        // Query summary view for the date range
        const result = await db.query<{
            event_day: string;
            total_events: number;
            helpful_events: number;
            not_helpful_events: number;
            avg_score: number | null;
            citation_missing_events: number;
            citation_incorrect_events: number;
            outdated_law_events: number;
            unsafe_or_uncertain_events: number;
        }>(
            `
            SELECT
                event_day,
                total_events,
                helpful_events,
                not_helpful_events,
                avg_score,
                citation_missing_events,
                citation_incorrect_events,
                outdated_law_events,
                unsafe_or_uncertain_events
            FROM public.answer_quality_feedback_summary_v
            WHERE event_day >= NOW()::date - INTERVAL '1 day' * $1
            ORDER BY event_day DESC
            `,
            [daysBack]
        );

        // Transform to metrics with computed fields
        const metrics: DailyQualityMetric[] = result.rows.map((row) => ({
            eventDay: row.event_day,
            totalEvents: row.total_events,
            helpfulEvents: row.helpful_events,
            notHelpfulEvents: row.not_helpful_events,
            helpfulRate:
                row.total_events > 0 ? row.helpful_events / row.total_events : 0,
            avgScore: row.avg_score,
            citationMissingEvents: row.citation_missing_events,
            citationIncorrectEvents: row.citation_incorrect_events,
            outdatedLawEvents: row.outdated_law_events,
            unsafeOrUncertainEvents: row.unsafe_or_uncertain_events,
        }));

        // Compute aggregated summary
        const totalAnswers = metrics.reduce((sum, m) => sum + m.totalEvents, 0);
        const totalHelpful = metrics.reduce((sum, m) => sum + m.helpfulEvents, 0);
        const totalCitationIssues = metrics.reduce(
            (sum, m) =>
                sum +
                m.citationMissingEvents +
                m.citationIncorrectEvents +
                m.outdatedLawEvents,
            0
        );
        const totalEscalated = metrics.reduce(
            (sum, m) => sum + m.unsafeOrUncertainEvents,
            0
        );

        const avgScores = metrics
            .filter((m) => m.avgScore !== null)
            .map((m) => m.avgScore as number);

        return {
            dateRange: {
                start: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0],
                end: new Date().toISOString().split('T')[0],
            },
            metrics: metrics.reverse(), // Chronological order for rendering
            summary: {
                totalAnswers,
                helpfulRate: totalAnswers > 0 ? totalHelpful / totalAnswers : 0,
                citationIssueRate: totalAnswers > 0 ? totalCitationIssues / totalAnswers : 0,
                escalationRate: totalAnswers > 0 ? totalEscalated / totalAnswers : 0,
                avgScore: avgScores.length > 0 ? avgScores.reduce((a, b) => a + b) / avgScores.length : null,
            },
        };
    }

    /**
     * Get recent escalated answers for review.
     * Joins answer_sessions with feedback events to find unsafe/uncertain answers.
     */
    async getRecentEscalatedAnswers(limit: number = 20): Promise<
        Array<{
            answerSessionId: string;
            queryText: string;
            answerMode: string;
            escalated: boolean;
            citationCount: number;
            feedbackType: string;
            feedback: string | null;
            createdAt: string;
        }>
    > {
        const db = getPool();

        const result = await db.query<{
            answer_session_id: string;
            query_text: string;
            answer_mode: string;
            escalated: boolean;
            context_chunk_count: number;
            feedback_type: string;
            comment_text: string | null;
            created_at: string;
        }>(
            `
            SELECT
                s.answer_session_id,
                s.query_text,
                s.answer_mode,
                s.escalated,
                s.context_chunk_count,
                f.feedback_type,
                f.comment_text,
                f.created_at
            FROM public.answer_sessions s
            LEFT JOIN public.answer_quality_feedback_events f
                ON s.answer_session_id = f.answer_session_id
            WHERE f.feedback_type = 'unsafe_or_uncertain'
                OR (f.feedback_type IS NULL AND s.escalated = true)
            ORDER BY COALESCE(f.created_at, s.created_at) DESC
            LIMIT $1
            `,
            [limit]
        );

        return result.rows.map((row) => ({
            answerSessionId: row.answer_session_id,
            queryText: row.query_text,
            answerMode: row.answer_mode,
            escalated: row.escalated,
            citationCount: row.context_chunk_count,
            feedbackType: row.feedback_type,
            feedback: row.comment_text,
            createdAt: row.created_at,
        }));
    }

    /**
     * Get quality distribution by answer mode.
     */
    async getQualityByMode(): Promise<
        Array<{
            answerMode: string;
            totalAnswers: number;
            helpfulRate: number;
            avgScore: number | null;
            escalationCount: number;
        }>
    > {
        const db = getPool();

        const result = await db.query<{
            answer_mode: string;
            total_answers: number;
            helpful_count: number;
            avg_score: number | null;
            escalation_count: number;
        }>(
            `
            SELECT
                s.answer_mode,
                count(DISTINCT s.answer_session_id)::integer AS total_answers,
                count(DISTINCT CASE WHEN f.is_helpful = true THEN s.answer_session_id END)::integer AS helpful_count,
                round(avg(f.score)::numeric, 3) AS avg_score,
                count(DISTINCT CASE WHEN f.feedback_type = 'unsafe_or_uncertain' THEN s.answer_session_id END)::integer AS escalation_count
            FROM public.answer_sessions s
            LEFT JOIN public.answer_quality_feedback_events f
                ON s.answer_session_id = f.answer_session_id
            GROUP BY s.answer_mode
            ORDER BY total_answers DESC
            `
        );

        return result.rows.map((row) => ({
            answerMode: row.answer_mode,
            totalAnswers: row.total_answers,
            helpfulRate: row.total_answers > 0 ? row.helpful_count / row.total_answers : 0,
            avgScore: row.avg_score,
            escalationCount: row.escalation_count,
        }));
    }
}

export default new AnalyticsRepository();
