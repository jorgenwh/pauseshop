/**
 * PauseShop Background Service Worker
 * Handles screenshot capture and server communication
 */

import { handleScreenshotAnalysis } from "./analysis-workflow";
import { cancellationRegistry } from "./cancellation-registry";
import { ENABLE_SCREENSHOT_VALIDATION } from "./screenshot-debug";
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

        switch (message.type) {
        case "captureScreenshot": {
            const windowId =
                    sender.tab?.windowId || chrome.windows.WINDOW_ID_CURRENT;
            const abortSignal = cancellationRegistry.getAbortSignal(
                message.pauseId,
            );
            handleScreenshotAnalysis(
                windowId,
                message.pauseId,
                abortSignal,
                ENABLE_SCREENSHOT_VALIDATION,
                message.videoBounds,
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
            chrome.tabs.query(
                { active: true, currentWindow: true },
                (tabs) => {
                    if (tabs && tabs.length > 0 && tabs[0].id) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            type: "toggleSidebarPosition",
                        });
                    }
                },
            );
            safeSendResponse({ success: true });
            break;
        case "retryAnalysis": {
            const pauseId = `pause-${Date.now()}`;
            const windowId =
                    sender.tab?.windowId || chrome.windows.WINDOW_ID_CURRENT;
            const abortSignal = cancellationRegistry.getAbortSignal(pauseId);
            handleScreenshotAnalysis(
                windowId,
                pauseId,
                abortSignal,
                ENABLE_SCREENSHOT_VALIDATION,
                undefined,
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

