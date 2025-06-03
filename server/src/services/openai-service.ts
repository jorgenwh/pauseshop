/**
 * OpenAI Service
 * Handles image analysis using OpenAI's GPT-4o-mini
 */

import OpenAI from 'openai';
import {
    OpenAIConfig,
    OpenAIResponse,
    AnalysisService,
    Product,
    OpenAIProductResponse
} from '../types/analyze';
import {
    loadPrompt,
    extractJSONFromResponse,
    validateAndSanitizeProducts,
    handleAPIError
} from './analysis-utils';

export class OpenAIService implements AnalysisService {
    private client: OpenAI;
    private config: OpenAIConfig;

    constructor(config: OpenAIConfig) {
        this.config = config;
        this.client = new OpenAI({
            apiKey: config.apiKey,
        });
    }

    /**
     * Analyze image using OpenAI API
     */
    async analyzeImage(imageData: string): Promise<OpenAIResponse> {
        try {
            const prompt = await loadPrompt();
            
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

            console.log(`[OPENAI_SERVICE] LLM Analysis completed in ${processingTime}ms`);

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
            handleAPIError(error, 'OPENAI');
        }
    }

    /**
     * Parse OpenAI response into products array
     */
    parseResponseToProducts(response: string): Product[] {
        try {
            console.log('[OPENAI_SERVICE] Raw OpenAI response:', response);

            // Clean the response - remove any non-JSON content
            const cleanedResponse = extractJSONFromResponse(response);

            // Parse JSON
            const parsedResponse: OpenAIProductResponse = JSON.parse(cleanedResponse);

            // Validate and sanitize products
            const validatedProducts = validateAndSanitizeProducts(parsedResponse.products || []);

            return validatedProducts;

        } catch (error) {
            console.error('[OPENAI_SERVICE] Error parsing response:', error);
            console.log('[OPENAI_SERVICE] Response that failed to parse:', response.substring(0, 200));
            return [];
        }
    }
}
