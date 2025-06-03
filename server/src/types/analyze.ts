/**
 * Type definitions for image analysis endpoint
 */

export interface AnalyzeRequest {
    image: string; // base64 data URL
    metadata?: {
        timestamp: string;
    };
}

export interface AnalyzeResponse {
    success: boolean;
    timestamp: string;
    products: Product[];
    metadata: {
        processingTime: number;
    };
}

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

export enum ProductCategory {
    CLOTHING = 'clothing',
    ELECTRONICS = 'electronics',
    FURNITURE = 'furniture',
    ACCESSORIES = 'accessories',
    FOOTWEAR = 'footwear',
    HOME_DECOR = 'home_decor',
    BOOKS_MEDIA = 'books_media',
    SPORTS_FITNESS = 'sports_fitness',
    BEAUTY_PERSONAL_CARE = 'beauty_personal_care',
    KITCHEN_DINING = 'kitchen_dining',
    OTHER = 'other'
}

export enum TargetGender {
    MEN = 'men',
    WOMEN = 'women',
    UNISEX = 'unisex',
    BOY = 'boy',
    GIRL = 'girl'
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

export interface OpenAIProductResponse {
    products: Product[];
}

export interface OpenRouterConfig {
    apiKey: string;
    model: string;
    maxTokens: number;
    thinkingBudget?: number; // OpenRouter specific
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

export interface GeminiProductResponse {
    products: Product[];
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
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    } | undefined;
}

export enum AnalysisProvider {
    OPENAI = 'openai',
    REQUESTY = 'requesty',
    GEMINI = 'gemini',
    OPENROUTER = 'openrouter'
}

export interface AnalysisService {
    analyzeImage(imageData: string): Promise<OpenAIResponse | RequestyResponse | GeminiResponse | OpenRouterResponse>;
    parseResponseToProducts(response: string): Product[];
}
