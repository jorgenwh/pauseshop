/**
 * Image analysis endpoint
 * Accepts POST requests with image data and returns AI-powered product analysis
 */

import { Request, Response } from 'express';
import { AnalyzeRequest, AnalyzeResponse, AnalyzeErrorResponse, Product, OpenAIConfig } from '../types/analyze';
import { validateImageData } from '../utils/image-validator';
import { OpenAIService } from '../services/openai-service';

/**
 * OpenAI configuration from environment variables
 */
const getOpenAIConfig = (): OpenAIConfig => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  return {
    apiKey,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
  };
};

/**
 * Analyze image using OpenAI service
 */
const analyzeImageWithOpenAI = async (imageData: string): Promise<Product[]> => {
  const config = getOpenAIConfig();
  const openaiService = new OpenAIService(config);
  
  const response = await openaiService.analyzeImage(imageData);
  return openaiService.parseResponseToProducts(response.content);
};

/**
 * Handles POST /analyze requests
 */
export const analyzeImageHandler = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  try {
    // Validate request body
    const { image, metadata }: AnalyzeRequest = req.body;

    if (!image) {
      const errorResponse: AnalyzeErrorResponse = {
        success: false,
        error: {
          message: 'Missing required field: image',
          code: 'MISSING_IMAGE',
          timestamp: new Date().toISOString()
        }
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Validate image data
    const validationResult = validateImageData(image);
    
    if (!validationResult.isValid) {
      const errorResponse: AnalyzeErrorResponse = {
        success: false,
        error: {
          message: validationResult.error || 'Invalid image data',
          code: 'INVALID_IMAGE',
          timestamp: new Date().toISOString()
        }
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Analyze image with OpenAI
    const products = await analyzeImageWithOpenAI(image);
    const processingTime = Date.now() - startTime;

    // Success response
    const response: AnalyzeResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      products,
      metadata: {
        processingTime
      }
    };

    res.status(200).json(response);

    // Log successful analysis
    console.log(`[ANALYZE] Successfully processed image analysis in ${processingTime}ms, found ${products.length} products`);

  } catch (error) {
    console.error('[ANALYZE] Error processing image analysis:', error);

    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let errorMessage = 'Internal server error during image analysis';

    // Handle OpenAI-specific errors
    if (error instanceof Error) {
      switch (error.message) {
        case 'OPENAI_AUTH_ERROR':
          statusCode = 500;
          errorCode = 'OPENAI_AUTH_ERROR';
          errorMessage = 'OpenAI authentication failed';
          break;
        case 'OPENAI_RATE_LIMIT':
          statusCode = 429;
          errorCode = 'OPENAI_RATE_LIMIT';
          errorMessage = 'OpenAI rate limit exceeded';
          break;
        case 'OPENAI_TIMEOUT':
          statusCode = 503;
          errorCode = 'OPENAI_TIMEOUT';
          errorMessage = 'OpenAI request timeout';
          break;
        case 'OPENAI_API_ERROR':
          statusCode = 502;
          errorCode = 'OPENAI_API_ERROR';
          errorMessage = 'OpenAI API error';
          break;
      }
    }

    const errorResponse: AnalyzeErrorResponse = {
      success: false,
      error: {
        message: errorMessage,
        code: errorCode,
        timestamp: new Date().toISOString()
      }
    };

    res.status(statusCode).json(errorResponse);
  }
};
