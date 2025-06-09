/**
 * UI-specific type definitions for PauseShop extension
 */

import { AmazonScrapedProduct, ProductCategory } from "../types/amazon";
import { Product } from "../background/api-client";

export interface ProductDisplayData {
    name: string;
    products: AmazonScrapedProduct[];
    category: ProductCategory;
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

export interface SidebarConfig {
    darkMode: boolean;
    position: "right" | "left";
}

export interface SidebarEvents {
    onShow: () => void;
    onHide: () => void;
    onContentStateChange: (state: SidebarContentState) => void;
    onProductClick: (product: AmazonScrapedProduct) => void;
    onError: (error: Error) => void;
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

export type BackgroundMessage =
    | AnalysisStartedMessage
    | ProductGroupUpdateMessage
    | AnalysisCompleteMessage
    | AnalysisErrorMessage;
