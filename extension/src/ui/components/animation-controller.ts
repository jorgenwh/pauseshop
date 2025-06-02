/**
 * Animation controller for PauseShop UI components
 * Handles slide-in, pulse, and other animations with proper cleanup
 */

import { AnimationConfig } from '../types';

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
     * Slide left animation for expansion squares (Task 4.4)
     */
    public slideLeft(config: AnimationConfig & { distance: number }): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const keyframes = [
                    { transform: 'translateX(0) scale(0.8)', opacity: '0' },
                    { transform: `translateX(-${config.distance}px) scale(1)`, opacity: '1' }
                ];

                const animationOptions: KeyframeAnimationOptions = {
                    duration: config.duration,
                    easing: config.easing,
                    fill: 'forwards'
                };

                const slideLeftAnimation = this.element.animate(keyframes, animationOptions);
                this.activeAnimations.push(slideLeftAnimation);

                slideLeftAnimation.addEventListener('finish', () => {
                    this.removeFromActiveAnimations(slideLeftAnimation);
                    resolve();
                });

                slideLeftAnimation.addEventListener('cancel', () => {
                    this.removeFromActiveAnimations(slideLeftAnimation);
                    reject(new Error('Slide-left animation was cancelled'));
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Slide right animation for collapsing expansion squares (Task 4.4)
     */
    public slideRight(config: AnimationConfig & { distance: number }): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const keyframes = [
                    { transform: `translateX(-${config.distance}px) scale(1)`, opacity: '1' },
                    { transform: 'translateX(0) scale(0.8)', opacity: '0' }
                ];

                const animationOptions: KeyframeAnimationOptions = {
                    duration: config.duration,
                    easing: config.easing,
                    fill: 'forwards'
                };

                const slideRightAnimation = this.element.animate(keyframes, animationOptions);
                this.activeAnimations.push(slideRightAnimation);

                slideRightAnimation.addEventListener('finish', () => {
                    this.removeFromActiveAnimations(slideRightAnimation);
                    resolve();
                });

                slideRightAnimation.addEventListener('cancel', () => {
                    this.removeFromActiveAnimations(slideRightAnimation);
                    reject(new Error('Slide-right animation was cancelled'));
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Cross-fade between two elements for smooth content transitions
     */
    public crossFade(fromElement: HTMLElement, toElement: HTMLElement, config: AnimationConfig): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const fadeOutPromise = this.fadeElement(fromElement, 1, 0, config.duration / 2);
                const fadeInPromise = new Promise<void>((resolveIn) => {
                    setTimeout(() => {
                        this.fadeElement(toElement, 0, 1, config.duration / 2).then(resolveIn);
                    }, config.duration / 2);
                });

                Promise.all([fadeOutPromise, fadeInPromise]).then(() => resolve()).catch(reject);

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Fade an element from one opacity to another
     */
    public fadeElement(element: HTMLElement, fromOpacity: number, toOpacity: number, duration: number): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const keyframes = [
                    { opacity: fromOpacity.toString() },
                    { opacity: toOpacity.toString() }
                ];

                const animationOptions: KeyframeAnimationOptions = {
                    duration: duration,
                    easing: 'ease-in-out',
                    fill: 'forwards'
                };

                const fadeAnimation = element.animate(keyframes, animationOptions);
                this.activeAnimations.push(fadeAnimation);

                fadeAnimation.addEventListener('finish', () => {
                    this.removeFromActiveAnimations(fadeAnimation);
                    resolve();
                });

                fadeAnimation.addEventListener('cancel', () => {
                    this.removeFromActiveAnimations(fadeAnimation);
                    reject(new Error('Fade animation was cancelled'));
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Transform content with opacity transition
     */
    public transformContent(config: AnimationConfig & { fromOpacity: number, toOpacity: number }): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const keyframes = [
                    { opacity: config.fromOpacity.toString() },
                    { opacity: config.toOpacity.toString() }
                ];

                const animationOptions: KeyframeAnimationOptions = {
                    duration: config.duration,
                    easing: config.easing,
                    fill: 'forwards'
                };

                const transformAnimation = this.element.animate(keyframes, animationOptions);
                this.activeAnimations.push(transformAnimation);

                transformAnimation.addEventListener('finish', () => {
                    this.removeFromActiveAnimations(transformAnimation);
                    resolve();
                });

                transformAnimation.addEventListener('cancel', () => {
                    this.removeFromActiveAnimations(transformAnimation);
                    reject(new Error('Transform animation was cancelled'));
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