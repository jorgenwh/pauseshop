/**
 * Image processing utilities for the PauseShop background service worker
 */

/**
 * Downscales an image to the specified width while maintaining aspect ratio
 * @param dataUrl The original image data URL
 * @param targetWidth The desired width in pixels
 * @returns Promise<string> The downscaled image data URL
 */
export const downscaleImage = async (dataUrl: string, targetWidth: number): Promise<string> => {
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