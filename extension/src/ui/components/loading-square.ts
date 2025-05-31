/**
 * Loading square component for PauseShop extension
 * Displays a semi-transparent square with rounded corners and loading animations
 */

import { AnimationController } from './animation-controller';
import { LoadingState, LoadingSquareConfig } from '../types';

export class LoadingSquare {
    private element: HTMLElement | null = null;
    private animationController: AnimationController | null = null;
    private currentState: LoadingState = LoadingState.HIDDEN;
    private config: LoadingSquareConfig;

    constructor(config: LoadingSquareConfig) {
        this.config = config;
    }

    /**
     * Create the loading square element
     */
    public create(): HTMLElement {
        if (this.element) {
            return this.element;
        }

        this.element = document.createElement('div');
        this.element.className = 'pauseshop-loading-square';
        
        // Apply styling
        this.applyStyles();
        
        // Initialize animation controller
        this.animationController = new AnimationController(this.element);

        return this.element;
    }

    /**
     * Show the loading square with slide-in animation
     */
    public async show(): Promise<void> {
        if (!this.element || !this.animationController) {
            throw new Error('Loading square not created yet');
        }

        if (this.currentState !== LoadingState.HIDDEN) {
            return;
        }

        try {
            this.updateState(LoadingState.SLIDING_IN);
            
            // Start slide-in animation
            await this.animationController.slideInFromRight({
                duration: this.config.animations.slideInDuration,
                easing: 'ease-out'
            });

            this.updateState(LoadingState.LOADING);
            
            // Start pulse animation
            this.animationController.startPulseAnimation({
                duration: this.config.animations.pulseDuration,
                easing: 'ease-in-out'
            });

        } catch (error) {
            console.warn('PauseShop: Failed to show loading square:', error);
            // Fallback to instant show
            this.element.style.transform = 'translateX(0)';
            this.element.style.opacity = '1';
            this.updateState(LoadingState.LOADING);
        }
    }

    /**
     * Hide the loading square with slide-out animation
     */
    public async hide(): Promise<void> {
        if (!this.element || !this.animationController) {
            return;
        }

        if (this.currentState === LoadingState.HIDDEN) {
            return;
        }

        try {
            this.updateState(LoadingState.SLIDING_OUT);
            
            // Start slide-out animation
            await this.animationController.slideOutToRight({
                duration: this.config.animations.slideOutDuration,
                easing: 'ease-in'
            });

            this.updateState(LoadingState.HIDDEN);

        } catch (error) {
            console.warn('PauseShop: Failed to hide loading square:', error);
            // Fallback to instant hide
            this.element.style.transform = 'translateX(160px)';
            this.element.style.opacity = '0';
            this.updateState(LoadingState.HIDDEN);
        }
    }

    /**
     * Update the loading state
     */
    public updateState(newState: LoadingState): void {
        const previousState = this.currentState;
        this.currentState = newState;

        // Update element class for CSS state styling
        if (this.element) {
            this.element.setAttribute('data-state', newState);
        }

        // Handle state-specific logic
        switch (newState) {
            case LoadingState.PROCESSING:
                // Could add different animation or styling for processing state
                break;
            case LoadingState.HIDDEN:
                if (this.animationController) {
                    this.animationController.stopAllAnimations();
                }
                break;
        }
    }

    /**
     * Get current state
     */
    public getCurrentState(): LoadingState {
        return this.currentState;
    }

    /**
     * Check if the square is visible
     */
    public isVisible(): boolean {
        return this.currentState !== LoadingState.HIDDEN;
    }

    /**
     * Check if animations are running
     */
    public isAnimating(): boolean {
        return this.animationController?.isAnimating() ?? false;
    }

    /**
     * Apply CSS styles to the element
     */
    private applyStyles(): void {
        if (!this.element) return;

        const styles = {
            width: `${this.config.size}px`,
            height: `${this.config.size}px`,
            background: this.config.backgroundColor,
            borderRadius: `${this.config.borderRadius}px`,
            position: 'fixed' as const,
            top: `${this.config.position.top}px`,
            right: `${this.config.position.right}px`,
            zIndex: '999999',
            transform: 'translateX(240px)', // Start off-screen
            opacity: '0',
            pointerEvents: 'none' as const,
            userSelect: 'none' as const,
            boxSizing: 'border-box' as const,
            // Add subtle shadow for better visibility
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            // Ensure smooth transitions
            transition: 'none', // We'll handle animations programmatically
        };

        Object.assign(this.element.style, styles);
    }

    /**
     * Get the DOM element
     */
    public getElement(): HTMLElement | null {
        return this.element;
    }

    /**
     * Cleanup resources
     */
    public cleanup(): void {
        if (this.animationController) {
            this.animationController.cleanup();
            this.animationController = null;
        }

        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }

        this.element = null;
        this.currentState = LoadingState.HIDDEN;
    }
}