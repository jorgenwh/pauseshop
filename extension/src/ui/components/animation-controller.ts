/**
 * Animation controller for PauseShop UI components
 * Handles slide-in, pulse, and other animations with proper cleanup
 */

import { AnimationConfig, LoadingState } from '../types';

export class AnimationController {
    private element: HTMLElement;
    private activeAnimations: Animation[] = [];
    private slideInAnimation: Animation | null = null;
    private pulseAnimation: Animation | null = null;

    constructor(element: HTMLElement) {
        this.element = element;
    }

    /**
     * Slide in animation from the right side of screen
     */
    public slideInFromRight(config: AnimationConfig): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Clear any existing slide animation
                if (this.slideInAnimation) {
                    this.slideInAnimation.cancel();
                }

                const keyframes = [
                    { transform: 'translateX(170px)', opacity: '0' },
                    { transform: 'translateX(0)', opacity: '1' }
                ];

                const animationOptions: KeyframeAnimationOptions = {
                    duration: config.duration,
                    easing: config.easing,
                    fill: 'forwards'
                };

                this.slideInAnimation = this.element.animate(keyframes, animationOptions);
                this.activeAnimations.push(this.slideInAnimation);

                this.slideInAnimation.addEventListener('finish', () => {
                    this.removeFromActiveAnimations(this.slideInAnimation);
                    resolve();
                });

                this.slideInAnimation.addEventListener('cancel', () => {
                    this.removeFromActiveAnimations(this.slideInAnimation);
                    reject(new Error('Slide-in animation was cancelled'));
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Slide out animation to the right side of screen
     */
    public slideOutToRight(config: AnimationConfig): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Stop pulse animation if running
                this.stopPulseAnimation();

                const keyframes = [
                    { transform: 'translateX(0)', opacity: '1' },
                    { transform: 'translateX(170px)', opacity: '0' }
                ];

                const animationOptions: KeyframeAnimationOptions = {
                    duration: config.duration,
                    easing: config.easing,
                    fill: 'forwards'
                };

                const slideOutAnimation = this.element.animate(keyframes, animationOptions);
                this.activeAnimations.push(slideOutAnimation);

                slideOutAnimation.addEventListener('finish', () => {
                    this.removeFromActiveAnimations(slideOutAnimation);
                    resolve();
                });

                slideOutAnimation.addEventListener('cancel', () => {
                    this.removeFromActiveAnimations(slideOutAnimation);
                    reject(new Error('Slide-out animation was cancelled'));
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Slide down animation for product squares
     */
    public slideDown(config: AnimationConfig): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const keyframes = [
                    { transform: 'translateY(-140px)', opacity: '0' },
                    { transform: 'translateY(0)', opacity: '1' }
                ];

                const animationOptions: KeyframeAnimationOptions = {
                    duration: config.duration,
                    easing: config.easing,
                    fill: 'forwards'
                };

                const slideDownAnimation = this.element.animate(keyframes, animationOptions);
                this.activeAnimations.push(slideDownAnimation);

                slideDownAnimation.addEventListener('finish', () => {
                    this.removeFromActiveAnimations(slideDownAnimation);
                    resolve();
                });

                slideDownAnimation.addEventListener('cancel', () => {
                    this.removeFromActiveAnimations(slideDownAnimation);
                    reject(new Error('Slide-down animation was cancelled'));
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Slide up animation for hiding product squares
     */
    public slideUp(config: AnimationConfig): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const keyframes = [
                    { transform: 'translateY(0)', opacity: '1' },
                    { transform: 'translateY(-140px)', opacity: '0' }
                ];

                const animationOptions: KeyframeAnimationOptions = {
                    duration: config.duration,
                    easing: config.easing,
                    fill: 'forwards'
                };

                const slideUpAnimation = this.element.animate(keyframes, animationOptions);
                this.activeAnimations.push(slideUpAnimation);

                slideUpAnimation.addEventListener('finish', () => {
                    this.removeFromActiveAnimations(slideUpAnimation);
                    resolve();
                });

                slideUpAnimation.addEventListener('cancel', () => {
                    this.removeFromActiveAnimations(slideUpAnimation);
                    reject(new Error('Slide-up animation was cancelled'));
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Start pulsing opacity animation for loading state
     */
    public startPulseAnimation(config: AnimationConfig): void {
        try {
            // Clear any existing pulse animation
            if (this.pulseAnimation) {
                this.pulseAnimation.cancel();
            }

            const keyframes = [
                { opacity: '0.7' },
                { opacity: '1' },
                { opacity: '0.7' }
            ];

            const animationOptions: KeyframeAnimationOptions = {
                duration: config.duration,
                easing: config.easing,
                iterations: Infinity
            };

            this.pulseAnimation = this.element.animate(keyframes, animationOptions);
            this.activeAnimations.push(this.pulseAnimation);

        } catch (error) {
            console.warn('PauseShop: Failed to start pulse animation:', error);
        }
    }

    /**
     * Stop the pulsing animation
     */
    public stopPulseAnimation(): void {
        if (this.pulseAnimation) {
            this.pulseAnimation.cancel();
            this.removeFromActiveAnimations(this.pulseAnimation);
            this.pulseAnimation = null;
        }
    }

    /**
     * Stop all active animations and cleanup
     */
    public stopAllAnimations(): void {
        this.activeAnimations.forEach(animation => {
            try {
                animation.cancel();
            } catch (error) {
                // Animation might already be finished or cancelled
            }
        });
        
        this.activeAnimations = [];
        this.slideInAnimation = null;
        this.pulseAnimation = null;
    }

    /**
     * Get current animation state
     */
    public isAnimating(): boolean {
        return this.activeAnimations.length > 0;
    }

    /**
     * Remove animation from active animations list
     */
    private removeFromActiveAnimations(animation: Animation | null): void {
        if (!animation) return;
        
        const index = this.activeAnimations.indexOf(animation);
        if (index > -1) {
            this.activeAnimations.splice(index, 1);
        }
    }

    /**
     * Cleanup all resources
     */
    public cleanup(): void {
        this.stopAllAnimations();
    }
}