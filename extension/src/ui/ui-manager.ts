/**
 * Main UI manager for PauseShop extension
 * Orchestrates all UI components and handles lifecycle management
 */

import { Sidebar } from "./components/sidebar";
import { AmazonScrapedProduct, ProductCategory } from "../types/amazon";
import {
    LoadingState,
    UIManagerEvents,
    ProductDisplayData,
    SidebarState,
    SidebarContentState,
    SidebarConfig,
    SidebarEvents,
    BackgroundMessage,
} from "./types";

export class UIManager {
    private container: HTMLElement | null = null;
    private containerClassName: string = "pauseshop-ui-container";
    private zIndex: number = 999999;

    // Sidebar state management
    private sidebar: Sidebar | null = null;
    private currentSidebarState: SidebarState = SidebarState.HIDDEN;
    private sidebarConfig: SidebarConfig;
    private sidebarEvents: SidebarEvents;

    private events: UIManagerEvents;
    private isInitialized: boolean = false;
    private noProductsFoundTimeoutId: NodeJS.Timeout | null = null;

    constructor(
        events: UIManagerEvents = {},
        sidebarConfig: Partial<SidebarConfig> = {},
    ) {
        this.events = events;

        // Configure sidebar system
        this.sidebarConfig = {
            width: sidebarConfig.width || 388,
            position: sidebarConfig.position || "right",
            animations: {
                slideInDuration:
                    sidebarConfig.animations?.slideInDuration || 500,
                slideOutDuration:
                    sidebarConfig.animations?.slideOutDuration || 500,
            },
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
this.events.onShow?.();
                        break;
                    case SidebarContentState.NO_PRODUCTS:
                        this.events.onStateChange?.(
                            LoadingState.NO_PRODUCTS_FOUND,
                        );
                        break;
                }
            },
            onProductClick: (product) => {
                // Handle product clicks - open Amazon URL using ASIN
                if (product.amazonAsin) {
                    window.open(
                        `https://www.amazon.com/dp/${product.amazonAsin}`,
                        "_blank",
                    );
                } else if (product.productUrl) {
                    // Fallback to productUrl if ASIN is missing
                    const decodedUrl = product.productUrl.replace(/&/g, "&");
                    window.open(decodedUrl, "_blank");
                }
            },
            onError: (error) => {
                console.error(`Sidebar error: ${error.message}`);
            },
        };
    }

    /**
     * Initialize the UI manager and create container
     */
    public initialize(): boolean {
        if (this.isInitialized) {
            console.log("UIManager already initialized.");
            return true;
        }

        try {
            // Create main container
            this.createContainer();

            // Create sidebar component
            this.sidebar = new Sidebar(this.sidebarConfig, this.sidebarEvents);
            this.sidebar.create(); // Sidebar manages its own DOM insertion

            this.isInitialized = true;
            console.log("UIManager initialized successfully.");
            return true;
        } catch (error) {
            console.error(`Failed to initialize UI Manager: ${error}`);
            return false;
        }
    }

    /**
     * Show the sidebar with loading state
     */
    public async showSidebar(): Promise<boolean> {
        console.log("showSidebar called");
        if (!this.ensureInitialized()) {
            console.log("return early");
            return false;
        }

        if (!this.sidebar) {
            console.log("return early");
            console.warn("Sidebar not initialized");
            return false;
        }


        try {
            await this.sidebar.show();

            // log with timestamp that sidebar is shown
            console.log(
                `Sidebar shown at ${new Date().toISOString()}`
            );

            this.sidebar.setState("loading");
            return true;
        } catch (error) {
            console.error(`Failed to show sidebar: ${error}`);
            return false;
        }
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
            console.error(`Failed to hide sidebar: ${error}`);
            return false;
        }
    }


    /**
     * Update loading state
     */
    public updateLoadingState(state: LoadingState): void {
        if (this.sidebar) {
            // Map loading states to sidebar internal states
            switch (state) {
                case LoadingState.LOADING:
                case LoadingState.PROCESSING:
                    this.sidebar.setState("loading");
                    break;
                case LoadingState.NO_PRODUCTS_FOUND:
                    this.sidebar.setState("noProducts");
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

            // Show no products state in sidebar using new state management
            this.sidebar.setState("noProducts");

            // Use configured timeout or default
            const timeout =
                timeoutMs ??
                8000;

            // Auto-hide after timeout
            this.noProductsFoundTimeoutId = setTimeout(async () => {
                this.noProductsFoundTimeoutId = null;
                await this.hideSidebar();
            }, timeout);

            return true;
        } catch (error) {
            console.error(`Failed to show no products found state: ${error}`);
            return false;
        }
    }

    /**
     * Show products in sidebar
     */
    public async showProducts(
        productData: ProductDisplayData[],
    ): Promise<boolean> {
        if (!this.ensureInitialized()) {
            return false;
        }

        if (!this.sidebar) {
            return false;
        }

        try {
            // If products are provided, show them in the sidebar.
            // This path is primarily for non-streaming or initial display.
            if (productData && productData.length > 0) {
                this.sidebar.setState("productList");
                // Add products one by one using the new system
                for (const product of productData) {
                    await this.sidebar.addProduct(product);
                }
            } else {
                // If no products are provided, ensure the sidebar is in a loading state
                this.sidebar.setState("loading");
            }
            return true;
        } catch (error) {
            console.error(`Failed to show products in sidebar: ${error}`);
            return false;
        }
    }

    /**
     * Handle messages from the background script
     */
    private handleBackgroundMessages = (
        message: BackgroundMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void,
    ) => {
        if (message.type === "analysis_started") {
            console.info(
                `Received analysis_started for pauseId: ${message.pauseId}`,
            );
            this.sidebar?.setState("loading");
        } else if (message.type === "product_group_update") {
            console.info(
                `Received product_group_update for pauseId: ${message.pauseId} with ${message.scrapedProducts.length} products`,
            );

            // Create a single product display group for all scraped products
            const productDisplayData: ProductDisplayData = {
                name: message.originalProduct.name,
                thumbnailUrl: message.scrapedProducts[0]?.thumbnailUrl || "",
                allProducts: message.scrapedProducts.map(
                    (p: AmazonScrapedProduct) => ({
                        productId: p.productId,
                        amazonAsin: p.amazonAsin,
                        thumbnailUrl: p.thumbnailUrl,
                        productUrl: p.productUrl,
                        position: p.position,
                        confidence: p.confidence,
                    }),
                ),
                category: message.originalProduct.category as ProductCategory,
                fallbackText: message.originalProduct.searchTerms,
            };

            // Add the entire product group to the UI
            if (this.sidebar) {
                this.sidebar.addProduct(productDisplayData);
            }
        } else if (message.type === "analysis_complete") {
            console.info(
                `Received analysis_complete for pauseId: ${message.pauseId}`,
            );
            // Ensure the sidebar is in productList state if products were added
            // The sidebar's internal state should already be 'productList' if addProduct was called.
            // This prevents the sidebar from incorrectly showing 'noProducts' or hiding.
            if (this.sidebar?.hasProducts()) {
                this.sidebar.setState("productList");
            } else {
                // If no products were added at all, then show no products state
                this.sidebar?.setState("noProducts");
            }
        } else if (message.type === "analysis_error") {
            console.error(
                `Received analysis_error for pauseId: ${message.pauseId} - ${message.error}`,
            );
            this.sidebar?.showError({
                title: "Analysis Error",
                message:
                    message.error ||
                    "An unknown error occurred during analysis.",
                showRetryButton: true,
            });
        }
        sendResponse(true);
    };




    /**
    /**
     * @deprecated Use sidebar methods instead
     */

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
                case SidebarState.SLIDING_IN:
                    return LoadingState.LOADING; // Default to loading when visible or sliding in
                case SidebarState.SLIDING_OUT:
                    return LoadingState.HIDDEN; // Default to hidden when sliding out
                default:
                    return LoadingState.HIDDEN;
            }
        }

        return LoadingState.HIDDEN;
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
            return (
                state === SidebarState.SLIDING_IN ||
                state === SidebarState.SLIDING_OUT
            );
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

        // Remove message listener
        console.info("Removing background message listener.");
        chrome.runtime.onMessage.removeListener(this.handleBackgroundMessages);
    }

    /**
     * Create the main UI container
     */
    private createContainer(): void {
        // Remove existing container if it exists
        const existingContainer = document.querySelector(
            `.${this.containerClassName}`,
        );
        if (existingContainer) {
            existingContainer.remove();
        }

        this.container = document.createElement("div");
        this.container.className = this.containerClassName;

        // Apply container styles
        const containerStyles = {
            position: "fixed" as const,
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            pointerEvents: "none" as const,
            zIndex: this.zIndex.toString(),
            userSelect: "none" as const,
        };

        Object.assign(this.container.style, containerStyles);

        // Append to document body
        document.body.appendChild(this.container);

        // Add message listener for background script communication
        console.info("Adding background message listener.");
        chrome.runtime.onMessage.addListener(this.handleBackgroundMessages);
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
     * Static method to create and initialize a UI manager
     */
    public static create(
        events?: UIManagerEvents,
        sidebarConfig?: Partial<SidebarConfig>,
    ): UIManager | null {
        try {
            const manager = new UIManager(
                events,
                sidebarConfig,
            );
            if (manager.initialize()) {
                return manager;
            }
            return null;
        } catch (error) {
            console.error("PauseShop: Failed to create UI Manager:", error);
            return null;
        }
    }
}
