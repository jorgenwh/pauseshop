/**
 * Types and interfaces for the PauseShop background service worker
 */

export interface ScreenshotMessage {
    action: "captureScreenshot";
    pauseId: string;
}

export interface ScreenshotResponse {
    success: boolean;
    error?: string;
    pauseId?: string;
}
