/**
 * Types and interfaces for the PauseShop background service worker
 */

export interface ScreenshotMessage {
    action: "captureScreenshot";
    pauseId: string;
    videoBounds?: VideoBounds;
}

export interface VideoBounds {
    x: number;
    y: number;
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
    devicePixelRatio: number;
}

export interface ScreenshotResponse {
    success: boolean;
    error?: string;
    pauseId?: string;
}

export interface ToggleSidebarPositionMessage {
    action: "toggleSidebarPosition";
}

export interface RegisterPauseMessage {
    action: "registerPause";
    pauseId: string;
}

export interface CancelPauseMessage {
    action: "cancelPause";
    pauseId: string;
}

export interface RetryAnalysisMessage {
    action: "retryAnalysis";
}


export type BackgroundMessage =
    | ScreenshotMessage
    | ToggleSidebarPositionMessage
    | RegisterPauseMessage
    | CancelPauseMessage
    | RetryAnalysisMessage;
