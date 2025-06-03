/**
 * OpenRouter Service
 * Handles image analysis using OpenRouter's API with support for multiple models and thinking budget
 */

import OpenAI from 'openai';
import {
    OpenRouterConfig,
    OpenRouterResponse,
    AnalysisService,
    Product,
    OpenAIProductResponse // OpenRouter uses OpenAI's API structure for product response
} from '../types/analyze';
import {
    loadPrompt,
    extractJSONFromResponse,
    validateAndSanitizeProducts,
    handleAPIError
} from './analysis-utils';

export class OpenRouterService implements AnalysisService {
    private client: OpenAI;
    private config: OpenRouterConfig;

    constructor(config: OpenRouterConfig) {
        this.config = config;
        this.client = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: config.apiKey,
            defaultHeaders: {
                'HTTP-Referer': config.siteUrl || '',
                'X-Title': config.siteName || '',
            },
        });
    }

    /**
     * Analyze image using OpenRouter API
     */
    async analyzeImage(imageData: string): Promise<OpenRouterResponse> {
        try {
            const prompt = await loadPrompt();

            const startTime = Date.now();

            const requestBody: any = {
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
            };

            if (this.config.thinkingBudget) {
                requestBody.reasoning = {
                    max_tokens: this.config.thinkingBudget,
                };
            }

            const response = await this.client.chat.completions.create(requestBody);

            const processingTime = Date.now() - startTime;
            const content = response.choices[0]?.message?.content || '';
            const reasoning = (response.choices[0]?.message as any)?.reasoning || ''; // OpenRouter specific

            const promptCost = (response.usage?.prompt_tokens || 0) * this.config.promptCostPerToken;
            const completionCost = (response.usage?.completion_tokens || 0) * this.config.completionCostPerToken;
            const totalCost = (promptCost + completionCost) * 1.05; // Add 5% extra charge
            console.log(`[OPENROUTER_SERVICE] LLM Analysis completed in ${processingTime}ms. Tokens: [${response.usage?.prompt_tokens}/${response.usage?.completion_tokens}/${response.usage?.total_tokens}]. Cost: $${totalCost.toFixed(6)}`);

            return {
                content,
                usage: response.usage ? {
                    promptTokens: response.usage.prompt_tokens,
                    completionTokens: response.usage.completion_tokens,
                    totalTokens: response.usage.total_tokens,
                } : undefined,
                reasoning: reasoning,
            };

        } catch (error) {
            console.error('[OPENROUTER_SERVICE] Error during image analysis:', error);
            handleAPIError(error, 'OPENROUTER');
        }
    }

    /**
     * Parse OpenRouter response into products array
     */
    parseResponseToProducts(response: string): Product[] {
        try {
            console.log('[OPENROUTER_SERVICE] Raw OpenRouter response:', response);

            // Clean the response - remove any non-JSON content
            const cleanedResponse = extractJSONFromResponse(response);

            // Parse JSON
            const parsedResponse: OpenAIProductResponse = JSON.parse(cleanedResponse);

            // Validate and sanitize products
            const validatedProducts = validateAndSanitizeProducts(parsedResponse.products || []);

            return validatedProducts;

        } catch (error) {
            console.error('[OPENROUTER_SERVICE] Error parsing response:', error);
            console.log('[OPENROUTER_SERVICE] Response that failed to parse:', response.substring(0, 200));
            return [];
        }
    }
}