interface ScreenshotMessage {
    action: "captureScreenshot";
    pauseId: string;
}

export const captureScreenshot = async (
    pauseId: string,
): Promise<void> => {
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
};

export const cleanupUI = (): void => {
};

export const initializeScreenshotCapturer = (): void => {};
