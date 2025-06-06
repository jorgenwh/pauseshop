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

// Define a merged product interface that combines server and scraped data

// Define message types for communication with the UI
interface ProductGroupMessage { // Changed from ProductMessage to ProductGroupMessage
    type: 'product_group_update'; // New type to distinguish
    originalProduct: Product; // The original product from server stream
    scrapedProducts: AmazonScrapedProduct[]; // All scraped Amazon products for this original product
    pauseId?: string;
}

/**
 * Merges original product data from server stream with scraped Amazon data
 * @param originalProduct Product data from server analysis
 * @param scrapedProduct Scraped Amazon product data
 * @returns Single consolidated product object
 */

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

        return new Promise<ScreenshotResponse>(async (resolve) => { // eslint-disable-line no-async-promise-executor
            // Track all async operations from onProduct callbacks
            const pendingOperations: Promise<void>[] = [];
            
            try {
                await analyzeImageStreaming(
                    imageData,
                    {
                        onProduct: async (product: Product) => {
                            // Log product received from server stream with detailed information
                            logWithTimestamp(config, 'info', 'Product received from server stream', {
                                productName: product.name,
                                brand: product.brand,
                                category: product.category,
                                primaryColor: product.primaryColor,
                                secondaryColors: product.secondaryColors,
                                features: product.features,
                                targetGender: product.targetGender,
                                searchTerms: product.searchTerms
                            });
                            
                            log(config, `Received streamed product: ${product.name}`);
                            
                            // Create a promise for this product's async processing
                            const productProcessingPromise = (async () => {
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
                                        maxProductsPerSearch: 5,
                                        requireThumbnail: true,
                                        validateUrls: true,
                                        timeoutMs: 5000
                                    });

                                    if (amazonScrapedResults && amazonScrapedResults.scrapedResults.length > 0 && amazonScrapedResults.scrapedResults[0].products.length > 0) {
                                        const scrapedProducts = amazonScrapedResults.scrapedResults[0].products;
                                        
                                        // Log successful Amazon scraping completion with all products found
                                        logWithTimestamp(config, 'info', 'Amazon scraping completed successfully', {
                                            originalProductName: product.name,
                                            totalProductsFound: scrapedProducts.length,
                                            searchTermsUsed: product.searchTerms,
                                            scrapedProducts: scrapedProducts.map(p => ({
                                                productId: p.productId,
                                                productUrl: p.productUrl,
                                                thumbnailUrl: p.thumbnailUrl,
                                                position: p.position,
                                                confidence: p.confidence,
                                                amazonAsin: p.amazonAsin
                                            }))
                                        });
                                        
                                        // Send a single message with the original product and all scraped products
                                        const tabId = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
                                        if (tabId) {
                                            chrome.tabs.sendMessage(tabId, {
                                                type: 'product_group_update', // Use new type
                                                originalProduct: product, // The original product
                                                scrapedProducts: scrapedProducts, // All scraped products
                                                pauseId: pauseId
                                            } as ProductGroupMessage).catch(e => log(config, `Error sending product group update to tab ${tabId}: ${e.message}`));
                                        } else {
                                            log(config, 'Could not find active tab to send product group update.');
                                        }
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
                            })();
                            
                            // Add this promise to our tracking array
                            pendingOperations.push(productProcessingPromise);
                        },
                        onComplete: async () => {
                            log(config, 'Streaming analysis complete. Waiting for all product processing to finish...');
                            
                            // Wait for all pending operations to complete
                            try {
                                await Promise.allSettled(pendingOperations);
                                log(config, 'All product processing operations completed.');
                                
                                // Log summary of total products processed
                                logWithTimestamp(config, 'info', 'Analysis workflow completed', {
                                    totalProductsFromServer: pendingOperations.length,
                                    message: `Processed ${pendingOperations.length} product(s) from server stream. Each may have generated up to 5 Amazon products for the UI.`
                                });
                            } catch (error) {
                                log(config, `Error waiting for product processing: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            }
                            
                            const tabId = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
                            if (tabId) {
                                chrome.tabs.sendMessage(tabId, {
                                    type: 'analysis_complete',
                                    pauseId: pauseId
                                } as AnalysisCompleteMessage).catch(e => log(config, `Error sending analysis complete to tab ${tabId}: ${e.message}`));
                            }
                            resolve({ success: true, pauseId: pauseId });
                        },
                        onError: async (error: Event) => {
                            const errorMessage = `Streaming analysis failed: ${error.type || 'Unknown error'}`;
                            log(config, errorMessage);
                            const tabId = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
                            if (tabId) {
                                chrome.tabs.sendMessage(tabId, {
                                    type: 'analysis_error',
                                    error: errorMessage,
                                    pauseId: pauseId
                                } as AnalysisErrorMessage).catch(e => log(config, `Error sending analysis error to tab ${tabId}: ${e.message}`));
                            }
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
                const tabId = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
                if (tabId) {
                    chrome.tabs.sendMessage(tabId, {
                        type: 'analysis_error',
                        error: errorMessage,
                        pauseId: pauseId
                    } as AnalysisErrorMessage).catch(e => log(config, `Error sending analysis error to tab ${tabId}: ${e.message}`));
                }
                resolve({ success: false, error: errorMessage, pauseId: pauseId });
            }
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log(config, `Screenshot workflow failed: ${errorMessage}`);
        return { success: false, error: errorMessage, pauseId };
    }
};
