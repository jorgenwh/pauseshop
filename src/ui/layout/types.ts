/**
 * Layout-aware positioning types for PauseShop extension
 */

export interface ContentBounds {
    element: HTMLElement;
    bounds: DOMRect;
    type: ContentType;
}

export type ContentType = 'youtube-shorts' | 'youtube-regular' | 'generic';

export interface PositionStrategy {
    x: number;
    side: 'left' | 'right';
    reason: string; // For debugging and analytics
}

export interface RelativePositionConfig {
    offsetGap: number;        // Gap between content and sidebar
    preferredSide: 'left' | 'right' | 'auto';
    fallbackPosition: { side: 'left' | 'right'; offset: number };
}

export interface LayoutChangeCallback {
    (): void;
}