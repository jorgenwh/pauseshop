/**
 * PauseShop Background Service Worker
 * Handles frame capture and server communication
 */

import { handleScreenshotAnalysis } from "./analysis-workflow";
import { cancellationRegistry } from "./cancellation-registry";
import type { BackgroundMessage, ScreenshotResponse } from "./types";

chrome.runtime.onMessage.addListener(
    (
        message: BackgroundMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response: ScreenshotResponse) => void,
    ) => {
        // Helper function to safely send response
        const safeSendResponse = (response: ScreenshotResponse) => {
            try {
                // Check if the message port is still valid by checking chrome.runtime.lastError
                // after attempting to send the response
                sendResponse(response);

                // Check for lastError after sending to detect if the receiving end exists
                if (chrome.runtime.lastError) {
                    console.error(
                        `[PauseShop:ServiceWorker] Message port closed, unable to send response: ${chrome.runtime.lastError.message}`,
                    );
                }
            } catch (error) {
                // Catch any synchronous errors when calling sendResponse
                console.error(
                    `[PauseShop:ServiceWorker] Failed to send response - receiving end may not exist: ${error}`,
                );
            }
        };

        switch (message.type) {
            case "image_data": {
                const abortSignal = cancellationRegistry.getAbortSignal(
                    message.pauseId,
                );
                handleScreenshotAnalysis(
                    message.imageData,
                    message.pauseId,
                    abortSignal,
                    sender.tab?.id,
                )
                    .then(safeSendResponse)
                    .catch((error) => {
                        if (error.name === "AbortError") {
                            console.warn(
                                `[PauseShop:ServiceWorker] Analysis cancelled for pauseId: ${message.pauseId}`,
                            );
                            safeSendResponse({
                                success: false,
                                error: "Analysis cancelled",
                                pauseId: message.pauseId,
                            });
                        } else {
                            console.error(
                                `[PauseShop:ServiceWorker] Screenshot analysis error for pauseId: ${message.pauseId}:`,
                                error,
                            );
                            safeSendResponse({
                                success: false,
                                error: error.message || "Unknown error",
                                pauseId: message.pauseId,
                            });
                        }
                    });
                break;
            }
            case "registerPause":
                cancellationRegistry.registerPause(message.pauseId);
                safeSendResponse({ success: true });
                break;
            case "cancelPause":
                cancellationRegistry.cancelPause(message.pauseId);
                safeSendResponse({ success: true });
                break;
            case "toggleSidebarPosition":
                if (message.tabId) {
                    chrome.tabs.sendMessage(message.tabId, {
                        type: "toggleSidebarPosition",
                    }).catch(error => {
                        console.error(`[PauseShop:ServiceWorker] Error sending toggleSidebarPosition message to tab ${message.tabId}: ${error}`);
                    });
                } else {
                    console.warn("[PauseShop:ServiceWorker] No tabId provided for toggleSidebarPosition message");
                }
                safeSendResponse({ success: true });
                break;
            case "retryAnalysis": {
                const pauseId = `pause-${Date.now()}`;
                const abortSignal = cancellationRegistry.getAbortSignal(pauseId);
                // Since we are not taking a frame, we can pass an empty string for the image data.
                handleScreenshotAnalysis(
                    "",
                    pauseId,
                    abortSignal,
                    sender.tab?.id,
                )
                    .then(safeSendResponse)
                    .catch((error) => {
                        if (error.name === "AbortError") {
                            console.warn(
                                `[PauseShop:ServiceWorker] Analysis cancelled for pauseId: ${pauseId}`,
                            );
                            safeSendResponse({
                                success: false,
                                error: "Analysis cancelled",
                                pauseId,
                            });
                        } else {
                            console.error(
                                `[PauseShop:ServiceWorker] Screenshot analysis error for pauseId: ${pauseId}:`,
                                error,
                            );
                            safeSendResponse({
                                success: false,
                                error: error.message || "Unknown error",
                                pauseId,
                            });
                        }
                    });
                break;
            }
        }

        return true; // Keep message channel open for async response
    },
);

