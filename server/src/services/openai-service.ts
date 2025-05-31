/**
 * OpenAI Service
 * Handles image analysis using OpenAI's GPT-4o-mini
 */

import OpenAI from 'openai';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import {
  OpenAIConfig,
  OpenAIResponse,
  Product,
  ProductCategory,
  TargetGender,
  OpenAIProductResponse
} from '../types/analyze';

export class OpenAIService {
    private client: OpenAI;
    private config: OpenAIConfig;
    private static promptCache: string | null = null;

    constructor(config: OpenAIConfig) {
        this.config = config;
        this.client = new OpenAI({
            apiKey: config.apiKey,
        });
    }

    /**
     * Load the prompt from file (cached)
     */
    private async loadPrompt(): Promise<string> {
        if (OpenAIService.promptCache) {
            return OpenAIService.promptCache;
        }

        try {
            const promptPath = resolve(__dirname, '../prompts/product-analysis.txt');
            const promptContent = await fs.readFile(promptPath, 'utf-8');
            OpenAIService.promptCache = promptContent.trim();
            return OpenAIService.promptCache;
        } catch (error) {
            console.error('[OPENAI_SERVICE] Error loading prompt:', error);
            throw new Error('Failed to load image analysis prompt');
        }
    }

  /**
   * Analyze image using OpenAI API
   */
  async analyzeImage(imageData: string): Promise<OpenAIResponse> {
        try {
            const prompt = await this.loadPrompt();
            
            console.log('[OPENAI_SERVICE] Sending image to OpenAI API...');
            const startTime = Date.now();

            console.log("[OPENAI_SERVICE] Using prompt:", prompt);
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

            console.log(`[OPENAI_SERVICE] Analysis completed in ${processingTime}ms`);
            console.log(`[OPENAI_SERVICE] Token usage: ${response.usage?.total_tokens || 0} tokens`);

            return {
                content,
                usage: response.usage ? {
                    promptTokens: response.usage.prompt_tokens,
                    completionTokens: response.usage.completion_tokens,
                    totalTokens: response.usage.total_tokens,
                } : undefined,
            };

        } catch (error) {
            console.error('[OPENAI_SERVICE] Error during image analysis:', error);
            this.handleAPIError(error);
        }
    }

  /**
   * Parse OpenAI response into products array
   */
  parseResponseToProducts(response: string): Product[] {
        try {
            console.log('[OPENAI_SERVICE] Raw OpenAI response:', response);
            
            // Clean the response - remove any non-JSON content
            const cleanedResponse = this.extractJSONFromResponse(response);
            console.log('[OPENAI_SERVICE] Cleaned JSON:', cleanedResponse);
            
            // Parse JSON
            const parsedResponse: OpenAIProductResponse = JSON.parse(cleanedResponse);
            
            // Validate and sanitize products
            const validatedProducts = this.validateAndSanitizeProducts(parsedResponse.products || []);
            console.log(`[OPENAI_SERVICE] Validated ${validatedProducts.length} products`);
            
            return validatedProducts;
            
        } catch (error) {
            console.error('[OPENAI_SERVICE] Error parsing response:', error);
            console.log('[OPENAI_SERVICE] Response that failed to parse:', response.substring(0, 200));
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
     * Handle OpenAI API errors
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private handleAPIError(error: any): never {
        if (error?.status === 401) {
            throw new Error('OPENAI_AUTH_ERROR');
        }
        if (error?.status === 429) {
            throw new Error('OPENAI_RATE_LIMIT');
        }
        if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
            throw new Error('OPENAI_TIMEOUT');
        }
        
        throw new Error('OPENAI_API_ERROR');
    }
}
