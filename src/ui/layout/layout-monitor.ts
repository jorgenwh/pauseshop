/**
 * Monitor for layout changes that might affect sidebar positioning
 */

import { LayoutChangeCallback } from './types';

export class LayoutMonitor {
    private resizeObserver: ResizeObserver | null = null;
    private debounceTimer: number | null = null;
    private readonly debounceDelay = 300; // ms

    constructor(private onLayoutChange: LayoutChangeCallback) {
        this.setupObservers();
    }

    /**
     * Set up observers for layout changes
     * Only monitors window resize - DOM changes are handled by periodic updates
     */
    private setupObservers(): void {
        this.setupResizeObserver();
        // Removed DOM mutation observer - using periodic updates instead
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
     * Debounce layout updates to avoid excessive recalculations
     */
    private debounceLayoutUpdate(reason: string): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = window.setTimeout(() => {
            // Only log in debug mode or for major changes
            if (reason === 'resize' || reason.includes('video')) {
                console.log(`[PauseShop:LayoutMonitor] Layout update triggered by: ${reason}`);
            }
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
            debounceTimerActive: !!this.debounceTimer,
            debounceDelay: this.debounceDelay,
            note: 'DOM mutations handled by periodic updates, not observers'
        };
    }
}