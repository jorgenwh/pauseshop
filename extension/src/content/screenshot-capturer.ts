/**
 * Screenshot capture functionality for PauseShop extension
 * Uses Chrome's captureVisibleTab API through background service worker
 */

import { UIManager } from '../ui/ui-manager';
import { LoadingState, ProductDisplayData } from '../ui/types';
import { AmazonScrapedBatch } from '../types/amazon';

interface ScreenshotConfig {
    targetWidth: number;
    enableLogging: boolean;
    logPrefix: string;
    debugMode: boolean;
    serverUrl: string;
}

interface ScreenshotMessage {
    action: 'captureScreenshot';
    config: ScreenshotConfig;
}

interface ScreenshotResponse {
    success: boolean;
    error?: string;
    analysisResult?: {
        products: Array<{ name: string; }>;
        metadata: { processingTime: number; };
    };
    amazonSearchResults?: {
        searchResults?: unknown;
        metadata: { successfulSearches: number; totalProducts: number; processingTime: number; };
    };
    amazonExecutionResults?: unknown;
    amazonScrapedResults?: AmazonScrapedBatch;
}

const defaultConfig: ScreenshotConfig = {
    targetWidth: 640,
    enableLogging: true,
    logPrefix: 'PauseShop Screenshot',
    debugMode: true,
    serverUrl: 'http://localhost:3000'
};

// Global UI manager instance
let uiManager: UIManager | null = null;

const log = (config: ScreenshotConfig, message: string): void => {
    if (config.enableLogging) {
        console.log(`${config.logPrefix}: ${message}`);
    }
};

/**
 * Extract product display data from Amazon scraping results
 * Enhanced for Task 4.4: Include all products for horizontal expansion
 */
const extractProductDisplayData = (amazonResults: AmazonScrapedBatch): ProductDisplayData[] => {
    const displayData: ProductDisplayData[] = [];
    
    amazonResults.scrapedResults.forEach(result => {
        if (result.success && result.products.length > 0) {
            const firstProduct = result.products[0];
            
            // Include all products for expansion functionality
            displayData.push({
                thumbnailUrl: firstProduct?.thumbnailUrl || null,
                allProducts: result.products, // NEW: All products for expansion
                category: result.originalSearchResult.category,
                fallbackText: result.originalSearchResult.originalProduct.name
            });
        } else if (result.success && result.products.length === 0) {
            // Handle case where search succeeded but no products found
            displayData.push({
                thumbnailUrl: null,
                allProducts: [], // Empty array for consistency
                category: result.originalSearchResult.category,
                fallbackText: result.originalSearchResult.originalProduct.name
            });
        }
    });
    
    return displayData;
};

/**
 * Initialize UI manager if not already created
 */
const ensureUIManager = (): UIManager | null => {
    if (!uiManager) {
        uiManager = UIManager.create({
            enableLogging: true,
            logPrefix: 'PauseShop UI'
        }, {}, {});
    }
    return uiManager;
};

/**
 * Captures a screenshot by communicating with the background service worker
 * @param config Screenshot configuration options
 */
export const captureScreenshot = async (config: Partial<ScreenshotConfig> = {}): Promise<void> => {
    const fullConfig: ScreenshotConfig = { ...defaultConfig, ...config };
    
    // Initialize and show UI immediately
    const ui = ensureUIManager();
    if (ui) {
        await ui.showLoadingSquare();
    }
    
    try {
        // Update UI state to processing
        if (ui) {
            ui.updateLoadingState(LoadingState.PROCESSING);
        }

        const message: ScreenshotMessage = {
            action: 'captureScreenshot',
            config: fullConfig
        };

        // Send message to background service worker
        const response = await chrome.runtime.sendMessage(message) as ScreenshotResponse;

        if (response.success) {
            // Log analysis results if available
            if (response.analysisResult) {
                const { products, metadata } = response.analysisResult;
                log(fullConfig, `Analysis complete: ${products.length} products detected in ${metadata.processingTime}ms`);
            }

            // Check if we have Amazon scraping results to show product grid
            if (response.amazonScrapedResults && ui) {
                const amazonResults = response.amazonScrapedResults;
                const productDisplayData = extractProductDisplayData(amazonResults);

                if (productDisplayData.length > 0) {
                    await ui.showProductGrid(productDisplayData);
                } else {
                    log(fullConfig, 'No valid product thumbnails found, keeping loading square visible');
                }
            } else {
                if (response.amazonScrapedResults) {
                    const { metadata } = response.amazonScrapedResults;
                    log(fullConfig, `Amazon scraping: ${metadata.successfulScrapes}/${metadata.totalSearches} successful, ${metadata.totalProductsFound} products found in ${metadata.totalScrapingTime}ms`);
                }
            }
        } else {
            log(fullConfig, `Screenshot capture failed: ${response.error || 'Unknown error'}`);

            // Hide UI on error
            if (ui) {
                await ui.hideLoadingSquare();
            }
        }
    } catch (error) {
        if (error instanceof Error) {
            log(fullConfig, `Failed to communicate with background service worker: ${error.message}`);
        } else {
            log(fullConfig, 'Unknown error during screenshot capture');
        }

        // Hide UI on error
        if (ui) {
            await ui.hideLoadingSquare();
        }
    }
};

/**
 * Hide the UI (called when video resumes)
 */
export const hideUI = async (): Promise<void> => {
    if (uiManager) {
        await uiManager.hideUI();
    }
};

/**
 * Cleanup UI resources
 */
export const cleanupUI = (): void => {
    if (uiManager) {
        uiManager.cleanup();
        uiManager = null;
    }
};

/**
 * Initialize screenshot capture functionality
 */
export const initializeScreenshotCapturer = (): void => {};
