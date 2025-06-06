/**
 * Request logging middleware for development
 */

import { Request, Response, NextFunction } from "express";
import { isDevelopment } from "../utils";

export const requestLogger = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    if (!isDevelopment()) {
        return next();
    }

    const startTime = Date.now();
    const { method, url, ip } = req;

    // Log request start
    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${ip}`);

    // Override res.end to log response
    const originalEnd = res.end;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.end = function (chunk?: any, encoding?: any): Response {
        const duration = Date.now() - startTime;
        const { statusCode } = res;
        const statusColor =
            statusCode >= 400
                ? "\x1b[31m"
                : statusCode >= 300
                  ? "\x1b[33m"
                  : "\x1b[32m";

        console.log(
            `[${new Date().toISOString()}] ${method} ${url} - ${statusColor}${statusCode}\x1b[0m - ${duration}ms`,
        );

        // Call original end method
        originalEnd.call(this, chunk, encoding);
        return this;
    };

    next();
};
