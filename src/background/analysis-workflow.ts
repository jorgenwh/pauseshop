/**
 * Streaming analysis workflow for processing frames and constructing Amazon search results
 */

import { analyzeImageStreaming } from "./api-client";
import { Product } from "../types/common";
import { constructAmazonSearch } from "../amazon/amazon-search";
import { executeAmazonSearch } from "../amazon/amazon-http-client";
import { scrapeAmazonSearchResult } from "../amazon/amazon-parser";
import { ENABLE_FRAME_VALIDATION, openFrameInNewTab } from "./frame-debugger";
import type { BackgroundMessageResponse } from "./types";

/**
 * Handles the complete frame and streaming analysis workflow
 */
export const handleScreenshotAnalysis = async (
    imageData: string,
    pauseId: string,
    abortSignal?: AbortSignal,
    originTabId?: number,
): Promise<BackgroundMessageResponse> => {
    try {
        // Check if already aborted
        if (abortSignal?.aborted) {
            console.warn(`[PauseShop:AnalysisWorkflow] Already aborted at start for pauseId: ${pauseId}`);
            throw new DOMException('Operation aborted', 'AbortError');
        }

        // Optionally open frame in new tab for validation
        if (ENABLE_FRAME_VALIDATION) {
            await openFrameInNewTab(imageData);
        }

        // Check again after frame capture
        if (abortSignal?.aborted) {
            console.log(`[PauseShop:AnalysisWorkflow] Aborted after frame capture for pauseId: ${pauseId}`);
            throw new DOMException('Operation aborted', 'AbortError');
        }

        // Track all async operations from onProduct callbacks
        const pendingOperations: Promise<void>[] = [];

        // Use the origin tab ID provided by the sender
        const tabId = originTabId;

        try {
            if (tabId) {
                browser.tabs
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
                                browser.tabs
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
                        browser.tabs
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
                        browser.tabs
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
                    browser.tabs
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
                browser.tabs
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
            `[PauseShop:AnalysisWorkflow] Frame workflow failed for pauseId: ${pauseId}: ${errorMessage}`,
        );
        return { success: false, error: errorMessage, pauseId };
    }
};
