/**
 * UI-specific type definitions for PauseShop extension
 */

import { AmazonScrapedProduct, ProductCategory } from '../types/amazon';

export enum LoadingState {
    HIDDEN = 'hidden',
    SLIDING_IN = 'sliding-in',
    LOADING = 'loading',
    PROCESSING = 'processing',
    TRANSFORMING = 'transforming',
    NO_PRODUCTS_FOUND = 'no-products-found',
    SLIDING_OUT = 'sliding-out'
}

export enum ProductDisplayState {
    HIDDEN = 'hidden',
    SLIDING_OUT = 'sliding-out',
    DISPLAYED = 'displayed'
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
    thumbnailUrl: string | null;
    allProducts: AmazonScrapedProduct[]; // Enhanced: All 1-5 products for category
    category: ProductCategory;
    fallbackText?: string;
}

export interface ProductSquareConfig {
    size: number;
    borderRadius: number;
    backgroundColor: string;
    position: {
        top: number;
        right: number;
    };
    thumbnailUrl: string | null;
    productData: AmazonScrapedProduct | null; // First product for thumbnail
    allProducts: AmazonScrapedProduct[]; // All products for expansion
    category: ProductCategory;
    animations: {
        slideDownDuration: number;
        thumbnailFadeDuration: number;
    };
    onExpansionRequest?: () => Promise<void>; // Callback for grid coordination
}

export interface ProductGridConfig {
    squareSize: number;
    spacing: number;
    startPosition: {
        top: number;
        right: number;
    };
    animationDelayMs: number;
    maxProducts: number;
    backgroundColor: string;
    borderRadius: number;
}

// New expansion-related types for Task 4.4
export enum ExpansionState {
    HIDDEN = 'hidden',
    EXPANDING = 'expanding',
    EXPANDED = 'expanded',
    COLLAPSING = 'collapsing'
}

export interface ProductExpansionConfig {
    parentSquare: HTMLElement;
    products: AmazonScrapedProduct[];
    category: ProductCategory;
    startPosition: { top: number; right: number };
    expansionDirection: 'left';
    squareSize: number;
    spacing: number;
    animations: {
        slideLeftDuration: number;
        fadeInDuration: number;
    };
}

export interface ExpansionSquareConfig {
    product: AmazonScrapedProduct;
    position: { top: number; right: number };
    size: number;
    borderRadius: number;
    backgroundColor: string;
    index: number;
    spacing: number; // Spacing between expansion squares
    animations: {
        slideLeftDuration: number;
        thumbnailFadeDuration: number;
    };
}