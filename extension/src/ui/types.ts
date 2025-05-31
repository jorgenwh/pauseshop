/**
 * UI-specific type definitions for PauseShop extension
 */

import { AmazonScrapedProduct, ProductCategory } from '../types/amazon';

export enum LoadingState {
    HIDDEN = 'hidden',
    SLIDING_IN = 'sliding-in',
    LOADING = 'loading',
    PROCESSING = 'processing',
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
    productData: AmazonScrapedProduct | null;
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
    productData: AmazonScrapedProduct | null;
    category: ProductCategory;
    animations: {
        slideDownDuration: number;
        thumbnailFadeDuration: number;
    };
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