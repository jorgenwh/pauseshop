/**
 * Analysis workflow for processing screenshots and constructing Amazon search results
 */

import { analyzeImage, analyzeImageStreaming, Product } from './api-client';
import { constructAmazonSearchBatch } from '../scraper/amazon-search';
import { executeAmazonSearchBatch } from '../scraper/amazon-http-client';
import { scrapeAmazonSearchBatch } from '../scraper/amazon-parser';
import { captureScreenshot } from './screenshot-capturer';
import { log } from './logger';
import type { ScreenshotConfig, ScreenshotResponse } from './types';
import type { AmazonScrapedProduct } from '../types/amazon';

// Define message types for communication with the UI
interface ProductMessage {
    type: 'product_update';
    originalProduct: Product; // Add original product data
    scrapedProduct: AmazonScrapedProduct; // Rename 'product' to 'scrapedProduct' for clarity
    pauseId?: string;
}

interface AnalysisCompleteMessage {
    type: 'analysis_complete';
    pauseId?: string;
}

interface AnalysisErrorMessage {
    type: 'analysis_error';
    error: string;
    pauseId?: string;
}

/**
 * Handles the complete screenshot and analysis workflow
 * @param config The screenshot configuration
 * @param windowId The window ID to capture from
 * @returns Promise<ScreenshotResponse> The analysis results
 */
export const handleScreenshotAnalysis = async (config: ScreenshotConfig, windowId: number, pauseId?: string): Promise<ScreenshotResponse> => {
    try {
        const imageData = await captureScreenshot(config, windowId);

        if (config.useStreaming) {
            return new Promise<ScreenshotResponse>((resolve) => {
                analyzeImageStreaming(
                    imageData,
                    {
                        onProduct: async (product: Product) => {
                            log(config, `Received streamed product: ${product.name}`);
                            try {
                                const amazonSearchResults = constructAmazonSearchBatch([product], {
                                    domain: 'amazon.com',
                                    enableCategoryFiltering: true,
                                    fallbackToGenericSearch: true
                                });

                                const amazonExecutionResults = await executeAmazonSearchBatch(amazonSearchResults, {
                                    maxConcurrentRequests: 1,
                                    requestDelayMs: 500,
                                    timeoutMs: 10000,
                                    maxRetries: 1,
                                    userAgentRotation: true
                                });

                                const amazonScrapedResults = scrapeAmazonSearchBatch(amazonExecutionResults, {
                                    maxProductsPerSearch: 1,
                                    requireThumbnail: true,
                                    validateUrls: true,
                                    timeoutMs: 5000
                                });

                                if (amazonScrapedResults && amazonScrapedResults.scrapedResults.length > 0 && amazonScrapedResults.scrapedResults[0].products.length > 0) {
                                    const scrapedProduct = amazonScrapedResults.scrapedResults[0].products[0];
                                    chrome.runtime.sendMessage({
                                        type: 'product_update',
                                        originalProduct: product, // Pass the original product
                                        scrapedProduct: scrapedProduct, // Pass the scraped product
                                        pauseId: pauseId
                                    } as ProductMessage);
                                }
                            } catch (error) {
                                const errorMessage = error instanceof Error ? error.message : 'Unknown Amazon search/scraping error';
                                log(config, `Amazon search/scraping failed for streamed product: ${errorMessage}`);
                            }
                        },
                        onComplete: () => {
                            log(config, 'Streaming analysis complete.');
                            chrome.runtime.sendMessage({
                                type: 'analysis_complete',
                                pauseId: pauseId
                            } as AnalysisCompleteMessage);
                            resolve({ success: true, pauseId: pauseId });
                        },
                        onError: (error: Event) => {
                            const errorMessage = `Streaming analysis failed: ${error.type || 'Unknown error'}`;
                            log(config, errorMessage);
                            chrome.runtime.sendMessage({
                                type: 'analysis_error',
                                error: errorMessage,
                                pauseId: pauseId
                            } as AnalysisErrorMessage);
                            resolve({ success: false, error: errorMessage, pauseId: pauseId });
                        }
                    },
                    {
                        baseUrl: config.serverUrl
                    }
                );
            });
        } else {
            // Existing batch processing logic
            try {
                const analysisResult = await analyzeImage(imageData, {
                    baseUrl: config.serverUrl
                });

                try {
                    const products: Product[] = analysisResult.products.map((p: unknown) => {
                        const product = p as Product; // Cast directly to Product
                        return product;
                    });

                    const amazonSearchResults = constructAmazonSearchBatch(products, {
                        domain: 'amazon.com',
                        enableCategoryFiltering: true,
                        fallbackToGenericSearch: true
                    });

                    try {
                        const amazonExecutionResults = await executeAmazonSearchBatch(amazonSearchResults, {
                            maxConcurrentRequests: 3,
                            requestDelayMs: 1500,
                            timeoutMs: 10000,
                            maxRetries: 2,
                            userAgentRotation: true
                        });

                        try {
                            const amazonScrapedResults = scrapeAmazonSearchBatch(amazonExecutionResults, {
                                maxProductsPerSearch: 5,
                                requireThumbnail: true,
                                validateUrls: true,
                                timeoutMs: 5000
                            });

                            return {
                                success: true,
                                analysisResult,
                                amazonSearchResults,
                                amazonExecutionResults,
                                amazonScrapedResults,
                                pauseId
                            };
                        } catch (scrapingError) {
                            const scrapingErrorMessage = scrapingError instanceof Error ? scrapingError.message : 'Unknown scraping error';
                            log(config, `Amazon search scraping failed: ${scrapingErrorMessage}`);
                            return {
                                success: true,
                                analysisResult,
                                amazonSearchResults,
                                amazonExecutionResults,
                                amazonScrapedResults: null,
                                pauseId
                            };
                        }
                    } catch (executionError) {
                        const executionErrorMessage = executionError instanceof Error ? executionError.message : 'Unknown execution error';
                        log(config, `Amazon search execution failed: ${executionErrorMessage}`);
                        return {
                            success: true,
                            analysisResult,
                            amazonSearchResults,
                            amazonExecutionResults: null,
                            amazonScrapedResults: null,
                            pauseId
                        };
                    }
                } catch (searchError) {
                    const searchErrorMessage = searchError instanceof Error ? searchError.message : 'Unknown search error';
                    log(config, `Amazon search URL construction failed: ${searchErrorMessage}`);
                    return {
                        success: true,
                        analysisResult,
                        amazonSearchResults: null,
                        amazonExecutionResults: null,
                        amazonScrapedResults: null,
                        pauseId
                    };
                }
            } catch (serverError) {
                const serverErrorMessage = serverError instanceof Error ? serverError.message : 'Unknown server error';
                log(config, `Server analysis failed: ${serverErrorMessage}`);
                return {
                    success: false,
                    error: `Server communication failed: ${serverErrorMessage}`,
                    pauseId
                };
            }
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log(config, `Screenshot workflow failed: ${errorMessage}`);
        return { success: false, error: errorMessage, pauseId };
    }
};
