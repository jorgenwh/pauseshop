/**
 * PauseShop Background Service Worker
 * Handles screenshot capture and server communication
 */

import { handleScreenshotAnalysis } from "./analysis-workflow";
import { cancellationRegistry } from "./cancellation-registry";
import type { BackgroundMessage, ScreenshotResponse } from "./types";

const activePorts = new Map<number, chrome.runtime.Port>();

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "pauseshop-content-script") {
        if (port.sender?.tab?.id) {
            const tabId = port.sender.tab.id;
            activePorts.set(tabId, port);

            port.onDisconnect.addListener(() => {
                activePorts.delete(tabId);
            });
        }
    }
});

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

        if (message.action === "captureScreenshot") {
            console.log(
                `[PauseShop:ServiceWorker] Received screenshot capture request for pauseId: ${message.pauseId || "N/A"}`,
            );
            const windowId =
                sender.tab?.windowId || chrome.windows.WINDOW_ID_CURRENT;

            // Get the abort signal for this pause
            const abortSignal = cancellationRegistry.getAbortSignal(message.pauseId);
            
            console.log(
                `[PauseShop:ServiceWorker] Starting screenshot analysis for pauseId: ${message.pauseId}, has abort signal: ${!!abortSignal}`,
            );
            
            handleScreenshotAnalysis(windowId, message.pauseId, abortSignal)
                .then(safeSendResponse)
                .catch((error) => {
                    // Handle AbortError separately
                    if (error.name === 'AbortError') {
                        console.warn(`[PauseShop:ServiceWorker] Analysis cancelled due to AbortError for pauseId: ${message.pauseId}`);
                        safeSendResponse({
                            success: false,
                            error: "Analysis cancelled",
                            pauseId: message.pauseId,
                        });
                    } else {
                        console.error(`[PauseShop:ServiceWorker] Screenshot analysis error for pauseId: ${message.pauseId}:`, error);
                        safeSendResponse({
                            success: false,
                            error: error.message || "Unknown error",
                            pauseId: message.pauseId,
                        });
                    }
                });
        } else if (message.action === "registerPause") {
            console.log(
                `[PauseShop:ServiceWorker] Received registerPause message for pauseId: ${message.pauseId}`,
            );
            cancellationRegistry.registerPause(message.pauseId);
            safeSendResponse({ success: true });
        } else if (message.action === "cancelPause") {
            console.log(
                `[PauseShop:ServiceWorker] Received cancelPause message for pauseId: ${message.pauseId}`,
            );
            cancellationRegistry.cancelPause(message.pauseId);
            safeSendResponse({ success: true });
        } else if (message.action === "toggleSidebarPosition") {
            // Find the active tab to send the message to its content script
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs && tabs.length > 0 && tabs[0].id) {
                    const tabId = tabs[0].id;
                    chrome.tabs.sendMessage(tabId, {
                        type: "toggleSidebarPosition", // Changed 'action' to 'type'
                    });
                }
            });
            safeSendResponse({ success: true });
        }

        return true; // Keep message channel open for async response
    },
);
