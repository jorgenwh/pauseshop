/**
 * Gemini Service
 * Handles streaming image analysis using Google's Gemini API
 */

import { GoogleGenAI } from "@google/genai";
import {
    GeminiConfig,
    AnalysisService,
    StreamingCallbacks,
} from "../types/analyze";
import { loadPrompt, handleAPIError } from "./analysis-utils";
import { DefaultPartialProductParser } from "./partial-product-parser";

export class GeminiService implements AnalysisService {
    private client: GoogleGenAI;
    private config: GeminiConfig;

    constructor(config: GeminiConfig) {
        this.config = config;
        this.client = new GoogleGenAI({ apiKey: config.apiKey });
    }

    supportsStreaming(): boolean {
        return true;
    }

    async analyzeImageStreaming(
        imageData: string,
        callbacks: StreamingCallbacks,
    ): Promise<void> {
        try {
            const prompt = await loadPrompt();
            const parser = new DefaultPartialProductParser();

            const startTime = Date.now();
            let firstTokenTime: number | null = null;
            let lastTokenTime: number | null = null;

            const requestBody: any = {
                model: this.config.model,
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: "image/jpeg", // Assuming JPEG for now, can be made dynamic
                                    data: imageData.split(",")[1], // Remove "data:image/jpeg;base64," prefix
                                },
                            },
                        ],
                    },
                ],
                config: {
                    maxOutputTokens: this.config.maxTokens,
                },
            };

            if (this.config.thinkingBudget !== undefined) {
                requestBody.config.thinkingConfig = {
                    thinkingBudget: this.config.thinkingBudget,
                };
            }

            const streamResult =
                await this.client.models.generateContentStream(requestBody);

            let fullContent = "";
            let lastChunk: any = null;
            for await (const chunk of streamResult) {
                // Iterate directly over streamResult
                lastChunk = chunk;
                const chunkText = chunk.text;
                if (chunkText) {
                    // Track first and last token times
                    if (firstTokenTime === null) {
                        firstTokenTime = Date.now();
                    }
                    lastTokenTime = Date.now();

                    fullContent += chunkText;
                    const products = parser.parse(chunkText);
                    products.forEach((product) => callbacks.onProduct(product));
                }
            }

            const processingTime = Date.now() - startTime;
            const streamingDuration =
                firstTokenTime && lastTokenTime
                    ? lastTokenTime - firstTokenTime
                    : 0;

            // Usage metadata is available on the last chunk
            const usageMetadata = lastChunk?.usageMetadata;
            const promptCost =
                (usageMetadata?.promptTokenCount || 0) *
                this.config.promptCostPerToken;
            const completionCost =
                (usageMetadata?.candidatesTokenCount || 0) *
                this.config.completionCostPerToken;
            const totalCost = promptCost + completionCost;
            console.log(
                `[GEMINI_SERVICE] LLM Streaming Analysis completed in ${processingTime}ms (streaming duration: ${streamingDuration}ms). Tokens: [${usageMetadata?.promptTokenCount}/${usageMetadata?.candidatesTokenCount}/${usageMetadata?.totalTokenCount}]. Cost: $${totalCost.toFixed(6)}`,
            );

            callbacks.onComplete({
                content: fullContent,
                usage: usageMetadata
                    ? {
                        promptTokens: usageMetadata.promptTokenCount || 0,
                        completionTokens:
                              usageMetadata.candidatesTokenCount || 0,
                        totalTokens: usageMetadata.totalTokenCount || 0,
                        thoughtsTokenCount: usageMetadata.thoughtsTokenCount,
                        candidatesTokenCount:
                              usageMetadata.candidatesTokenCount,
                    }
                    : undefined,
            });
        } catch (error) {
            console.error(
                "[GEMINI_SERVICE] Error during streaming image analysis:",
                error,
            );
            callbacks.onError(handleAPIError(error, "GEMINI"));
        }
    }
}
