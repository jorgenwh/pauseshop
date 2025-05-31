/**
 * UI-specific type definitions for PauseShop extension
 */

export enum LoadingState {
    HIDDEN = 'hidden',
    SLIDING_IN = 'sliding-in',
    LOADING = 'loading',
    PROCESSING = 'processing',
    SLIDING_OUT = 'sliding-out'
}

export interface UIConfig {
    enableLogging: boolean;
    logPrefix: string;
    containerClassName: string;
    zIndex: number;
}

export interface LoadingSquareConfig {
    size: number;
    borderRadius: number;
    backgroundColor: string;
    position: {
        top: number;
        right: number;
    };
    animations: {
        slideInDuration: number;
        slideOutDuration: number;
        pulseDuration: number;
    };
}

export interface AnimationConfig {
    duration: number;
    easing: string;
    iterations?: number;
}

export interface UIManagerEvents {
    onShow?: () => void;
    onHide?: () => void;
    onStateChange?: (state: LoadingState) => void;
}