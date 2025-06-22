/**
 * Debug utilities for the PauseShop background service worker
 */

/**
 * Debug function: Opens frame in new tab (kept for debugging purposes)
 * @param imageData The image data URL to open
 */
export const openScreenshotInNewTab = async (
    imageData: string,
): Promise<void> => {
    await chrome.tabs.create({ url: imageData });
};
