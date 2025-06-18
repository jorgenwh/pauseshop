import { UIManager } from "../ui/ui-manager";
import type { VideoBounds } from "../background/types";

interface ScreenshotMessage {
    type: "captureScreenshot";
    pauseId: string;
    videoBounds?: VideoBounds;
}

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
