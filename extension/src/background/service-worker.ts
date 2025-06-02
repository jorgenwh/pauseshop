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
        handleScreenshotAnalysis(message.config, windowId, message.pauseId).then(sendResponse).catch(error => {
            console.error('Screenshot analysis error:', error);
            sendResponse({ success: false, error: error.message || 'Unknown error', pauseId: message.pauseId });
        });
        return true; // Keep message channel open for async response
    }
});
