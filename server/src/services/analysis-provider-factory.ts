/**
 * Analysis Provider Factory
 * Creates the appropriate analysis service based on environment configuration
 */

import { OpenAIService } from "./openai-service";
import { RequestyService } from "./requesty-service";
import { GeminiService } from "./gemini-service";
import { OpenRouterService } from "./openrouter-service";
import {
    AnalysisService,
    AnalysisProvider,
    OpenAIConfig,
    RequestyConfig,
    GeminiConfig,
    OpenRouterConfig,
} from "../types/analyze";
import {
    OPENAI_MODEL_PRICING,
    GEMINI_MODEL_PRICING,
    REQUESTY_MODEL_PRICING,
    OPENROUTER_MODEL_PRICING,
} from "../config/model-pricing";

/**
 * Get OpenAI configuration from environment variables
 */
const getOpenAIConfig = (): OpenAIConfig => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY environment variable is required");
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const pricing = OPENAI_MODEL_PRICING[model];
    if (!pricing) {
        throw new Error(
            `Pricing information not found for OpenAI model: ${model}`,
        );
    }

    return {
        apiKey,
        model,
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "1000"),
        promptCostPerToken: pricing.promptCostPerMillionTokens / 1_000_000,
        completionCostPerToken:
            pricing.completionCostPerMillionTokens / 1_000_000,
    };
};

/**
 * Get Requesty configuration from environment variables
 */
const getRequestyConfig = (): RequestyConfig => {
    const apiKey = process.env.REQUESTY_API_KEY;
    if (!apiKey) {
        throw new Error("REQUESTY_API_KEY environment variable is required");
    }

    const model = process.env.REQUESTY_MODEL || "google/gemini-2.0-flash-exp";
    const pricing = REQUESTY_MODEL_PRICING[model];
    if (!pricing) {
        throw new Error(
            `Pricing information not found for Requesty model: ${model}`,
        );
    }

    return {
        apiKey,
        model,
        maxTokens: parseInt(process.env.REQUESTY_MAX_TOKENS || "1000"),
        siteUrl: process.env.REQUESTY_SITE_URL,
        siteName: process.env.REQUESTY_SITE_NAME,
        promptCostPerToken: pricing.promptCostPerMillionTokens / 1_000_000,
        completionCostPerToken:
            pricing.completionCostPerMillionTokens / 1_000_000,
    };
};

/**
 * Get Gemini configuration from environment variables
 */
const getGeminiConfig = (): GeminiConfig => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-preview-05-20";
    const pricing = GEMINI_MODEL_PRICING[model];
    if (!pricing) {
        throw new Error(
            `Pricing information not found for Gemini model: ${model}`,
        );
    }

    return {
        apiKey,
        model,
        maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || "20000"),
        thinkingBudget: parseInt(process.env.GEMINI_THINKING_BUDGET || "0"),
        promptCostPerToken: pricing.promptCostPerMillionTokens / 1_000_000,
        completionCostPerToken:
            pricing.completionCostPerMillionTokens / 1_000_000,
    };
};

/**
 * Get OpenRouter configuration from environment variables
 */
const getOpenRouterConfig = (): OpenRouterConfig => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY environment variable is required");
    }

    const model = process.env.OPENROUTER_MODEL || "anthropic/claude-3.7-sonnet";
    const pricing = OPENROUTER_MODEL_PRICING[model];
    if (!pricing) {
        throw new Error(
            `Pricing information not found for OpenRouter model: ${model}`,
        );
    }

    return {
        apiKey,
        model,
        maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS || "1000"),
        thinkingBudget: parseInt(process.env.OPENROUTER_THINKING_BUDGET || "0"),
        siteUrl: process.env.OPENROUTER_SITE_URL,
        siteName: process.env.OPENROUTER_SITE_NAME,
        promptCostPerToken: pricing.promptCostPerMillionTokens / 1_000_000,
        completionCostPerToken:
            pricing.completionCostPerMillionTokens / 1_000_000,
    };
};

/**
 * Analysis Provider Factory
 * Creates the appropriate analysis service based on the ANALYSIS_PROVIDER environment variable
 */
export class AnalysisProviderFactory {
    /**
     * Create an analysis service instance based on environment configuration
     */
    static createProvider(): AnalysisService {
        const provider = (
            process.env.ANALYSIS_PROVIDER || "openai"
        ).toLowerCase() as AnalysisProvider;

        switch (provider) {
            case AnalysisProvider.OPENAI:
                try {
                    const config = getOpenAIConfig();
                    return new OpenAIService(config);
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Unknown error";
                    console.error(
                        `[PROVIDER_FACTORY] Failed to create OpenAI provider: ${errorMessage}`,
                    );
                    throw new Error(
                        `OpenAI provider configuration error: ${errorMessage}`,
                    );
                }
            case AnalysisProvider.REQUESTY:
                try {
                    const config = getRequestyConfig();
                    return new RequestyService(config);
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Unknown error";
                    console.error(
                        `[PROVIDER_FACTORY] Failed to create Requesty provider: ${errorMessage}`,
                    );
                    throw new Error(
                        `Requesty provider configuration error: ${errorMessage}`,
                    );
                }
            case AnalysisProvider.GEMINI:
                try {
                    const config = getGeminiConfig();
                    return new GeminiService(config);
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Unknown error";
                    console.error(
                        `[PROVIDER_FACTORY] Failed to create Gemini provider: ${errorMessage}`,
                    );
                    throw new Error(
                        `Gemini provider configuration error: ${errorMessage}`,
                    );
                }
            case AnalysisProvider.OPENROUTER:
                try {
                    const config = getOpenRouterConfig();
                    return new OpenRouterService(config);
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Unknown error";
                    console.error(
                        `[PROVIDER_FACTORY] Failed to create OpenRouter provider: ${errorMessage}`,
                    );
                    throw new Error(
                        `OpenRouter provider configuration error: ${errorMessage}`,
                    );
                }
            default: {
                const errorMessage = `Unknown analysis provider: ${provider}. Supported providers: ${Object.values(AnalysisProvider).join(", ")}`;
                console.error(`[PROVIDER_FACTORY] ${errorMessage}`);
                throw new Error(errorMessage);
            }
        }
    }

    /**
     * Get the current provider type from environment
     */
    static getCurrentProvider(): AnalysisProvider {
        return (
            process.env.ANALYSIS_PROVIDER || "openai"
        ).toLowerCase() as AnalysisProvider;
    }

    /**
     * Validate that the current provider configuration is valid
     */
    static validateProviderConfig(): { isValid: boolean; error?: string } {
        try {
            const provider = AnalysisProviderFactory.getCurrentProvider();

            switch (provider) {
                case AnalysisProvider.OPENAI:
                    getOpenAIConfig();
                    return { isValid: true };

                case AnalysisProvider.REQUESTY:
                    getRequestyConfig();
                    return { isValid: true };

                case AnalysisProvider.GEMINI:
                    getGeminiConfig();
                    return { isValid: true };

                case AnalysisProvider.OPENROUTER:
                    getOpenRouterConfig();
                    return { isValid: true };

                default:
                    return {
                        isValid: false,
                        error: `Unknown provider: ${provider}`,
                    };
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            return {
                isValid: false,
                error: errorMessage,
            };
        }
    }
}
