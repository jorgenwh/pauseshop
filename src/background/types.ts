/**
 * Types and interfaces for the PauseShop background service worker
 */

export interface ScreenshotMessage {
    type: "captureScreenshot";
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
    type: "toggleSidebarPosition";
    tabId?: number;
}

export interface RegisterPauseMessage {
    type: "registerPause";
    pauseId: string;
}

export interface CancelPauseMessage {
    type: "cancelPause";
    pauseId: string;
}

export interface RetryAnalysisMessage {
    type: "retryAnalysis";
}


export type BackgroundMessage =
    | ScreenshotMessage
    | ToggleSidebarPositionMessage
    | RegisterPauseMessage
    | CancelPauseMessage
    | RetryAnalysisMessage;
