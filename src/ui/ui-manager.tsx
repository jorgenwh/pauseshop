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
import {
    clickHistory,
    ClickHistoryEntry,
    sessionData,
    sidebarPosition,
} from "../storage";
import { triggerRetryAnalysis } from "../content/video-detector";
import { getWebsiteBaseUrl } from "../background/server-config";

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
    private currentPageUrl: string = "";
    private videoElement: HTMLVideoElement | null = null;

    private isInitialized: boolean = false;

    constructor(currentPageUrl: string, videoElement: HTMLVideoElement | null) {
        this.currentPageUrl = currentPageUrl;
        this.videoElement = videoElement;
        this.sidebarConfig = {
            position: "left", // Default value, will be updated from storage
        };

        this.sidebarEvents = {
            onShow: () => { },
            onHide: () => {
                this.productStorage = { pauseId: "", productGroups: [] };
                this.sidebarContentState = SidebarContentState.LOADING;
            },
            onProductClick: async (product: AmazonScrapedProduct) => {
                try {
                    if (!this.productStorage.pauseId) {
                        console.error(
                            "[PauseShop:UIManager] No pauseId available for product click",
                        );
                        return;
                    }

                    const currentSession = await sessionData.getValue();
                    if (currentSession) {
                        await sessionData.setValue({
                            ...currentSession,
                            clickedProduct: product,
                        });
                    }

                    // New click history logic
                    const productGroup = this.productStorage.productGroups.find(
                        (pg) =>
                            pg.scrapedProducts.some((p) => p.id === product.id),
                    );

                    if (productGroup) {
                        let history = await clickHistory.getValue();
                        if (!Array.isArray(history)) {
                            history = [];
                        }
                        const pauseId = this.productStorage.pauseId;
                        const newEntry: ClickHistoryEntry = {
                            pauseId,
                            clickedProduct: product,
                            productGroup: productGroup,
                        };

                        const newHistory = [...history, newEntry];

                        // Enforce total limit of 20 entries
                        if (newHistory.length > 20) {
                            newHistory.shift(); // Remove the oldest entry
                        }

                        await clickHistory.setValue(newHistory);

                        // Log the entire click history for verification
                        const updatedHistory = await clickHistory.getValue();
                        console.log(
                            "[PauseShop:UIManager] Updated Click History:",
                            updatedHistory,
                        );
                    }

                    const baseUrl = getWebsiteBaseUrl();
                    const extensionId = browser.runtime.id;
                    const url = new URL(`${baseUrl}/referrer`);
                    url.searchParams.append("extensionId", extensionId);
                    window.open(url.toString(), "_blank");
                } catch (error) {
                    console.error(
                        "[PauseShop:UIManager] Error handling product click:",
                        error,
                    );
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
        sidebarPosition.getValue().then((position) => {
            this.sidebarConfig.position = position;
            this.renderSidebar();
        });

        browser.runtime.onMessage.addListener(this.handleBackgroundMessages);
    }

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
                        productStorage={this.productStorage}
                        onShow={this.sidebarEvents.onShow}
                        onHide={this.sidebarEvents.onHide}
                        onProductClick={this.sidebarEvents.onProductClick}
                        onClose={this.sidebarEvents.onClose}
                        onRetryAnalysis={this.sidebarEvents.onRetryAnalysis}
                        errorMessage={this.errorMessage}
                        currentPageUrl={this.currentPageUrl}
                        videoElement={this.videoElement}
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
        // Clear previous session data
        sessionData.setValue(null);

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

        // Update product storage whenever it's updated
        sessionData.setValue(this.productStorage);

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
        await sidebarPosition.setValue(newPosition);
        this.renderSidebar();
    }

    /**
     * Update the video element reference
     */
    public updateVideoElement(videoElement: HTMLVideoElement | null): void {
        this.videoElement = videoElement;
        // Re-render sidebar to pass the updated video element
        this.renderSidebar();
    }

    public cleanup(): void {
        if (this.reactRoot) {
            this.reactRoot.unmount();
            this.reactRoot = null;
        }

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;

        this.isInitialized = false;

        browser.runtime.onMessage.removeListener(this.handleBackgroundMessages);
    }

    public static create(currentPageUrl: string, videoElement: HTMLVideoElement | null): UIManager | null {
        try {
            const manager = new UIManager(currentPageUrl, videoElement);
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


