/**
 * PauseShop Background Service Worker
 * Handles screenshot capture and server communication
 */

import { handleScreenshotAnalysis } from './analysis-workflow';
import { log } from './logger';
import type { ScreenshotMessage, ScreenshotResponse } from './types';

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((
    message: ScreenshotMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: ScreenshotResponse) => void
) => {
    if (message.action === 'captureScreenshot') {
        log(message.config, `Received screenshot capture request for pauseId: ${message.pauseId || 'N/A'}`);
        const windowId = sender.tab?.windowId || chrome.windows.WINDOW_ID_CURRENT;
        
        // Helper function to safely send response
        const safeSendResponse = (response: ScreenshotResponse) => {
            try {
                // Check if the message port is still valid by checking chrome.runtime.lastError
                // after attempting to send the response
                sendResponse(response);
                
                // Check for lastError after sending to detect if the receiving end exists
                if (chrome.runtime.lastError) {
                    log(message.config, `Message port closed, unable to send response: ${chrome.runtime.lastError.message}`);
                }
            } catch (error) {
                // Catch any synchronous errors when calling sendResponse
                log(message.config, `Failed to send response - receiving end may not exist: ${error}`);
            }
        };
        
        handleScreenshotAnalysis(message.config, windowId, message.pauseId)
            .then(safeSendResponse)
            .catch(error => {
                console.error('Screenshot analysis error:', error);
                safeSendResponse({ success: false, error: error.message || 'Unknown error', pauseId: message.pauseId });
            });
        return true; // Keep message channel open for async response
    }
});
