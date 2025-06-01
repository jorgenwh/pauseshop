/**
 * Product expansion component for PauseShop extension
 * Manages horizontal expansion of product squares showing all category products
 */

import { ExpansionSquare } from './expansion-square';
import { ProductExpansionConfig, ExpansionState, ExpansionSquareConfig } from '../types';

export class ProductExpansion {
    private container: HTMLElement | null = null;
    private expansionSquares: ExpansionSquare[] = [];
    private config: ProductExpansionConfig;
    private currentState: ExpansionState = ExpansionState.HIDDEN;

    constructor(config: ProductExpansionConfig) {
        this.config = config;
    }

    /**
     * Create the expansion container with expansion squares
     */
    public async create(): Promise<HTMLElement> {
        if (this.container) {
            this.cleanup(); // Clean up existing expansion
        }

        // Create container element
        this.container = document.createElement('div');
        this.container.className = 'pauseshop-product-expansion';
        this.applyContainerStyles();

        // Create expansion squares for all products (including first one for complete Amazon access)
        this.createExpansionSquares();

        return this.container;
    }

    /**
     * Show the expansion with staggered slide-left animations
     */
    public async show(): Promise<void> {
        if (!this.container || this.expansionSquares.length === 0) {
            return;
        }

        if (this.currentState !== ExpansionState.HIDDEN) {
            return;
        }

        try {
            this.updateState(ExpansionState.EXPANDING);

            // Show squares with staggered timing
            const animationPromises: Promise<void>[] = [];
            
            this.expansionSquares.forEach((square, index) => {
                const delay = index * 50; // 50ms stagger
                animationPromises.push(square.show(delay));
            });

            // Wait for all animations to complete
            await Promise.all(animationPromises);
            
            this.updateState(ExpansionState.EXPANDED);

        } catch (error) {
            console.warn('PauseShop: Failed to show product expansion:', error);
            // Ensure all squares are visible even if animation fails
            this.expansionSquares.forEach(square => {
                const element = square.getElement();
                if (element) {
                    element.style.transform = 'translateX(0)';
                    element.style.opacity = '1';
                }
            });
            this.updateState(ExpansionState.EXPANDED);
        }
    }

    /**
     * Hide the expansion with slide-right animations
     */
    public async hide(): Promise<void> {
        if (!this.container || this.expansionSquares.length === 0) {
            return;
        }

        if (this.currentState === ExpansionState.HIDDEN) {
            return;
        }

        try {
            this.updateState(ExpansionState.COLLAPSING);

            // Hide all squares simultaneously (reverse animation)
            const hidePromises = this.expansionSquares.map(square => square.hide());
            await Promise.all(hidePromises);
            
            this.updateState(ExpansionState.HIDDEN);

        } catch (error) {
            console.warn('PauseShop: Failed to hide product expansion:', error);
            // Fallback to instant hide
            this.expansionSquares.forEach(square => {
                const element = square.getElement();
                if (element) {
                    element.style.transform = 'translateX(100px)';
                    element.style.opacity = '0';
                }
            });
            this.updateState(ExpansionState.HIDDEN);
        }
    }

    /**
     * Update the expansion state
     */
    public updateState(newState: ExpansionState): void {
        this.currentState = newState;

        // Update container class for CSS state styling
        if (this.container) {
            this.container.setAttribute('data-state', newState);
        }
    }

    /**
     * Get current state
     */
    public getCurrentState(): ExpansionState {
        return this.currentState;
    }

    /**
     * Check if the expansion is visible
     */
    public isVisible(): boolean {
        return this.currentState !== ExpansionState.HIDDEN;
    }

    /**
     * Check if any animations are running
     */
    public isAnimating(): boolean {
        return this.currentState === ExpansionState.EXPANDING || 
               this.currentState === ExpansionState.COLLAPSING ||
               this.expansionSquares.some(square => square.isAnimating());
    }

    /**
     * Get all expansion squares
     */
    public getExpansionSquares(): ExpansionSquare[] {
        return [...this.expansionSquares];
    }

    /**
     * Get number of expansion squares
     */
    public getSquareCount(): number {
        return this.expansionSquares.length;
    }

    /**
     * Create expansion squares for each product (including all products)
     */
    private createExpansionSquares(): void {
        // Include all products in expansion squares for complete Amazon access
        const productsToExpand = this.config.products;
        
        productsToExpand.forEach((product, index) => {
            const squareConfig: ExpansionSquareConfig = {
                product: product,
                position: this.calculateSquarePosition(index),
                size: this.config.squareSize, // 85px for expansion squares
                borderRadius: Math.round(this.config.squareSize * 0.16), // Proportional border radius
                backgroundColor: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(168, 85, 247, 0.9), rgba(236, 72, 153, 0.85))',
                index: index,
                animations: {
                    slideLeftDuration: this.config.animations.slideLeftDuration,
                    thumbnailFadeDuration: this.config.animations.fadeInDuration
                }
            };

            const square = new ExpansionSquare(squareConfig);
            const squareElement = square.create();
            
            this.expansionSquares.push(square);
            this.container!.appendChild(squareElement);
        });
    }

    /**
     * Calculate position for an expansion square at given index
     */
    private calculateSquarePosition(index: number): { top: number; right: number } {
        // Position squares to the left of the parent square
        const leftOffset = (index + 1) * (this.config.squareSize + this.config.spacing);
        
        return {
            top: this.config.startPosition.top,
            right: this.config.startPosition.right + leftOffset
        };
    }

    /**
     * Apply styles to the container element
     */
    private applyContainerStyles(): void {
        if (!this.container) return;

        const containerStyles = {
            position: 'fixed' as const,
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none' as const,
            zIndex: '999997', // Below product squares but above everything else
            userSelect: 'none' as const
        };

        Object.assign(this.container.style, containerStyles);
    }

    /**
     * Get the DOM container element
     */
    public getContainer(): HTMLElement | null {
        return this.container;
    }

    /**
     * Cleanup resources
     */
    public cleanup(): void {
        // Cleanup all expansion squares
        this.expansionSquares.forEach(square => {
            square.cleanup();
        });
        this.expansionSquares = [];

        // Remove container from DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;

        this.currentState = ExpansionState.HIDDEN;
    }
}