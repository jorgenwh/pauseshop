/**
 * OpenRouter Service
 * Handles streaming image analysis using OpenRouter's API with support for multiple models
 */

import {
    AnalysisService,
    OpenRouterConfig,
    StreamingCallbacks,
    OpenRouterResponse,
} from "../types/analyze";
import { handleAPIError, loadPrompt } from "./analysis-utils";
import { DefaultPartialProductParser } from "./partial-product-parser";

export class OpenRouterService implements AnalysisService {
    private config: OpenRouterConfig;

    constructor(config: OpenRouterConfig) {
        this.config = config;
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

            const body = JSON.stringify({
                model: this.config.model,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
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

            const response = await fetch(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${this.config.apiKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": this.config.siteUrl || "",
                        "X-Title": this.config.siteName || "",
                    },
                    body,
                },
            );

            const reader = response.body?.getReader();
            if (!reader) throw new Error("Response body is not readable");

            const decoder = new TextDecoder();
            let buffer = "";
            let fullContent = "";
            let usage: OpenRouterResponse["usage"] = undefined;

            try {
                let done;
                let value;
                while (({ done, value } = await reader.read()) && !done) {
                    buffer += decoder.decode(value, { stream: true });

                    let lineEnd;
                    while ((lineEnd = buffer.indexOf("\n")) !== -1) {
                        const line = buffer.slice(0, lineEnd).trim();
                        buffer = buffer.slice(lineEnd + 1);

                        if (line.startsWith("data: ")) {
                            const data = line.slice(6);
                            if (data === "[DONE]") break;

                            try {
                                const parsed = JSON.parse(data);
                                const content =
                                    parsed.choices?.[0]?.delta?.content || "";
                                if (content) {
                                    if (firstTokenTime === null)
                                        firstTokenTime = Date.now();
                                    lastTokenTime = Date.now();

                                    fullContent += content;
                                    const products = parser.parse(content);
                                    products.forEach((product) =>
                                        callbacks.onProduct(product),
                                    );
                                }
                                if (parsed.usage) {
                                    usage = {
                                        promptTokens:
                                            parsed.usage.prompt_tokens,
                                        completionTokens:
                                            parsed.usage.completion_tokens,
                                        totalTokens: parsed.usage.total_tokens,
                                    };
                                }
                            } catch (e) {
                                // Ignore invalid JSON
                            }
                        }
                    }
                }
            } finally {
                reader.cancel();
            }

            const processingTime = Date.now() - startTime;
            const streamingDuration =
                firstTokenTime && lastTokenTime
                    ? lastTokenTime - firstTokenTime
                    : 0;

            const promptCost =
                (usage?.promptTokens || 0) * this.config.promptCostPerToken;
            const completionCost =
                (usage?.completionTokens || 0) *
                this.config.completionCostPerToken;
            const totalCost = promptCost + completionCost;
            console.log(
                `[OPENROUTER_SERVICE] LLM Streaming Analysis completed in ${processingTime}ms (streaming duration: ${streamingDuration}ms). Tokens: [${usage?.promptTokens}/${usage?.completionTokens}/${usage?.totalTokens}]. Cost: $${totalCost.toFixed(6)}`,
            );

            callbacks.onComplete({
                content: fullContent,
                usage: usage
                    ? {
                        promptTokens: usage.promptTokens,
                        completionTokens: usage.completionTokens,
                        totalTokens: usage.totalTokens,
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
