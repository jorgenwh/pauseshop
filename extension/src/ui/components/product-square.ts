/**
 * Product square component for PauseShop extension
 * Displays individual product thumbnails in a square format
 * Enhanced for Task 4.4: Horizontal expansion functionality
 */

import { AnimationController } from './animation-controller';
import { ProductExpansion } from './product-expansion';
import { ProductDisplayState, ProductSquareConfig, ProductExpansionConfig } from '../types';

export class ProductSquare {
    private element: HTMLElement | null = null;
    private thumbnailElement: HTMLImageElement | null = null;
    private animationController: AnimationController | null = null;
    private currentState: ProductDisplayState = ProductDisplayState.HIDDEN;
    private config: ProductSquareConfig;
    
    // Task 4.4: Expansion functionality
    private expansion: ProductExpansion | null = null;
    private isExpanded: boolean = false;

    constructor(config: ProductSquareConfig) {
        this.config = config;
    }

    /**
     * Create the product square element
     * Enhanced for Task 4.4: Add click handling for expansion
     */
    public create(): HTMLElement {
        if (this.element) {
            return this.element;
        }

        this.element = document.createElement('div');
        this.element.className = 'pauseshop-product-square';
        
        // Create thumbnail container
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.className = 'pauseshop-thumbnail-container';
        
        // Create thumbnail image or fallback
        if (this.config.thumbnailUrl) {
            this.createThumbnailImage(thumbnailContainer);
        } else {
            this.createFallbackDisplay(thumbnailContainer);
        }
        
        this.element.appendChild(thumbnailContainer);
        
        // Apply styling
        this.applyStyles();
        
        // Initialize animation controller
        this.animationController = new AnimationController(this.element);
        
        // Task 4.4: Add click handling if multiple products available
        if (this.config.allProducts.length > 1) {
            this.bindClickHandler();
        }

        return this.element;
    }

    /**
     * Show the product square with slide-down animation
     */
    public async show(delay: number = 0): Promise<void> {
        if (!this.element || !this.animationController) {
            throw new Error('Product square not created yet');
        }

        if (this.currentState !== ProductDisplayState.HIDDEN) {
            return;
        }

        try {
            // Wait for delay if specified
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            this.updateState(ProductDisplayState.SLIDING_OUT);
            
            // Start slide-down animation
            await this.animationController.slideDown({
                duration: this.config.animations.slideDownDuration,
                easing: 'ease-out'
            });

            this.updateState(ProductDisplayState.DISPLAYED);
            
            // Fade in thumbnail if it exists
            if (this.thumbnailElement) {
                this.fadeInThumbnail();
            }

        } catch (error) {
            console.warn('PauseShop: Failed to show product square:', error);
            // Fallback to instant show
            this.element.style.transform = 'translateY(0)';
            this.element.style.opacity = '1';
            this.updateState(ProductDisplayState.DISPLAYED);
        }
    }

    /**
     * Hide the product square
     */
    public async hide(): Promise<void> {
        if (!this.element || !this.animationController) {
            return;
        }

        if (this.currentState === ProductDisplayState.HIDDEN) {
            return;
        }

        try {
            // Fade out and slide up
            await this.animationController.slideUp({
                duration: 200,
                easing: 'ease-in'
            });

            this.updateState(ProductDisplayState.HIDDEN);

        } catch (error) {
            console.warn('PauseShop: Failed to hide product square:', error);
            // Fallback to instant hide
            this.element.style.transform = 'translateY(-140px)';
            this.element.style.opacity = '0';
            this.updateState(ProductDisplayState.HIDDEN);
        }
    }

    /**
     * Update the display state
     */
    public updateState(newState: ProductDisplayState): void {
        this.currentState = newState;

        // Update element class for CSS state styling
        if (this.element) {
            this.element.setAttribute('data-state', newState);
        }
    }

    /**
     * Get current state
     */
    public getCurrentState(): ProductDisplayState {
        return this.currentState;
    }

    /**
     * Check if the square is visible
     */
    public isVisible(): boolean {
        return this.currentState !== ProductDisplayState.HIDDEN;
    }

    /**
     * Check if animations are running
     */
    public isAnimating(): boolean {
        return this.animationController?.isAnimating() ?? false;
    }

    /**
     * Get the product data associated with this square
     */
    public getProductData() {
        return this.config.productData;
    }

    /**
     * Get the product category
     */
    public getCategory() {
        return this.config.category;
    }

    /**
     * Check if the square is currently expanded (Task 4.4)
     */
    public getIsExpanded(): boolean {
        return this.isExpanded;
    }

    /**
     * Bind click handler for expansion functionality (Task 4.4)
     */
    private bindClickHandler(): void {
        if (!this.element) return;

        this.element.addEventListener('click', this.handleClick.bind(this));
        
        // Add hover effect for interactive squares
        this.element.addEventListener('mouseenter', () => {
            if (this.element && !this.isExpanded) {
                this.element.style.transform += ' scale(1.02)';
                this.element.style.transition = 'transform 0.1s ease';
            }
        });

        this.element.addEventListener('mouseleave', () => {
            if (this.element && !this.isExpanded) {
                this.element.style.transform = this.element.style.transform.replace(' scale(1.02)', '');
            }
        });
    }

    /**
     * Handle click event for expansion toggle (Task 4.4)
     */
    private async handleClick(event: Event): Promise<void> {
        event.preventDefault();
        event.stopPropagation();
        
        if (this.isExpanded) {
            await this.collapseExpansion();
        } else {
            await this.expandHorizontally();
        }
    }

