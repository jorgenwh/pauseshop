/**
 * Main UI manager for PauseShop extension
 * Orchestrates all UI components and handles lifecycle management
 */

import React from "react";
import ReactDOM from "react-dom/client";
import Sidebar from "./components/Sidebar"; // New React component
import { AmazonScrapedProduct } from "../types/amazon";
import {
    DEFAULT_SIDEBAR_POSITION,
    DEFAULT_COMPACT,
    NO_PRODUCTS_TIMEOUT_MS,
    UI_CONTAINER_CLASS_NAME,
} from "./constants";
import {
    // ProductDisplayData,
    SidebarContentState,
    SidebarConfig,
    SidebarEvents,
    BackgroundMessage,
    AnalysisStartedMessage,
    AnalysisCompleteMessage,
    AnalysisErrorMessage,
    ProductGroupUpdateMessage,
    ProductStorage
} from "./types";

export class UIManager {
    private container: HTMLElement | null = null;
    private reactRoot: ReactDOM.Root | null = null; // React root for the sidebar

    // Internal state for the React sidebar
    private sidebarVisible: boolean = false;
    private sidebarContentState: SidebarContentState =
        SidebarContentState.LOADING;
    private sidebarConfig: SidebarConfig;
    private sidebarEvents: SidebarEvents; // Events for UIManager to handle or pass to React component

    private productStorage: ProductStorage = { pauseId: "", productGroups: [] };

    private isInitialized: boolean = false;
    private noProductsFoundTimeoutId: NodeJS.Timeout | null = null;

    constructor() {
        this.sidebarConfig = {
            position: DEFAULT_SIDEBAR_POSITION,
            compact: DEFAULT_COMPACT,
        };

        // Initialize with actual event handlers
        this.sidebarEvents = {
            onShow: () => {
                console.log("Sidebar shown.");
            },
            onHide: () => {
                console.log("Sidebar hidden.");
                this.productStorage = { pauseId: "", productGroups: [] };
                this.sidebarContentState = SidebarContentState.LOADING;
            },
            onContentStateChange: (state: SidebarContentState) => {
                console.log(`Sidebar content state changed to: ${state}`);
            },
            onProductClick: (product: AmazonScrapedProduct) => {
                if (product.amazonAsin) {
                    window.open(
                        `https://www.amazon.com/dp/${product.amazonAsin}`,
                        "_blank",
                    );
                } else if (product.productUrl) {
                    const decodedUrl = product.productUrl.replace(/&/g, "&");
                    window.open(decodedUrl, "_blank");
                }
            },
            onError: (error: Error) => {
                console.error(`Sidebar error: ${error.message}`);
            },
            onToggleCompact: () => {
                this.sidebarConfig.compact = !this.sidebarConfig.compact;
                this.renderSidebar();
            },
            onTogglePosition: () => {
                this.sidebarConfig.position =
                    this.sidebarConfig.position === "right" ? "left" : "right";
                this.renderSidebar();
            },
        };

        // Add message listener for background script communication only once
        chrome.runtime.onMessage.addListener(this.handleBackgroundMessages);
    }

    private createContainer(): void {
        const existingContainer = document.querySelector(
            `.${UI_CONTAINER_CLASS_NAME}`,
        );
        if (existingContainer) {
            existingContainer.remove();
        }

        this.container = document.createElement("div");
        this.container.className = UI_CONTAINER_CLASS_NAME;

        const containerStyles = {
            position: "fixed" as const,
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            pointerEvents: "none" as const,
            zIndex: "999999",
            userSelect: "none" as const,
        };
        Object.assign(this.container.style, containerStyles);

        // Append to document body
        document.body.appendChild(this.container);
    }

    public initialize(): boolean {
        if (this.isInitialized) {
            return true;
        }

        try {
            this.createContainer();
            if (!this.container) {
                throw new Error("UI container was not created.");
            }
            this.reactRoot = ReactDOM.createRoot(this.container);
            this.renderSidebar(); // Initial render of the React sidebar

            this.isInitialized = true;
            console.log("UIManager initialized successfully.");
            return true;
        } catch (error) {
            console.error(`Failed to initialize UI Manager: ${error}`);
            this.isInitialized = false; // Mark as not initialized on error
            return false;
        }
    }

