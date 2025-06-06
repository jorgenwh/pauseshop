/**
 * UI-specific type definitions for PauseShop extension
 */

import { AmazonScrapedProduct, ProductCategory } from "../types/amazon";
import { Product } from "../background/api-client"; // Import Product
import { ProductCard } from "./components/product-card";

export enum LoadingState {
    HIDDEN = "hidden",
    SLIDING_IN = "sliding-in",
    LOADING = "loading",
    PROCESSING = "processing",
    NO_PRODUCTS_FOUND = "no-products-found",
    SLIDING_OUT = "sliding-out",
}

export enum ProductDisplayState {
    HIDDEN = "hidden",
    SLIDING_OUT = "sliding-out",
    DISPLAYED = "displayed",
}

export interface UIConfig {
    enableLogging: boolean;
    logPrefix: string;
    containerClassName: string;
    zIndex: number;
}

export interface LoadingSquareConfig {
    size: number;
    borderRadius: number;
    backgroundColor: string;
    position: {
        top: number;
        right: number;
    };
    animations: {
        slideInDuration: number;
        slideOutDuration: number;
        pulseDuration: number;
    };
    noProductsFoundTimeout?: number; // milliseconds to show before auto-hide (default: 3000)
}

export interface AnimationConfig {
    duration: number;
    easing: string;
    iterations?: number;
}

export interface UIManagerEvents {
    onShow?: () => void;
    onHide?: () => void;
    onStateChange?: (state: LoadingState) => void;
    onProductGridShow?: () => void;
    onProductGridHide?: () => void;
}

export interface ProductDisplayData {
    name: string; // Added product name
    thumbnailUrl: string | null;
    allProducts: AmazonScrapedProduct[]; // Enhanced: All 1-5 products for category
    category: ProductCategory;
    fallbackText?: string;
}

// New sidebar-related types for the glassmorphic redesign
export enum SidebarState {
    HIDDEN = "hidden",
    SLIDING_IN = "sliding-in",
    VISIBLE = "visible",
    SLIDING_OUT = "sliding-out",
}

export enum SidebarContentState {
    LOADING = "loading",
    PRODUCTS = "products",
    NO_PRODUCTS = "no-products",
    ERROR = "error",
}

export interface SidebarConfig {
    width: number;
    position: "right" | "left";
    animations: {
        slideInDuration: number;
        slideOutDuration: number;
    };
    enableBackdropBlur: boolean;
    enableGlassmorphism: boolean;
}

export interface SidebarHeaderConfig {
    title: string;
    showCloseButton: boolean;
    onClose?: () => void;
}

export interface LoadingStateConfig {
    message: string;
    subMessage?: string;
    spinnerSize: "small" | "medium" | "large" | "initial";
}

export interface ProductListConfig {
    maxHeight: string;
    enableVirtualScrolling: boolean;
    itemSpacing: number;
}

export interface ProductCardConfig {
    product: ProductDisplayData;
    isExpanded: boolean;
    onToggleExpansion: (card: ProductCard) => void | Promise<void>;
    onAmazonProductClick: (product: AmazonScrapedProduct) => void;
    animations: {
        expansionDuration: number;
        hoverTransitionDuration: number;
    };
}

export interface AmazonProductGridConfig {
    products: AmazonScrapedProduct[];
    columns: number;
    onProductClick: (product: AmazonScrapedProduct) => void;
    showPrices: boolean;
    showRatings: boolean;
}

export interface MessageStateConfig {
    title: string;
    message: string;
    iconType: "search" | "empty" | "error";
    showRetryButton: boolean;
    onRetry?: () => void;
}

// Events for the new sidebar system
export interface SidebarEvents {
    onShow?: () => void;
    onHide?: () => void;
    onStateChange?: (state: SidebarState) => void;
    onContentStateChange?: (state: SidebarContentState) => void;
    onProductClick?: (product: AmazonScrapedProduct) => void;
    onError?: (error: Error) => void;
    onRetry?: () => void; // Added for retry button in error/no products state
}

// Message types for communication with the background script
export interface AnalysisStartedMessage {
    type: "analysis_started";
    pauseId?: string;
}

export interface ProductGroupUpdateMessage {
    type: "product_group_update";
    originalProduct: Product;
    scrapedProducts: AmazonScrapedProduct[];
    pauseId?: string;
}

export interface AnalysisCompleteMessage {
    type: "analysis_complete";
    pauseId?: string;
}

export interface AnalysisErrorMessage {
    type: "analysis_error";
    error: string;
    pauseId?: string;
}

export type BackgroundMessage =
    | AnalysisStartedMessage
    | ProductGroupUpdateMessage
    | AnalysisCompleteMessage
    | AnalysisErrorMessage;

// Forward declarations for new components
export interface Sidebar {
    show(): Promise<void>;
    hide(): Promise<void>;
    isVisible(): boolean;
    getCurrentState(): SidebarState;
    setContentState(state: SidebarContentState): void;
    showProducts(products: ProductDisplayData[]): Promise<void>;
    showLoading(config?: LoadingStateConfig): void;
    showNoProducts(config?: MessageStateConfig): void;
    cleanup(): void;
    addProduct(product: ProductDisplayData): Promise<void>; // Add addProduct method
    hasProducts(): boolean; // Add hasProducts method
}

// Enhanced UI Manager configuration for sidebar
export interface SidebarUIConfig extends UIConfig {
    sidebarConfig: SidebarConfig;
    headerConfig: SidebarHeaderConfig;
    loadingConfig: LoadingStateConfig;
    productListConfig: ProductListConfig;
    messageStateConfig: MessageStateConfig;
}
