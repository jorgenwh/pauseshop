/**
 * Main UI manager for PauseShop extension
 * Orchestrates all UI components and handles lifecycle management
 */

import { Sidebar } from "./components/sidebar";
import { AmazonScrapedProduct } from "../types/amazon";
import { 
    DEFAULT_DARK_MODE, 
    DEFAULT_SIDEBAR_POSITION, 
    DEFAULT_COMPACT,
    NO_PRODUCTS_TIMEOUT_MS,
    UI_CONTAINER_CLASS_NAME,
    UI_Z_INDEX
} from "./constants";
import {
    ProductDisplayData,
    SidebarContentState,
    SidebarConfig,
    SidebarEvents,
    BackgroundMessage,
    AnalysisStartedMessage,
    AnalysisCompleteMessage,
    AnalysisErrorMessage,
    ProductGroupUpdateMessage,
} from "./types";

export class UIManager {
    private container: HTMLElement | null = null;

    // Sidebar state management
    private sidebar: Sidebar | null = null;
    private sidebarConfig: SidebarConfig;
    private sidebarEvents: SidebarEvents;

    private isInitialized: boolean = false;
    private noProductsFoundTimeoutId: NodeJS.Timeout | null = null;

    constructor() {
        this.sidebarConfig = {
            darkMode: DEFAULT_DARK_MODE,
            position: DEFAULT_SIDEBAR_POSITION,
            compact: DEFAULT_COMPACT,
        };

        this.sidebarEvents = {
            onShow: () => {},
            onHide: () => {},
            onContentStateChange: (_state: SidebarContentState) => {},
            onProductClick: (product: AmazonScrapedProduct) => {
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
            onError: (error: Error) => {
                console.error(`Sidebar error: ${error.message}`);
            },
        };
    }

    // Initialize the UI manager and create container
    public initialize(): boolean {
        if (this.isInitialized) {
            return true;
        }

        try {
            this.createContainer();
            if (!this.container) {
                throw new Error("UI container was not created.");
            }
            this.sidebar = new Sidebar(
                this.container,
                this.sidebarConfig,
                this.sidebarEvents,
            );
            this.isInitialized = true;
            console.log("UIManager initialized successfully.");
            return true;
        } catch (error) {
            console.error(`Failed to initialize UI Manager: ${error}`);
            return false;
        }
    }

    /**
     * Show the sidebar
     */
    public async showSidebar(): Promise<boolean> {
        if (!this.initialize()) {
            return false;
        }

        if (!this.sidebar) {
            console.warn("Cannot show sidebar because it is not initialized");
            return false;
        }

        try {
            await this.sidebar.show();
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
     * Show "no products found" state and auto-hide after timeout
     */
    public async showNoProductsFound(): Promise<boolean> {
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
            this.sidebar.setContentState(SidebarContentState.NO_PRODUCTS);

            // Auto-hide after timeout
            this.noProductsFoundTimeoutId = setTimeout(async () => {
                this.noProductsFoundTimeoutId = null;
                await this.hideSidebar();
            }, NO_PRODUCTS_TIMEOUT_MS);

            return true;
        } catch (error) {
            console.error(`Failed to show no products found state: ${error}`);
            return false;
        }
    }

    private handleAnalysisStarted = (message: AnalysisStartedMessage): boolean => {
        console.info(
            `Received analysis_started for pauseId: ${message.pauseId}`,
        );
        if (!this.sidebar) {
            return false;
        }

        this.sidebar.setContentState(SidebarContentState.LOADING);

        return true;
    }

    private handleAnalysisComplete = (message: AnalysisCompleteMessage): boolean => {
        console.info(
            `Received analysis_complete for pauseId: ${message.pauseId}`,
        );
        return true;
    }

    private handleAnalysisError = (message: AnalysisErrorMessage): boolean => {
        console.error(
            `Received analysis_error for pauseId: ${message.pauseId}`,
        );
        if (!this.sidebar) {
            return false;
        }

        this.sidebar.showError();

        return true;
    }

    private handleProductGroupUpdate = (message: ProductGroupUpdateMessage): boolean => {
        console.info(
            `Received product_group_update for pauseId: ${message.pauseId} with ${message.scrapedProducts.length} products`,
        );

        return true;
    }

    /**
     * Handle messages from the background script
     */
    private handleBackgroundMessages = (
        message: BackgroundMessage,
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void,
    ) => {
        let result;
        switch (message.type) {
            case "analysis_started":
                result = this.handleAnalysisStarted(message);
                break;
            case "analysis_complete":
                result = this.handleAnalysisComplete(message);
                break;
            case "analysis_error":
                result = this.handleAnalysisError(message);
                break;
            case "product_group_update":
                result = this.handleProductGroupUpdate(message);
                break;
            default:
                result = false;
                console.warn("UI manager received bad background message");
        }
        sendResponse(result);
    };

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

        this.isInitialized = false;

        // Remove message listener for background script communication
        chrome.runtime.onMessage.removeListener(this.handleBackgroundMessages);
    }

    private createContainer(): void {
        const existingContainer = document.querySelector(
            `.${UI_CONTAINER_CLASS_NAME}`,
        );
        if (existingContainer) {
            existingContainer.remove();
        }

        this.container = document.createElement("div");
        this.container.className = UI_CONTAINER_CLASS_NAME

        const containerStyles = {
            position: "fixed" as const,
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            pointerEvents: "none" as const,
            zIndex: UI_Z_INDEX.toString(),
            userSelect: "none" as const,
        };
        Object.assign(this.container.style, containerStyles);

        // Append to document body
        document.body.appendChild(this.container);

        // Add message listener for background script communication
        chrome.runtime.onMessage.addListener(this.handleBackgroundMessages);
    }

    public static create(): UIManager | null {
        try {
            const manager = new UIManager();
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
