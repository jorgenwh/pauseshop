/**
 * PauseShop Background Service Worker
 * Handles screenshot capture using chrome.tabs.captureVisibleTab API
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

const log = (config: ScreenshotConfig, message: string): void => {
  if (config.enableLogging) {
    console.log(`${config.logPrefix}: ${message}`);
  }
};

/**
 * Downscales an image to the specified width while maintaining aspect ratio
 * @param dataUrl The original image data URL
 * @param targetWidth The desired width in pixels
 * @returns Promise<string> The downscaled image data URL
 */
const downscaleImage = async (dataUrl: string, targetWidth: number): Promise<string> => {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Create ImageBitmap from blob (available in service workers)
    const imageBitmap = await createImageBitmap(blob);
    
    // Calculate new dimensions maintaining aspect ratio
    const originalWidth = imageBitmap.width;
    const originalHeight = imageBitmap.height;
    const aspectRatio = originalHeight / originalWidth;
    const newHeight = Math.round(targetWidth * aspectRatio);

    // Create OffscreenCanvas for downscaling (available in service workers)
    const canvas = new OffscreenCanvas(targetWidth, newHeight);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw downscaled image
    ctx.drawImage(imageBitmap, 0, 0, targetWidth, newHeight);
    
    // Convert to blob and then to data URL
    const downscaledBlob = await canvas.convertToBlob({ type: 'image/png' });
    
    // Convert blob to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
      reader.readAsDataURL(downscaledBlob);
    });
  } catch (error) {
    throw new Error(`Image downscaling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const captureScreenshot = async (config: ScreenshotConfig, windowId: number): Promise<ScreenshotResponse> => {
  try {
    log(config, 'Capturing screenshot');
    const dataUrl: string = await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });

    log(config, `Downscaling image to ${config.targetWidth}px width`);
    const downscaledDataUrl = await downscaleImage(dataUrl, config.targetWidth);

    log(config, 'Opening downscaled screenshot in new tab');
    const tab = await chrome.tabs.create({ url: downscaledDataUrl });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(config, `Screenshot capture failed: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
};

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((
  message: ScreenshotMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: ScreenshotResponse) => void
) => {
  if (message.action === 'captureScreenshot') {
    log(message.config, 'Received screenshot capture request');
    const windowId = sender.tab?.windowId || chrome.windows.WINDOW_ID_CURRENT;
    captureScreenshot(message.config, windowId).then(sendResponse).catch(error => {
      console.error('Screenshot capture error:', error);
      sendResponse({ success: false, error: error.message || 'Unknown error' });
    });
    return true; // Keep message channel open for async response
  }
});

console.log('PauseShop service worker loaded');
