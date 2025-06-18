/**
 * UI-specific type definitions for PauseShop extension
 */

import { AmazonScrapedProduct } from "../types/amazon";
import { Category, Product } from "../types/common";

export interface ProductDisplayData {
    name: string;
    products: AmazonScrapedProduct[];
    category: Category;
}

export interface ProductGroup {
    product: Product;
    scrapedProducts: AmazonScrapedProduct[];
}

export interface ProductStorage {
    pauseId: string;
    productGroups: ProductGroup[];
}

export enum SidebarState {
    HIDDEN = "hidden",
    VISIBLE = "visible",
    SLIDING_IN = "sliding-in",
    SLIDING_OUT = "sliding-out",
}

export enum SidebarContentState {
    LOADING = "loading",
    PRODUCTS = "products",
    NO_PRODUCTS = "no-products",
    ERROR = "error",
}

export type SidebarPosition = "left" | "right";

export interface SidebarConfig {
    position: SidebarPosition;
}

export interface SidebarEvents {
    onShow: () => void;
    onHide: () => void;
    onContentStateChange: (state: SidebarContentState) => void;
    onProductClick: (product: AmazonScrapedProduct) => void;
    onError: (error: Error) => void;
    onClose: () => void; // New event for closing the UI and stopping background processing
    onRetryAnalysis: () => void;
}

// Message types for communication with the background script
export interface AnalysisStartedMessage {
    type: "analysis_started";
    pauseId: string;
}

export interface ProductGroupUpdateMessage {
    type: "product_group_update";
    originalProduct: Product;
    scrapedProducts: AmazonScrapedProduct[];
    pauseId: string;
}

export interface AnalysisCompleteMessage {
    type: "analysis_complete";
    pauseId: string;
}

export interface AnalysisErrorMessage {
    type: "analysis_error";
    error: string;
    pauseId: string;
}

export interface AnalysisCancelledMessage {
    type: "analysis_cancelled";
    pauseId: string;
}

export interface ToggleSidebarPositionMessage {
    type: "toggleSidebarPosition";
}

export interface RetryAnalysisMessage {
    type: "retry_analysis";
}

export type BackgroundMessage =
    | AnalysisStartedMessage
    | ProductGroupUpdateMessage
    | AnalysisCompleteMessage
    | AnalysisErrorMessage
    | AnalysisCancelledMessage
    | ToggleSidebarPositionMessage
    | RetryAnalysisMessage;
