/**
 * Main Sidebar component for PauseShop extension
 * Replaces the floating squares with a modern glassmorphic sidebar
 */

import { SidebarConfig, SidebarState, SidebarContentState, SidebarEvents, ProductDisplayData, LoadingStateConfig, MessageStateConfig } from '../types';
import { SidebarHeader } from './sidebar-header';
import { LoadingState } from './loading-state';
import { ProductList } from './product-list';
import { MessageState } from './message-state';

export class Sidebar {
    private element: HTMLElement | null = null;
    private headerComponent: SidebarHeader | null = null;
    private loadingComponent: LoadingState | null = null;
    private productListComponent: ProductList | null = null;
    private messageComponent: MessageState | null = null; // Renamed from noProductsComponent
    private contentContainer: HTMLElement | null = null;
    
    // Internal state elements for the three views
    private loadingElement: HTMLElement | null = null;
    private noProductsElement: HTMLElement | null = null;
    
    private currentState: SidebarState = SidebarState.HIDDEN;
    private currentContentState: SidebarContentState = SidebarContentState.LOADING;
    private config: SidebarConfig;
    private events: SidebarEvents;
    private isAnimating: boolean = false;

    constructor(config: Partial<SidebarConfig>, events: SidebarEvents = {}) {
        this.config = {
            width: config.width || 400,
            position: config.position || 'right',
            animations: {
                slideInDuration: config.animations?.slideInDuration || 150,
                slideOutDuration: config.animations?.slideOutDuration || 500
            },
            enableBackdropBlur: config.enableBackdropBlur !== undefined ? config.enableBackdropBlur : true,
            enableGlassmorphism: config.enableGlassmorphism !== undefined ? config.enableGlassmorphism : true
        };
        this.events = events;
    }

    /**
     * Create the sidebar element and all child components
     */
    public create(): HTMLElement {
        if (this.element) {
            return this.element;
        }

        // Create main sidebar container
        this.element = document.createElement('div');
        this.element.className = 'pauseshop-sidebar pauseshop-z-index pauseshop-crisp';
        this.element.setAttribute('data-state', this.currentState);
        // Set initial position off-screen and apply transition
        this.element.classList.add('translate-x-full'); // Start off-screen
        this.element.style.transition = `transform ${this.config.animations.slideInDuration / 1000}s ease-out`;
        
        // Apply custom width if different from default
        if (this.config.width !== 400) {
            this.element.style.width = `${this.config.width}px`;
        }

        // Create header
        this.headerComponent = new SidebarHeader({
            title: 'PauseShop',
            showCloseButton: true,
            onClose: () => this.hide()
        });
        const headerElement = this.headerComponent.create();
        this.element.appendChild(headerElement);

        // Create content container
        this.contentContainer = document.createElement('div');
        this.contentContainer.className = 'flex-grow flex flex-col overflow-hidden';
        this.element.appendChild(this.contentContainer);

        // Create footer
        this.createFooter();

        // Set initial loading state
        this.setState('loading');

        return this.element;
    }

    /**
     * Show the sidebar with slide-in animation
     */
    public async show(): Promise<void> {
        if (!this.element) {
            throw new Error('Sidebar not created yet');
        }

        if (this.currentState === SidebarState.VISIBLE || this.isAnimating) {
            return;
        }

        try {
            this.isAnimating = true;
            this.updateState(SidebarState.SLIDING_IN);

            // Add to DOM if not already present
            if (!this.element.parentNode) {
                document.body.appendChild(this.element);
            }

            // Prevent body scroll
            document.body.classList.add('pauseshop-no-scroll');

            // Trigger slide-in animation
            await this.animateSlideIn();
            
            this.updateState(SidebarState.VISIBLE);
            this.events.onShow?.();

        } catch (error) {
            console.error('PauseShop: Failed to show sidebar:', error);
            this.updateState(SidebarState.HIDDEN);
            throw error;
        } finally {
            this.isAnimating = false;
        }
    }

