/**
 * Gemini Service
 * Handles image analysis using Google's Gemini API
 */

import { GoogleGenAI } from '@google/genai';
import {
    GeminiConfig,
    GeminiResponse,
    AnalysisService,
    Product,
    GeminiProductResponse
} from '../types/analyze';
import {
    loadPrompt,
    extractJSONFromResponse,
    validateAndSanitizeProducts,
    handleAPIError
} from './analysis-utils';

export class GeminiService implements AnalysisService {
    private client: GoogleGenAI;
    private config: GeminiConfig;

    constructor(config: GeminiConfig) {
        this.config = config;
        this.client = new GoogleGenAI({ apiKey: config.apiKey });
    }

    /**
     * Analyze image using Gemini API
     */
    async analyzeImage(imageData: string): Promise<GeminiResponse> {
        try {
            const prompt = await loadPrompt();

            console.log('[GEMINI_SERVICE] Sending image to Gemini API...');
            const startTime = Date.now();

            console.log("[GEMINI_SERVICE] Using prompt:", prompt);

            const requestBody: any = {
                model: this.config.model,
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: "image/jpeg", // Assuming JPEG for now, can be made dynamic
                                    data: imageData.split(',')[1] // Remove "data:image/jpeg;base64," prefix
                                }
                            }
                        ]
                    }
                ],
                config: {
                    maxOutputTokens: this.config.maxTokens,
                },
            };

            if (this.config.thinkingBudget !== undefined) {
                requestBody.config.thinkingConfig = {
                    thinkingBudget: this.config.thinkingBudget,
                };
            }

            const response = await this.client.models.generateContent(requestBody);

            const content = response.text;

            const processingTime = Date.now() - startTime;

            const promptCost = (response.usageMetadata?.promptTokenCount || 0) * this.config.promptCostPerToken;
            const completionCost = (response.usageMetadata?.candidatesTokenCount || 0) * this.config.completionCostPerToken;
            const totalCost = promptCost + completionCost;
            console.log(`[GEMINI_SERVICE] LLM Analysis completed in ${processingTime}ms. Tokens: [${response.usageMetadata?.promptTokenCount}/${response.usageMetadata?.candidatesTokenCount}/${response.usageMetadata?.totalTokenCount}]. Cost: $${totalCost.toFixed(6)}`);

            return {
                content: content || '',
                usage: response.usageMetadata ? {
                    promptTokens: response.usageMetadata.promptTokenCount || 0,
                    completionTokens: response.usageMetadata.candidatesTokenCount || 0,
                    totalTokens: response.usageMetadata.totalTokenCount || 0,
                    thoughtsTokenCount: response.usageMetadata.thoughtsTokenCount,
                    candidatesTokenCount: response.usageMetadata.candidatesTokenCount,
                } : undefined,
            };

        } catch (error) {
            console.error('[GEMINI_SERVICE] Error during image analysis:', error);
            handleAPIError(error, 'GEMINI');
        }
    }

    /**
     * Parse Gemini response into products array
     */
    parseResponseToProducts(response: string): Product[] {
        try {
            console.log('[GEMINI_SERVICE] Raw Gemini response:', response);

            // Clean the response - remove any non-JSON content
            const cleanedResponse = extractJSONFromResponse(response);

            // Parse JSON
            const parsedResponse: GeminiProductResponse = JSON.parse(cleanedResponse);

            // Validate and sanitize products
            const validatedProducts = validateAndSanitizeProducts(parsedResponse.products || []);

            return validatedProducts;

        } catch (error) {
            console.error('[GEMINI_SERVICE] Error parsing response:', error);
            console.log('[GEMINI_SERVICE] Response that failed to parse:', response.substring(0, 200));
            return [];
        }
    }
}