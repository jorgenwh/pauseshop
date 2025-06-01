/**
 * Image analysis endpoint
 * Accepts POST requests with image data and returns AI-powered product analysis
 */

import { Request, Response } from 'express';
import { AnalyzeRequest, AnalyzeResponse, AnalyzeErrorResponse, Product } from '../types/analyze';
import { validateImageData } from '../utils/image-validator';
import { AnalysisProviderFactory } from '../services/analysis-provider-factory';

/**
 * Analyze image using the configured provider
 */
const analyzeImageWithProvider = async (imageData: string): Promise<Product[]> => {
  const analysisService = AnalysisProviderFactory.createProvider();
  const response = await analysisService.analyzeImage(imageData);
  const products = analysisService.parseResponseToProducts(response.content);
  return products;
};

/**
 * Handles POST /analyze requests
 */
export const analyzeImageHandler = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  // Log provider configuration at the start of each request
  console.log('[ANALYZE] =================================');
  console.log('[ANALYZE] Starting image analysis request');
  console.log(`[ANALYZE] Provider: ${AnalysisProviderFactory.getCurrentProvider()}`);

  // Validate provider configuration
  const validation = AnalysisProviderFactory.validateProviderConfig();
  if (!validation.isValid) {
    console.error(`[ANALYZE] Provider configuration error: ${validation.error}`);
    res.status(500).json({
    success: false,
    error: {
      message: validation.error || 'Invalid provider configuration',
      code: 'PROVIDER_CONFIG_ERROR',
      timestamp: new Date().toISOString()
    }
    });
    return;
  }

  // Log provider-specific configuration
  const currentProvider = AnalysisProviderFactory.getCurrentProvider();
  if (currentProvider === 'openai') {
    console.log(`[ANALYZE] OpenAI Model: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`);
  } else if (currentProvider === 'requesty') {
    console.log(`[ANALYZE] Requesty Model: ${process.env.REQUESTY_MODEL || 'openai/gpt-4o-mini'}`);
  }
  console.log('[ANALYZE] =================================');

  try {
    // Validate request body
    const { image, metadata: _metadata }: AnalyzeRequest = req.body;

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

    // Analyze image with configured provider
    const products = await analyzeImageWithProvider(image);
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

    // Handle provider-specific errors
    if (error instanceof Error) {
      switch (error.message) {
        // OpenAI errors
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
        // Requesty errors
        case 'REQUESTY_AUTH_ERROR':
          statusCode = 500;
          errorCode = 'REQUESTY_AUTH_ERROR';
          errorMessage = 'Requesty authentication failed';
          break;
        case 'REQUESTY_RATE_LIMIT':
          statusCode = 429;
          errorCode = 'REQUESTY_RATE_LIMIT';
          errorMessage = 'Requesty rate limit exceeded';
          break;
        case 'REQUESTY_TIMEOUT':
          statusCode = 503;
          errorCode = 'REQUESTY_TIMEOUT';
          errorMessage = 'Requesty request timeout';
          break;
        case 'REQUESTY_API_ERROR':
          statusCode = 502;
          errorCode = 'REQUESTY_API_ERROR';
          errorMessage = 'Requesty API error';
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
