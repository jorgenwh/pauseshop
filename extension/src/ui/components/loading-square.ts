/**
 * Loading square component for PauseShop extension
 * Displays a semi-transparent square with rounded corners and loading animations
 */

import { AnimationController } from './animation-controller';
import { LoadingState, LoadingSquareConfig, ProductDisplayData } from '../types';

export class LoadingSquare {
    private element: HTMLElement | null = null;
    private animationController: AnimationController | null = null;
    private currentState: LoadingState = LoadingState.HIDDEN;
    private config: LoadingSquareConfig;

    private thumbnailElement: HTMLImageElement | null = null;
    private _isTransformed: boolean = false;

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
        
        // Create loading spinner element
        const spinner = document.createElement('div');
        spinner.className = 'pauseshop-loading-spinner';
        this.element.appendChild(spinner);
        
        // Create thumbnail container (initially hidden)
        const thumbnailContainer = document.createElement('div');
        thumbnailContainer.className = 'pauseshop-thumbnail-container';
        thumbnailContainer.style.display = 'none'; // Initially hidden
        thumbnailContainer.style.opacity = '0'; // Initially transparent
        this.element.appendChild(thumbnailContainer);

        // Create no products found text element
        const noProductsText = document.createElement('div');
        noProductsText.className = 'pauseshop-no-products-text';
        noProductsText.innerHTML = `
            <div class="pauseshop-no-products-line1">No products</div>
            <div class="pauseshop-no-products-line2">found 🛒❌</div>
        `;
        noProductsText.style.display = 'none'; // Initially hidden
        this.element.appendChild(noProductsText);
        
        // Apply initial styling
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
            // Reset visual state before any animation to ensure clean slide-in
            this.resetToLoadingState();
            
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
     * Transform the loading square to become the first product card
     */
    public async transformToProductCard(productData: ProductDisplayData): Promise<void> {
        if (!this.element || !this.animationController) {
            throw new Error('Loading square not created yet');
        }

        if (this.currentState !== LoadingState.LOADING && this.currentState !== LoadingState.PROCESSING) {
            return;
        }

        try {
            this.updateState(LoadingState.TRANSFORMING);

            // Phase 1: Fade out spinner (150ms)
            await this.fadeOutSpinner();

            // Phase 2: Update styling and fade in product thumbnail (150ms)
            await Promise.all([
                this.updateToProductStyling(),
                this.fadeInProductThumbnail(productData.thumbnailUrl, productData.category)
            ]);

            // Phase 3: Enable product interactions
            this.enableProductInteractions(productData);

            this._isTransformed = true;
            this.updateState(LoadingState.LOADING); // Keep as loading state but transformed

        } catch (error) {
            console.warn('PauseShop: Failed to transform loading square:', error);
            // Fallback to showing first product immediately
            this.element.style.opacity = '1';
            this.updateState(LoadingState.LOADING);
        }
    }

    /**
     * Fade out the spinner element
     */
    private async fadeOutSpinner(): Promise<void> {
        if (!this.animationController) return;

        const spinner = this.element?.querySelector('.pauseshop-loading-spinner') as HTMLElement;
        if (spinner) {
            await this.animationController.fadeElement(spinner, 1, 0, 150);
            spinner.style.display = 'none';
        }
    }

    /**
     * Fade in the product thumbnail
     */
    private async fadeInProductThumbnail(thumbnailUrl: string | null, category: string): Promise<void> {
        if (!this.element || !this.animationController) return;

        // Create thumbnail container if it doesn't exist
        let thumbnailContainer = this.element.querySelector('.pauseshop-thumbnail-container') as HTMLElement;
        if (!thumbnailContainer) {
            thumbnailContainer = document.createElement('div');
            thumbnailContainer.className = 'pauseshop-thumbnail-container';
            this.element.appendChild(thumbnailContainer);
        }

        // Create thumbnail or fallback
        if (thumbnailUrl) {
            await this.createThumbnailImage(thumbnailContainer, thumbnailUrl);
        } else {
            this.createFallbackDisplay(thumbnailContainer, category);
        }

        // Fade in the thumbnail container
        thumbnailContainer.style.opacity = '0';
        thumbnailContainer.style.display = 'flex';
        await this.animationController.fadeElement(thumbnailContainer, 0, 1, 150);
    }

