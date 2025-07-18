/**
 * UI-specific type definitions for FreezeFrame extension
 */

import { AmazonScrapedProduct } from "../types/amazon";
import { Product } from "../types/common";
import { ToggleSidebarPositionMessage } from "../background/types";

export interface ProductGroup {
    product: Product;
    scrapedProducts: AmazonScrapedProduct[];
}

export interface ProductStorage {
    pauseId: string;
    productGroups: ProductGroup[];
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
    onProductClick: (product: AmazonScrapedProduct) => void;
    onClose: () => void;
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


export interface RetryAnalysisMessage {
    type: "retryAnalysis";
}

export type BackgroundMessage =
    | AnalysisStartedMessage
    | ProductGroupUpdateMessage
    | AnalysisCompleteMessage
    | AnalysisErrorMessage
    | AnalysisCancelledMessage
    | ToggleSidebarPositionMessage
    | RetryAnalysisMessage
