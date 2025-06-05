/**
 * Types and interfaces for the PauseShop background service worker
 */

import { AmazonSearchBatch, AmazonSearchExecutionBatch, AmazonScrapedBatch } from '../types/amazon';

export interface ScreenshotConfig {
    targetWidth: number;
    enableLogging: boolean;
    logPrefix: string;
    debugMode: boolean;
    serverUrl: string;
    pauseId?: string; // Add pauseId
    useStreaming?: boolean; // Add useStreaming flag
}

export interface ScreenshotMessage {
    action: 'captureScreenshot';
    config: ScreenshotConfig;
    pauseId?: string; // Add pauseId
}

export interface AnalysisResult {
    products: Array<{
        name: string;
        category: string;
        brand: string;
        primaryColor: string;
        secondaryColors: string[];
        features: string[];
        targetGender: string;
        searchTerms: string;
    }>;
    metadata: {
        processingTime: number;
    };
}

export interface ScreenshotResponse {
    success: boolean;
    error?: string;
    analysisResult?: AnalysisResult;
    amazonSearchResults?: AmazonSearchBatch | null;
    amazonExecutionResults?: AmazonSearchExecutionBatch | null;
    amazonScrapedResults?: AmazonScrapedBatch | null;
    pauseId?: string; // Add pauseId to response
}