/**
 * Main UI manager for PauseShop extension
 * Orchestrates all UI components and handles lifecycle management
 */

import React from "react";
import ReactDOM from "react-dom/client";
import Sidebar from "./components/sidebar/sidebar";
import { AmazonScrapedProduct } from "../types/amazon";
import {
    SidebarContentState,
    SidebarConfig,
    SidebarEvents,
    BackgroundMessage,
    AnalysisStartedMessage,
    AnalysisCompleteMessage,
    AnalysisErrorMessage,
    ProductGroupUpdateMessage,
    ProductStorage,
    AnalysisCancelledMessage,
} from "./types";
import { getSidebarPosition, setSidebarPosition } from "../storage";
import { triggerRetryAnalysis } from "../content/video-detector";
import { ContentDetector } from "./layout/content-detector";
import { RelativePositionCalculator } from "./layout/relative-position-calculator";
import { LayoutMonitor } from "./layout/layout-monitor";
import { ContentBounds, PositionStrategy, RelativePositionConfig } from "./layout/types";
import { COMPACT_SIDEBAR_WIDTH, EXPANDED_SIDEBAR_WIDTH } from "./constants";
import "./layout/debug"; // Import debug utilities

export class UIManager {
    private container: HTMLElement | null = null;
    private reactRoot: ReactDOM.Root | null = null; // React root for the sidebar

    // Internal state for the React sidebar
    private sidebarVisible: boolean = false;
    private sidebarContentState: SidebarContentState =
        SidebarContentState.LOADING;
    private sidebarConfig: SidebarConfig;
    private errorMessage: string = "";
    private sidebarEvents: SidebarEvents; // Events for UIManager to handle or pass to React component

    private productStorage: ProductStorage = { pauseId: "", productGroups: [] };

    // Layout-aware positioning components
    private contentDetector = new ContentDetector();
    private positionCalculator = new RelativePositionCalculator();
    private layoutMonitor: LayoutMonitor | null = null;
    private currentPositionStrategy: PositionStrategy | null = null;
    private isCompact: boolean = true; // Track sidebar state for width calculations

    private isInitialized: boolean = false;

