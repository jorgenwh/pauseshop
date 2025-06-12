/**
 * PauseShop Background Service Worker
 * Handles screenshot capture and server communication
 */

import { handleScreenshotAnalysis } from "./analysis-workflow";
import type { ScreenshotMessage, ScreenshotResponse } from "./types";

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
        message: ScreenshotMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response: ScreenshotResponse) => void,
    ) => {
        console.log(
            `[Service Worker] Received screenshot capture request for pauseId: ${message.pauseId || "N/A"}`,
        );
        const windowId =
            sender.tab?.windowId || chrome.windows.WINDOW_ID_CURRENT;

        // Helper function to safely send response
        const safeSendResponse = (response: ScreenshotResponse) => {
            try {
                // Check if the message port is still valid by checking chrome.runtime.lastError
                // after attempting to send the response
                sendResponse(response);

                // Check for lastError after sending to detect if the receiving end exists
                if (chrome.runtime.lastError) {
                    console.error(
                        `[Service Worker] Message port closed, unable to send response: ${chrome.runtime.lastError.message}`,
                    );
                }
            } catch (error) {
                // Catch any synchronous errors when calling sendResponse
                console.error(
                    `[Service Worker] Failed to send response - receiving end may not exist: ${error}`,
                );
            }
        };

        handleScreenshotAnalysis(windowId, message.pauseId)
            .then(safeSendResponse)
            .catch((error) => {
                console.error("Screenshot analysis error:", error);
                safeSendResponse({
                    success: false,
                    error: error.message || "Unknown error",
                    pauseId: message.pauseId,
                });
            });

        return true; // Keep message channel open for async response
    },
);
