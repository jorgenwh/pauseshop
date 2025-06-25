/**
 * PauseShop Background Service Worker
 * Handles frame capture and server communication
 */

import { handleScreenshotAnalysis } from "./analysis-workflow";
import { cancellationRegistry } from "./cancellation-registry";
import type { BackgroundMessage, BackgroundMessageResponse } from "./types";

browser.runtime.onMessage.addListener(
    (
        message: BackgroundMessage,
        sender: Browser.runtime.MessageSender,
        sendResponse: (response: BackgroundMessageResponse) => void,
    ) => {
        // Helper function to safely send response
        const safeSendResponse = (response: BackgroundMessageResponse) => {
            try {
                // Check if the message port is still valid by checking browser.runtime.lastError
                // after attempting to send the response
                sendResponse(response);

                // Check for lastError after sending to detect if the receiving end exists
                if (browser.runtime.lastError) {
                    console.error(
                        `[PauseShop:ServiceWorker] Message port closed, unable to send response: ${browser.runtime.lastError.message}`,
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
            case "registerFrame": {
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
                    browser.tabs.sendMessage(message.tabId, {
                        type: "toggleSidebarPosition",
                    }).catch(error => {
                        console.error(`[PauseShop:ServiceWorker] Error sending toggleSidebarPosition message to tab ${message.tabId}: ${error}`);
                    });
                } else {
                    console.warn("[PauseShop:ServiceWorker] No tabId provided for toggleSidebarPosition message");
                }
                safeSendResponse({ success: true });
                break;
        }

        return true; // Keep message channel open for async response
    },
);

