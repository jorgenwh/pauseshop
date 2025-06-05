/**
 * Image analysis endpoint
 * Accepts POST requests with image data and returns AI-powered product analysis
 */

import { Request, Response } from 'express';
import { AnalyzeRequest, AnalyzeResponse, AnalyzeErrorResponse, Product, StreamingCallbacks } from '../types/analyze';
import { validateImageData } from '../utils/image-validator';
import { AnalysisProviderFactory } from '../services/analysis-provider-factory';
import { StreamingAnalysisService } from '../services/streaming-analysis';

/**
 * Analyze image using the configured provider
 */
const analyzeImageWithProvider = async (imageData: string): Promise<Product[]> => {
    const streamingService = new StreamingAnalysisService();
    const result = await streamingService.analyzeImage(imageData, { preferStreaming: false }); // Explicitly use batch for this endpoint
    return result.products;
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

/**
 * Handles POST /analyze/stream requests for SSE
 */
export const analyzeImageStreamingHandler = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*', // Allow all origins for development, restrict in production
    });

    // Send a "start" event immediately
    res.write(`event: start\ndata: ${JSON.stringify({ timestamp: new Date().toISOString(), provider: AnalysisProviderFactory.getCurrentProvider() })}\n\n`);

    const streamingService = new StreamingAnalysisService();

    try {
        const { image }: AnalyzeRequest = req.body;

        if (!image) {
            res.write(`event: error\ndata: ${JSON.stringify({ message: 'Missing required field: image', code: 'MISSING_IMAGE' })}\n\n`);
            res.end();
            return;
        }

        const validationResult = validateImageData(image);
        if (!validationResult.isValid) {
            res.write(`event: error\ndata: ${JSON.stringify({ message: validationResult.error || 'Invalid image data', code: 'INVALID_IMAGE' })}\n\n`);
            res.end();
            return;
        }

        await streamingService.analyzeImageStreaming(image, {
            onProduct: (product: Product) => {
                res.write(`event: product\ndata: ${JSON.stringify(product)}\n\n`);
            },
            onComplete: (response) => {
                const processingTime = Date.now() - startTime;
                res.write(`event: complete\ndata: ${JSON.stringify({ totalProducts: 0, processingTime, usage: response.usage })}\n\n`); // totalProducts will be calculated on frontend
                res.end();
            },
            onError: (error: Error) => {
                console.error('[ANALYZE_STREAM] Error during streaming analysis:', error);
                res.write(`event: error\ndata: ${JSON.stringify({ message: error.message, code: 'STREAMING_ERROR' })}\n\n`);
                res.end();
            }
        });

    } catch (error) {
        console.error('[ANALYZE_STREAM] Uncaught error in streaming handler:', error);
        res.write(`event: error\ndata: ${JSON.stringify({ message: (error as Error).message || 'Internal server error during streaming analysis', code: 'INTERNAL_STREAMING_ERROR' })}\n\n`);
        res.end();
    }
};
