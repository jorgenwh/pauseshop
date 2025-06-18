/**
 * Streaming analysis workflow for processing screenshots and constructing Amazon search results
 */

import { analyzeImageStreaming } from "./api-client";
import { Product } from "../types/common";
import { constructAmazonSearch } from "../scraper/amazon-search";
import { executeAmazonSearch } from "../scraper/amazon-http-client";
import { scrapeAmazonSearchResult } from "../scraper/amazon-parser";
import { captureAndCropScreenshot } from "./screenshot-capturer";
import { openScreenshotForValidation } from "./screenshot-debug";
import type { ScreenshotResponse, VideoBounds } from "./types";

/**
 * Handles the complete screenshot and streaming analysis workflow
 */
export const handleScreenshotAnalysis = async (
    windowId: number,
    pauseId: string,
    abortSignal?: AbortSignal,
    enableScreenshotValidation: boolean = false,
    videoBounds?: VideoBounds,
    originTabId?: number,
): Promise<ScreenshotResponse> => {
    try {
        // Check if already aborted
        if (abortSignal?.aborted) {
            console.warn(`[PauseShop:AnalysisWorkflow] Already aborted at start for pauseId: ${pauseId}`);
            throw new DOMException('Operation aborted', 'AbortError');
        }

        const imageData = await captureAndCropScreenshot(windowId, videoBounds);

        // Optionally open screenshot in new tab for validation
        if (enableScreenshotValidation) {
            await openScreenshotForValidation(imageData);
        }

        // Check again after screenshot capture
        if (abortSignal?.aborted) {
            console.log(`[PauseShop:AnalysisWorkflow] Aborted after screenshot capture for pauseId: ${pauseId}`);
            throw new DOMException('Operation aborted', 'AbortError');
        }

        // Track all async operations from onProduct callbacks
        const pendingOperations: Promise<void>[] = [];

        // Use the origin tab ID if provided, otherwise fall back to querying for active tab
        let tabId = originTabId;
        if (!tabId) {
            tabId = (
                await chrome.tabs.query({
                    active: true,
                    currentWindow: true,
                })
            )[0]?.id;
        }

        try {
            if (tabId) {
                chrome.tabs
                    .sendMessage(tabId, {
                        type: "analysis_started",
                        pauseId: pauseId,
                    })
                    .catch((e) =>
                        console.error(
                            `[PauseShop:AnalysisWorkflow] Error sending analysis_started to tab ${tabId}: ${e.message}`,
                        ),
                    );
            }

            await analyzeImageStreaming(imageData, {
                onProduct: async (product: Product) => {
                    // Check if aborted before processing product
                    if (abortSignal?.aborted) {
                        return;
                    }

                    // Create a promise for this product's async processing
                    const productProcessingPromise = (async () => {
                        try {
                            const amazonSearch = constructAmazonSearch(product);
                            if (!amazonSearch) {
                                console.warn(
                                    `[PauseShop:AnalysisWorkflow] Failed to construct Amazon search for pauseId: ${pauseId} - skipping`,
                                );
                                return;
                            }

                            // Check if aborted before Amazon search
                            if (abortSignal?.aborted) {
                                console.log(`[PauseShop:AnalysisWorkflow] Product processing aborted before Amazon search for pauseId: ${pauseId}`);
                                return;
                            }

                            const amazonSearchResult =
                                await executeAmazonSearch(amazonSearch, abortSignal);
                            if (!amazonSearchResult) {
                                console.warn(
                                    `[PauseShop:AnalysisWorkflow] Failed to construct Amazon search result for pauseId: ${pauseId} - skipping`,
                                );
                                return;
                            }

                            const amazonScrapedResult =
                                scrapeAmazonSearchResult(amazonSearchResult);
                            if (
                                amazonScrapedResult === null ||
                                amazonScrapedResult.products.length === 0
                            ) {
                                console.warn(
                                    `[PauseShop:AnalysisWorkflow] Failed to construct Amazon search result for pauseId: ${pauseId} - skipping`,
                                );
                                return;
                            }

                            const scrapedProducts =
                                amazonScrapedResult.products;

                            // Send a single message with the original product and all scraped products
                            // Use the same tabId from the start of the analysis
                            if (tabId) {
                                chrome.tabs
                                    .sendMessage(tabId, {
                                        type: "product_group_update",
                                        originalProduct: product,
                                        scrapedProducts: scrapedProducts,
                                        pauseId: pauseId,
                                    })
                                    .catch((e) =>
                                        console.error(
                                            `[PauseShop:AnalysisWorkflow] Error sending product group update to tab ${tabId} for pauseId: ${pauseId}: ${e.message}`,
                                        ),
                                    );
                            } else {
                                console.warn(
                                    `[PauseShop:AnalysisWorkflow] Could not find active tab to send product group update for pauseId: ${pauseId}`,
                                );
                            }
                        } catch (error) {
                            const errorMessage =
                                error instanceof Error
                                    ? error.message
                                    : "Unknown Amazon search/scraping error";
                            console.error(
                                `[PauseShop:AnalysisWorkflow] Amazon search/scraping failed for pauseId: ${pauseId}, product: ${product.name}: ${errorMessage}`,
                            );
                        }
                    })();

                    pendingOperations.push(productProcessingPromise);
                },
                onComplete: async () => {
                    try {
                        await Promise.allSettled(pendingOperations);
                    } catch (error) {
                        console.error(
                            `[PauseShop:AnalysisWorkflow] Error waiting for product processing for pauseId: ${pauseId}: ${error instanceof Error ? error.message : "Unknown error"}`,
                        );
                    }

                    // Use the same tabId from the start of the analysis
                    if (tabId) {
                        chrome.tabs
                            .sendMessage(tabId, {
                                type: "analysis_complete",
                                pauseId: pauseId,
                            })
                            .catch((e) =>
                                console.error(
                                    `[PauseShop:AnalysisWorkflow] Error sending analysis complete to tab ${tabId} for pauseId: ${pauseId}: ${e.message}`,
                                ),
                            );
                    }
                    return { success: true, pauseId: pauseId };
                },
                onError: async (error: Event) => {
                    const errorMessage = `Streaming analysis failed: ${error.type || "Unknown error"}`;
                    console.error(`[PauseShop:AnalysisWorkflow] ${errorMessage} for pauseId: ${pauseId}`);
                    // Use the same tabId from the start of the analysis
                    if (tabId) {
                        chrome.tabs
                            .sendMessage(tabId, {
                                type: "analysis_error",
                                error: errorMessage,
                                pauseId: pauseId,
                            })
                            .catch((e) =>
                                console.error(
                                    `[PauseShop:AnalysisWorkflow] Error sending analysis error to tab ${tabId} for pauseId: ${pauseId}: ${e.message}`,
                                ),
                            );
                    }
                    return {
                        success: false,
                        error: errorMessage,
                        pauseId: pauseId,
                    };
                },
            }, abortSignal);
            return { success: true, pauseId: pauseId };
        } catch (error) {
            // Handle AbortError
            if (error instanceof Error && error.name === 'AbortError') {
                console.warn(`[PauseShop:AnalysisWorkflow] Analysis aborted for pauseId: ${pauseId}`);
                // Use the same tabId from the start of the analysis
                if (tabId) {
                    chrome.tabs
                        .sendMessage(tabId, {
                            type: "analysis_cancelled",
                            pauseId: pauseId,
                        })
                        .catch((e) =>
                            console.error(
                                `[PauseShop:AnalysisWorkflow] Error sending analysis cancelled to tab ${tabId} for pauseId: ${pauseId}: ${e.message}`,
                            ),
                        );
                }
                throw error; // Re-throw to be caught by service worker
            }

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to start streaming analysis";
            console.error(`[PauseShop:AnalysisWorkflow] ${errorMessage} for pauseId: ${pauseId}`);
            // Use the same tabId from the start of the analysis
            if (tabId) {
                chrome.tabs
                    .sendMessage(tabId, {
                        type: "analysis_error",
                        error: errorMessage,
                        pauseId: pauseId,
                    })
                    .catch((e) =>
                        console.error(
                            `[PauseShop:AnalysisWorkflow] Error sending analysis error to tab ${tabId} for pauseId: ${pauseId}: ${e.message}`,
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
        // Re-throw AbortError to be handled by service worker
        if (error instanceof Error && error.name === 'AbortError') {
            throw error;
        }

        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        console.error(
            `[PauseShop:AnalysisWorkflow] Screenshot workflow failed for pauseId: ${pauseId}: ${errorMessage}`,
        );
        return { success: false, error: errorMessage, pauseId };
    }
};
