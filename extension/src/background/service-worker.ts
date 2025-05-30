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
        log(message.config, 'Received screenshot capture request');
        const windowId = sender.tab?.windowId || chrome.windows.WINDOW_ID_CURRENT;
        const response = handleScreenshotAnalysis(message.config, windowId).then(sendResponse).catch(error => {
            console.error('Screenshot analysis error:', error);
            sendResponse({ success: false, error: error.message || 'Unknown error' });
        });
        return true; // Keep message channel open for async response
    }
});

console.log('PauseShop service worker loaded');
