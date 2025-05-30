/**
 * Analysis workflow for processing screenshots and constructing Amazon search results
 */

import { analyzeImage } from './api-client';
import { constructAmazonSearchBatch } from '../scraper/amazon-search';
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
                const products: Product[] = analysisResult.products.map((p: any) => ({
                    name: p.name,
                    category: p.category,
                    brand: p.brand,
                    primaryColor: p.primaryColor,
                    secondaryColors: p.secondaryColors,
                    features: p.features,
                    targetGender: p.targetGender,
                    searchTerms: p.searchTerms
                }));
                
                const amazonSearchResults = constructAmazonSearchBatch(products, {
                    domain: 'amazon.com',
                    enableCategoryFiltering: true,
                    fallbackToGenericSearch: true
                });
                
                log(config, `Amazon search URLs constructed: ${amazonSearchResults.metadata.successfulSearches}/${amazonSearchResults.metadata.totalProducts} successful`);
                
                return {
                    success: true,
                    analysisResult,
                    amazonSearchResults
                };
            } catch (searchError) {
                const searchErrorMessage = searchError instanceof Error ? searchError.message : 'Unknown search error';
                log(config, `Amazon search URL construction failed: ${searchErrorMessage}`);
                
                // Still return analysis results even if search construction fails
                return {
                    success: true,
                    analysisResult,
                    amazonSearchResults: null
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