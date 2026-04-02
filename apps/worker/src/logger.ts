import type { IngestionLogger } from '../../../packages/legal-core/src/ingestion.js';

export class ConsoleIngestionLogger implements IngestionLogger {
    info(message: string, context?: Record<string, unknown>): void {
        console.log(message, context ?? {});
    }

    warn(message: string, context?: Record<string, unknown>): void {
        console.warn(message, context ?? {});
    }

    error(message: string, context?: Record<string, unknown>): void {
        console.error(message, context ?? {});
    }
}
