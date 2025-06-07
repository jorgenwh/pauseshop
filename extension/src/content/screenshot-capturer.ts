/**
 * Screenshot capture functionality for PauseShop extension
 * Uses Chrome's captureVisibleTab API through background service worker
 */

import { UIManager } from "../ui/ui-manager";
import { LoadingState, ProductDisplayData } from "../ui/types";
import { type AmazonScrapedBatch } from "../types/amazon";

// Define local interfaces, not imported types
interface ScreenshotConfig {
    targetWidth: number;
    enableLogging: boolean;
    logPrefix: string;
    debugMode: boolean;
    serverUrl: string;
    pauseId?: string;
}

interface ScreenshotMessage {
    action: "captureScreenshot";
    config: ScreenshotConfig;
    pauseId?: string;
}

interface ScreenshotResponse {
    success: boolean;
    error?: string;
    analysisResult?: {
        products: Array<{ name: string }>;
        metadata: { processingTime: number };
    };
    amazonSearchResults?: {
        searchResults?: unknown;
        metadata: {
            successfulSearches: number;
            totalProducts: number;
            processingTime: number;
        };
    };
    amazonExecutionResults?: unknown;
    amazonScrapedResults?: AmazonScrapedBatch;
    pauseId?: string;
}

const defaultConfig: ScreenshotConfig = {
    targetWidth: 640,
    enableLogging: false,
    logPrefix: "PauseShop Screenshot",
    debugMode: true,
    serverUrl: "http://localhost:3000",
};

export let uiManager: UIManager | null = null;

export const setUIManager = (manager: UIManager): void => {
    uiManager = manager;
};

/**
 * Extract product display data from Amazon scraping results
 * Enhanced for Task 4.4: Include all products for horizontal expansion
 */
const extractProductDisplayData = (
    amazonResults: AmazonScrapedBatch, // Revert to original type
): ProductDisplayData[] => {
    const displayData: ProductDisplayData[] = [];

    amazonResults.scrapedResults.forEach((result) => {
        if (result.success && result.products.length > 0) {
            const firstProduct = result.products[0];

            // Include all products for expansion functionality
            displayData.push({
                name: result.originalSearchResult.originalProduct.name, // Assign the product name
                thumbnailUrl: firstProduct?.thumbnailUrl || null,
                allProducts: result.products, // NEW: All products for expansion
                category: result.originalSearchResult.category,
                fallbackText: result.originalSearchResult.originalProduct.name,
            });
        } else if (result.success && result.products.length === 0) {
            // Handle case where search succeeded but no products found
            displayData.push({
                name: result.originalSearchResult.originalProduct.name, // Assign the product name
                thumbnailUrl: null,
                allProducts: [], // Empty array for consistency
                category: result.originalSearchResult.category,
                fallbackText: result.originalSearchResult.originalProduct.name,
            });
        }
    });

    return displayData;
};

// Removed ensureUIManager as UIManager will be provided externally

/**
 * Captures a screenshot by communicating with the background service worker
 * @param config Screenshot configuration options
 * @param pauseId Optional: A unique ID for the pause event that triggered this capture
 */
export const captureScreenshot = async (
    config: Partial<ScreenshotConfig> = {}, // Revert to original config parameter
    pauseId?: string,
    getCurrentPauseId?: () => string | null, // New parameter
): Promise<void> => {
    const fullConfig: ScreenshotConfig = { ...defaultConfig, ...config };

    // If a pauseId is provided, add it to the fullConfig
    if (pauseId) {
        fullConfig.pauseId = pauseId;
    }

    // Use the externally provided UI manager
    if (!uiManager) {
        // Changed from this.log to console.error
        console.error("Error: UIManager not set in screenshot-capturer.ts");
        return;
    }

    // Show UI immediately
    await uiManager.showSidebar(); // Adjusted from showLoadingSquare
    uiManager.updateLoadingState(LoadingState.PROCESSING); // Set loading state

    try {
        const message: ScreenshotMessage = {
            action: "captureScreenshot",
            config: fullConfig,
            pauseId: fullConfig.pauseId,
        };

        // Send message to background service worker
        const response = await chrome.runtime.sendMessage(message); // Removed as ScreenshotResponse cast

        if (response.success) {
            // Log analysis results if available
            if (response.analysisResult) {
                const { products, metadata } = response.analysisResult;
                // Changed from log to console.info
                console.info(
                    `[Screenshot Capturer] Analysis complete: ${products.length} products detected in ${metadata.processingTime}ms`,
                );
            }

            // Check if we have Amazon scraping results to show product grid
            if (response.amazonScrapedResults && uiManager) {
                const currentActivePauseId = getCurrentPauseId
                    ? getCurrentPauseId()
                    : null;

                if (
                    response.pauseId &&
                    currentActivePauseId &&
                    response.pauseId === currentActivePauseId
                ) {
                    const amazonResults = response.amazonScrapedResults;
                    const productDisplayData =
                        extractProductDisplayData(amazonResults); // Reverted to original call

                    if (productDisplayData.length > 0) {
                        await uiManager.showProducts(productDisplayData); // Adjusted from showProductGrid
                    } else {
                        // Changed from log to console.info
                        console.info(
                            "[Screenshot Capturer] No products found, showing temporary message",
                        );
                        await uiManager.showNoProductsFound(); // Will auto-hide after 3 seconds
                    }
                } else {
                    // Changed from log to console.warn
                    console.warn(
                        `[Screenshot Capturer] Ignoring product display for pauseId ${response.pauseId || "N/A"} as it's not the current active pauseId (${currentActivePauseId || "N/A"})`,
                    );
                    // Hide UI if this was the only pending action for this pauseId
                    await uiManager.hideSidebar(); // Adjusted from hideLoadingSquare
                }
            } else {
                // No scraping results available or no UI manager
                // Changed from log to console.info
                console.info(
                    "No scraping results available or UI not initialized, showing no products message",
                );
                // Removed uiManager.showNoProductsFound() as it was causing premature hiding

                if (response.amazonScrapedResults) {
                    const { metadata } = response.amazonScrapedResults;
                    // Changed from log to console.info
                    console.info(
                        `[Screenshot Capturer] Amazon scraping: ${metadata.successfulScrapes}/${metadata.totalSearches} successful, ${metadata.totalProductsFound} products found in ${metadata.totalScrapingTime}ms`,
                    );
                }
            }
        } else {
            // Changed from log to console.error
            console.error(
                `[Screenshot Capturer] Screenshot capture failed: ${response.error || "Unknown error"}`,
            );

            // Hide UI on error
            await uiManager.hideSidebar(); // Adjusted from hideLoadingSquare
        }
    } catch (error) {
        if (error instanceof Error) {
            // Changed from log to console.error
            console.error(
                `[Screenshot Capturer] Failed to communicate with background service worker: ${error.message}`,
            );
        } else {
            // Changed from log to console.error
            console.error(
                "[Screenshot Capturer] Unknown error during screenshot capture",
            );
        }

        // Hide UI on error
        await uiManager.hideSidebar(); // Adjusted from hideLoadingSquare
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

/**
 * Initialize screenshot capture functionality
 */
