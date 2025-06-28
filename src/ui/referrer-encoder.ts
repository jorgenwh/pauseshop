/**
 * Utility functions for encoding and constructing referrer URLs
 * 
 * Uses a custom fixed-length encoding scheme optimized for Amazon product data:
 * - Extracts only the image ID from Amazon thumbnail URLs (11 characters)
 * - Uses fixed-length format without separators (ASINs are always 10 characters)
 * - Stores prices in cents to avoid decimal points
 * 
 * Format: {encodedProductObject}||{clickPosition}|{amazonProduct1}|{amazonProduct2}|...
 * Example: "1~T-Shirt~...||1|710PSL6OBTLB0CB3VXLPZ3799|61abc123DEFB07XJ8C8F54550"
 *
 * See URL_RECONSTRUCTION_GUIDE.md for decoding instructions.
 */

import { AmazonScrapedProduct } from "../types/amazon";
import { ReferrerData, ReferrerProductData, ReferrerConfig } from "../types/referrer";
import { Product, Category, TargetGender } from "../types/common";

// Amazon data constants - all ASINs and image IDs are fixed length
const AMAZON_IMAGE_ID_LENGTH = 11; // e.g., "710PSL6OBTL"
const AMAZON_ASIN_LENGTH = 10;     // e.g., "B0CB3VXLPZ"

/**
 * Extracts the image ID from Amazon thumbnail URLs
 * Example: https://m.media-amazon.com/images/I/51wDsZxtTLL._AC_UL320_.jpg -> 51wDsZxtTLL
 */
function extractAmazonImageId(thumbnailUrl: string): string | null {
    const match = thumbnailUrl.match(/\/images\/I\/([^._]+)/);
    return match ? match[1] : null;
}


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
 * Encodes a single product to string format
 */
function encodeProduct(product: ReferrerProductData): string | null {
    const imageId = extractAmazonImageId(product.thumbnailUrl);
    if (!imageId) {
        console.warn('[PauseShop:ReferrerEncoder] Failed to extract image ID from thumbnail URL:', product.thumbnailUrl);
        return null;
    }

    // Validate image ID length (should always be 11 characters)
    if (imageId.length !== AMAZON_IMAGE_ID_LENGTH) {
        console.warn(`[PauseShop:ReferrerEncoder] Unexpected image ID length: ${imageId.length}, expected ${AMAZON_IMAGE_ID_LENGTH}. ID: ${imageId}`);
        return null;
    }

    // Start with image ID (always 11 chars)
    let encoded = imageId;

    // Add ASIN if present (always 10 chars) - no separator needed due to fixed lengths
    if (product.amazonAsin) {
        // Validate ASIN length (should always be 10 characters)
        if (product.amazonAsin.length !== AMAZON_ASIN_LENGTH) {
            console.warn(`[PauseShop:ReferrerEncoder] Unexpected ASIN length: ${product.amazonAsin.length}, expected ${AMAZON_ASIN_LENGTH}. ASIN: ${product.amazonAsin}`);
            // Still include it, but log the warning
        }
        encoded += product.amazonAsin;
    }

    // Add price if present
    if (product.price !== undefined) {
        const priceInCents = Math.round(product.price * 100);
        encoded += priceInCents.toString();
    }

    return encoded;
}


/**
 * Encodes a product object into a compact, URL-safe string.
 */
function encodeProductObject(product: Product): string {
    const categoryIndex = Object.values(Category).indexOf(product.category);
    const genderIndex = Object.values(TargetGender).indexOf(product.targetGender);

    // Convert confidence (0-1) to a single digit (0-9)
    const confidenceDigit = Math.floor((product.confidence || 0) * 10);

    const parts = [
        product.name || '',
        product.iconCategory || '',
        categoryIndex > -1 ? categoryIndex : '',
        product.brand || '',
        product.primaryColor || '',
        (product.secondaryColors || []).join(','),
        (product.features || []).join(','),
        genderIndex > -1 ? genderIndex : '',
        product.searchTerms || '',
        Math.min(9, Math.max(0, confidenceDigit)) // Clamp to 0-9
    ];

    return parts.join('~');
}

/**
 * Custom encoding scheme optimized for our specific data structure.
 * Format: {encodedProductObject}||{clickPosition}|{amazonProducts...}
 */
export function encodeReferrerData(data: Omit<ReferrerData, 'pauseId'>): string {
    try {
        let encodedProductContext = '';
        if (data.productContext) {
            encodedProductContext = encodeProductObject(data.productContext);
        }

        const encodedAmazonProducts = data.products
            .map(encodeProduct)
            .filter((p): p is string => p !== null);

        const amazonPart = data.clickedPosition + '|' + encodedAmazonProducts.join('|');

        return encodedProductContext + '||' + amazonPart;
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
    allProducts: AmazonScrapedProduct[],
    productContext?: Product
): string {
    const config = getReferrerConfig();

    // Convert all products to referrer format
    const referrerProducts = allProducts.map(convertToReferrerProductData);

    // Get the clicked Amazon product for logging
    const clickedAmazonProduct = referrerProducts[clickedPosition];
    if (!clickedAmazonProduct) {
        throw new Error(`No product found at position ${clickedPosition}`);
    }

    // Create the data package
    const referrerData: Omit<ReferrerData, 'pauseId'> = {
        clickedPosition,
        products: referrerProducts,
        productContext
    };

    // Encode the data with optimized format
    const encodedData = encodeReferrerData(referrerData);

    // Construct the final URL with pauseId as a query parameter
    const referrerUrl = `${config.baseUrl}/referrer?pauseId=${pauseId}&data=${encodedData}`;

    // Log information
    console.log(`[PauseShop:ReferrerEncoder] Constructed referrer URL for ${config.isLocal ? 'local' : 'remote'} environment`);
    console.log(`[PauseShop:ReferrerEncoder] Session: ${pauseId}, Position: ${clickedPosition}, Products: ${allProducts.length}`);
    console.log(`[PauseShop:ReferrerEncoder] Clicked product: ${clickedAmazonProduct.amazonAsin || 'No ASIN'} - ${clickedAmazonProduct.price ? clickedAmazonProduct.price.toFixed(2) : 'No price'}`);
    if (productContext) {
        console.log(`[PauseShop:ReferrerEncoder] Included product context: ${productContext.name}`);
    }
    console.log(`[PauseShop:ReferrerEncoder] URL length: ${referrerUrl.length} chars`);

    return referrerUrl;
}


