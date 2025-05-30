/**
 * Types and interfaces for the PauseShop background service worker
 */

import { AmazonSearchBatch, AmazonSearchExecutionBatch } from '../types/amazon';

export interface ScreenshotConfig {
    targetWidth: number;
    enableLogging: boolean;
    logPrefix: string;
    debugMode: boolean;
    serverUrl: string;
}

export interface ScreenshotMessage {
    action: 'captureScreenshot';
    config: ScreenshotConfig;
}

export interface ScreenshotResponse {
    success: boolean;
    error?: string;
    analysisResult?: any;
    amazonSearchResults?: AmazonSearchBatch | null;
    amazonExecutionResults?: AmazonSearchExecutionBatch | null;
}