    private renderSidebar(): void {
        if (this.reactRoot) {
            this.reactRoot.render(
                <React.StrictMode>
                    <Sidebar
                        isVisible={this.sidebarVisible}
                        contentState={this.sidebarContentState}
                        position={this.sidebarConfig.position}
                        compact={this.sidebarConfig.compact}
                        productStorage={this.productStorage}
                        onShow={this.sidebarEvents.onShow}
                        onHide={this.sidebarEvents.onHide}
                        onContentStateChange={
                            this.sidebarEvents.onContentStateChange
                        }
                        onProductClick={this.sidebarEvents.onProductClick}
                        onError={this.sidebarEvents.onError}
                        onToggleCompact={this.sidebarEvents.onToggleCompact}
                        onTogglePosition={this.sidebarEvents.onTogglePosition}
                    />
                </React.StrictMode>,
            );
        }
    }

    /**
     * Show the sidebar
     */
    public async showSidebar(): Promise<boolean> {
        if (!this.isInitialized) {
            if (!this.initialize()) {
                return false;
            }
        }
        this.sidebarVisible = true;
        // Ensure content state is loading and clear products on initial show
        // only if not already in loading state from an analysis start
        if (this.sidebarContentState !== SidebarContentState.LOADING) {
            this.sidebarContentState = SidebarContentState.LOADING;
            this.productStorage = { pauseId: "", productGroups: [] };
        }
        this.renderSidebar();
        return true;
    }

    /**
     * Hide the sidebar
     */
    public async hideSidebar(): Promise<boolean> {
        this.sidebarVisible = false;
        this.renderSidebar();
        return true;
    }

    /**
     * Show "no products found" state and auto-hide after timeout
     */
    public async showNoProductsFound(): Promise<boolean> {
        if (!this.isInitialized) {
            if (!this.initialize()) {
                return false;
            }
        }
        // Clear any existing timeout
        if (this.noProductsFoundTimeoutId) {
            clearTimeout(this.noProductsFoundTimeoutId);
            this.noProductsFoundTimeoutId = null;
        }

        this.sidebarContentState = SidebarContentState.NO_PRODUCTS;
        this.renderSidebar();

        // Auto-hide after timeout
        this.noProductsFoundTimeoutId = setTimeout(async () => {
            this.noProductsFoundTimeoutId = null;
            await this.hideSidebar();
        }, NO_PRODUCTS_TIMEOUT_MS);

        return true;
    }

    private handleAnalysisStarted = (
        message: AnalysisStartedMessage,
    ): boolean => {
        console.info(
            `Received analysis_started for pauseId: ${message.pauseId}`,
        );
        this.sidebarContentState = SidebarContentState.LOADING;
        this.sidebarVisible = true; // Make sure sidebar is visible when analysis starts
        this.renderSidebar();
        return true;
    };

    private handleAnalysisComplete = (
        message: AnalysisCompleteMessage,
    ): boolean => {
        console.info(
            `Received analysis_complete for pauseId: ${message.pauseId}`,
        );
        // Maybe hide sidebar or change content to "results" state
        // For now, no change needed for completion
        return true;
    };

    private handleAnalysisError = (message: AnalysisErrorMessage): boolean => {
        console.error(
            `Received analysis_error for pauseId: ${message.pauseId}`,
        );
        this.sidebarContentState = SidebarContentState.ERROR;
        this.sidebarVisible = true; // Make sure sidebar is visible to show error
        this.renderSidebar();
        return true;
    };

    private handleProductGroupUpdate = (
        message: ProductGroupUpdateMessage,
    ): boolean => {
        console.info(
            `Received product_group_update for pauseId: ${message.pauseId} with ${message.scrapedProducts.length} products`,
        );

        if (this.productStorage.pauseId !== message.pauseId) {
            this.productStorage = { pauseId: message.pauseId, productGroups: [] };
        }

        this.productStorage.productGroups.push({
            product: message.originalProduct,
            scrapedProducts: message.scrapedProducts,
        });

        this.sidebarContentState = SidebarContentState.PRODUCTS;
        this.sidebarVisible = true; // Make sure sidebar is visible to show products

        this.renderSidebar();
        return true;
    };

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
        case "toggleSidebarPosition":
            this.sidebarEvents.onTogglePosition();
            result = true;
            break;
        default:
            result = false;
            // Cast message to BackgroundMessage to access 'type' property safely
            console.warn("UI manager received unhandled background message:", (message as BackgroundMessage).type);
        }
        sendResponse(result);
    };

    public cleanup(): void {
        // Clear any pending no products found timeout
        if (this.noProductsFoundTimeoutId) {
            clearTimeout(this.noProductsFoundTimeoutId);
            this.noProductsFoundTimeoutId = null;
        }

        // Unmount React component
        if (this.reactRoot) {
            this.reactRoot.unmount();
            this.reactRoot = null;
        }

        // Remove container from DOM if it exists and has a parent
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;

        this.isInitialized = false;

        // Remove message listener for background script communication
        chrome.runtime.onMessage.removeListener(this.handleBackgroundMessages);
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
