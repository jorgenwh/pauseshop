/**
 * Streaming analysis workflow for processing screenshots and constructing Amazon search results
 */

import { analyzeImageStreaming } from "./api-client";
import { Product } from "../types/common";
import { constructAmazonSearch } from "../scraper/amazon-search";
import { executeAmazonSearch } from "../scraper/amazon-http-client";
import { scrapeAmazonSearchResult } from "../scraper/amazon-parser";
import { captureScreenshot } from "./screenshot-capturer";
import type { ScreenshotResponse } from "./types";

/**
 * Handles the complete screenshot and streaming analysis workflow
 */
export const handleScreenshotAnalysis = async (
    windowId: number,
    pauseId: string,
): Promise<ScreenshotResponse> => {
    try {
        const imageData = await captureScreenshot(windowId);

        // Track all async operations from onProduct callbacks
        const pendingOperations: Promise<void>[] = [];

        try {
            // Get current tab ID
            const tabId = (
                await chrome.tabs.query({
                    active: true,
                    currentWindow: true,
                })
            )[0]?.id;
            if (tabId) {
                chrome.tabs.sendMessage(
                    tabId, 
                    {
                        type: "analysis_started",
                        pauseId: pauseId,
                    }
                ).catch((e) =>
                    console.error(
                        `[Analysis Workflow] Error sending analysis_started to tab ${tabId}: ${e.message}`,
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
                                const amazonSearch =
                                    constructAmazonSearch(product);
                                if (!amazonSearch) {
                                    console.warn(
                                        "[Analysis Workflow] Failed to construct Amazon search - skipping"
                                    );
                                    return;
                                }

                                const amazonSearchResult =
                                    await executeAmazonSearch(amazonSearch);
                                if (!amazonSearchResult) {
                                    console.warn(
                                        "[Analysis Workflow] Failed to construct Amazon search result - skipping"
                                    );
                                    return;
                                }

                                const amazonScrapedResult =
                                    scrapeAmazonSearchResult(amazonSearchResult);
                                if (amazonScrapedResult === null || amazonScrapedResult.products.length === 0) {
                                    console.warn(
                                        "[Analysis Workflow] Failed to construct Amazon search result - skipping"
                                    );
                                    return;
                                }

                                const scrapedProducts = amazonScrapedResult.products;

                                // Send a single message with the original product and all scraped products
                                const tabId = (
                                    await chrome.tabs.query({
                                        active: true,
                                        currentWindow: true,
                                    })
                                )[0]?.id;
                                if (tabId) {
                                    console.log("tabId:", tabId);
                                    chrome.tabs.sendMessage(
                                        tabId, 
                                        {
                                            type: "product_group_update",
                                            originalProduct: product,
                                            scrapedProducts: scrapedProducts,
                                            pauseId: pauseId,
                                        }
                                    )
                                    .catch((e) =>
                                        console.error(
                                            `[Analysis Workflow] Error sending product group update to tab ${tabId}: ${e.message}`,
                                        ),
                                    );
                                } else {
                                    console.warn(
                                        "[Analysis Workflow] Could not find active tab to send product group update.",
                                    );
                                }
                            } catch (error) {
                                const errorMessage =
                                    error instanceof Error
                                        ? error.message
                                        : "Unknown Amazon search/scraping error";
                                console.error(
                                    `[Analysis Workflow] Amazon search/scraping failed for streamed product: ${errorMessage}`,
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
                                `[Analysis Workflow] Error waiting for product processing: ${error instanceof Error ? error.message : "Unknown error"}`,
                            );
                        }

                        const tabId = (
                            await chrome.tabs.query({
                                active: true,
                                currentWindow: true,
                            })
                        )[0]?.id;
                        if (tabId) {
                            chrome.tabs.sendMessage(
                                tabId, 
                                {
                                    type: "analysis_complete",
                                    pauseId: pauseId,
                                }
                            )
                            .catch((e) =>
                                console.error(
                                    `[Analysis Workflow] Error sending analysis complete to tab ${tabId}: ${e.message}`,
                                ),
                            );
                        }
                        return { success: true, pauseId: pauseId };
                    },
                    onError: async (error: Event) => {
                        const errorMessage = `Streaming analysis failed: ${error.type || "Unknown error"}`;
                        console.error(`[Analysis Workflow] ${errorMessage}`);
                        const tabId = (
                            await chrome.tabs.query({
                                active: true,
                                currentWindow: true,
                            })
                        )[0]?.id;
                        if (tabId) {
                            chrome.tabs.sendMessage(
                                tabId, 
                                {
                                    type: "analysis_error",
                                    error: errorMessage,
                                    pauseId: pauseId,
                                }
                            )
                            .catch((e) =>
                                console.error(
                                    `[Analysis Workflow] Error sending analysis error to tab ${tabId}: ${e.message}`,
                                ),
                            );
                        }
                        return {
                            success: false,
                            error: errorMessage,
                            pauseId: pauseId,
                        };
                    },
                }
            );
            return { success: true, pauseId: pauseId };
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to start streaming analysis";
            console.error(`[Analysis Workflow] ${errorMessage}`);
            const tabId = (
                await chrome.tabs.query({
                    active: true,
                    currentWindow: true,
                })
            )[0]?.id;
            if (tabId) {
                chrome.tabs.sendMessage(
                    tabId, 
                    {
                        type: "analysis_error",
                        error: errorMessage,
                        pauseId: pauseId,
                    }
                )
                .catch((e) =>
                    console.error(
                        `[Analysis Workflow] Error sending analysis error to tab ${tabId}: ${e.message}`,
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
        console.error(
            `[Analysis Workflow] Screenshot workflow failed: ${errorMessage}`,
        );
        return { success: false, error: errorMessage, pauseId };
    }
};
