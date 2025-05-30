/**
 * Screenshot capture functionality for PauseShop extension
 * Uses Chrome's captureVisibleTab API through background service worker
 */

interface ScreenshotConfig {
    targetWidth: number;
    enableLogging: boolean;
    logPrefix: string;
    debugMode: boolean;
    serverUrl: string;
}

interface ScreenshotMessage {
    action: 'captureScreenshot';
    config: ScreenshotConfig;
}

interface ScreenshotResponse {
    success: boolean;
    error?: string;
    analysisResult?: any;
    amazonSearchResults?: any;
}

const defaultConfig: ScreenshotConfig = {
    targetWidth: 640,
    enableLogging: true,
    logPrefix: 'PauseShop Screenshot',
    debugMode: true,
    serverUrl: 'http://localhost:3000'
};

const log = (config: ScreenshotConfig, message: string): void => {
    if (config.enableLogging) {
        console.log(`${config.logPrefix}: ${message}`);
    }
};

/**
 * Captures a screenshot by communicating with the background service worker
 * @param config Screenshot configuration options
 */
export const captureScreenshot = async (config: Partial<ScreenshotConfig> = {}): Promise<void> => {
    const fullConfig: ScreenshotConfig = { ...defaultConfig, ...config };
    
    try {
        log(fullConfig, 'Requesting screenshot capture from background service worker...');

        const message: ScreenshotMessage = {
            action: 'captureScreenshot',
            config: fullConfig
        };

        // Send message to background service worker
        const response = await chrome.runtime.sendMessage(message) as ScreenshotResponse;

        if (response.success) {
            log(fullConfig, 'Screenshot captured and processed successfully');
            
            // Log analysis results if available
            if (response.analysisResult) {
                const { products, metadata } = response.analysisResult;
                log(fullConfig, `Analysis complete: ${products.length} products detected in ${metadata.processingTime}ms`);
                
                // Log individual products
                products.forEach((product: any, index: number) => {
                    log(fullConfig, `Product ${index + 1}: ${product.name}`);
                });
            }
            
            // Log Amazon search results if available
            if (response.amazonSearchResults) {
                const { searchResults, metadata } = response.amazonSearchResults;
                log(fullConfig, `Amazon search URLs: ${metadata.successfulSearches}/${metadata.totalProducts} generated in ${metadata.processingTime}ms`);
                
                // Log individual search URLs for debugging
                searchResults.forEach((result: any, index: number) => {
                    if (result.searchUrl) {
                        log(fullConfig, `Search ${index + 1}: ${result.searchTerms} (confidence: ${result.confidence.toFixed(2)})`);
                        if (fullConfig.debugMode) {
                            log(fullConfig, `URL: ${result.searchUrl}`);
                        }
                    }
                });
            }
        } else {
            log(fullConfig, `Screenshot capture failed: ${response.error || 'Unknown error'}`);
        }
    } catch (error) {
        if (error instanceof Error) {
            log(fullConfig, `Failed to communicate with background service worker: ${error.message}`);
        } else {
            log(fullConfig, 'Unknown error during screenshot capture');
        }
    }
};

/**
 * Initialize screenshot capture functionality
 */
export const initializeScreenshotCapturer = (): void => {
    console.log('PauseShop: Screenshot capturer initialized');
};
