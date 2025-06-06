/**
 * Types and interfaces for the PauseShop background service worker
 */

export interface ScreenshotConfig {
    targetWidth: number;
    enableLogging: boolean;
    logPrefix: string;
    debugMode: boolean;
    serverUrl: string;
    pauseId?: string;
}

export interface ScreenshotMessage {
    action: "captureScreenshot";
    config: ScreenshotConfig;
    pauseId?: string; // Add pauseId
}

export interface ScreenshotResponse {
    success: boolean;
    error?: string;
    pauseId?: string;
}
