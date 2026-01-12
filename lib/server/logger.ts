import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';

export interface LogContext {
  requestId: string;
  userId?: string;
  orgId?: string;
  jobId?: string;
}

export interface RequestLogger {
  info: (message: string, data?: object) => void;
  warn: (message: string, data?: object) => void;
  error: (message: string, error?: Error | unknown, data?: object) => void;
  debug: (message: string, data?: object) => void;
}

/**
 * Create a structured logger for a request context.
 * Outputs JSON logs suitable for log aggregation services.
 */
export function createRequestLogger(
  req: NextRequest | null,
  context: Partial<LogContext> = {}
): RequestLogger {
  const requestId = context.requestId || randomUUID();
  const baseContext = {
    requestId,
    userId: context.userId,
    orgId: context.orgId,
    jobId: context.jobId,
    path: req?.nextUrl?.pathname,
    method: req?.method,
  };

  const formatLog = (level: string, message: string, data?: object) => {
    return JSON.stringify({
      level,
      timestamp: new Date().toISOString(),
      ...baseContext,
      message,
      ...data,
    });
  };

  return {
    info: (message: string, data?: object) => {
      console.log(formatLog('info', message, data));
    },

    warn: (message: string, data?: object) => {
      console.warn(formatLog('warn', message, data));
    },

    error: (message: string, error?: Error | unknown, data?: object) => {
      const errorData: Record<string, unknown> = { ...data };
      
      if (error instanceof Error) {
        errorData.error = error.message;
        errorData.stack = error.stack;
        errorData.errorName = error.name;
      } else if (error) {
        errorData.error = String(error);
      }

      console.error(formatLog('error', message, errorData));
    },

    debug: (message: string, data?: object) => {
      if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
        console.log(formatLog('debug', message, data));
      }
    },
  };
}

/**
 * Generate a unique request ID.
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Extract request ID from headers or generate a new one.
 */
export function getOrCreateRequestId(req: NextRequest): string {
  return req.headers.get('x-request-id') || generateRequestId();
}