    /**
     * Hide the sidebar with slide-out animation
     */
    public async hide(): Promise<void> {
        if (!this.element || this.currentState === SidebarState.HIDDEN || this.isAnimating) {
            return;
        }

        try {
            this.isAnimating = true;
            this.updateState(SidebarState.SLIDING_OUT);

            // Trigger slide-out animation
            await this.animateSlideOut();
            
            // Clear content before hiding to ensure a fresh state on next show
            this.clearContent();

            // Remove from DOM and restore body scroll
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            document.body.classList.remove('pauseshop-no-scroll');

            this.updateState(SidebarState.HIDDEN);
            this.events.onHide?.();

        } catch (error) {
            console.error('PauseShop: Failed to hide sidebar:', error);
            throw error;
        } finally {
            this.isAnimating = false;
        }
    }

    /**
     * Check if sidebar is currently visible
     */
    public isVisible(): boolean {
        return this.currentState === SidebarState.VISIBLE;
    }

    /**
     * Get current sidebar state
     */
    public getCurrentState(): SidebarState {
        return this.currentState;
    }

    /**
     * Check if sidebar has any products
     */
    public hasProducts(): boolean {
        return this.productListComponent ? this.productListComponent.getProductCount() > 0 : false;
    }

    /**
     * Set the internal display state of the sidebar content
     * Manages three states: loading, productList, noProducts
     */
    public setState(state: 'loading' | 'productList' | 'noProducts'): void {
        if (!this.contentContainer) {
            return;
        }

        // Show the view corresponding to the given state
        switch (state) {
            case 'loading':
                this.showLoading(); // Use the public showLoading method
                this.setContentState(SidebarContentState.LOADING);
                break;
            case 'productList':
                // Handle async product list view creation
                this.showProductListView().catch(error => {
                    console.error('Failed to show product list view:', error);
                });
                this.setContentState(SidebarContentState.PRODUCTS);
                break;
            case 'noProducts':
                this.showNoProducts(); // Use the public showNoProducts method
                this.setContentState(SidebarContentState.NO_PRODUCTS);
                break;
        }
    }

    /**
     * Hide all content views (loading, product list, no products)
     */
    private hideAllContentViews(): void {
        // Cleanup existing components
        if (this.loadingComponent) {
            this.loadingComponent.cleanup();
            this.loadingComponent = null;
        }
        if (this.productListComponent) {
            this.productListComponent.cleanup();
            this.productListComponent = null;
        }
        if (this.messageComponent) {
            this.messageComponent.cleanup();
            this.messageComponent = null;
        }

        // Clear DOM
        if (this.contentContainer) {
            this.contentContainer.innerHTML = '';
        }
    }

    /**
     * Show the product list view
     */
    private async showProductListView(): Promise<void> {
        this.clearContent(); // Hide all other content

        if (!this.productListComponent) {
            // Create product list component if it doesn't exist
            this.productListComponent = new ProductList({
                maxHeight: 'calc(100vh - 200px)',
                enableVirtualScrolling: false,
                itemSpacing: 14
            }, {
                onProductClick: (product) => this.events.onProductClick?.(product)
            });
            
            // Create and append the product list element
            const element = await this.productListComponent.create();
            this.contentContainer!.appendChild(element);
        }
        
        // Ensure the element is visible
        const element = this.productListComponent.getElement();
        if (element) {
            element.style.display = 'flex';
        }
        await this.productListComponent.show();
    }

    /**
     * Set content state and update display
     */
    public setContentState(state: SidebarContentState): void {
        if (this.currentContentState === state) {
            return;
        }

        this.currentContentState = state;
        this.events.onContentStateChange?.(state);
    }

