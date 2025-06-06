/**
 * Streaming analysis workflow for processing screenshots and constructing Amazon search results
 */

import { analyzeImageStreaming, Product } from "./api-client";
import { constructAmazonSearchBatch } from "../scraper/amazon-search";
import { executeAmazonSearchBatch } from "../scraper/amazon-http-client";
import { scrapeAmazonSearchBatch } from "../scraper/amazon-parser";
import { captureScreenshot } from "./screenshot-capturer";
import { log, logWithTimestamp } from "./logger";
import type { ScreenshotConfig, ScreenshotResponse } from "./types";
import type { AmazonScrapedProduct } from "../types/amazon";

// Define a merged product interface that combines server and scraped data

// Define message types for communication with the UI
interface ProductGroupMessage {
    // Changed from ProductMessage to ProductGroupMessage
    type: "product_group_update"; // New type to distinguish
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
    type: "analysis_complete";
    pauseId?: string;
}

interface AnalysisErrorMessage {
    type: "analysis_error";
    error: string;
    pauseId?: string;
}

/**
 * Handles the complete screenshot and streaming analysis workflow
 * @param config The screenshot configuration
 * @param windowId The window ID to capture from
 * @returns Promise<ScreenshotResponse> The analysis results
 */
export const handleScreenshotAnalysis = async (
    config: ScreenshotConfig,
    windowId: number,
    pauseId?: string,
): Promise<ScreenshotResponse> => {
    try {
        const imageData = await captureScreenshot(config, windowId);

        // Track all async operations from onProduct callbacks
        const pendingOperations: Promise<void>[] = [];

        try {
            // Notify UI that analysis has started
            const tabId = (
                await chrome.tabs.query({
                    active: true,
                    currentWindow: true,
                })
            )[0]?.id;
            if (tabId) {
                chrome.tabs
                    .sendMessage(tabId, {
                        type: "analysis_started",
                        pauseId: pauseId,
                    })
                    .catch((e) =>
                        log(
                            config,
                            `Error sending analysis_started to tab ${tabId}: ${e.message}`,
                        ),
                    );
            }

            await analyzeImageStreaming(
                imageData,
                {
                    onProduct: async (product: Product) => {
                        // Create a promise for this product's async processing
                        const productProcessingPromise = (async () => {
                            try {
                                const amazonSearchResults =
                                    constructAmazonSearchBatch([product], {
                                        domain: "amazon.com",
                                        enableCategoryFiltering: true,
                                        fallbackToGenericSearch: true,
                                    });

                                const amazonExecutionResults =
                                    await executeAmazonSearchBatch(
                                        amazonSearchResults,
                                        {
                                            maxConcurrentRequests: 1,
                                            requestDelayMs: 500,
                                            timeoutMs: 10000,
                                            maxRetries: 1,
                                            userAgentRotation: true,
                                        },
                                    );

                                const amazonScrapedResults =
                                    scrapeAmazonSearchBatch(
                                        amazonExecutionResults,
                                        {
                                            maxProductsPerSearch: 5,
                                            requireThumbnail: true,
                                            validateUrls: true,
                                            timeoutMs: 5000,
                                        },
                                    );

                                if (
                                    amazonScrapedResults &&
                                    amazonScrapedResults.scrapedResults.length >
                                        0 &&
                                    amazonScrapedResults.scrapedResults[0]
                                        .products.length > 0
                                ) {
                                    const scrapedProducts =
                                        amazonScrapedResults.scrapedResults[0]
                                            .products;

                                    // Send a single message with the original product and all scraped products
                                    const tabId = (
                                        await chrome.tabs.query({
                                            active: true,
                                            currentWindow: true,
                                        })
                                    )[0]?.id;
                                    if (tabId) {
                                        chrome.tabs
                                            .sendMessage(tabId, {
                                                type: "product_group_update", // Use new type
                                                originalProduct: product, // The original product
                                                scrapedProducts:
                                                    scrapedProducts, // All scraped products
                                                pauseId: pauseId,
                                            } as ProductGroupMessage)
                                            .catch((e) =>
                                                log(
                                                    config,
                                                    `Error sending product group update to tab ${tabId}: ${e.message}`,
                                                ),
                                            );
                                    } else {
                                        log(
                                            config,
                                            "Could not find active tab to send product group update.",
                                        );
                                    }
                                } else {
                                    // Log when no products were found
                                    logWithTimestamp(
                                        config,
                                        "warn",
                                        "Amazon scraping completed but no products found",
                                        {
                                            originalProductName: product.name,
                                            searchTermsUsed:
                                                product.searchTerms,
                                            scrapedResultsCount:
                                                amazonScrapedResults
                                                    ?.scrapedResults?.length ||
                                                0,
                                        },
                                    );
                                }
                            } catch (error) {
                                const errorMessage =
                                    error instanceof Error
                                        ? error.message
                                        : "Unknown Amazon search/scraping error";
                                log(
                                    config,
                                    `Amazon search/scraping failed for streamed product: ${errorMessage}`,
                                );

                                // Log Amazon scraping failure with timestamp and error details
                                logWithTimestamp(
                                    config,
                                    "error",
                                    "Amazon scraping failed",
                                    {
                                        originalProductName: product.name,
                                        brand: product.brand,
                                        category: product.category,
                                        searchTermsUsed: product.searchTerms,
                                        errorMessage: errorMessage,
                                        errorType:
                                            error instanceof Error
                                                ? error.constructor.name
                                                : "Unknown",
                                    },
                                );
                            }
                        })();

                        // Add this promise to our tracking array
                        pendingOperations.push(productProcessingPromise);
                    },
                    onComplete: async () => {
                        // Wait for all pending operations to complete
                        try {
                            await Promise.allSettled(pendingOperations);
                        } catch (error) {
                            log(
                                config,
                                `Error waiting for product processing: ${error instanceof Error ? error.message : "Unknown error"}`,
                            );
                        }

                        const tabId = (
                            await chrome.tabs.query({
                                active: true,
                                currentWindow: true,
                            })
                        )[0]?.id;
                        if (tabId) {
                            chrome.tabs
                                .sendMessage(tabId, {
                                    type: "analysis_complete",
                                    pauseId: pauseId,
                                } as AnalysisCompleteMessage)
                                .catch((e) =>
                                    log(
                                        config,
                                        `Error sending analysis complete to tab ${tabId}: ${e.message}`,
                                    ),
                                );
                        }
                        return { success: true, pauseId: pauseId };
                    },
                    onError: async (error: Event) => {
                        const errorMessage = `Streaming analysis failed: ${error.type || "Unknown error"}`;
                        log(config, errorMessage);
                        const tabId = (
                            await chrome.tabs.query({
                                active: true,
                                currentWindow: true,
                            })
                        )[0]?.id;
                        if (tabId) {
                            chrome.tabs
                                .sendMessage(tabId, {
                                    type: "analysis_error",
                                    error: errorMessage,
                                    pauseId: pauseId,
                                } as AnalysisErrorMessage)
                                .catch((e) =>
                                    log(
                                        config,
                                        `Error sending analysis error to tab ${tabId}: ${e.message}`,
                                    ),
                                );
                        }
                        return {
                            success: false,
                            error: errorMessage,
                            pauseId: pauseId,
                        };
                    },
                },
                {
                    baseUrl: config.serverUrl,
                },
            );
            return { success: true, pauseId: pauseId }; // Return success if analyzeImageStreaming completes without error
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to start streaming analysis";
            log(config, errorMessage);
            const tabId = (
                await chrome.tabs.query({
                    active: true,
                    currentWindow: true,
                })
            )[0]?.id;
            if (tabId) {
                chrome.tabs
                    .sendMessage(tabId, {
                        type: "analysis_error",
                        error: errorMessage,
                        pauseId: pauseId,
                    } as AnalysisErrorMessage)
                    .catch((e) =>
                        log(
                            config,
                            `Error sending analysis error to tab ${tabId}: ${e.message}`,
                        ),
                    );
            }
            return {
                success: false,
                error: errorMessage,
                pauseId: pauseId,
            };
        }
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        log(config, `Screenshot workflow failed: ${errorMessage}`);
        return { success: false, error: errorMessage, pauseId };
    }
};