    /**
     * Update styling to match product squares
     */
    private async updateToProductStyling(): Promise<void> {
        if (!this.element) return;

        // Make the element visible and properly positioned
        this.element.style.opacity = '1';
        this.element.style.transform = 'translateX(0)';
        
        // Update background to match product squares
        this.element.style.background = 'rgba(40, 40, 40, 0.9)';
        
        // Update box shadow to match product squares
        this.element.style.boxShadow = '0 12px 36px rgba(0, 0, 0, 0.5), 0 6px 18px rgba(0, 0, 0, 0.3)';
        
        // Enable pointer events for interactions
        this.element.style.pointerEvents = 'auto';
        this.element.style.cursor = 'pointer';
        
        // Add flex layout for centering content
        this.element.style.display = 'flex';
        this.element.style.alignItems = 'center';
        this.element.style.justifyContent = 'center';
    }

    /**
     * Enable product interactions (click/hover)
     */
    private enableProductInteractions(productData: ProductDisplayData): void {
        if (!this.element || productData.allProducts.length <= 1) return;

        // Add click handler for expansion if multiple products
        this.element.addEventListener('click', this.handleProductClick.bind(this, productData));
        
        // Add hover effects
        this.element.addEventListener('mouseenter', () => {
            if (this.element && this._isTransformed) {
                this.element.style.transform += ' scale(1.02)';
                this.element.style.transition = 'transform 0.1s ease';
            }
        });

        this.element.addEventListener('mouseleave', () => {
            if (this.element && this._isTransformed) {
                this.element.style.transform = this.element.style.transform.replace(' scale(1.02)', '');
            }
        });
    }

    /**
     * Handle click event for product expansion
     */
    private handleProductClick(productData: ProductDisplayData, event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        
        // This would integrate with the expansion system
        // For now, just log the interaction
        console.log('PauseShop: Transformed loading card clicked', productData);
    }

