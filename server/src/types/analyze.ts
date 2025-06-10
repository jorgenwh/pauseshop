/**
 * Type definitions for image analysis endpoint
 */

export interface AnalyzeRequest {
    image: string; // base64 data URL
    metadata?: {
        timestamp: string;
    };
}

import { ProductCategory } from "../config/product-categories";

export interface Product {
    name: string;
    category: ProductCategory;
    brand: string;
    primaryColor: string;
    secondaryColors: string[];
    features: string[];
    targetGender: TargetGender;
    searchTerms: string;
}

export enum TargetGender {
    MEN = "men",
    WOMEN = "women",
    UNISEX = "unisex",
    BOY = "boy",
    GIRL = "girl",
}

export interface OpenAIConfig {
    apiKey: string;
    model: string;
    maxTokens: number;
    promptCostPerToken: number;
    completionCostPerToken: number;
}

export interface OpenAIResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface OpenRouterConfig {
    apiKey: string;
    model: string;
    maxTokens: number;
    siteUrl?: string;
    siteName?: string;
    promptCostPerToken: number;
    completionCostPerToken: number;
}

export interface OpenRouterResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    reasoning?: string; // OpenRouter specific
}

export interface GeminiConfig {
    apiKey: string;
    model: string;
    maxTokens: number;
    thinkingBudget?: number;
    promptCostPerToken: number;
    completionCostPerToken: number;
}

export interface GeminiResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        thoughtsTokenCount?: number;
        candidatesTokenCount?: number;
    };
}

export interface AnalyzeErrorResponse {
    success: false;
    error: {
        message: string;
        code: string;
        timestamp: string;
    };
}

export interface ImageValidationResult {
    isValid: boolean;
    width?: number;
    height?: number;
    format?: string;
    sizeBytes?: number;
    error?: string;
}

export interface RequestyConfig {
    apiKey: string;
    model: string;
    maxTokens: number;
    siteUrl?: string;
    siteName?: string;
    promptCostPerToken: number;
    completionCostPerToken: number;
}

export interface RequestyResponse {
    content: string;
    usage?:
        | {
              promptTokens: number;
              completionTokens: number;
              totalTokens: number;
          }
        | undefined;
}

export enum AnalysisProvider {
    OPENAI = "openai",
    REQUESTY = "requesty",
    GEMINI = "gemini",
    OPENROUTER = "openrouter",
}

export interface StreamingCallbacks {
    onProduct: (product: Product) => void;
    onComplete: (
        response:
            | OpenAIResponse
            | RequestyResponse
            | GeminiResponse
            | OpenRouterResponse,
    ) => void;
    onError: (error: Error) => void;
}

export interface PartialProductParser {
    parse(partialResponse: string): Product[];
}

export interface AnalysisService {
    supportsStreaming(): boolean;
    analyzeImageStreaming(
        imageData: string,
        callbacks: StreamingCallbacks,
    ): Promise<void>;
}
