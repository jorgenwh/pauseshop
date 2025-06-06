/**
 * Express app configuration
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import {
    requestLogger,
    globalErrorHandler,
    notFoundHandler,
} from "./middleware";
import routes from "./routes";
import { getVersion } from "./utils";
import { AnalysisProviderFactory } from "./services/analysis-provider-factory";

const createApp = (): express.Application => {
    const app = express();

    // Log startup configuration
    console.log("=================================");
    console.log("PauseShop Server Starting...");
    console.log("=================================");
    console.log("Environment Variables:");
    console.log(`NODE_ENV: ${process.env.NODE_ENV || "not set"}`);
    console.log(`PORT: ${process.env.PORT || "not set"}`);
    console.log(
        `ANALYSIS_PROVIDER: "${process.env.ANALYSIS_PROVIDER || "not set"}"`,
    );

    // Log provider-specific configuration
    const currentProvider = AnalysisProviderFactory.getCurrentProvider();
    console.log(`Current Provider: ${currentProvider}`);

    if (currentProvider === "openai") {
        console.log("OpenAI Configuration:");
        console.log(
            `  API Key: ${process.env.OPENAI_API_KEY ? "Set (****)" : "NOT SET"}`,
        );
        console.log(
            `  Model: ${process.env.OPENAI_MODEL || "gpt-4o-mini (default)"}`,
        );
        console.log(
            `  Max Tokens: ${process.env.OPENAI_MAX_TOKENS || "1000 (default)"}`,
        );
    } else if (currentProvider === "requesty") {
        console.log("Requesty Configuration:");
        console.log(
            `  API Key: ${process.env.REQUESTY_API_KEY ? "Set (****)" : "NOT SET"}`,
        );
        console.log(
            `  Model: ${process.env.REQUESTY_MODEL || "openai/gpt-4o-mini (default)"}`,
        );
        console.log(
            `  Max Tokens: ${process.env.REQUESTY_MAX_TOKENS || "1000 (default)"}`,
        );
        console.log(
            `  Site URL: ${process.env.REQUESTY_SITE_URL || "not set"}`,
        );
        console.log(
            `  Site Name: ${process.env.REQUESTY_SITE_NAME || "not set"}`,
        );
    }

    // Validate provider configuration
    const validation = AnalysisProviderFactory.validateProviderConfig();
    console.log(
        `Provider Config: ${validation.isValid ? "✅ Valid" : "❌ Invalid - " + validation.error}`,
    );
    console.log("=================================");

    // Set app locals
    app.locals.startTime = new Date();
    app.locals.version = getVersion();

    // Trust proxy (for accurate IP addresses)
    app.set("trust proxy", 1);

    // Security middleware - Helmet
    app.use(
        helmet({
            contentSecurityPolicy: false, // Allow extension communication
            crossOriginEmbedderPolicy: false,
        }),
    );

    // CORS configuration for extension communication
    app.use(
        cors({
            origin: [
                "chrome-extension://*",
                /^chrome-extension:\/\/.*$/,
                "http://localhost:3000", // For local development testing
                "http://127.0.0.1:3000",
            ],
            methods: ["GET", "POST", "OPTIONS"],
            allowedHeaders: [
                "Content-Type",
                "Authorization",
                "X-Requested-With",
                "Accept",
                "Cache-Control",
            ],
            credentials: false,
        }),
    );

    // Body parsing middleware
    app.use(express.json({ limit: "10mb" })); // For base64 images
    app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Request logging (development only)
    app.use(requestLogger);

    // API routes
    app.use("/", routes);

    // 404 handler
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(globalErrorHandler);

    return app;
};

export default createApp;
