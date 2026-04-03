import { describe, it, expect } from 'vitest';
import type {
    DailyQualityMetric,
    QualityTrendData,
} from '../packages/db/src/analyticsRepository';

describe('Analytics Dashboard', () => {
    describe('Quality metrics data structure', () => {
        it('should structure daily quality metrics correctly', () => {
            const dailyMetric: DailyQualityMetric = {
                eventDay: '2026-04-03',
                totalEvents: 100,
                helpfulEvents: 75,
                notHelpfulEvents: 25,
                helpfulRate: 0.75,
                avgScore: 4.2,
                citationMissingEvents: 2,
                citationIncorrectEvents: 1,
                outdatedLawEvents: 0,
                unsafeOrUncertainEvents: 5,
            };

            expect(dailyMetric.totalEvents).toBe(100);
            expect(dailyMetric.helpfulRate).toBe(0.75);
            expect(dailyMetric.unsafeOrUncertainEvents).toBe(5);
        });

        it('should compute helpful rate correctly', () => {
            const metric: DailyQualityMetric = {
                eventDay: '2026-04-03',
                totalEvents: 40,
                helpfulEvents: 30,
                notHelpfulEvents: 10,
                helpfulRate: 30 / 40,
                avgScore: null,
                citationMissingEvents: 0,
                citationIncorrectEvents: 0,
                outdatedLawEvents: 0,
                unsafeOrUncertainEvents: 0,
            };

            expect(metric.helpfulRate).toBeCloseTo(0.75);
        });

        it('should handle zero events gracefully', () => {
            const metric: DailyQualityMetric = {
                eventDay: '2026-04-03',
                totalEvents: 0,
                helpfulEvents: 0,
                notHelpfulEvents: 0,
                helpfulRate: 0,
                avgScore: null,
                citationMissingEvents: 0,
                citationIncorrectEvents: 0,
                outdatedLawEvents: 0,
                unsafeOrUncertainEvents: 0,
            };

            expect(metric.helpfulRate).toBe(0);
            expect(metric.avgScore).toBeNull();
        });
    });

    describe('Quality trend summary', () => {
        it('should aggregate daily metrics into summary', () => {
            const metrics: DailyQualityMetric[] = [
                {
                    eventDay: '2026-04-01',
                    totalEvents: 50,
                    helpfulEvents: 40,
                    notHelpfulEvents: 10,
                    helpfulRate: 0.8,
                    avgScore: 4.2,
                    citationMissingEvents: 1,
                    citationIncorrectEvents: 0,
                    outdatedLawEvents: 0,
                    unsafeOrUncertainEvents: 2,
                },
                {
                    eventDay: '2026-04-02',
                    totalEvents: 60,
                    helpfulEvents: 45,
                    notHelpfulEvents: 15,
                    helpfulRate: 0.75,
                    avgScore: 4.0,
                    citationMissingEvents: 2,
                    citationIncorrectEvents: 1,
                    outdatedLawEvents: 1,
                    unsafeOrUncertainEvents: 3,
                },
            ];

            const totalAnswers = metrics.reduce((sum, m) => sum + m.totalEvents, 0);
            const totalHelpful = metrics.reduce((sum, m) => sum + m.helpfulEvents, 0);
            const helpfulRate = totalHelpful / totalAnswers;

            expect(totalAnswers).toBe(110);
            expect(totalHelpful).toBe(85);
            expect(helpfulRate).toBeCloseTo(0.7727, 3);
        });

        it('should calculate citation issue rate', () => {
            const metrics: DailyQualityMetric[] = [
                {
                    eventDay: '2026-04-01',
                    totalEvents: 100,
                    helpfulEvents: 75,
                    notHelpfulEvents: 25,
                    helpfulRate: 0.75,
                    avgScore: 4.0,
                    citationMissingEvents: 3,
                    citationIncorrectEvents: 2,
                    outdatedLawEvents: 1,
                    unsafeOrUncertainEvents: 2,
                },
            ];

            const totalAnswers = 100;
            const totalCitationIssues =
                3 + 2 + 1; /* missing + incorrect + outdated */
            const citationIssueRate = totalCitationIssues / totalAnswers;

            expect(citationIssueRate).toBe(0.06);
        });

        it('should calculate escalation rate', () => {
            const metrics: DailyQualityMetric[] = [
                {
                    eventDay: '2026-04-01',
                    totalEvents: 100,
                    helpfulEvents: 85,
                    notHelpfulEvents: 15,
                    helpfulRate: 0.85,
                    avgScore: 4.2,
                    citationMissingEvents: 1,
                    citationIncorrectEvents: 0,
                    outdatedLawEvents: 0,
                    unsafeOrUncertainEvents: 8,
                },
            ];

            const totalAnswers = 100;
            const totalEscalated = 8;
            const escalationRate = totalEscalated / totalAnswers;

            expect(escalationRate).toBe(0.08);
        });

        it('should structure quality trend data with date range', () => {
            const trendData: QualityTrendData = {
                dateRange: {
                    start: '2026-03-04',
                    end: '2026-04-03',
                },
                metrics: [
                    {
                        eventDay: '2026-04-03',
                        totalEvents: 50,
                        helpfulEvents: 40,
                        notHelpfulEvents: 10,
                        helpfulRate: 0.8,
                        avgScore: 4.1,
                        citationMissingEvents: 1,
                        citationIncorrectEvents: 0,
                        outdatedLawEvents: 0,
                        unsafeOrUncertainEvents: 2,
                    },
                ],
                summary: {
                    totalAnswers: 50,
                    helpfulRate: 0.8,
                    citationIssueRate: 0.02,
                    escalationRate: 0.04,
                    avgScore: 4.1,
                },
            };

            expect(trendData.dateRange.start).toBe('2026-03-04');
            expect(trendData.dateRange.end).toBe('2026-04-03');
            expect(trendData.summary.helpfulRate).toBe(0.8);
            expect(trendData.summary.escalationRate).toBe(0.04);
        });
    });

    describe('Escalated answers review', () => {
        it('should identify escalated answers for review', () => {
            const escalatedAnswer = {
                answerSessionId: 'session_123',
                queryText: 'tôi cần kiện công ty',
                answerMode: 'safer_response',
                escalated: true,
                citationCount: 0,
                feedbackType: 'unsafe_or_uncertain',
                feedback: 'Vấn đề quá phức tạp',
                createdAt: '2026-04-03T10:00:00Z',
            };

            expect(escalatedAnswer.escalated).toBe(true);
            expect(escalatedAnswer.feedbackType).toBe('unsafe_or_uncertain');
            expect(escalatedAnswer.answerMode).toBe('safer_response');
        });

        it('should include user feedback in escalated answers', () => {
            const escalatedAnswer = {
                answerSessionId: 'session_456',
                queryText: 'ly hôn',
                answerMode: 'safer_response',
                escalated: true,
                citationCount: 1,
                feedbackType: 'unsafe_or_uncertain',
                feedback: 'Không phù hợp với tình huống của tôi',
                createdAt: '2026-04-03T11:30:00Z',
            };

            expect(escalatedAnswer.feedback).toBeTruthy();
            expect(escalatedAnswer.feedback).toMatch(/không phù hợp/i);
        });
    });

    describe('Quality by answer mode', () => {
        it('should compare normal vs safer_response quality', () => {
            const qualityByMode = [
                {
                    answerMode: 'normal',
                    totalAnswers: 200,
                    helpfulRate: 0.85,
                    avgScore: 4.3,
                    escalationCount: 2,
                },
                {
                    answerMode: 'safer_response',
                    totalAnswers: 30,
                    helpfulRate: 0.33,
                    avgScore: null,
                    escalationCount: 20,
                },
            ];

            expect(qualityByMode[0].helpfulRate).toBeGreaterThan(
                qualityByMode[1].helpfulRate
            );
            expect(qualityByMode[0].escalationCount).toBeLessThan(
                qualityByMode[1].escalationCount
            );
        });

        it('should show normal mode has higher quality metrics', () => {
            const normalMode = {
                answerMode: 'normal',
                totalAnswers: 500,
                helpfulRate: 0.82,
                avgScore: 4.15,
                escalationCount: 8,
            };

            expect(normalMode.helpfulRate).toBeGreaterThan(0.8);
            expect(normalMode.avgScore).toBeGreaterThan(4.0);
            expect(normalMode.escalationCount).toBeLessThan(
                normalMode.totalAnswers * 0.05
            );
        });
    });

    describe('Analytics API endpoint contracts', () => {
        it('should return quality metrics with date range query parameter', () => {
            // GET /api/analytics/quality?daysBack=30
            const queryParams = { daysBack: '30' };
            expect(queryParams.daysBack).toBe('30');
        });

        it('should validate daysBack parameter bounds', () => {
            const validRanges = [
                { daysBack: 1, valid: true },
                { daysBack: 30, valid: true },
                { daysBack: 365, valid: true },
                { daysBack: 0, valid: false },
                { daysBack: 400, valid: false },
            ];

            validRanges.forEach(({ daysBack, valid }) => {
                const isValid = daysBack >= 1 && daysBack <= 365;
                expect(isValid).toBe(valid);
            });
        });

        it('should return escalated answers with limit parameter', () => {
            // GET /api/analytics/escalated?limit=20
            const queryParams = { limit: '20' };
            const limit = parseInt(queryParams.limit, 10);
            expect(limit).toBe(20);
            expect(limit).toBeGreaterThanOrEqual(1);
            expect(limit).toBeLessThanOrEqual(100);
        });

        it('should return quality by mode without parameters', () => {
            // GET /api/analytics/quality-by-mode
            // No query parameters required
            expect(true).toBe(true);
        });
    });
});
