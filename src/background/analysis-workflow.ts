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
            throw new DOMException('Operation aborted', 'AbortError');
        }

        // Optionally open frame in new tab for validation
        if (ENABLE_FRAME_VALIDATION) {
            await openFrameInNewTab(imageData);
        }

        // Check again after frame capture
        if (abortSignal?.aborted) {
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
                            `[FreezeFrame:AnalysisWorkflow] Error sending analysis_started to tab ${tabId}: ${e.message}`,
                        ),
                    );
            }

            // Use pauseId directly as the session identifier
            await analyzeImageStreaming(
                imageData, 
                {
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
                                    `[FreezeFrame:AnalysisWorkflow] Failed to construct Amazon search for pauseId: ${pauseId} - skipping`,
                                );
                                return;
                            }

                            // Check if aborted before Amazon search
                            if (abortSignal?.aborted) {
                                return;
                            }

                            const amazonSearchResult =
                                await executeAmazonSearch(amazonSearch, abortSignal);
                            if (!amazonSearchResult) {
                                console.warn(
                                    `[FreezeFrame:AnalysisWorkflow] Failed to construct Amazon search result for pauseId: ${pauseId} - skipping`,
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
                                    `[FreezeFrame:AnalysisWorkflow] Failed to construct Amazon search result for pauseId: ${pauseId} - skipping`,
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
                                            `[FreezeFrame:AnalysisWorkflow] Error sending product group update to tab ${tabId} for pauseId: ${pauseId}: ${e.message}`,
                                        ),
                                    );
                            } else {
                                console.warn(
                                    `[FreezeFrame:AnalysisWorkflow] Could not find active tab to send product group update for pauseId: ${pauseId}`,
                                );
                            }
                        } catch (error) {
                            const errorMessage =
                                error instanceof Error
                                    ? error.message
                                    : "Unknown Amazon search/scraping error";
                            console.error(
                                `[FreezeFrame:AnalysisWorkflow] Amazon search/scraping failed for pauseId: ${pauseId}, product: ${product.name}: ${errorMessage}`,
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
                            `[FreezeFrame:AnalysisWorkflow] Error waiting for product processing for pauseId: ${pauseId}: ${error instanceof Error ? error.message : "Unknown error"}`,
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
                                    `[FreezeFrame:AnalysisWorkflow] Error sending analysis complete to tab ${tabId} for pauseId: ${pauseId}: ${e.message}`,
                                ),
                            );
                    }
                    return { success: true, pauseId: pauseId };
                },
                onError: async (error: Event) => {
                    const errorMessage = `Streaming analysis failed: ${error.type || "Unknown error"}`;
                    console.error(`[FreezeFrame:AnalysisWorkflow] ${errorMessage} for pauseId: ${pauseId}`);
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
                                    `[FreezeFrame:AnalysisWorkflow] Error sending analysis error to tab ${tabId} for pauseId: ${pauseId}: ${e.message}`,
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
                pauseId, 
                abortSignal
            );
            return { success: true, pauseId: pauseId };
        } catch (error) {
            // Handle AbortError
            if (error instanceof Error && error.name === 'AbortError') {
                // Use the same tabId from the start of the analysis
                if (tabId) {
                    browser.tabs
                        .sendMessage(tabId, {
                            type: "analysis_cancelled",
                            pauseId: pauseId,
                        })
                        .catch((e) =>
                            console.error(
                                `[FreezeFrame:AnalysisWorkflow] Error sending analysis cancelled to tab ${tabId} for pauseId: ${pauseId}: ${e.message}`,
                            ),
                        );
                }
                throw error; // Re-throw to be caught by service worker
            }

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to start streaming analysis";
            console.error(`[FreezeFrame:AnalysisWorkflow] ${errorMessage} for pauseId: ${pauseId}`);
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
                            `[FreezeFrame:AnalysisWorkflow] Error sending analysis error to tab ${tabId} for pauseId: ${pauseId}: ${e.message}`,
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
            `[FreezeFrame:AnalysisWorkflow] Frame workflow failed for pauseId: ${pauseId}: ${errorMessage}`,
        );
        return { success: false, error: errorMessage, pauseId };
    }
};
