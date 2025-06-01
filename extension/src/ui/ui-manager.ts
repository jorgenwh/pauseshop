/**
 * Main UI manager for PauseShop extension
 * Orchestrates all UI components and handles lifecycle management
 */

import { LoadingSquare } from './components/loading-square';
import { ProductGrid } from './components/product-grid';
import { LoadingState, UIConfig, LoadingSquareConfig, UIManagerEvents, ProductDisplayData, ProductGridConfig, ProductDisplayState } from './types';

export class UIManager {
    private container: HTMLElement | null = null;
    private loadingSquare: LoadingSquare | null = null;
    private productGrid: ProductGrid | null = null;
    private config: UIConfig;
    private loadingSquareConfig: LoadingSquareConfig;
    private productGridConfig: ProductGridConfig;
    private events: UIManagerEvents;
    private isInitialized: boolean = false;
    private noProductsFoundTimeoutId: NodeJS.Timeout | null = null;

    constructor(
        config: Partial<UIConfig> = {},
        loadingSquareConfig: Partial<LoadingSquareConfig> = {},
        events: UIManagerEvents = {},
        productGridConfig: Partial<ProductGridConfig> = {}
    ) {
        this.config = {
            enableLogging: true,
            logPrefix: 'PauseShop UI',
            containerClassName: 'pauseshop-ui-container',
            zIndex: 999999,
            ...config
        };

        this.loadingSquareConfig = {
            size: 126,
            borderRadius: 14,
            backgroundColor: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(168, 85, 247, 0.9), rgba(236, 72, 153, 0.85))',
            position: {
                top: 120,
                right: 30
            },
            animations: {
                slideInDuration: 300,
                slideOutDuration: 250,
                pulseDuration: 1500
            },
            noProductsFoundTimeout: 8000, // 8 seconds default
            ...loadingSquareConfig
        };

