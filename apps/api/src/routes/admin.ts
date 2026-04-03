import type { Request, Response } from 'express';
import AdminRepository from '@legal/db/adminRepository';

export function createAdminHandler() {
    return {
        async getIngestOverview(req: Request, res: Response): Promise<void> {
            try {
                const data = await AdminRepository.getIngestOverview();
                res.status(200).json({
                    success: true,
                    data,
                });
            } catch (error) {
                const err = error as any;
                res.status(500).json({
                    success: false,
                    error: {
                        code: err.code ?? 'ADMIN_ERROR',
                        message: err.message ?? 'Failed to load ingest overview.',
                    },
                });
            }
        },

        async listIngestJobs(req: Request, res: Response): Promise<void> {
            try {
                const query = req.query as Record<string, string>;
                const limit = parseInt(query.limit ?? '25', 10);
                const status = query.status?.trim();

                if (Number.isNaN(limit) || limit < 1 || limit > 100) {
                    res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_PARAMS',
                            message: 'limit must be between 1 and 100.',
                        },
                    });
                    return;
                }

                const data = await AdminRepository.listIngestJobs({
                    limit,
                    status: status || undefined,
                });

                res.status(200).json({
                    success: true,
                    data: {
                        jobs: data,
                        count: data.length,
                    },
                });
            } catch (error) {
                const err = error as any;
                res.status(500).json({
                    success: false,
                    error: {
                        code: err.code ?? 'ADMIN_ERROR',
                        message: err.message ?? 'Failed to load ingest jobs.',
                    },
                });
            }
        },

        async listIngestErrors(req: Request, res: Response): Promise<void> {
            try {
                const query = req.query as Record<string, string>;
                const limit = parseInt(query.limit ?? '25', 10);

                if (Number.isNaN(limit) || limit < 1 || limit > 100) {
                    res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_PARAMS',
                            message: 'limit must be between 1 and 100.',
                        },
                    });
                    return;
                }

                const data = await AdminRepository.listIngestErrors(limit);

                res.status(200).json({
                    success: true,
                    data: {
                        errors: data,
                        count: data.length,
                    },
                });
            } catch (error) {
                const err = error as any;
                res.status(500).json({
                    success: false,
                    error: {
                        code: err.code ?? 'ADMIN_ERROR',
                        message: err.message ?? 'Failed to load ingest errors.',
                    },
                });
            }
        },
    };
}
