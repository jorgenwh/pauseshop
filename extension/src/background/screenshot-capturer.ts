/**
 * Screenshot capture functionality for the PauseShop background service worker
 */

import type { VideoBounds } from "./types";

export const captureScreenshot = async (windowId: number): Promise<string> => {
    const dataUrl: string = await chrome.tabs.captureVisibleTab(windowId, {
        format: "png",
    });
    return dataUrl;
};

export const captureAndCropScreenshot = async (windowId: number, videoBounds?: VideoBounds): Promise<string> => {
    const fullScreenshot = await captureScreenshot(windowId);

    if (!videoBounds) {
        console.log("[PauseShop:ScreenshotCapturer] No video bounds provided, returning full screenshot");
        return fullScreenshot;
    }

    return cropScreenshot(fullScreenshot, videoBounds);
};

const cropScreenshot = async (dataUrl: string, bounds: VideoBounds): Promise<string> => {
    try {
        // Convert data URL to ImageBitmap (available in service workers)
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);

        // Create OffscreenCanvas for cropping
        const canvas = new OffscreenCanvas(bounds.width, bounds.height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        // Account for device pixel ratio and scroll position
        const scaledX = (bounds.x + bounds.scrollX) * bounds.devicePixelRatio;
        const scaledY = (bounds.y + bounds.scrollY) * bounds.devicePixelRatio;
        const scaledWidth = bounds.width * bounds.devicePixelRatio;
        const scaledHeight = bounds.height * bounds.devicePixelRatio;

        console.log(`[PauseShop:ScreenshotCapturer] Cropping screenshot - bounds: ${bounds.x},${bounds.y} ${bounds.width}x${bounds.height}, scaled: ${scaledX},${scaledY} ${scaledWidth}x${scaledHeight}`);

        // Draw the cropped portion of the image
        ctx.drawImage(
            imageBitmap,
            scaledX, scaledY, scaledWidth, scaledHeight, // source rectangle
            0, 0, bounds.width, bounds.height // destination rectangle
        );

        // Convert to blob and then to data URL
        const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });

        // Convert blob to data URL
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
            reader.readAsDataURL(croppedBlob);
        });

    } catch (error) {
        console.error('[PauseShop:ScreenshotCapturer] Error cropping screenshot:', error);
        throw error;
    }
};
