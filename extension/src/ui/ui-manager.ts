/**
 * Main UI manager for PauseShop extension
 * Orchestrates all UI components and handles lifecycle management
 *
 * Phase 4: Simplified to use only the new Sidebar architecture
 */

import { Sidebar } from './components/sidebar';
import {
    LoadingState,
    UIConfig,
    LoadingSquareConfig,
    UIManagerEvents,
    ProductDisplayData,
    SidebarState,
    SidebarContentState,
    SidebarConfig,
    SidebarEvents,
    LoadingStateConfig,
    NoProductsStateConfig
} from './types';

export class UIManager {
    private container: HTMLElement | null = null;
    
    // Sidebar state management
    private sidebar: Sidebar | null = null;
    private currentSidebarState: SidebarState = SidebarState.HIDDEN;
    private sidebarConfig: SidebarConfig;
    private sidebarEvents: SidebarEvents;
    
    private config: UIConfig;
    private loadingSquareConfig: LoadingSquareConfig; // Keep for timeout config
    private events: UIManagerEvents;
    private isInitialized: boolean = false;
    private noProductsFoundTimeoutId: NodeJS.Timeout | null = null;

    constructor(
        config: Partial<UIConfig> = {},
        loadingSquareConfig: Partial<LoadingSquareConfig> = {},
        events: UIManagerEvents = {},
        sidebarConfig: Partial<SidebarConfig> = {}
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
            noProductsFoundTimeout: 8000, // Keep for timeout config
            ...loadingSquareConfig
        };

        this.events = events;
        
        // Configure sidebar system
        this.sidebarConfig = {
            width: sidebarConfig.width || 400,
            position: sidebarConfig.position || 'right',
            animations: {
                slideInDuration: sidebarConfig.animations?.slideInDuration || 500,
                slideOutDuration: sidebarConfig.animations?.slideOutDuration || 500
            },
            enableBackdropBlur: sidebarConfig.enableBackdropBlur !== undefined ? sidebarConfig.enableBackdropBlur : true,
            enableGlassmorphism: sidebarConfig.enableGlassmorphism !== undefined ? sidebarConfig.enableGlassmorphism : true
        };
        
        // Configure sidebar events
        this.sidebarEvents = {
            onShow: () => {
                this.currentSidebarState = SidebarState.VISIBLE;
                this.events.onShow?.();
            },
            onHide: () => {
                this.currentSidebarState = SidebarState.HIDDEN;
                this.events.onHide?.();
            },
            onStateChange: (state: SidebarState) => {
                this.currentSidebarState = state;
                // Map sidebar states to legacy loading states for backward compatibility
                if (state === SidebarState.VISIBLE) {
                    this.events.onStateChange?.(LoadingState.LOADING);
                } else if (state === SidebarState.HIDDEN) {
                    this.events.onStateChange?.(LoadingState.HIDDEN);
                }
            },
            onContentStateChange: (state: SidebarContentState) => {
                // Map content states to legacy states
                switch (state) {
                    case SidebarContentState.LOADING:
                        this.events.onStateChange?.(LoadingState.LOADING);
                        break;
                    case SidebarContentState.PRODUCTS:
                        this.events.onProductGridShow?.();
                        break;
                    case SidebarContentState.NO_PRODUCTS:
                        this.events.onStateChange?.(LoadingState.NO_PRODUCTS_FOUND);
                        break;
                }
            },
            onProductClick: (product) => {
                // Handle product clicks - open Amazon URL
                if (product.productUrl) {
                    window.open(product.productUrl, '_blank');
                }
            },
            onError: (error) => {
                this.log(`Sidebar error: ${error.message}`);
            }
        };
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
            
            // Create sidebar component
            this.sidebar = new Sidebar(this.sidebarConfig, this.sidebarEvents);
            const sidebarElement = this.sidebar.create();
            // Sidebar manages its own DOM insertion
            
