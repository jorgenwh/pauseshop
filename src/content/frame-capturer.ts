import { UIManager } from "../ui/ui-manager";

export let uiManager: UIManager | null = null;

export const setUIManager = (manager: UIManager): void => {
    uiManager = manager;
};

export const captureVideoFrame = async (
    pauseId: string,
    video: HTMLVideoElement,
): Promise<void> => {
    if (!uiManager) {
        console.error("Error: UIManager has not been set!");
        return;
    }

    // Update the UI with the current video element that triggered the pause
    uiManager.updateVideoElement(video);

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
            type: "registerFrame",
            pauseId: pauseId,
            imageData: imageData,
        };
        const response = await browser.runtime.sendMessage(message);
        if (!response.success) {
            console.error(
                `[Frame Capturer] Failed to process image: ${response?.error || "Unknown error"}`,
            );
            return;
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(
                `[Frame Capturer] Failed to capture video frame: ${error.message}`,
            );
        } else {
            console.error(
                "[Frame Capturer] Unknown error during video frame capture",
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

export const initializeFrameCapturer = (): void => {};