        this.productGridConfig = {
            squareSize: 126,
            spacing: 14,
            startPosition: {
                top: 120,
                right: 30
            },
            animationDelayMs: 100,
            maxProducts: 5,
            backgroundColor: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(168, 85, 247, 0.9), rgba(236, 72, 153, 0.85))',
            borderRadius: 14,
            ...productGridConfig
        };

        this.events = events;
    }

    /**
     * Initialize the UI manager and create container
     */
    public initialize(): boolean {
        if (this.isInitialized) {
            return true;
        }

        try {
            // Create main container
            this.createContainer();
            
            // Create loading square component
            this.loadingSquare = new LoadingSquare(this.loadingSquareConfig);
            
            this.isInitialized = true;
            return true;

        } catch (error) {
            this.log(`Failed to initialize UI Manager: ${error}`);
            return false;
        }
    }

    /**
     * Show the loading square
     */
    public async showLoadingSquare(): Promise<boolean> {
        if (!this.ensureInitialized()) {
            return false;
        }

        try {
            // Create and append loading square to container
            const squareElement = this.loadingSquare!.create();
            this.container!.appendChild(squareElement);

            // Show with animation
            await this.loadingSquare!.show();
            
            this.events.onShow?.();
            this.events.onStateChange?.(LoadingState.LOADING);
            
            return true;

        } catch (error) {
            this.log(`Failed to show loading square: ${error}`);
            return false;
        }
    }

    /**
     * Hide the loading square
     */
    public async hideLoadingSquare(): Promise<boolean> {
        if (!this.loadingSquare || !this.loadingSquare.isVisible()) {
            return true;
        }

        try {
            await this.loadingSquare.hide();
            
            // Remove from DOM after animation
            const element = this.loadingSquare.getElement();
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
            
            this.events.onHide?.();
            this.events.onStateChange?.(LoadingState.HIDDEN);
            
            return true;

        } catch (error) {
            this.log(`Failed to hide loading square: ${error}`);
            return false;
        }
    }

    /**
     * Update loading square state
     */
    public updateLoadingState(state: LoadingState): void {
        if (!this.loadingSquare) {
            return;
        }

        this.loadingSquare.updateState(state);
        this.events.onStateChange?.(state);
    }

    /**
     * Show "no products found" state and auto-hide after timeout
     */
    public async showNoProductsFound(timeoutMs?: number): Promise<boolean> {
        if (!this.loadingSquare?.isVisible()) {
            return false;
        }

        try {
            // Clear any existing timeout to restart the countdown
            if (this.noProductsFoundTimeoutId) {
                clearTimeout(this.noProductsFoundTimeoutId);
                this.noProductsFoundTimeoutId = null;
            }

            // Use configured timeout or default
            const timeout = timeoutMs ?? this.loadingSquareConfig.noProductsFoundTimeout ?? 8000;
            
            // Update to no products found state
            this.updateLoadingState(LoadingState.NO_PRODUCTS_FOUND);
            
            // Auto-hide after timeout with proper cleanup
            this.noProductsFoundTimeoutId = setTimeout(async () => {
                this.noProductsFoundTimeoutId = null;
                await this.hideLoadingSquare();
            }, timeout);
            
            return true;

        } catch (error) {
            this.log(`Failed to show no products found state: ${error}`);
            return false;
        }
    }

    /**
     * Show product grid (transforms from loading square)
     */
    public async showProductGrid(productData: ProductDisplayData[]): Promise<boolean> {
        if (!this.ensureInitialized()) {
            return false;
        }

        try {
            // Hide loading square first
            await this.hideLoadingSquare();

            // Create and show product grid
            this.productGrid = new ProductGrid(this.productGridConfig);
            const gridElement = await this.productGrid.create(productData);
            this.container!.appendChild(gridElement);

            // Show with staggered animations
            await this.productGrid.show();
            
            this.events.onProductGridShow?.();
            
            return true;

        } catch (error) {
            this.log(`Failed to show product grid: ${error}`);
            return false;
        }
    }

    /**
     * Hide the product grid
     */
    public async hideProductGrid(): Promise<boolean> {
        if (!this.productGrid || !this.productGrid.isVisible()) {
            return true;
        }

        try {
            await this.productGrid.hide();
            
            // Remove from DOM after animation
            const container = this.productGrid.getContainer();
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
            
            // Cleanup product grid
            this.productGrid.cleanup();
            this.productGrid = null;
            
            this.events.onProductGridHide?.();
            
            return true;

        } catch (error) {
            this.log(`Failed to hide product grid: ${error}`);
            return false;
        }
    }

    /**
     * Check if product grid is currently visible
     */
    public isProductGridVisible(): boolean {
        return this.productGrid?.isVisible() ?? false;
    }

    /**
     * Get number of products in grid
     */
    public getProductCount(): number {
        return this.productGrid?.getProductCount() ?? 0;
    }

    /**
     * Hide all UI components
     */
    public async hideUI(): Promise<void> {
        // Ensure all expansions are collapsed before hiding (Task 4.4)
        if (this.productGrid) {
            await this.productGrid.collapseAllExpansions();
        }
        
        await Promise.all([
            this.hideLoadingSquare(),
            this.hideProductGrid()
        ]);
    }

    /**
     * Check if UI is currently visible
     */
    public isUIVisible(): boolean {
        return (this.loadingSquare?.isVisible() ?? false) ||
               (this.productGrid?.isVisible() ?? false);
    }

    /**
     * Get current loading state
     */
    public getCurrentState(): LoadingState {
        return this.loadingSquare?.getCurrentState() ?? LoadingState.HIDDEN;
    }

    /**
     * Get current product grid state
     */
    public getProductGridState(): ProductDisplayState {
        return this.productGrid?.getCurrentState() ?? ProductDisplayState.HIDDEN;
    }

    /**
     * Check if any animations are running
     */
    public isAnimating(): boolean {
        return (this.loadingSquare?.isAnimating() ?? false) ||
               (this.productGrid?.isAnimating() ?? false);
    }

    /**
     * Complete cleanup of all UI components
     */
    public cleanup(): void {
        // Clear any pending no products found timeout
        if (this.noProductsFoundTimeoutId) {
            clearTimeout(this.noProductsFoundTimeoutId);
            this.noProductsFoundTimeoutId = null;
        }

        // Cleanup loading square
        if (this.loadingSquare) {
            this.loadingSquare.cleanup();
            this.loadingSquare = null;
        }

        // Cleanup product grid
        if (this.productGrid) {
            this.productGrid.cleanup();
            this.productGrid = null;
        }

        // Remove container from DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;

        this.isInitialized = false;
    }

    /**
     * Create the main UI container
     */
    private createContainer(): void {
        // Remove existing container if it exists
        const existingContainer = document.querySelector(`.${this.config.containerClassName}`);
        if (existingContainer) {
            existingContainer.remove();
        }

        this.container = document.createElement('div');
        this.container.className = this.config.containerClassName;
        
        // Apply container styles
        const containerStyles = {
            position: 'fixed' as const,
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none' as const,
            zIndex: this.config.zIndex.toString(),
            userSelect: 'none' as const
        };

        Object.assign(this.container.style, containerStyles);

        // Append to document body
        document.body.appendChild(this.container);
    }

    /**
     * Ensure UI manager is initialized
     */
    private ensureInitialized(): boolean {
        if (!this.isInitialized) {
            return this.initialize();
        }
        return true;
    }

    /**
     * Log message with prefix
     */
    private log(message: string): void {
        if (this.config.enableLogging) {
            console.log(`${this.config.logPrefix}: ${message}`);
        }
    }

    /**
     * Static method to create and initialize a UI manager
     */
    public static create(
        config?: Partial<UIConfig>,
        loadingSquareConfig?: Partial<LoadingSquareConfig>,
        events?: UIManagerEvents,
        productGridConfig?: Partial<ProductGridConfig>
    ): UIManager | null {
        try {
            const manager = new UIManager(config, loadingSquareConfig, events, productGridConfig);
            if (manager.initialize()) {
                return manager;
            }
            return null;
        } catch (error) {
            console.error('PauseShop: Failed to create UI Manager:', error);
            return null;
        }
    }
}
