/**
 * Types and interfaces for the FreezeFrame background service worker
 */

export interface BackgroundMessageResponse {
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

export interface FrameMessage {
    type: "registerFrame";
    pauseId: string;
    imageData: string;
}

export type BackgroundMessage =
    | ToggleSidebarPositionMessage
    | RegisterPauseMessage
    | CancelPauseMessage
    | RetryAnalysisMessage
    | FrameMessage;
