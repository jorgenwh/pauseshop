/**
 * Requesty Service
 * Handles image analysis using Requesty's API router with support for multiple models
 */

import OpenAI from 'openai';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import {
    RequestyConfig,
    RequestyResponse,
    Product,
    ProductCategory,
    TargetGender,
    OpenAIProductResponse,
    AnalysisService
} from '../types/analyze';

export class RequestyService implements AnalysisService {
    private client: OpenAI;
    private config: RequestyConfig;
    private static promptCache: string | null = null;

    constructor(config: RequestyConfig) {
        this.config = config;
        this.client = new OpenAI({
            baseURL: 'https://router.requesty.ai/v1',
            apiKey: config.apiKey,
            defaultHeaders: {
                'HTTP-Referer': config.siteUrl || '',
                'X-Title': config.siteName || '',
            },
        });
    }

    /**
     * Load the prompt from file (cached)
     */
    private async loadPrompt(): Promise<string> {
        if (RequestyService.promptCache) {
            return RequestyService.promptCache;
        }

        try {
            const promptPath = resolve(__dirname, '../prompts/product-analysis.txt');
            const promptContent = await fs.readFile(promptPath, 'utf-8');
            RequestyService.promptCache = promptContent.trim();
            return RequestyService.promptCache;
        } catch (error) {
            console.error('[REQUESTY_SERVICE] Error loading prompt:', error);
            throw new Error('Failed to load image analysis prompt');
        }
    }

    /**
     * Analyze image using Requesty API
     */
    async analyzeImage(imageData: string): Promise<RequestyResponse> {
        try {
            const prompt = await this.loadPrompt();

            const startTime = Date.now();

            const response = await this.client.chat.completions.create({
                model: this.config.model,
                max_tokens: this.config.maxTokens,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt,
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageData,
                                },
                            },
                        ],
                    },
                ],
            });

            const processingTime = Date.now() - startTime;
            const content = response.choices[0]?.message?.content || '';

            console.log(`[REQUESTY_SERVICE] LLM Analysis completed in ${processingTime}ms`);

            return {
                content,
                usage: response.usage ? {
                    promptTokens: response.usage.prompt_tokens,
                    completionTokens: response.usage.completion_tokens,
                    totalTokens: response.usage.total_tokens,
                } : undefined,
            };

        } catch (error) {
            console.error('[REQUESTY_SERVICE] Error during image analysis:', error);
            this.handleAPIError(error);
        }
    }

    /**
     * Parse Requesty response into products array
     */
    parseResponseToProducts(response: string): Product[] {
        try {
            console.log('[REQUESTY_SERVICE] Raw Requesty response:', response);

            // Clean the response - remove any non-JSON content
            const cleanedResponse = this.extractJSONFromResponse(response);

            // Parse JSON
            const parsedResponse: OpenAIProductResponse = JSON.parse(cleanedResponse);

            // Validate and sanitize products
            const validatedProducts = this.validateAndSanitizeProducts(parsedResponse.products || []);

            return validatedProducts;

        } catch (error) {
            console.error('[REQUESTY_SERVICE] Error parsing response:', error);
            console.log('[REQUESTY_SERVICE] Response that failed to parse:', response.substring(0, 200));
            return [];
        }
    }

    /**
     * Extract JSON from response, handling potential extra text
     */
    private extractJSONFromResponse(response: string): string {
        // Remove any text before the first {
        const jsonStart = response.indexOf('{');
        if (jsonStart === -1) throw new Error('No JSON found in response');
        
        // Find the last } to handle any trailing text
        const jsonEnd = response.lastIndexOf('}');
        if (jsonEnd === -1) throw new Error('Incomplete JSON in response');
        
        return response.substring(jsonStart, jsonEnd + 1);
    }

    /**
     * Validate and sanitize products array
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private validateAndSanitizeProducts(products: any[]): Product[] {
        return products
            .filter(product => this.isValidProduct(product))
            .map(product => this.sanitizeProduct(product));
    }

    /**
     * Check if product has all required fields
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private isValidProduct(product: any): boolean {
        return (
            typeof product === 'object' &&
            typeof product.name === 'string' &&
            typeof product.category === 'string' &&
            typeof product.brand === 'string' &&
            typeof product.primaryColor === 'string' &&
            Array.isArray(product.secondaryColors) &&
            Array.isArray(product.features) &&
            typeof product.targetGender === 'string' &&
            typeof product.searchTerms === 'string'
        );
    }

    /**
     * Sanitize and normalize product data
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private sanitizeProduct(product: any): Product {
        return {
            name: String(product.name).substring(0, 100).trim(),
            category: this.validateCategory(product.category),
            brand: String(product.brand).substring(0, 50).trim(),
            primaryColor: String(product.primaryColor).substring(0, 30).trim(),
            secondaryColors: this.sanitizeStringArray(product.secondaryColors, 30, 3),
            features: this.sanitizeStringArray(product.features, 50, 5),
            targetGender: this.validateTargetGender(product.targetGender),
            searchTerms: String(product.searchTerms).substring(0, 200).trim()
        };
    }

    /**
     * Validate product category, fallback to OTHER if invalid
     */
    private validateCategory(category: string): ProductCategory {
        const validCategories = Object.values(ProductCategory);
        return validCategories.includes(category as ProductCategory)
            ? category as ProductCategory
            : ProductCategory.OTHER;
    }

    /**
     * Validate target gender, fallback to UNISEX if invalid
     */
    private validateTargetGender(targetGender: string): TargetGender {
        const validGenders = Object.values(TargetGender);
        return validGenders.includes(targetGender as TargetGender)
            ? targetGender as TargetGender
            : TargetGender.UNISEX;
    }

    /**
     * Sanitize array of strings with length and count limits
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private sanitizeStringArray(arr: any[], maxLength: number, maxCount: number): string[] {
        if (!Array.isArray(arr)) return [];
        
        return arr
            .slice(0, maxCount)
            .map(item => String(item).substring(0, maxLength).trim())
            .filter(item => item.length > 0);
    }

    /**
     * Handle Requesty API errors
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private handleAPIError(error: any): never {
        if (error?.status === 401) {
            throw new Error('REQUESTY_AUTH_ERROR');
        }
        if (error?.status === 429) {
            throw new Error('REQUESTY_RATE_LIMIT');
        }
        if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
            throw new Error('REQUESTY_TIMEOUT');
        }
        
        throw new Error('REQUESTY_API_ERROR');
    }
}
