/**
 * Monitor for layout changes that might affect sidebar positioning
 */

import { LayoutChangeCallback } from './types';

export class LayoutMonitor {
    private resizeObserver: ResizeObserver | null = null;
    private mutationObserver: MutationObserver | null = null;
    private debounceTimer: number | null = null;
    private readonly debounceDelay = 150; // ms

    constructor(private onLayoutChange: LayoutChangeCallback) {
        this.setupObservers();
    }

    /**
     * Set up observers for layout changes
     */
    private setupObservers(): void {
        this.setupResizeObserver();
        this.setupMutationObserver();
    }

    /**
     * Monitor viewport size changes
     */
    private setupResizeObserver(): void {
        if ('ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver(() => {
                this.debounceLayoutUpdate('resize');
            });
            this.resizeObserver.observe(document.body);
        } else {
            // Fallback for older browsers
            window.addEventListener('resize', () => {
                this.debounceLayoutUpdate('resize-fallback');
            });
        }
    }

    /**
     * Monitor DOM changes that might affect content positioning
     */
    private setupMutationObserver(): void {
        this.mutationObserver = new MutationObserver((mutations) => {
            const hasRelevantChanges = mutations.some(mutation => 
                this.isRelevantMutation(mutation)
            );
            
            if (hasRelevantChanges) {
                this.debounceLayoutUpdate('mutation');
            }
        });

        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'data-shorts-container']
        });
    }

    /**
     * Check if a mutation is relevant to our positioning
     */
    private isRelevantMutation(mutation: MutationRecord): boolean {
        const target = mutation.target as Element;

        // Check for changes to video containers
        if (this.isVideoRelatedElement(target)) {
            return true;
        }

        // Check for changes to YouTube-specific containers
        if (this.isYouTubeLayoutElement(target)) {
            return true;
        }

        // Check for attribute changes that might affect layout
        if (mutation.type === 'attributes') {
            const attributeName = mutation.attributeName;
            if (attributeName === 'class' || attributeName === 'style') {
                return this.isLayoutRelevantElement(target);
            }
        }

        // Check for added/removed nodes that might be video containers
        if (mutation.type === 'childList') {
            const addedNodes = Array.from(mutation.addedNodes);
            const removedNodes = Array.from(mutation.removedNodes);
            
            return [...addedNodes, ...removedNodes].some(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    return this.isVideoRelatedElement(node as Element);
                }
                return false;
            });
        }

        return false;
    }

    /**
     * Check if an element is related to video content
     */
    private isVideoRelatedElement(element: Element): boolean {
        const tagName = element.tagName.toLowerCase();
        const className = element.className || '';
        const id = element.id || '';

        // Video elements
        if (tagName === 'video') {
            return true;
        }

        // YouTube-specific selectors
        const youtubeSelectors = [
            'ytd-shorts',
            'ytd-reel-video-renderer',
            'html5-video-player'
        ];

        if (youtubeSelectors.some(selector => 
            tagName.includes(selector) || className.includes(selector)
        )) {
            return true;
        }

        // ID-based selectors
        const relevantIds = [
            'shorts-container',
            'player-container',
            'movie_player'
        ];

        if (relevantIds.some(relevantId => id.includes(relevantId))) {
            return true;
        }

        return false;
    }

    /**
     * Check if an element is part of YouTube's layout system
     */
    private isYouTubeLayoutElement(element: Element): boolean {
        const className = element.className || '';
        const tagName = element.tagName.toLowerCase();

        // YouTube custom elements
        if (tagName.startsWith('ytd-')) {
            return true;
        }

        // YouTube layout classes
        const layoutClasses = [
            'ytd-page-manager',
            'ytd-app',
            'ytd-watch-flexy',
            'ytd-shorts'
        ];

        return layoutClasses.some(layoutClass => className.includes(layoutClass));
    }

    /**
     * Check if an element's changes might affect layout
     */
    private isLayoutRelevantElement(element: Element): boolean {
        return this.isVideoRelatedElement(element) || this.isYouTubeLayoutElement(element);
    }

    /**
     * Debounce layout updates to avoid excessive recalculations
     */
    private debounceLayoutUpdate(reason: string): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = window.setTimeout(() => {
            console.log(`[PauseShop:LayoutMonitor] Layout update triggered by: ${reason}`);
            this.onLayoutChange();
            this.debounceTimer = null;
        }, this.debounceDelay);
    }

    /**
     * Manually trigger a layout update (useful for testing or forced updates)
     */
    public triggerUpdate(reason: string = 'manual'): void {
        this.debounceLayoutUpdate(reason);
    }

    /**
     * Clean up observers
     */
    public cleanup(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }

        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        // Remove fallback resize listener if it was added
        window.removeEventListener('resize', () => {
            this.debounceLayoutUpdate('resize-fallback');
        });
    }

    /**
     * Get current monitoring status
     */
    public getStatus(): any {
        return {
            resizeObserverActive: !!this.resizeObserver,
            mutationObserverActive: !!this.mutationObserver,
            debounceTimerActive: !!this.debounceTimer,
            debounceDelay: this.debounceDelay
        };
    }
}