/**
 * OpenRouter Service
 * Handles streaming image analysis using OpenRouter's API with support for multiple models and thinking budget
 */

import OpenAI from "openai";
import {
    OpenRouterConfig,
    AnalysisService,
    StreamingCallbacks,
} from "../types/analyze";

export class OpenRouterService implements AnalysisService {
    private client: OpenAI;
    private config: OpenRouterConfig;

    constructor(config: OpenRouterConfig) {
        this.config = config;
        this.client = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: config.apiKey,
            defaultHeaders: {
                "HTTP-Referer": config.siteUrl || "",
                "X-Title": config.siteName || "",
            },
        });
    }

    /**
     * Check if streaming is supported
     */
    supportsStreaming(): boolean {
        return false; // OpenRouter streaming not yet implemented
    }

    /**
     * Analyze image with streaming (not yet implemented)
     */
    async analyzeImageStreaming(
        imageData: string,
        callbacks: StreamingCallbacks,
    ): Promise<void> {
        // OpenRouter streaming analysis is not yet implemented.
        callbacks.onError(
            new Error("OpenRouter streaming analysis is not yet implemented."),
        );
        return Promise.reject(
            new Error("OpenRouter streaming analysis is not yet implemented."),
        );
    }
}
