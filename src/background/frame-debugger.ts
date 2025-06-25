/**
 * Frame debugging utilities
 */

// Debug flag to enable frame validation globally
export const ENABLE_FRAME_VALIDATION = false;

/**
 * Opens a frame in a new tab for validation/debugging purposes
 * @param imageData The image data URL to open
 */
export const openFrameInNewTab = async (imageData: string): Promise<void> => {
    try {
        await browser.tabs.create({ url: imageData });
        console.log("[PauseShop:FrameDebugger] Frame opened in new tab for validation");
    } catch (error) {
        console.error("[PauseShop:FrameDebugger] Failed to open frame in new tab:", error);
    }
};
