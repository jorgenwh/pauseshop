/**
 * Product grid component for PauseShop extension
 * Manages vertical stack of product squares with staggered animations
 */

import { ProductSquare } from './product-square';
import { ProductDisplayData, ProductGridConfig, ProductSquareConfig, ProductDisplayState } from '../types';

export class ProductGrid {
    private container: HTMLElement | null = null;
    private productSquares: ProductSquare[] = [];
    private config: ProductGridConfig;
    private currentState: ProductDisplayState = ProductDisplayState.HIDDEN;
    private expandedSquareIndex: number | null = null; // Track expanded square for Task 4.4

    constructor(config: ProductGridConfig) {
        this.config = config;
    }

    /**
     * Create the product grid with given product data
     */
    public async create(productData: ProductDisplayData[]): Promise<HTMLElement> {
        if (this.container) {
            this.cleanup(); // Clean up existing grid
        }

        // Limit to maximum products
        const limitedData = productData.slice(0, this.config.maxProducts);

        // Create container element
        this.container = document.createElement('div');
        this.container.className = 'pauseshop-product-grid';
        this.applyContainerStyles();

        // Create product squares
        this.createProductSquares(limitedData);

        return this.container;
    }

    /**
     * Show the product grid with staggered animations
     */
    public async show(): Promise<void> {
        if (!this.container || this.productSquares.length === 0) {
            throw new Error('Product grid not created yet');
        }

        if (this.currentState !== ProductDisplayState.HIDDEN) {
            return;
        }

        try {
            this.updateState(ProductDisplayState.SLIDING_OUT);

            // Show squares with staggered timing
            const animationPromises: Promise<void>[] = [];
            
            this.productSquares.forEach((square, index) => {
                const delay = index * this.config.animationDelayMs;
                animationPromises.push(square.show(delay));
            });

            // Wait for all animations to complete
            await Promise.all(animationPromises);
            
            this.updateState(ProductDisplayState.DISPLAYED);

        } catch (error) {
            console.warn('PauseShop: Failed to show product grid:', error);
            // Ensure all squares are visible even if animation fails
            this.productSquares.forEach(square => {
                const element = square.getElement();
                if (element) {
                    element.style.transform = 'translateY(0)';
                    element.style.opacity = '1';
                }
            });
            this.updateState(ProductDisplayState.DISPLAYED);
        }
    }

    /**
     * Hide the product grid
     */
    public async hide(): Promise<void> {
        if (!this.container || this.productSquares.length === 0) {
            return;
        }

        if (this.currentState === ProductDisplayState.HIDDEN) {
            return;
        }

        try {
            // Collapse all expansions before hiding (Task 4.4)
            await this.collapseAllExpansions();

            // Hide all squares simultaneously
            const hidePromises = this.productSquares.map(square => square.hide());
            await Promise.all(hidePromises);
            
            this.updateState(ProductDisplayState.HIDDEN);

        } catch (error) {
            console.warn('PauseShop: Failed to hide product grid:', error);
            // Fallback to instant hide
            this.productSquares.forEach(square => {
                const element = square.getElement();
                if (element) {
                    element.style.transform = 'translateY(-140px)';
                    element.style.opacity = '0';
                }
            });
            this.updateState(ProductDisplayState.HIDDEN);
        }
    }

    /**
     * Update the display state
     */
    public updateState(newState: ProductDisplayState): void {
        this.currentState = newState;

        // Update container class for CSS state styling
        if (this.container) {
            this.container.setAttribute('data-state', newState);
        }
    }

    /**
     * Get current state
     */
    public getCurrentState(): ProductDisplayState {
        return this.currentState;
    }

    /**
     * Check if the grid is visible
     */
    public isVisible(): boolean {
        return this.currentState !== ProductDisplayState.HIDDEN;
    }

    /**
     * Check if any animations are running
     */
    public isAnimating(): boolean {
        return this.productSquares.some(square => square.isAnimating());
    }

    /**
     * Get all product squares
     */
    public getProductSquares(): ProductSquare[] {
        return [...this.productSquares];
    }

    /**
     * Get product square by index
     */
    public getProductSquare(index: number): ProductSquare | null {
        return this.productSquares[index] || null;
    }

    /**
     * Get number of products in grid
     */
    public getProductCount(): number {
        return this.productSquares.length;
    }

    /**
     * Create product squares for each product data item
     * Enhanced for Task 4.4: Pass all products and expansion coordination
     */
    private createProductSquares(productData: ProductDisplayData[]): void {
        productData.forEach((data, index) => {
            const squareConfig: ProductSquareConfig = {
                size: this.config.squareSize,
                borderRadius: this.config.borderRadius,
                backgroundColor: this.config.backgroundColor,
                position: this.calculateSquarePosition(index),
                thumbnailUrl: data.thumbnailUrl,
                productData: data.allProducts.length > 0 ? data.allProducts[0] : null, // First product for thumbnail
                allProducts: data.allProducts, // All products for expansion
                category: data.category,
                animations: {
                    slideDownDuration: 200,
                    thumbnailFadeDuration: 300
                },
                onExpansionRequest: () => this.handleExpansionRequest(index) // Expansion coordination
            };

            const square = new ProductSquare(squareConfig);
            const squareElement = square.create();
            
            this.productSquares.push(square);
            this.container!.appendChild(squareElement);
        });
    }

    /**
     * Calculate position for a square at given index
     */
    private calculateSquarePosition(index: number): { top: number; right: number } {
        return {
            top: this.config.startPosition.top + (index * (this.config.squareSize + this.config.spacing)),
            right: this.config.startPosition.right
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
            zIndex: '999998', // Below individual squares
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
     * Handle expansion request from a product square (Task 4.4)
     */
    private async handleExpansionRequest(requestingIndex: number): Promise<void> {
        // Collapse any currently expanded square
        if (this.expandedSquareIndex !== null && this.expandedSquareIndex !== requestingIndex) {
            const currentlyExpanded = this.productSquares[this.expandedSquareIndex];
            if (currentlyExpanded && typeof (currentlyExpanded as unknown as { collapseExpansion?: () => Promise<void> }).collapseExpansion === 'function') {
                await (currentlyExpanded as unknown as { collapseExpansion: () => Promise<void> }).collapseExpansion();
            }
        }
        
        this.expandedSquareIndex = requestingIndex;
    }

    /**
     * Collapse all expansions (Task 4.4)
     */
    public async collapseAllExpansions(): Promise<void> {
        if (this.expandedSquareIndex !== null) {
            const square = this.productSquares[this.expandedSquareIndex];
            if (square && typeof (square as unknown as { collapseExpansion?: () => Promise<void> }).collapseExpansion === 'function') {
                await (square as unknown as { collapseExpansion: () => Promise<void> }).collapseExpansion();
            }
            this.expandedSquareIndex = null;
        }
    }

    /**
     * Cleanup resources
     */
    public cleanup(): void {
        // Cleanup all product squares
        this.productSquares.forEach(square => {
            square.cleanup();
        });
        this.productSquares = [];

        // Remove container from DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;

        this.currentState = ProductDisplayState.HIDDEN;
        this.expandedSquareIndex = null; // Reset expansion tracking
    }
}