    /**
     * Show loading state
     */
    public showLoading(config?: LoadingStateConfig): void {
        this.clearContent(); // Hide all other content

        // Clean up product list if it exists, as a new analysis is starting
        if (this.productListComponent) {
            this.productListComponent.cleanup();
            this.productListComponent = null;
        }

        if (!this.loadingComponent) {
            this.loadingComponent = new LoadingState(config || {
                message: 'Processing...',
                subMessage: 'Analyzing your paused scene.',
                spinnerSize: 'initial'
            });
            const loadingElement = this.loadingComponent.create();
            this.contentContainer?.appendChild(loadingElement);
        } else {
            // Update existing loading component if it already exists
            this.loadingComponent.updateMessage(
                config?.message || 'Processing...',
                config?.subMessage || 'Analyzing your paused scene.'
            );
        }
        
        // Ensure the element is visible
        const loadingElement = this.loadingComponent.getElement();
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
        this.loadingComponent.show(); // Animate the loading state in
    }

    /**
     * Show products in the sidebar
     */
    public async showProducts(products: ProductDisplayData[]): Promise<void> {
        this.setContentState(SidebarContentState.PRODUCTS);
        this.clearContent(); // Hide all other content

        if (!this.productListComponent) {
            this.productListComponent = new ProductList({
                maxHeight: 'calc(100vh - 200px)',
                enableVirtualScrolling: false,
                itemSpacing: 14
            }, {
                onProductClick: (product) => this.events.onProductClick?.(product)
            });
            const productListElement = await this.productListComponent.create();
            this.contentContainer?.appendChild(productListElement);
        }
        
        // Ensure the element is visible
        const productListElement = this.productListComponent.getElement();
        if (productListElement) {
            productListElement.style.display = 'flex';
        }
        await this.productListComponent.show(); // Show the empty list container

        // Add products one by one if provided (for non-streaming initial load)
        for (const product of products) {
            await this.productListComponent.addProduct(product);
        }
    }

    /**
     * Add a single product to the sidebar's product list (for streaming)
     */
    public async addProduct(product: ProductDisplayData): Promise<void> {
        // If we are currently showing loading or no products, clear it and transition to product list
        if (this.currentContentState !== SidebarContentState.PRODUCTS) {
            this.clearContent(); // Hide all other content
            this.setContentState(SidebarContentState.PRODUCTS);
        }

        if (!this.productListComponent) {
            // Create product list component if it doesn't exist
            this.productListComponent = new ProductList({
                maxHeight: 'calc(100vh - 200px)',
                enableVirtualScrolling: false,
                itemSpacing: 14
            }, {
                onProductClick: (product) => this.events.onProductClick?.(product)
            });
            const element = await this.productListComponent.create();
            this.contentContainer?.appendChild(element);
        }
        
        // Ensure the element is visible
        const element = this.productListComponent.getElement();
        if (element) {
            element.style.display = 'flex';
        }
        await this.productListComponent.show();
        
        await this.productListComponent.addProduct(product);
    }

    /**
     * Hide the loading state and show product list (or empty state if no products)
     */
    public hideLoading(): void {
        // This method is called when analysis is complete but no products are found,
        // or when products are about to be displayed.
        // The content state will be set by showProducts or showNoProducts,
        // which will also handle hiding the loading component.
        // No explicit action needed here beyond what clearContent() does.
    }

    /**
     * Show an error message in the sidebar
     */
    public showError(config: { title: string; message: string; showRetryButton?: boolean }): void {
        this.setContentState(SidebarContentState.ERROR); // Assuming a new ERROR state
        this.clearContent(); // Hide all other content

        // Use MessageState for error display
        if (!this.messageComponent) {
            this.messageComponent = new MessageState({
                title: config.title,
                message: config.message,
                iconType: 'error',
                showRetryButton: config.showRetryButton || false,
                onRetry: config.showRetryButton ? () => this.events.onRetry?.() : undefined
            });
            const errorElement = this.messageComponent.create();
            this.contentContainer?.appendChild(errorElement);
        } else {
            this.messageComponent.updateConfig({
                title: config.title,
                message: config.message,
                iconType: 'error',
                showRetryButton: config.showRetryButton || false,
                onRetry: config.showRetryButton ? () => this.events.onRetry?.() : undefined
            });
        }
        
        // Ensure the element is visible
        const errorElement = this.messageComponent.getElement();
        if (errorElement) {
            errorElement.style.display = 'flex';
        }
        this.messageComponent.show();
    }

