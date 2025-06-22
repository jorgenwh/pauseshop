import { UIManager } from "../ui/ui-manager";
import type { VideoBounds, ScreenshotMessage } from "../background/types";

export let uiManager: UIManager | null = null;

export const setUIManager = (manager: UIManager): void => {
    uiManager = manager;
};

const getVideoBounds = (): VideoBounds | null => {
    const video = document.querySelector('video') as HTMLVideoElement;
    if (!video) {
        return null;
    }

    const bounds = video.getBoundingClientRect();
    return {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        devicePixelRatio: window.devicePixelRatio,
    };
};

export const captureVideoFrame = async (
    pauseId: string,
    video: HTMLVideoElement,
): Promise<void> => {
    if (!uiManager) {
        console.error("Error: UIManager has not been set!");
        return;
    }

    await uiManager.showSidebar();

    try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/png');

        const message = {
            type: "image_data",
            pauseId: pauseId,
            imageData: imageData,
        };
        const response = await chrome.runtime.sendMessage(message);
        if (!response.success) {
            console.error(
                `[Screenshot Capturer] Failed to process image: ${response?.error || "Unknown error"}`,
            );
            return;
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(
                `[Screenshot Capturer] Failed to capture video frame: ${error.message}`,
            );
        } else {
            console.error(
                "[Screenshot Capturer] Unknown error during video frame capture",
            );
        }
    }
};

export const captureScreenshot = async (pauseId: string): Promise<void> => {
    if (!uiManager) {
        console.error("Error: UIManager has not been set!");
        return;
    }

    await uiManager.showSidebar();

    try {
        const videoBounds = getVideoBounds();
        const message: ScreenshotMessage = {
            type: "captureScreenshot",
            pauseId: pauseId,
            videoBounds: videoBounds || undefined,
        };
        const response = await chrome.runtime.sendMessage(message);
        if (!response.success) {
            console.error(
                `[Screenshot Capturer] Failed to capture screenshot: ${response?.error || "Unknown error"}`,
            );
            return;
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(
                `[Screenshot Capturer] Failed to communicate with background service worker: ${error.message}`,
            );
        } else {
            console.error(
                "[Screenshot Capturer] Unknown error during screenshot capture",
            );
        }
    }
};

export const hideUI = async (): Promise<void> => {
    if (uiManager) {
        await uiManager.hideSidebar();
    }
};

export const cleanupUI = (): void => {
    if (uiManager) {
        uiManager.cleanup();
        uiManager = null;
    }
};

export const initializeScreenshotCapturer = (): void => {};
