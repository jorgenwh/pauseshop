/**
 * Streaming analysis workflow for processing screenshots and constructing Amazon search results
 */

import { analyzeImageStreaming, Product } from './api-client';
import { constructAmazonSearchBatch } from '../scraper/amazon-search';
import { executeAmazonSearchBatch } from '../scraper/amazon-http-client';
import { scrapeAmazonSearchBatch } from '../scraper/amazon-parser';
import { captureScreenshot } from './screenshot-capturer';
import { log, logWithTimestamp } from './logger';
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
 * Handles the complete screenshot and streaming analysis workflow
 * @param config The screenshot configuration
 * @param windowId The window ID to capture from
 * @returns Promise<ScreenshotResponse> The analysis results
 */
export const handleScreenshotAnalysis = async (config: ScreenshotConfig, windowId: number, pauseId?: string): Promise<ScreenshotResponse> => {
    try {
        const imageData = await captureScreenshot(config, windowId);

        return new Promise<ScreenshotResponse>(async (resolve) => {
            try {
                await analyzeImageStreaming(
                    imageData,
                    {
                        onProduct: async (product: Product) => {
                            log(config, `Received streamed product: ${product.name}`);
                            
                            // Log Amazon scraping start with timestamp and product details
                            logWithTimestamp(config, 'info', 'Amazon scraping started', {
                                productName: product.name,
                                brand: product.brand,
                                category: product.category,
                                searchTerms: product.searchTerms,
                                targetGender: product.targetGender
                            });
                            
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
                                    
                                    // Log successful Amazon scraping completion with timestamp and product details
                                    logWithTimestamp(config, 'info', 'Amazon scraping completed successfully', {
                                        originalProductName: product.name,
                                        scrapedProductId: scrapedProduct.productId,
                                        scrapedProductUrl: scrapedProduct.productUrl,
                                        scrapedThumbnailUrl: scrapedProduct.thumbnailUrl,
                                        scrapedProductPosition: scrapedProduct.position,
                                        scrapedProductConfidence: scrapedProduct.confidence,
                                        amazonAsin: scrapedProduct.amazonAsin,
                                        searchTermsUsed: product.searchTerms
                                    });
                                    
                                    chrome.runtime.sendMessage({
                                        type: 'product_update',
                                        originalProduct: product, // Pass the original product
                                        scrapedProduct: scrapedProduct, // Pass the scraped product
                                        pauseId: pauseId
                                    } as ProductMessage);
                                } else {
                                    // Log when no products were found
                                    logWithTimestamp(config, 'warn', 'Amazon scraping completed but no products found', {
                                        originalProductName: product.name,
                                        searchTermsUsed: product.searchTerms,
                                        scrapedResultsCount: amazonScrapedResults?.scrapedResults?.length || 0
                                    });
                                }
                            } catch (error) {
                                const errorMessage = error instanceof Error ? error.message : 'Unknown Amazon search/scraping error';
                                log(config, `Amazon search/scraping failed for streamed product: ${errorMessage}`);
                                
                                // Log Amazon scraping failure with timestamp and error details
                                logWithTimestamp(config, 'error', 'Amazon scraping failed', {
                                    originalProductName: product.name,
                                    brand: product.brand,
                                    category: product.category,
                                    searchTermsUsed: product.searchTerms,
                                    errorMessage: errorMessage,
                                    errorType: error instanceof Error ? error.constructor.name : 'Unknown'
                                });
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
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to start streaming analysis';
                log(config, errorMessage);
                chrome.runtime.sendMessage({
                    type: 'analysis_error',
                    error: errorMessage,
                    pauseId: pauseId
                } as AnalysisErrorMessage);
                resolve({ success: false, error: errorMessage, pauseId: pauseId });
            }
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log(config, `Screenshot workflow failed: ${errorMessage}`);
        return { success: false, error: errorMessage, pauseId };
    }
};
