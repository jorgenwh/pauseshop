/**
 * Type definitions for referrer page data encoding
 */

/**
 * Essential product data for referrer page (stripped down from AmazonScrapedProduct)
 */
export interface ReferrerProductData {
    amazonAsin?: string;
    thumbnailUrl: string;
    price?: number;
}

/**
 * Complete data package sent to referrer page
 */
export interface ReferrerData {
    pauseId: string;
    clickedPosition: number; // Index of clicked product in the products array
    products: ReferrerProductData[]; // All scraped products for context
}

/**
 * Environment configuration for referrer URLs
 */
export interface ReferrerConfig {
    baseUrl: string;
    isLocal: boolean;
}