    /**
     * Show no products found state
     */
    public showNoProducts(config?: MessageStateConfig): void {
        this.setContentState(SidebarContentState.NO_PRODUCTS);
        this.clearContent(); // Hide all other content

        if (!this.messageComponent) {
            this.messageComponent = new MessageState(config || {
                title: 'No products found.',
                message: 'Try a different scene or ensure items are clearly visible.',
                iconType: 'search',
                showRetryButton: true, // Changed to true to allow retry
                onRetry: () => this.events.onRetry?.()
            });
            const noProductsElement = this.messageComponent.create();
            this.contentContainer?.appendChild(noProductsElement);
        } else {
            this.messageComponent.updateConfig(config || {
                title: 'No products found.',
                message: 'Try a different scene or ensure items are clearly visible.',
                iconType: 'search',
                showRetryButton: true, // Changed to true to allow retry
                onRetry: () => this.events.onRetry?.()
            });
        }
        
        // Ensure the element is visible
        const noProductsElement = this.messageComponent.getElement();
        if (noProductsElement) {
            noProductsElement.style.display = 'flex';
        }
        this.messageComponent.show();
    }

    /**
     * Clear all content from the content container by hiding them
     */
    private clearContent(): void {
        if (!this.contentContainer) return;

        // Hide all component elements
        if (this.loadingComponent && this.loadingComponent.getElement()) {
            this.loadingComponent.getElement()!.style.display = 'none';
        }
        if (this.productListComponent && this.productListComponent.getElement()) {
            this.productListComponent.getElement()!.style.display = 'none';
        }
        if (this.messageComponent && this.messageComponent.getElement()) {
            this.messageComponent.getElement()!.style.display = 'none';
        }
    }

    /**
     * Create footer element
     */
    private createFooter(): void {
        const footer = document.createElement('div');
        footer.className = 'mt-auto pt-3 text-center border-t border-slate-600/80';
        footer.innerHTML = `
            <p class="text-xs text-slate-400">Powered by PauseShop AI</p>
        `;
        this.element?.appendChild(footer);
    }

    /**
     * Update sidebar state
     */
    private updateState(newState: SidebarState): void {
        this.currentState = newState;
        if (this.element) {
            this.element.setAttribute('data-state', newState);
        }
        this.events.onStateChange?.(newState);
    }

    /**
     * Animate sidebar slide-in
     */
    private async animateSlideIn(): Promise<void> {
        if (!this.element) return;

        return new Promise((resolve) => {
            // Ensure the element is in its initial off-screen state before transitioning
            // This forces a reflow/repaint, allowing the transition to apply correctly
            this.element!.offsetWidth; // Trigger reflow

            this.element!.classList.remove('translate-x-full');
            this.element!.classList.add('translate-x-0');
            
            const handler = () => {
                this.element!.removeEventListener('transitionend', handler);
                resolve();
            };
            this.element!.addEventListener('transitionend', handler);
        });
    }

    /**
     * Animate sidebar slide-out
     */
    private async animateSlideOut(): Promise<void> {
        if (!this.element) return;

        return new Promise((resolve) => {
            this.element!.classList.remove('translate-x-0');
            this.element!.classList.add('translate-x-full');
            
            const handler = () => {
                this.element!.removeEventListener('transitionend', handler);
                resolve();
            };
            this.element!.addEventListener('transitionend', handler);
        });
    }

    /**
     * Cleanup all resources
     */
    public cleanup(): void {
        this.clearContent();

        if (this.headerComponent) {
            this.headerComponent.cleanup();
            this.headerComponent = null;
        }

        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }

        // Restore body scroll
        document.body.classList.remove('pauseshop-no-scroll');

        this.element = null;
        this.contentContainer = null;
        this.currentState = SidebarState.HIDDEN;
        this.currentContentState = SidebarContentState.LOADING;
        this.isAnimating = false;
    }
}