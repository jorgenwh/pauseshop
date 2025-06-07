/**
 * Screenshot capture functionality for the PauseShop background service worker
 */

// import { downscaleImage } from './image-processor';
// import { log } from './logger';
import type { ScreenshotConfig } from "./types";

/**
 * Captures and downscales a screenshot, returning the image data
 * @param config The screenshot configuration
 * @param windowId The window ID to capture from
 * @returns Promise<string> The downscaled image data URL
 */
export const captureScreenshot = async (
    config: ScreenshotConfig,
    windowId: number,
): Promise<string> => {
    console.log(`Capturing screenshot at ${new Date().toISOString()}`);
    const dataUrl: string = await chrome.tabs.captureVisibleTab(windowId, {
        format: "png",
    });
    
    // log with timestamp that screenshot was captured
    console.log(`Screenshot captured at ${new Date().toISOString()}`);

    // log(config, `Downscaling image to ${config.targetWidth}px width`);
    // const downscaledDataUrl = await downscaleImage(dataUrl, config.targetWidth);

    // return downscaledDataUrl;

    return dataUrl; // Skip downscaling for now while gemini 2.0 flash is free
};
