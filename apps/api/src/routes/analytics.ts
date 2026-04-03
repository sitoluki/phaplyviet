import type { Request, Response } from 'express';
import AnalyticsRepository from '@legal/db/analyticsRepository';

export function createAnalyticsHandler() {
    return {
        /**
         * GET /api/analytics/quality
         * Returns daily quality metrics for the past 30 days
         */
        async getQualityMetrics(req: Request, res: Response): Promise<void> {
            try {
                const query = req.query as Record<string, string>;
                const daysBack = parseInt(query.daysBack || '30', 10);

                if (daysBack < 1 || daysBack > 365) {
                    res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_PARAMS',
                            message: 'daysBack must be between 1 and 365',
                        },
                    });
                    return;
                }

                const data = await AnalyticsRepository.getDailyQualityMetrics(
                    daysBack
                );

                res.status(200).json({
                    success: true,
                    data,
                });
            } catch (error) {
                const err = error as any;
                res.status(500).json({
                    success: false,
                    error: {
                        code: err.code ?? 'ANALYTICS_ERROR',
                        message: err.message ?? 'Failed to retrieve analytics data',
                    },
                });
            }
        },

        /**
         * GET /api/analytics/escalated
         * Returns recent escalated answers requiring review
         */
        async getEscalatedAnswers(req: Request, res: Response): Promise<void> {
            try {
                const query = req.query as Record<string, string>;
                const limit = parseInt(query.limit || '20', 10);

                if (limit < 1 || limit > 100) {
                    res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_PARAMS',
                            message: 'limit must be between 1 and 100',
                        },
                    });
                    return;
                }

                const data = await AnalyticsRepository.getRecentEscalatedAnswers(
                    limit
                );

                res.status(200).json({
                    success: true,
                    data: {
                        escalatedAnswers: data,
                        count: data.length,
                    },
                });
            } catch (error) {
                const err = error as any;
                res.status(500).json({
                    success: false,
                    error: {
                        code: err.code ?? 'ANALYTICS_ERROR',
                        message: err.message ?? 'Failed to retrieve escalated answers',
                    },
                });
            }
        },

        /**
         * GET /api/analytics/quality-by-mode
         * Returns quality distribution by answer mode (normal vs safer_response)
         */
        async getQualityByMode(req: Request, res: Response): Promise<void> {
            try {
                const data = await AnalyticsRepository.getQualityByMode();

                res.status(200).json({
                    success: true,
                    data: {
                        byMode: data,
                    },
                });
            } catch (error) {
                const err = error as any;
                res.status(500).json({
                    success: false,
                    error: {
                        code: err.code ?? 'ANALYTICS_ERROR',
                        message: err.message ?? 'Failed to retrieve quality metrics',
                    },
                });
            }
        },
    };
}
