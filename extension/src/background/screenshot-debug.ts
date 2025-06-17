/**
 * Screenshot debugging utilities
 */

// Debug flag to enable screenshot validation globally
// Note: In service worker context, we don't have access to window or process.env at runtime
// For now, set this to true to enable validation, or false to disable
export const ENABLE_SCREENSHOT_VALIDATION = true;

/**
 * Opens a screenshot in a new tab for validation/debugging purposes
 * @param imageData The image data URL to open
 */
export const openScreenshotForValidation = async (imageData: string): Promise<void> => {
    try {
        // Directly call chrome.tabs.create instead of sending a message to ourselves
        await chrome.tabs.create({ url: imageData });
        console.log("[PauseShop:ScreenshotDebug] Screenshot opened in new tab for validation");
    } catch (error) {
        console.error("[PauseShop:ScreenshotDebug] Failed to open screenshot in new tab:", error);
    }
};

/**
 * Captures a screenshot and immediately opens it in a new tab for validation
 * @param windowId The window ID to capture
 */
export const captureAndValidateScreenshot = async (windowId: number): Promise<string> => {
    const { captureScreenshot } = await import("./screenshot-capturer");
    const imageData = await captureScreenshot(windowId);
    
    // Open in new tab for validation
    await openScreenshotForValidation(imageData);
    
    return imageData;
};