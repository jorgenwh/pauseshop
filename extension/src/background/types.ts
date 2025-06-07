/**
 * Types and interfaces for the PauseShop background service worker
 */

export interface ScreenshotConfig {
    targetWidth?: number;
    debugMode?: boolean;
    serverUrl: string;
    pauseId?: string;
}

export interface ScreenshotMessage {
    action: "captureScreenshot";
    config: ScreenshotConfig;
    pauseId?: string; // Add pauseId
}

export interface ScreenshotResponse {
    success: boolean;
    error?: string;
    analysisResult?: {
        products: Array<{ name: string }>;
        metadata: { processingTime: number };
    };
    amazonScrapedResults?: {
        scrapedResults: unknown[];
        metadata: {
            successfulScrapes: number;
            totalSearches: number;
            totalProductsFound: number;
            totalScrapingTime: number;
        };
    };
    pauseId?: string;
}
