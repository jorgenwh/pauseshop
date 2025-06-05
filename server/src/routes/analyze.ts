/**
 * Streaming image analysis endpoint
 * Accepts POST requests with image data and returns AI-powered product analysis via SSE
 */

import { Request, Response } from 'express';
import { AnalyzeRequest, Product } from '../types/analyze';
import { validateImageData } from '../utils/image-validator';
import { AnalysisProviderFactory } from '../services/analysis-provider-factory';
import { StreamingAnalysisService } from '../services/streaming-analysis';

/**
 * Handles POST /analyze/stream requests for SSE
 */
export const analyzeImageStreamingHandler = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    // Log provider configuration at the start of each request
    console.log('[ANALYZE_STREAM] =================================');
    console.log('[ANALYZE_STREAM] Starting streaming image analysis request');
    console.log(`[ANALYZE_STREAM] Provider: ${AnalysisProviderFactory.getCurrentProvider()}`);

    // Validate provider configuration
    const validation = AnalysisProviderFactory.validateProviderConfig();
    if (!validation.isValid) {
        console.error(`[ANALYZE_STREAM] Provider configuration error: ${validation.error}`);
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
        console.log(`[ANALYZE_STREAM] OpenAI Model: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`);
    } else if (currentProvider === 'requesty') {
        console.log(`[ANALYZE_STREAM] Requesty Model: ${process.env.REQUESTY_MODEL || 'openai/gpt-4o-mini'}`);
    }
    console.log('[ANALYZE_STREAM] =================================');

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
                console.log(`[ANALYZE_STREAM] Successfully completed streaming analysis in ${processingTime}ms`);
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