            this.isInitialized = true;
            return true;

        } catch (error) {
            this.log(`Failed to initialize UI Manager: ${error}`);
            return false;
        }
    }

    /**
     * Show the sidebar with loading state
     */
    public async showSidebar(): Promise<boolean> {
        if (!this.ensureInitialized()) {
            return false;
        }

        if (!this.sidebar) {
            this.log('Sidebar not initialized');
            return false;
        }

        try {
            await this.sidebar.show();
            this.sidebar.showLoading();
            return true;
        } catch (error) {
            this.log(`Failed to show sidebar: ${error}`);
            return false;
        }
    }

    /**
     * DEPRECATED: Show the loading square (maintained for backward compatibility)
     * @deprecated Use showSidebar() instead
     */
    public async showLoadingSquare(): Promise<boolean> {
        return this.showSidebar();
    }

    /**
     * Hide the sidebar
     */
    public async hideSidebar(): Promise<boolean> {
        if (!this.sidebar) {
            return true;
        }

        try {
            await this.sidebar.hide();
            return true;
        } catch (error) {
            this.log(`Failed to hide sidebar: ${error}`);
            return false;
        }
    }

    /**
     * DEPRECATED: Hide the loading square (maintained for backward compatibility)
     * @deprecated Use hideSidebar() instead
     */
    public async hideLoadingSquare(): Promise<boolean> {
        return this.hideSidebar();
    }

    /**
     * Update loading state
     */
    public updateLoadingState(state: LoadingState): void {
        if (this.sidebar) {
            // Map loading states to sidebar content states
            switch (state) {
                case LoadingState.LOADING:
                case LoadingState.PROCESSING:
                    this.sidebar.showLoading({
                        message: state === LoadingState.PROCESSING ? 'Processing...' : 'Finding products...',
                        subMessage: 'Analyzing your paused scene.',
                        spinnerSize: 'medium'
                    });
                    break;
                case LoadingState.NO_PRODUCTS_FOUND:
                    this.sidebar.showNoProducts();
                    break;
            }
        }
        
        this.events.onStateChange?.(state);
    }

    /**
     * Show "no products found" state and auto-hide after timeout
     */
    public async showNoProductsFound(timeoutMs?: number): Promise<boolean> {
        if (!this.sidebar) {
            return false;
        }

        try {
            // Clear any existing timeout
            if (this.noProductsFoundTimeoutId) {
                clearTimeout(this.noProductsFoundTimeoutId);
                this.noProductsFoundTimeoutId = null;
            }

            // Show no products state in sidebar
            this.sidebar.showNoProducts({
                title: 'No products found.',
                message: 'Try a different scene or ensure items are clearly visible.',
                iconType: 'search',
                showRetryButton: false
            });

            // Use configured timeout or default
            const timeout = timeoutMs ?? this.loadingSquareConfig.noProductsFoundTimeout ?? 8000;
            
            // Auto-hide after timeout
            this.noProductsFoundTimeoutId = setTimeout(async () => {
                this.noProductsFoundTimeoutId = null;
                await this.hideSidebar();
            }, timeout);
            
            return true;
        } catch (error) {
            this.log(`Failed to show no products found state: ${error}`);
            return false;
        }
    }

    /**
     * Show products in sidebar
     */
    public async showProducts(productData: ProductDisplayData[]): Promise<boolean> {
        if (!this.ensureInitialized() || !productData.length) {
            return false;
        }

        if (!this.sidebar) {
            return false;
        }

        try {
            await this.sidebar.showProducts(productData);
            return true;
        } catch (error) {
            this.log(`Failed to show products in sidebar: ${error}`);
            return false;
        }
    }

    /**
     * DEPRECATED: Show product grid (maintained for backward compatibility)
     * @deprecated Use showProducts() instead
     */
    public async showProductGrid(productData: ProductDisplayData[]): Promise<boolean> {
        return this.showProducts(productData);
    }

    /**
     * DEPRECATED: Hide the product grid (maintained for backward compatibility)
     * @deprecated Use hideSidebar() instead
     */
    public async hideProductGrid(): Promise<boolean> {
        return this.hideSidebar();
    }

    /**
     * DEPRECATED: Check if product grid is currently visible (maintained for backward compatibility)
     * @deprecated Use isUIVisible() instead
     */
    public isProductGridVisible(): boolean {
        return this.isUIVisible();
    }

    /**
     * DEPRECATED: Get number of products in grid (maintained for backward compatibility)
     * @deprecated Use sidebar methods instead
     */
    public getProductCount(): number {
        // This information is not easily accessible from the sidebar
        // Return 0 as a safe default
        return 0;
    }

    /**
     * Hide all UI components
     */
    public async hideUI(): Promise<void> {
        await this.hideSidebar();
    }

    /**
     * Check if UI is currently visible
     */
    public isUIVisible(): boolean {
        return this.sidebar?.isVisible() ?? false;
    }

    /**
     * Get current loading state
     */
    public getCurrentState(): LoadingState {
        if (this.sidebar) {
            // Map sidebar state to loading state
            const sidebarState = this.sidebar.getCurrentState();
            switch (sidebarState) {
                case SidebarState.VISIBLE:
                    return LoadingState.LOADING; // Default to loading when visible
                case SidebarState.SLIDING_IN:
                    return LoadingState.SLIDING_IN;
                case SidebarState.SLIDING_OUT:
                    return LoadingState.SLIDING_OUT;
                default:
                    return LoadingState.HIDDEN;
            }
        }

        return LoadingState.HIDDEN;
    }

    /**
     * DEPRECATED: Get current product grid state (maintained for backward compatibility)
     * @deprecated Use getCurrentState() instead
     */
    public getProductGridState(): LoadingState {
        return this.getCurrentState();
    }

    /**
     * Get current sidebar state
     */
    public getCurrentSidebarState(): SidebarState {
        return this.currentSidebarState;
    }

    /**
     * Check if any animations are running
     */
    public isAnimating(): boolean {
        if (this.sidebar) {
            const state = this.sidebar.getCurrentState();
            return state === SidebarState.SLIDING_IN || state === SidebarState.SLIDING_OUT;
        }

        return false;
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

        // Cleanup sidebar
        if (this.sidebar) {
            this.sidebar.cleanup();
            this.sidebar = null;
        }

        // Remove container from DOM
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;

        this.currentSidebarState = SidebarState.HIDDEN;
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
        sidebarConfig?: Partial<SidebarConfig>
    ): UIManager | null {
        try {
            const manager = new UIManager(
                config,
                loadingSquareConfig,
                events,
                sidebarConfig
            );
            if (manager.initialize()) {
                return manager;
            }
            return null;
        } catch (error) {
            console.error('PauseShop: Failed to create UI Manager:', error);
            return null;
        }
    }

    /**
     * DEPRECATED: Static method to create UI manager with legacy components (for backward compatibility)
     * @deprecated Use create() instead
     */
    public static createLegacy(
        config?: Partial<UIConfig>,
        loadingSquareConfig?: Partial<LoadingSquareConfig>,
        events?: UIManagerEvents
    ): UIManager | null {
        return UIManager.create(config, loadingSquareConfig, events, {});
    }
}
