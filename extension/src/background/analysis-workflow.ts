/**
 * Analysis workflow for processing screenshots and constructing Amazon search results
 */

import { analyzeImage } from './api-client';
import { constructAmazonSearchBatch } from '../scraper/amazon-search';
import { executeAmazonSearchBatch } from '../scraper/amazon-http-client';
import { scrapeAmazonSearchBatch } from '../scraper/amazon-parser';
import { captureScreenshot } from './screenshot-capturer';
import { log } from './logger';
import type { Product } from '../types/amazon';
import type { ScreenshotConfig, ScreenshotResponse } from './types';

/**
 * Handles the complete screenshot and analysis workflow
 * @param config The screenshot configuration
 * @param windowId The window ID to capture from
 * @returns Promise<ScreenshotResponse> The analysis results
 */
export const handleScreenshotAnalysis = async (config: ScreenshotConfig, windowId: number, pauseId?: string): Promise<ScreenshotResponse> => {
    try {
        // Capture and downscale screenshot
        // The captureScreenshot function in content script is not the same as this one.
        // This captureScreenshot is from './screenshot-capturer' which is a background script utility.
        // It's confusing, but the content script's captureScreenshot sends a message to this background script.
        // So, we don't pass pauseId here. The pauseId is already in the config object.
        const imageData = await captureScreenshot(config, windowId);

        // Send to server for analysis
        try {
            const analysisResult = await analyzeImage(imageData, {
                baseUrl: config.serverUrl
            });

            // Construct Amazon search URLs from analysis results
            try {
                const products: Product[] = analysisResult.products.map((p: unknown) => {
                    const product = p as {
                        name: string;
                        category: string;
                        brand: string;
                        primaryColor: string;
                        secondaryColors: string[];
                        features: string[];
                        targetGender: string;
                        searchTerms: string;
                    };
                    return {
                        name: product.name,
                        category: product.category as Product['category'],
                        brand: product.brand,
                        primaryColor: product.primaryColor,
                        secondaryColors: product.secondaryColors,
                        features: product.features,
                        targetGender: product.targetGender as Product['targetGender'],
                        searchTerms: product.searchTerms
                    };
                });

                const amazonSearchResults = constructAmazonSearchBatch(products, {
                    domain: 'amazon.com',
                    enableCategoryFiltering: true,
                    fallbackToGenericSearch: true
                });

                // Execute Amazon search requests to fetch HTML content
                try {
                    const amazonExecutionResults = await executeAmazonSearchBatch(amazonSearchResults, {
                        maxConcurrentRequests: 3,
                        requestDelayMs: 1500,
                        timeoutMs: 10000,
                        maxRetries: 2,
                        userAgentRotation: true
                    });

                    // Scrape Amazon search results HTML
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
                            pauseId // Include pauseId in the response
                        };
                    } catch (scrapingError) {
                        const scrapingErrorMessage = scrapingError instanceof Error ? scrapingError.message : 'Unknown scraping error';
                        log(config, `Amazon search scraping failed: ${scrapingErrorMessage}`);

                        // Still return execution results even if scraping fails
                        return {
                            success: true,
                            analysisResult,
                            amazonSearchResults,
                            amazonExecutionResults,
                            amazonScrapedResults: null,
                            pauseId // Include pauseId in the response
                        };
                    }
                } catch (executionError) {
                    const executionErrorMessage = executionError instanceof Error ? executionError.message : 'Unknown execution error';
                    log(config, `Amazon search execution failed: ${executionErrorMessage}`);

                    // Still return search URLs even if execution fails
                    return {
                        success: true,
                        analysisResult,
                        amazonSearchResults,
                        amazonExecutionResults: null,
                        amazonScrapedResults: null,
                        pauseId // Include pauseId in the response
                    };
                }
            } catch (searchError) {
                const searchErrorMessage = searchError instanceof Error ? searchError.message : 'Unknown search error';
                log(config, `Amazon search URL construction failed: ${searchErrorMessage}`);

                // Still return analysis results even if search construction fails
                return {
                    success: true,
                    analysisResult,
                    amazonSearchResults: null,
                    amazonExecutionResults: null,
                    amazonScrapedResults: null,
                    pauseId // Include pauseId in the response
                };
            }
        } catch (serverError) {
            const serverErrorMessage = serverError instanceof Error ? serverError.message : 'Unknown server error';
            log(config, `Server analysis failed: ${serverErrorMessage}`);

            return {
                success: false,
                error: `Server communication failed: ${serverErrorMessage}`,
                pauseId // Include pauseId in the response
            };
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log(config, `Screenshot workflow failed: ${errorMessage}`);
        return { success: false, error: errorMessage, pauseId };
    }
};
