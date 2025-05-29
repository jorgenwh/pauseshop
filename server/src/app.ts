/**
 * Express app configuration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger, globalErrorHandler, notFoundHandler } from './middleware';
import routes from './routes';
import { getVersion } from './utils';

const createApp = (): express.Application => {
    const app = express();

    // Set app locals
    app.locals.startTime = new Date();
    app.locals.version = getVersion();

    // Trust proxy (for accurate IP addresses)
    app.set('trust proxy', 1);

    // Security middleware - Helmet
    app.use(helmet({
        contentSecurityPolicy: false, // Allow extension communication
        crossOriginEmbedderPolicy: false
    }));

    // CORS configuration for extension communication
    app.use(cors({
        origin: [
            'chrome-extension://*',
            /^chrome-extension:\/\/.*$/,
            'http://localhost:3000', // For local development testing
            'http://127.0.0.1:3000'
        ],
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: false
    }));

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' })); // For base64 images
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging (development only)
    app.use(requestLogger);

    // API routes
    app.use('/', routes);

    // 404 handler
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(globalErrorHandler);

    return app;
};

export default createApp;
