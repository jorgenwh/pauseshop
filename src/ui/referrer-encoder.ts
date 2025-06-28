/**
 * Utility functions for encoding and constructing referrer URLs
 */

import { AmazonScrapedProduct } from "../types/amazon";
import { ReferrerData, ReferrerProductData, ReferrerConfig } from "../types/referrer";

/**
 * Determines the referrer configuration based on environment
 */
export function getReferrerConfig(): ReferrerConfig {
    const isLocal = process.env.SERVER_ENV === 'local';
    const baseUrl = isLocal ? 'http://localhost:5173' : 'https://pauseshop.net';
    
    return {
        baseUrl,
        isLocal
    };
}

/**
 * Converts AmazonScrapedProduct to ReferrerProductData (removes unnecessary fields)
 */
export function convertToReferrerProductData(product: AmazonScrapedProduct): ReferrerProductData {
    return {
        amazonAsin: product.amazonAsin,
        thumbnailUrl: product.thumbnailUrl,
        price: product.price
    };
}

/**
 * Encodes referrer data to a URL-safe base64 string
 */
export function encodeReferrerData(data: ReferrerData): string {
    try {
        const jsonString = JSON.stringify(data);
        const base64String = btoa(jsonString);
        // Make it URL-safe by replacing characters that might cause issues
        return base64String
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    } catch (error) {
        console.error('[PauseShop:ReferrerEncoder] Failed to encode referrer data:', error);
        throw new Error('Failed to encode referrer data');
    }
}

/**
 * Constructs the complete referrer URL with encoded data
 */
export function constructReferrerUrl(
    pauseId: string,
    clickedPosition: number,
    allProducts: AmazonScrapedProduct[]
): string {
    const config = getReferrerConfig();
    
    // Convert all products to referrer format
    const referrerProducts = allProducts.map(convertToReferrerProductData);
    
    // Create the data package
    const referrerData: ReferrerData = {
        pauseId,
        clickedPosition,
        products: referrerProducts
    };
    
    // Encode the data
    const encodedData = encodeReferrerData(referrerData);
    
    // Construct the final URL
    const referrerUrl = `${config.baseUrl}/referrer?data=${encodedData}`;
    
    console.log(`[PauseShop:ReferrerEncoder] Constructed referrer URL for ${config.isLocal ? 'local' : 'remote'} environment`);
    console.log(`[PauseShop:ReferrerEncoder] Session: ${pauseId}, Position: ${clickedPosition}, Products: ${allProducts.length}`);
    
    return referrerUrl;
}

/**
 * Decodes referrer data from a URL-safe base64 string (for testing/debugging)
 */
export function decodeReferrerData(encodedData: string): ReferrerData {
    try {
        // Restore base64 padding and characters
        let base64String = encodedData
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        // Add padding if needed
        while (base64String.length % 4) {
            base64String += '=';
        }
        
        const jsonString = atob(base64String);
        return JSON.parse(jsonString) as ReferrerData;
    } catch (error) {
        console.error('[PauseShop:ReferrerEncoder] Failed to decode referrer data:', error);
        throw new Error('Failed to decode referrer data');
    }
}