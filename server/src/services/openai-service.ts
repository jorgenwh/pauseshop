/**
 * OpenAI Service
 * Handles image analysis using OpenAI's GPT-4o-mini
 */

import OpenAI from 'openai';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { OpenAIConfig, OpenAIResponse, Product } from '../types/analyze';

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
    if (!response) {
      return [];
    }

    const products: Product[] = [];

    console.log("response", response);

    products.push({
      confidence: 0.9,
    });

    return products;
  }

  /**
   * Handle OpenAI API errors
   */
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
