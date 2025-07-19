/**
 * Optimized screenshot utilities for extension frame capture
 * Applies smart format selection and compression similar to website utils
 */

/**
 * Check WebP support in extension context
 */
const checkWebPSupport = (): boolean => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
};

/**
 * Simple format selection: WebP if supported, otherwise JPEG
 * Optimized for video screenshots with good compression and universal compatibility
 */
const selectOptimalScreenshotFormat = (): { format: string; quality: number } => {
    // Use WebP for better compression if supported, otherwise fall back to JPEG
    const webpSupported = checkWebPSupport();
    
    if (webpSupported) {
        return { format: 'image/webp', quality: 0.8 };
    } else {
        return { format: 'image/jpeg', quality: 0.85 };
    }
};

/**
 * Calculate base64 size in MB
 */
const getBase64SizeMB = (base64String: string): number => {
    const base64Data = base64String.split(',')[1] || base64String;
    return (base64Data.length * 0.75) / (1024 * 1024);
};

/**
 * Optimized screenshot capture with smart format selection and compression
 */
export const captureOptimizedScreenshot = (
    video: HTMLVideoElement,
    maxSizeMB: number = 5
): string => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get canvas context');
    }
    
    // Draw the video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get optimal format and quality
    const { format, quality } = selectOptimalScreenshotFormat();
    
    console.log(`[FreezeFrame:ScreenshotCapture] Using format: ${format}, quality: ${quality}`);
    
    // Try the optimal format first
    let imageData = canvas.toDataURL(format, quality);
    let sizeMB = getBase64SizeMB(imageData);
    
    // If still too large, apply progressive compression
    if (sizeMB > maxSizeMB) {
        console.log(`[FreezeFrame:ScreenshotCapture] Image too large (${sizeMB.toFixed(2)}MB), applying compression...`);
        
        // Binary search for optimal quality
        let minQuality = 0.1;
        let maxQuality = quality;
        let bestDataUrl = imageData;
        let bestSize = sizeMB;
        
        for (let i = 0; i < 6; i++) {
            const testQuality = (minQuality + maxQuality) / 2;
            const testDataUrl = canvas.toDataURL(format, testQuality);
            const testSize = getBase64SizeMB(testDataUrl);
            
            console.log(`[FreezeFrame:ScreenshotCapture] Iteration ${i + 1}: quality=${testQuality.toFixed(2)}, size=${testSize.toFixed(2)}MB`);
            
            if (testSize <= maxSizeMB) {
                bestDataUrl = testDataUrl;
                bestSize = testSize;
                minQuality = testQuality; // Try higher quality
            } else {
                maxQuality = testQuality; // Reduce quality
            }
            
            // Early exit if good enough
            if (testSize <= maxSizeMB && testSize > maxSizeMB * 0.8) {
                console.log(`[FreezeFrame:ScreenshotCapture] Found optimal compression at iteration ${i + 1}`);
                break;
            }
        }
        
        imageData = bestDataUrl;
        sizeMB = bestSize;
    }
    
    const estimatedOriginalSize = getBase64SizeMB(canvas.toDataURL('image/png'));
    const compressionRatio = estimatedOriginalSize / sizeMB;
    const sizeReduction = ((estimatedOriginalSize - sizeMB) / estimatedOriginalSize) * 100;
    
    console.log(`[FreezeFrame:ScreenshotCapture] Screenshot optimized:
      📁 Original (PNG): ${estimatedOriginalSize.toFixed(2)}MB
      📦 Final (${format}): ${sizeMB.toFixed(2)}MB
      📊 Compression: ${compressionRatio.toFixed(1)}x smaller
      📉 Size reduction: ${sizeReduction.toFixed(1)}%
      🖼️ Dimensions: ${canvas.width}x${canvas.height}`);
    
    return imageData;
};
