/**
 * Expansion square component for PauseShop extension
 * Individual squares that appear during horizontal expansion
 */

import { AnimationController } from './animation-controller';
import { ExpansionSquareConfig, ExpansionState } from '../types';
import { AmazonScrapedProduct, ProductCategory } from '../../types/amazon';

export class ExpansionSquare {
    private element: HTMLElement | null = null;
    private thumbnailElement: HTMLImageElement | null = null;
    private animationController: AnimationController | null = null;
    private currentState: ExpansionState = ExpansionState.HIDDEN;
    private config: ExpansionSquareConfig;

    constructor(config: ExpansionSquareConfig) {
        this.config = config;
    }

    /**
     * Create the expansion square element
     */
    public create(): HTMLElement {
        if (this.element) {
            return this.element;
        }

        this.element = document.createElement('div');
        this.element.className = 'pauseshop-expansion-square';
        
        // Create thumbnail container
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.className = 'pauseshop-expansion-thumbnail-container';
        
        // Create thumbnail image or fallback
        if (this.config.product.thumbnailUrl) {
            this.createThumbnailImage(thumbnailContainer);
        } else {
            this.createFallbackDisplay(thumbnailContainer);
        }
        
        this.element.appendChild(thumbnailContainer);
        
        // Apply styling
        this.applyStyles();
        
        // Initialize animation controller
        this.animationController = new AnimationController(this.element);
        
        // Bind click handler for Amazon link
        this.bindClickHandler();

        return this.element;
    }

    /**
     * Show the expansion square with slide-left animation
     */
    public async show(delay: number = 0): Promise<void> {
        if (!this.element || !this.animationController) {
            throw new Error('Expansion square not created yet');
        }

        if (this.currentState !== ExpansionState.HIDDEN) {
            return;
        }

        try {
            // Wait for delay if specified
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            this.updateState(ExpansionState.EXPANDING);
            
            // Calculate slide distance based on position
            const slideDistance = (this.config.index + 1) * (this.config.size + 12); // 12px spacing
            
            // Start slide-left animation
            await this.animationController.slideLeft({
                duration: this.config.animations.slideLeftDuration,
                easing: 'ease-out',
                distance: slideDistance
            });

            this.updateState(ExpansionState.EXPANDED);
            
            // Fade in thumbnail if it exists
            if (this.thumbnailElement) {
                this.fadeInThumbnail();
            }

        } catch (error) {
            console.warn('PauseShop: Failed to show expansion square:', error);
            // Fallback to instant show
            const slideDistance = (this.config.index + 1) * (this.config.size + 12);
            this.element.style.transform = `translateX(-${slideDistance}px)`;
            this.element.style.opacity = '1';
            this.updateState(ExpansionState.EXPANDED);
        }
    }

    /**
     * Hide the expansion square with slide-right animation
     */
    public async hide(): Promise<void> {
        if (!this.element || !this.animationController) {
            return;
        }

        if (this.currentState === ExpansionState.HIDDEN) {
            return;
        }

        try {
            this.updateState(ExpansionState.COLLAPSING);

            // Calculate slide distance to return to original position
            const slideDistance = (this.config.index + 1) * (this.config.size + 12);
            
            // Slide back to right (reverse animation)
            await this.animationController.slideRight({
                duration: this.config.animations.slideLeftDuration,
                easing: 'ease-in',
                distance: slideDistance
            });

            this.updateState(ExpansionState.HIDDEN);

        } catch (error) {
            console.warn('PauseShop: Failed to hide expansion square:', error);
            // Fallback to instant hide
            this.element.style.transform = 'translateX(0)';
            this.element.style.opacity = '0';
            this.updateState(ExpansionState.HIDDEN);
        }
    }

    /**
     * Update the display state
     */
    public updateState(newState: ExpansionState): void {
        this.currentState = newState;

        // Update element class for CSS state styling
        if (this.element) {
            this.element.setAttribute('data-state', newState);
        }
    }

    /**
     * Get current state
     */
    public getCurrentState(): ExpansionState {
        return this.currentState;
    }

    /**
     * Check if the square is visible
     */
    public isVisible(): boolean {
        return this.currentState !== ExpansionState.HIDDEN;
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
    public getProduct(): AmazonScrapedProduct {
        return this.config.product;
    }

    /**
     * Bind click handler to open Amazon product page
     */
    private bindClickHandler(): void {
        if (!this.element) return;

        this.element.addEventListener('click', (event: Event) => {
            event.preventDefault();
            event.stopPropagation();
            this.openProductPage();
        });

        // Add hover effect
        this.element.addEventListener('mouseenter', () => {
            if (this.element) {
                this.element.style.transform += ' scale(1.05)';
                this.element.style.transition = 'transform 0.1s ease';
            }
        });

        this.element.addEventListener('mouseleave', () => {
            if (this.element) {
                this.element.style.transform = this.element.style.transform.replace(' scale(1.05)', '');
            }
        });
    }

    /**
     * Open the Amazon product page
     */
    private openProductPage(): void {
        if (this.config.product.productUrl) {
            window.open(this.config.product.productUrl, '_blank', 'noopener,noreferrer');
        }
    }

    /**
     * Create thumbnail image element
     */
    private createThumbnailImage(container: HTMLElement): void {
        this.thumbnailElement = document.createElement('img');
        this.thumbnailElement.className = 'pauseshop-expansion-thumbnail-image';
        this.thumbnailElement.src = this.config.product.thumbnailUrl!;
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
        fallback.className = 'pauseshop-expansion-thumbnail-fallback';
        fallback.textContent = this.getCategoryIcon();
        
        // Apply fallback styles (smaller than main square fallbacks)
        const thumbnailSize = Math.round(this.config.size * 0.79); // ~67px for 85px square
        const fallbackStyles = {
            width: `${thumbnailSize}px`,
            height: `${thumbnailSize}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px', // Smaller than main square (32px)
            color: 'rgba(255, 255, 255, 0.8)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.2))',
            borderRadius: '6px', // Smaller radius for expansion squares
            margin: `${Math.round((this.config.size - thumbnailSize) / 2)}px`
        };
        
        Object.assign(fallback.style, fallbackStyles);
        container.appendChild(fallback);
    }

    /**
     * Get category icon for fallback display
     */
    private getCategoryIcon(): string {
        // This would normally come from the product category, but since we don't have direct access,
        // we'll use a generic icon. In a full implementation, we'd pass category through config.
        return '📦';
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
            zIndex: '999998', // Below main squares
            transform: 'translateX(0) scale(0.8)', // Start smaller and at original position
            opacity: '0',
            pointerEvents: 'auto' as const, // Enable clicks
            userSelect: 'none' as const,
            boxSizing: 'border-box' as const,
            boxShadow: '0 3px 8px rgba(0, 0, 0, 0.25)', // Slightly less shadow than main squares
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

        const thumbnailSize = Math.round(this.config.size * 0.79); // ~67px for 85px square
        const thumbnailStyles = {
            width: `${thumbnailSize}px`,
            height: `${thumbnailSize}px`,
            objectFit: 'cover' as const,
            borderRadius: '6px', // Smaller radius for expansion squares
            opacity: '0',
            transition: `opacity ${this.config.animations.thumbnailFadeDuration}ms ease-in`
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
        this.thumbnailElement = null;
        this.currentState = ExpansionState.HIDDEN;
    }
}