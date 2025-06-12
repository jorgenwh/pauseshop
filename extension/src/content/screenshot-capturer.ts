import { UIManager } from "../ui/ui-manager";

interface ScreenshotMessage {
    action: "captureScreenshot";
    pauseId: string;
}

export let uiManager: UIManager | null = null;

export const setUIManager = (manager: UIManager): void => {
    uiManager = manager;
};

export const captureScreenshot = async (pauseId: string): Promise<void> => {
    if (!uiManager) {
        console.error("Error: UIManager has not been set!");
        return;
    }

    await uiManager.showSidebar();

    try {
        const message: ScreenshotMessage = {
            action: "captureScreenshot",
            pauseId: pauseId,
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
