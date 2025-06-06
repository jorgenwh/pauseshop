/**
 * OpenAI Service
 * Handles streaming image analysis using OpenAI's GPT-4o-mini
 */

import OpenAI from "openai";
import {
    OpenAIConfig,
    AnalysisService,
    StreamingCallbacks,
} from "../types/analyze";

export class OpenAIService implements AnalysisService {
    private client: OpenAI;
    private config: OpenAIConfig;

    constructor(config: OpenAIConfig) {
        this.config = config;
        this.client = new OpenAI({
            apiKey: config.apiKey,
        });
    }

    supportsStreaming(): boolean {
        return false; // OpenAI streaming not yet implemented
    }

    async analyzeImageStreaming(
        imageData: string,
        callbacks: StreamingCallbacks,
    ): Promise<void> {
        // OpenAI streaming analysis is not yet implemented.
        callbacks.onError(
            new Error("OpenAI streaming analysis is not yet implemented."),
        );
        return Promise.reject(
            new Error("OpenAI streaming analysis is not yet implemented."),
        );
    }
}
