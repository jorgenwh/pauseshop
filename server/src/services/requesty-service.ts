/**
 * Requesty Service
 * Handles image analysis using Requesty's API router with support for multiple models
 */

import OpenAI from 'openai';
import {
    RequestyConfig,
    RequestyResponse,
    AnalysisService,
    Product,
    OpenAIProductResponse,
    StreamingCallbacks
} from '../types/analyze';
import {
    loadPrompt,
    extractJSONFromResponse,
    validateAndSanitizeProducts,
    handleAPIError
} from './analysis-utils';

export class RequestyService implements AnalysisService {
    private client: OpenAI;
    private config: RequestyConfig;

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
     * Analyze image using Requesty API
     */
    async analyzeImage(imageData: string): Promise<RequestyResponse> {
        try {
            const prompt = await loadPrompt();

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

            const promptCost = (response.usage?.prompt_tokens || 0) * this.config.promptCostPerToken;
            const completionCost = (response.usage?.completion_tokens || 0) * this.config.completionCostPerToken;
            const totalCost = (promptCost + completionCost) * 1.05; // Add 5% extra charge
            console.log(`[REQUESTY_SERVICE] LLM Analysis completed in ${processingTime}ms. Tokens: [${response.usage?.prompt_tokens}/${response.usage?.completion_tokens}/${response.usage?.total_tokens}]. Cost: $${totalCost.toFixed(6)}`);

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
            handleAPIError(error, 'REQUESTY');
        }
    }

    /**
     * Parse Requesty response into products array
     */
    parseResponseToProducts(response: string): Product[] {
        try {
            console.log('[REQUESTY_SERVICE] Raw Requesty response:', response);

            // Clean the response - remove any non-JSON content
            const cleanedResponse = extractJSONFromResponse(response);

            // Parse JSON
            const parsedResponse: OpenAIProductResponse = JSON.parse(cleanedResponse);

            // Validate and sanitize products
            const validatedProducts = validateAndSanitizeProducts(parsedResponse.products || []);

            return validatedProducts;

        } catch (error) {
            console.error('[REQUESTY_SERVICE] Error parsing response:', error);
            console.log('[REQUESTY_SERVICE] Response that failed to parse:', response.substring(0, 200));
            return [];
        }
    }
    
    supportsStreaming(): boolean {
        return false; // Requesty streaming not yet implemented
    }

    async analyzeImageStreaming(imageData: string, callbacks: StreamingCallbacks): Promise<void> {
        // This method is not yet implemented for Requesty.
        // The StreamingAnalysisService will fall back to batch analysis if this returns false.
        callbacks.onError(new Error('Requesty streaming analysis is not yet implemented.'));
        return Promise.reject(new Error('Requesty streaming analysis is not yet implemented.'));
    }
}