    constructor() {
        this.sidebarConfig = {
            position: "left", // Default value, will be updated from storage
            useContentRelativePositioning: true, // Enable content-relative positioning by default
        };

        this.sidebarEvents = {
            onShow: () => {
                // Recalculate position when sidebar is shown
                this.calculateSidebarPosition();
            },
            onHide: () => {
                this.productStorage = { pauseId: "", productGroups: [] };
                this.sidebarContentState = SidebarContentState.LOADING;
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
            onClose: () => {
                if (this.productStorage.pauseId) {
                    browser.runtime.sendMessage({
                        type: "cancel_analysis",
                        pauseId: this.productStorage.pauseId,
                    });
                }
                this.hideSidebar();
            },
            onRetryAnalysis: () => {
                triggerRetryAnalysis();
            },
        };

        // Load sidebar position from storage
        getSidebarPosition().then((position) => {
            this.sidebarConfig.position = position;
            this.calculateSidebarPosition();
            this.renderSidebar();
        });

        browser.runtime.onMessage.addListener(this.handleBackgroundMessages);
    }

    /**
     * Calculate optimal sidebar position based on content layout
     * Only applies content-relative positioning for specific content types (currently YouTube Shorts)
     * Regular YouTube videos and other content use original edge positioning
     */
    private calculateSidebarPosition(): void {
        if (!this.sidebarConfig.useContentRelativePositioning) {
            this.currentPositionStrategy = null;
            return;
        }

        const contentBounds = this.detectCurrentContent();

        if (contentBounds) {
            // Content-relative positioning detected (currently only YouTube Shorts)
            const config: RelativePositionConfig = {
                offsetGap: 100,
                preferredSide: this.sidebarConfig.position,
                fallbackPosition: {
                    side: this.sidebarConfig.position,
                    offset: 20
                }
            };

            const sidebarWidth = this.getCurrentSidebarWidth();
            this.currentPositionStrategy = this.positionCalculator.calculatePosition(
                contentBounds,
                sidebarWidth,
                config
            );

            console.log(`[PauseShop:UIManager] Using content-relative positioning:`, {
                strategy: this.currentPositionStrategy,
                contentType: contentBounds.type,
                contentBounds: contentBounds.bounds
            });
        } else {
            // No special content detected - use original edge positioning
            // This includes regular YouTube videos, generic videos, etc.
            this.currentPositionStrategy = null;
            console.log(`[PauseShop:UIManager] Using original edge positioning (no special content detected)`);
        }
    }

    /**
     * Detect current content for positioning
     */
    private detectCurrentContent(): ContentBounds | null {
        return this.contentDetector.detectContent();
    }

    /**
     * Get current sidebar width based on compact state
     */
    private getCurrentSidebarWidth(): number {
        return this.isCompact ? COMPACT_SIDEBAR_WIDTH : EXPANDED_SIDEBAR_WIDTH;
    }

    /**
     * Handle layout changes and recalculate position
     */
    private handleLayoutChange = (): void => {
        console.log(`[PauseShop:UIManager] Layout change detected, recalculating position`);
        this.calculateSidebarPosition();
        this.renderSidebar();
    };

    /**
     * Periodic position update (called from URL check interval)
     * This is much more efficient than DOM mutation observers
     */
    public updatePositionIfNeeded(): void {
        if (!this.sidebarVisible || !this.sidebarConfig.useContentRelativePositioning) {
            return;
        }

        const previousStrategy = this.currentPositionStrategy;
        this.calculateSidebarPosition();
        
        // Only re-render if position actually changed
        if (JSON.stringify(previousStrategy) !== JSON.stringify(this.currentPositionStrategy)) {
            console.log(`[PauseShop:UIManager] Position changed, re-rendering sidebar`);
            this.renderSidebar();
        }
    };

    private createContainer(): void {
        const existingContainer = document.querySelector(
            ".pauseshop-ui-container",
        );
        if (existingContainer) {
            existingContainer.remove();
        }

        this.container = document.createElement("div");
        this.container.className = "pauseshop-ui-container";

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

            // Set up layout monitoring
            this.layoutMonitor = new LayoutMonitor(this.handleLayoutChange);

            this.renderSidebar(); // Initial render of the React sidebar

            this.isInitialized = true;
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
                        positionStrategy={this.currentPositionStrategy || undefined}
                        productStorage={this.productStorage}
                        onShow={this.sidebarEvents.onShow}
                        onHide={this.sidebarEvents.onHide}
                        onProductClick={this.sidebarEvents.onProductClick}
                        onClose={this.sidebarEvents.onClose}
                        onRetryAnalysis={this.sidebarEvents.onRetryAnalysis}
                        errorMessage={this.errorMessage}
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

        // Recalculate position when showing sidebar
        this.calculateSidebarPosition();
        this.renderSidebar();
        return true;
    }

    /**
     * Hide the sidebar
     */
    public async hideSidebar(): Promise<boolean> {
        this.sidebarVisible = false;
        this.errorMessage = ""; // Reset error message when hiding sidebar
        this.renderSidebar();
        return true;
    }

    /**
     * Show "no products found" state
     */
    public async showNoProductsFound(): Promise<boolean> {
        if (!this.isInitialized) {
            if (!this.initialize()) {
                return false;
            }
        }

        this.sidebarContentState = SidebarContentState.NO_PRODUCTS;
        this.renderSidebar();

        return true;
    }

    private handleAnalysisStarted = (
        message: AnalysisStartedMessage,
    ): boolean => {
        // Update the current pauseId when a new analysis starts
        this.productStorage = { pauseId: message.pauseId, productGroups: [] };
        this.sidebarContentState = SidebarContentState.LOADING;
        this.sidebarVisible = true; // Make sure sidebar is visible when analysis starts
        this.errorMessage = ""; // Reset error message when starting a new analysis
        this.renderSidebar();
        return true;
    };

    private handleAnalysisComplete = (
        message: AnalysisCompleteMessage,
    ): boolean => {
        if (this.productStorage.pauseId !== message.pauseId) {
            console.warn(
                `[PauseShop:UIManager] Ignoring analysis_complete from old pauseId: ${message.pauseId}`,
            );
            return false;
        }

        // If analysis is complete and no products have been found, update state
        if (this.productStorage.productGroups.length === 0) {
            this.sidebarContentState = SidebarContentState.NO_PRODUCTS;
            this.renderSidebar();
        }

        return true;
    };

    private handleAnalysisError = (message: AnalysisErrorMessage): boolean => {
        console.error(
            `[PauseShop:UIManager] Received analysis_error message for pauseId: ${message.pauseId}`,
        );
        this.sidebarContentState = SidebarContentState.ERROR;
        this.sidebarVisible = true; // Make sure sidebar is visible to show error
        this.errorMessage = message.error || "Unknown error occurred"; // Store the error message
        this.renderSidebar();
        return true;
    };

    private handleProductGroupUpdate = (
        message: ProductGroupUpdateMessage,
    ): boolean => {
        // Ignore updates from old pauseIds
        if (this.productStorage.pauseId !== message.pauseId) {
            return false;
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

    private handleAnalysisCancelled = (
        message: AnalysisCancelledMessage,
    ): boolean => {
        // Only hide sidebar if this is the current pauseId
        if (this.productStorage.pauseId === message.pauseId) {
            this.hideSidebar();
        }
        return true;
    };

    /**
     * Handle messages from the background script
     */
    private handleBackgroundMessages = (
        message: BackgroundMessage,
        _sender: Browser.runtime.MessageSender,
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
            case "analysis_cancelled":
                result = this.handleAnalysisCancelled(message);
                break;
            case "toggleSidebarPosition":
                this.toggleSidebarPosition();
                result = true;
                break;
            case "cancel_analysis":
                this.hideSidebar();
                result = true;
                break;
            default:
                result = false;
                // Cast message to BackgroundMessage to access 'type' property safely
                console.warn("[PauseShop:UIManager] Received unhandled background message:", (message as BackgroundMessage).type);
        }
        sendResponse(result);
    };

    private async toggleSidebarPosition(): Promise<void> {
        const newPosition =
            this.sidebarConfig.position === "left" ? "right" : "left";
        this.sidebarConfig.position = newPosition;
        await setSidebarPosition(newPosition);

        // Recalculate position with new preference
        this.calculateSidebarPosition();
        this.renderSidebar();
    }

    public cleanup(): void {
        if (this.layoutMonitor) {
            this.layoutMonitor.cleanup();
            this.layoutMonitor = null;
        }

        if (this.reactRoot) {
            this.reactRoot.unmount();
            this.reactRoot = null;
        }

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;

        this.currentPositionStrategy = null;
        this.isInitialized = false;

        browser.runtime.onMessage.removeListener(this.handleBackgroundMessages);
    }

    public static create(): UIManager | null {
        try {
            const manager = new UIManager();
            if (manager.initialize()) {
                return manager;
            }
            return null;
        } catch (error) {
            console.error("[PauseShop:UIManager] Failed to create UI Manager:", error);
            return null;
        }
    }
}


