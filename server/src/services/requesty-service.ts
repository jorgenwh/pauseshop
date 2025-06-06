/**
 * Requesty Service
 * Handles streaming image analysis using Requesty's API router with support for multiple models
 */

import OpenAI from "openai";
import {
    RequestyConfig,
    AnalysisService,
    StreamingCallbacks,
} from "../types/analyze";

export class RequestyService implements AnalysisService {
    private client: OpenAI;
    private config: RequestyConfig;

    constructor(config: RequestyConfig) {
        this.config = config;
        this.client = new OpenAI({
            baseURL: "https://router.requesty.ai/v1",
            apiKey: config.apiKey,
            defaultHeaders: {
                "HTTP-Referer": config.siteUrl || "",
                "X-Title": config.siteName || "",
            },
        });
    }

    supportsStreaming(): boolean {
        return false; // Requesty streaming not yet implemented
    }

    async analyzeImageStreaming(
        imageData: string,
        callbacks: StreamingCallbacks,
    ): Promise<void> {
        // Requesty streaming analysis is not yet implemented.
        callbacks.onError(
            new Error("Requesty streaming analysis is not yet implemented."),
        );
        return Promise.reject(
            new Error("Requesty streaming analysis is not yet implemented."),
        );
    }
}