    /**
     * Expand horizontally showing all products (Task 4.4)
     */
    private async expandHorizontally(): Promise<void> {
        if (this.config.allProducts.length <= 1) {
            return; // No additional products to show
        }

        try {
            // Notify parent grid to collapse other expansions
            if (this.config.onExpansionRequest) {
                await this.config.onExpansionRequest();
            }

            // Create expansion component
            const expansionConfig: ProductExpansionConfig = {
                parentSquare: this.element!,
                products: this.config.allProducts, // All products including first one
                category: this.config.category,
                startPosition: this.config.position,
                expansionDirection: 'left',
                squareSize: 126, // Same size as main square for consistency
                spacing: 14, // Match vertical spacing between main squares
                animations: {
                    slideLeftDuration: 200,
                    fadeInDuration: 300
                }
            };

            this.expansion = new ProductExpansion(expansionConfig);
            const expansionElement = await this.expansion.create();
            
            // Add to document body (same level as UI container)
            document.body.appendChild(expansionElement);
            
            await this.expansion.show();
            this.isExpanded = true;

        } catch (error) {
            console.warn('PauseShop: Failed to expand product square:', error);
        }
    }

    /**
     * Collapse the horizontal expansion (Task 4.4)
     */
    public async collapseExpansion(): Promise<void> {
        if (!this.expansion || !this.isExpanded) {
            return;
        }

        try {
            await this.expansion.hide();
            this.expansion.cleanup();
            this.expansion = null;
            this.isExpanded = false;

        } catch (error) {
            console.warn('PauseShop: Failed to collapse expansion:', error);
            // Force cleanup on error
            if (this.expansion) {
                this.expansion.cleanup();
                this.expansion = null;
            }
            this.isExpanded = false;
        }
    }

    /**
     * Create thumbnail image element
     */
    private createThumbnailImage(container: HTMLElement): void {
        this.thumbnailElement = document.createElement('img');
        this.thumbnailElement.className = 'pauseshop-thumbnail-image';
        this.thumbnailElement.src = this.config.thumbnailUrl!;
        this.thumbnailElement.alt = 'Product thumbnail';
        
        // Handle image load/error
        this.thumbnailElement.onload = () => {
            if (this.thumbnailElement) {
                this.thumbnailElement.style.opacity = '1';
            }
        };
        
        this.thumbnailElement.onerror = () => {
            // Replace with fallback on error
            if (container && this.thumbnailElement) {
                container.removeChild(this.thumbnailElement);
                this.createFallbackDisplay(container);
            }
        };
        
        // Apply thumbnail styles
        this.applyThumbnailStyles();
        
        container.appendChild(this.thumbnailElement);
    }

    /**
     * Create fallback display when no thumbnail is available
     */
    private createFallbackDisplay(container: HTMLElement): void {
        const fallback = document.createElement('div');
        fallback.className = 'pauseshop-thumbnail-fallback';
        fallback.textContent = this.getCategoryIcon();
        
        // Apply fallback styles
        const fallbackStyles = {
            width: '100px',
            height: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            color: 'rgba(255, 255, 255, 0.8)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.2))',
            borderRadius: '8px',
            margin: '13px'
        };
        
        Object.assign(fallback.style, fallbackStyles);
        container.appendChild(fallback);
    }

    /**
     * Get category icon for fallback display
     */
    private getCategoryIcon(): string {
        switch (this.config.category) {
            case 'clothing': return '👕';
            case 'electronics': return '📱';
            case 'furniture': return '🛋️';
            case 'accessories': return '👜';
            case 'footwear': return '👟';
            case 'home_decor': return '🏠';
            case 'books_media': return '📚';
            case 'sports_fitness': return '⚽';
            case 'beauty_personal_care': return '💄';
            case 'kitchen_dining': return '🍽️';
            default: return '📦';
        }
    }

    /**
     * Fade in thumbnail image
     */
    private fadeInThumbnail(): void {
        if (!this.thumbnailElement) return;
        
        this.thumbnailElement.style.transition = `opacity ${this.config.animations.thumbnailFadeDuration}ms ease-in`;
        this.thumbnailElement.style.opacity = '1';
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
            transform: 'translateY(-140px)', // Start above (will slide down)
            opacity: '0',
            pointerEvents: 'auto' as const, // Enable for future click handling
            userSelect: 'none' as const,
            boxSizing: 'border-box' as const,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transition: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        };

        Object.assign(this.element.style, styles);
    }

    /**
     * Apply styles to thumbnail image
     */
    private applyThumbnailStyles(): void {
        if (!this.thumbnailElement) return;

        const thumbnailStyles = {
            width: '100px',
            height: '100px',
            objectFit: 'cover' as const,
            borderRadius: '8px',
            opacity: '0',
            transition: 'opacity 300ms ease-in'
        };

        Object.assign(this.thumbnailElement.style, thumbnailStyles);
    }

    /**
     * Get the DOM element
     */
    public getElement(): HTMLElement | null {
        return this.element;
    }

    /**
     * Cleanup resources
     * Enhanced for Task 4.4: Clean up expansion components
     */
    public cleanup(): void {
        // Task 4.4: Cleanup expansion if it exists
        if (this.expansion) {
            this.expansion.cleanup();
            this.expansion = null;
        }
        this.isExpanded = false;

        if (this.animationController) {
            this.animationController.cleanup();
            this.animationController = null;
        }

        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }

        this.element = null;
        this.thumbnailElement = null;
        this.currentState = ProductDisplayState.HIDDEN;
    }
}