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
export const handleScreenshotAnalysis = async (config: ScreenshotConfig, windowId: number): Promise<ScreenshotResponse> => {
    try {
        // Step 1: Capture and downscale screenshot
        const imageData = await captureScreenshot(config, windowId);

        // Step 2: Debug mode logging
        if (config.debugMode) {
            log(config, `Debug mode: Image data URL (${imageData.length} characters)`);
            // Uncomment next line for full URL logging in debug mode:
            console.log('[DEBUG] Full image data URL:', imageData);
        }

        // Step 3: Send to server for analysis
        try {
            log(config, 'Sending image to server for analysis');
            const analysisResult = await analyzeImage(imageData, {
                baseUrl: config.serverUrl
            });

            log(config, `Server analysis complete: ${analysisResult.products.length} products detected`);
            
            // Step 4: Construct Amazon search URLs from analysis results
            try {
                log(config, 'Constructing Amazon search URLs...');
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
                
                log(config, `Amazon search URLs constructed: ${amazonSearchResults.metadata.successfulSearches}/${amazonSearchResults.metadata.totalProducts} successful`);
                
                // Step 5: Execute Amazon search requests to fetch HTML content
                try {
                    log(config, 'Executing Amazon search requests...');
                    const amazonExecutionResults = await executeAmazonSearchBatch(amazonSearchResults, {
                        maxConcurrentRequests: 3,
                        requestDelayMs: 1500,
                        timeoutMs: 10000,
                        maxRetries: 2,
                        userAgentRotation: true
                    });
                    
                    log(config, `Amazon searches executed: ${amazonExecutionResults.metadata.successfulRequests}/${amazonExecutionResults.metadata.totalRequests} successful`);
                    
                    // Step 6: Scrape Amazon search results HTML
                    try {
                        log(config, 'Scraping Amazon search results...');
                        const amazonScrapedResults = scrapeAmazonSearchBatch(amazonExecutionResults, {
                            maxProductsPerSearch: 5,
                            requireThumbnail: true,
                            validateUrls: true,
                            timeoutMs: 5000
                        });
                        
                        log(config, `Amazon scraping complete: ${amazonScrapedResults.metadata.totalProductsFound} products found from ${amazonScrapedResults.metadata.successfulScrapes}/${amazonScrapedResults.metadata.totalSearches} searches`);
                        
                        return {
                            success: true,
                            analysisResult,
                            amazonSearchResults,
                            amazonExecutionResults,
                            amazonScrapedResults
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
                            amazonScrapedResults: null
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
                        amazonScrapedResults: null
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
                    amazonScrapedResults: null
                };
            }
        } catch (serverError) {
            const serverErrorMessage = serverError instanceof Error ? serverError.message : 'Unknown server error';
            log(config, `Server analysis failed: ${serverErrorMessage}`);
            
            return {
                success: false,
                error: `Server communication failed: ${serverErrorMessage}`
            };
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log(config, `Screenshot workflow failed: ${errorMessage}`);
        return { success: false, error: errorMessage };
    }
};