    /**
     * Create thumbnail image element for transformation
     */
    private async createThumbnailImage(container: HTMLElement, thumbnailUrl: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Clear existing content
            container.innerHTML = '';

            this.thumbnailElement = document.createElement('img');
            this.thumbnailElement.className = 'pauseshop-thumbnail-image';
            this.thumbnailElement.src = thumbnailUrl;
            this.thumbnailElement.alt = 'Product thumbnail';
            
            // Handle image load/error
            this.thumbnailElement.onload = () => {
                if (this.thumbnailElement) {
                    this.applyThumbnailStyles();
                    resolve();
                }
            };
            
            this.thumbnailElement.onerror = () => {
                // Fallback to category icon on error
                if (container && this.thumbnailElement) {
                    container.removeChild(this.thumbnailElement);
                    this.createFallbackDisplay(container, 'default');
                    resolve();
                }
            };
            
            container.appendChild(this.thumbnailElement);
        });
    }

    /**
     * Create fallback display for transformation
     */
    private createFallbackDisplay(container: HTMLElement, category: string): void {
        // Clear existing content
        container.innerHTML = '';

        const fallback = document.createElement('div');
        fallback.className = 'pauseshop-thumbnail-fallback';
        fallback.textContent = this.getCategoryIcon(category);
        
        // Apply fallback styles
        const fallbackStyles = {
            width: '118px',
            height: '118px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            color: 'rgba(255, 255, 255, 0.8)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.2))',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxSizing: 'border-box' as const
        };
        
        Object.assign(fallback.style, fallbackStyles);
        container.appendChild(fallback);
    }

    /**
     * Get category icon for fallback display
     */
    private getCategoryIcon(category: string): string {
        switch (category) {
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
     * Apply styles to thumbnail image
     */
    private applyThumbnailStyles(): void {
        if (!this.thumbnailElement) return;

        const thumbnailStyles = {
            width: '118px',
            height: '118px',
            objectFit: 'cover' as const,
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxSizing: 'border-box' as const,
            opacity: '1', // Set to 1 as it's faded in by animation controller
            transition: 'none' // Handled by animation controller
        };

        Object.assign(this.thumbnailElement.style, thumbnailStyles);
    }

    /**
     * Update the loading state
     */
    public updateState(newState: LoadingState): void {
        const _previousState = this.currentState;
        this.currentState = newState;

        // Update element class for CSS state styling
        if (this.element) {
            this.element.setAttribute('data-state', newState);
        }

        // Handle state-specific logic
        switch (newState) {
            case LoadingState.LOADING:
                // Only reset visual state when returning to loading if not transformed
                if (!this._isTransformed) {
                    this.resetToLoadingState();
                }
                break;
            case LoadingState.PROCESSING:
                // Could add different animation or styling for processing state
                break;
            case LoadingState.NO_PRODUCTS_FOUND:
                this.handleNoProductsFoundState();
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
/**
     * Check if the loading square has been transformed into a product card
     */
    public get isTransformed(): boolean {
        return this._isTransformed;
    }
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
            transform: 'translateX(170px)', // Start off-screen
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
     * Handle transition to no products found state
     */
    private handleNoProductsFoundState(): void {
        if (!this.element) return;

        // Stop any running animations
        if (this.animationController) {
            this.animationController.stopAllAnimations();
        }

        // Get spinner and text elements
        const spinner = this.element.querySelector('.pauseshop-loading-spinner') as HTMLElement;
        const noProductsText = this.element.querySelector('.pauseshop-no-products-text') as HTMLElement;

        if (spinner && noProductsText) {
            // Hide spinner
            spinner.style.display = 'none';
            
            // Expand to rectangle and add red glow
            this.element.style.transition = 'width 0.4s ease-out, box-shadow 0.4s ease-out';
            this.element.style.width = '200px'; // Expand horizontally
            
            // Add red glow effect
            this.element.style.boxShadow = `
                0 4px 12px rgba(0, 0, 0, 0.3),
                0 0 20px rgba(239, 68, 68, 0.6),
                0 0 40px rgba(239, 68, 68, 0.3)
            `;
            
            // Show and animate in the no products text
            noProductsText.style.display = 'flex';
            noProductsText.style.opacity = '0';
            
            // Trigger fade-in animation for text
            requestAnimationFrame(() => {
                noProductsText.style.transition = 'opacity 0.3s ease-in-out';
                noProductsText.style.opacity = '1';
            });
            
            // Remove red glow after 1 second with smooth fade out
            setTimeout(() => {
                if (this.element) {
                    this.element.style.transition = 'width 0.4s ease-out, box-shadow 0.8s ease-out';
                    this.element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                }
            }, 1000);
        }
    }

    /**
     * Reset visual state back to loading (spinner visible, text hidden)
     */
    private resetToLoadingState(): void {
        if (!this.element) return;

        // Reset size back to square and remove glow
        this.element.style.transition = 'none'; // Remove transition to avoid flicker during reset
        this.element.style.width = `${this.config.size}px`;
        this.element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        this.element.style.background = this.config.backgroundColor; // Reset background
        this.element.style.pointerEvents = 'none'; // Disable pointer events
        this.element.style.cursor = 'default'; // Reset cursor

        // Get spinner, thumbnail container, and text elements
        const spinner = this.element.querySelector('.pauseshop-loading-spinner') as HTMLElement;
        const thumbnailContainer = this.element.querySelector('.pauseshop-thumbnail-container') as HTMLElement;
        const noProductsText = this.element.querySelector('.pauseshop-no-products-text') as HTMLElement;

        if (spinner) {
            spinner.style.display = 'block';
            spinner.style.opacity = '1';
        }
        if (thumbnailContainer) {
            thumbnailContainer.innerHTML = ''; // Clear any product content
            thumbnailContainer.style.display = 'none';
            thumbnailContainer.style.opacity = '0';
        }
        if (noProductsText) {
            noProductsText.style.display = 'none';
            noProductsText.style.opacity = '0';
            noProductsText.style.transition = 'none';
        }
        this._isTransformed = false;
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
        this.currentState = LoadingState.HIDDEN;
        this._isTransformed = false;
    }
}