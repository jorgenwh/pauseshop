/**
 * Screenshot capture functionality for PauseShop extension
 * Uses Chrome's captureVisibleTab API through background service worker
 */

interface ScreenshotConfig {
  targetWidth: number;
  enableLogging: boolean;
  logPrefix: string;
}

interface ScreenshotMessage {
  action: 'captureScreenshot';
  config: ScreenshotConfig;
}

interface ScreenshotResponse {
  success: boolean;
  error?: string;
}

const defaultConfig: ScreenshotConfig = {
  targetWidth: 640,
  enableLogging: true,
  logPrefix: 'PauseShop Screenshot'
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
