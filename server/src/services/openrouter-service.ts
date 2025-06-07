/**
 * OpenRouter Service
 * Handles streaming image analysis using OpenRouter's API with support for multiple models and thinking budget
 */

import OpenAI from "openai";
import {
    AnalysisService,
    OpenRouterConfig,
    StreamingCallbacks,
} from "../types/analyze";
import { handleAPIError, loadPrompt } from "./analysis-utils";
import { DefaultPartialProductParser } from "./partial-product-parser";

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
        return true;
    }

    /**
     * Analyze image with streaming
     */
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

            const stream = await this.client.chat.completions.create({
                model: this.config.model,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageData,
                                },
                            },
                        ],
                    },
                ],
                stream: true,
                max_tokens: this.config.maxTokens,
            });

            let fullContent = "";
            let usage: OpenAI.CompletionUsage | undefined;

            for await (const chunk of stream) {
                if (firstTokenTime === null) {
                    firstTokenTime = Date.now();
                }
                lastTokenTime = Date.now();

                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                    fullContent += content;
                    const products = parser.parse(content);
                    products.forEach((product) => callbacks.onProduct(product));
                }

                if (chunk.usage) {
                    usage = chunk.usage;
                }
            }

            const processingTime = Date.now() - startTime;
            const streamingDuration =
                firstTokenTime && lastTokenTime
                    ? lastTokenTime - firstTokenTime
                    : 0;

            const promptCost =
                (usage?.prompt_tokens || 0) * this.config.promptCostPerToken;
            const completionCost =
                (usage?.completion_tokens || 0) *
                this.config.completionCostPerToken;
            const totalCost = promptCost + completionCost;
            console.log(
                `[OPENROUTER_SERVICE] LLM Streaming Analysis completed in ${processingTime}ms (streaming duration: ${streamingDuration}ms). Tokens: [${usage?.prompt_tokens}/${usage?.completion_tokens}/${usage?.total_tokens}]. Cost: $${totalCost.toFixed(6)}`,
            );

            callbacks.onComplete({
                content: fullContent,
                usage: usage
                    ? {
                          promptTokens: usage.prompt_tokens,
                          completionTokens: usage.completion_tokens,
                          totalTokens: usage.total_tokens,
                      }
                    : undefined,
            });
        } catch (error) {
            console.error(
                "[OPENROUTER_SERVICE] Error during streaming image analysis:",
                error,
            );
            callbacks.onError(handleAPIError(error, "OPENROUTER"));
        }
    }
}
