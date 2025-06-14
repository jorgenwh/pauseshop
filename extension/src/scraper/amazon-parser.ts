/**
 * Amazon HTML parser for extracting product data from search results
 * Service worker compatible - uses regex patterns instead of DOMParser
 */

import {
    AmazonSearchResult,
    AmazonScrapedResult,
    AmazonScrapedProduct,
} from "../types/amazon";
import { AMAZON_MAX_PRODUCTS_PER_SEARCH } from "./constants";

/**
 * Extracts thumbnail image URL from HTML content using regex
 */
const extractThumbnailUrlFromHtml = (htmlContent: string): string | null => {
    // Primary pattern for Amazon's main image class (updated for current structure)
    const primaryPatterns = [
        /<img[^>]*class="[^"]*s-image[^"]*"[^>]*src="([^"]+)"/i,
        /<img[^>]*src="([^"]+)"[^>]*class="[^"]*s-image[^"]*"/i,
        // New pattern for current Amazon structure
        /<img[^>]*class="s-image"[^>]*src="([^"]+)"/i,
    ];

    for (const pattern of primaryPatterns) {
        const match = htmlContent.match(pattern);
        if (match && match[1] && isValidImageUrl(match[1])) {
            return match[1];
        }
    }

    // Enhanced fallback patterns for different Amazon layouts
    const fallbackPatterns = [
        /<img[^>]*data-image-latency="s-product-image"[^>]*src="([^"]+)"/i,
        /<img[^>]*data-image-index="[^"]*"[^>]*src="([^"]+)"/i,
        /<img[^>]*src="([^"]*images-amazon[^"]+)"/i,
        /<img[^>]*src="([^"]*ssl-images-amazon[^"]+)"/i,
        /<img[^>]*src="([^"]*media-amazon[^"]+)"/i,
    ];

    for (const pattern of fallbackPatterns) {
        const match = htmlContent.match(pattern);
        if (match && match[1] && isValidImageUrl(match[1])) {
            return match[1];
        }
    }

    return null;
};

/**
 * Validates if a URL is a valid image URL
 */
const isValidImageUrl = (url: string): boolean => {
    if (!url || url.length === 0) return false;

    // Check if it's a valid URL format
    try {
        new URL(url);
    } catch {
        return false;
    }

    // Check if it contains image indicators (updated for current Amazon structure)
    return (
        url.includes("images-amazon") ||
        url.includes("ssl-images-amazon") ||
        url.includes("media-amazon") ||
        url.includes("m.media-amazon") ||
        url.includes(".jpg") ||
        url.includes(".jpeg") ||
        url.includes(".png") ||
        url.includes(".webp")
    );
};

/**
 * Constructs a canonical Amazon product URL using the ASIN.
 */
const constructAmazonProductUrl = (asin: string, baseUrl: string): string => {
    // Extract the domain from the baseUrl (e.g., "https://www.amazon.com")
    const urlObj = new URL(baseUrl);
    const origin = urlObj.origin;
    // Construct the canonical URL using the ASIN
    return `${origin}/dp/${asin}`;
};

/**
 * Extracts product data from HTML content using regex patterns
 */
const extractProductDataFromHtml = (
    htmlContent: string,
    asin: string,
    position: number,
    baseUrl: string,
): AmazonScrapedProduct | null => {
    try {
        const id = `scraped-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Extract core data using regex patterns
        const thumbnailUrl = extractThumbnailUrlFromHtml(htmlContent);
        // Prioritize constructing a stable product URL using the ASIN
        const productUrl = constructAmazonProductUrl(asin, baseUrl);
        // Fallback to extracted URL if ASIN-based construction is not desired or fails
        // (though with this approach, the ASIN-based URL is robust)
        // const scrapedProductUrl = extractProductUrlFromHtml(htmlContent, baseUrl);
        // const finalProductUrl = scrapedProductUrl && isValidProductUrl(scrapedProductUrl) ? scrapedProductUrl : productUrl;

        if (!thumbnailUrl) {
            return null;
        }
        if (!thumbnailUrl) {
            return null;
        }
        if (thumbnailUrl && !isValidImageUrl(thumbnailUrl)) {
            return null;
        }
        // No need to validate productUrl here as it's constructed from ASIN, which is assumed valid.
        // It's already the stable URL.

        const productData = {
            id,
            amazonAsin: asin || undefined,
            thumbnailUrl: thumbnailUrl || "",
            productUrl,
            position,
        };

        return productData;
    } catch (error) {
        console.warn("Error extracting product data:", error);
        return null;
    }
};

/**
 * Parses Amazon search results HTML and extracts product data using regex patterns
 * (Service worker compatible - no DOMParser dependency)
 */
const parseAmazonSearchHtml = (
    htmlContent: string,
    baseUrl: string,
): AmazonScrapedProduct[] => {
    try {
        // Extract product containers using regex patterns (avoid duplicates by prioritizing specific patterns)
        const scrapedProducts: AmazonScrapedProduct[] = [];
        const processedAsins = new Set<string>(); // Track processed ASINs to avoid duplicates
        let position = 1;

        // Updated patterns to handle both old and new Amazon HTML structures
        const searchResultPatterns = [
            // New Amazon structure: data-asin comes BEFORE data-component-type
            /<div[^>]*data-asin="([^"]+)"[^>]*data-component-type="s-search-result"[^>]*>([\s\S]*?)(?=<div[^>]*role="listitem"|$)/gi,
            // Old Amazon structure: data-component-type comes BEFORE data-asin
            /<div[^>]*data-component-type="s-search-result"[^>]*data-asin="([^"]+)"[^>]*>([\s\S]*?)(?=<div[^>]*data-component-type="s-search-result"|$)/gi,
        ];

        let match;

        // Try each pattern until we find products or exhaust all patterns
        for (const pattern of searchResultPatterns) {
            pattern.lastIndex = 0; // Reset regex state

            while (
                (match = pattern.exec(htmlContent)) !== null &&
                position <= AMAZON_MAX_PRODUCTS_PER_SEARCH
            ) {
                const asin = match[1];
                const containerHtml = match[2];

                if (!asin || !containerHtml || processedAsins.has(asin))
                    continue;

                const productData = extractProductDataFromHtml(
                    containerHtml,
                    asin,
                    position,
                    baseUrl,
                );

                if (productData) {
                    scrapedProducts.push(productData);
                    processedAsins.add(asin);
                    position++;
                }
            }

            // If we found products with this pattern, no need to try others
            if (scrapedProducts.length > 0) break;
        }

        // If we still haven't found enough products, try more flexible patterns
        if (position <= AMAZON_MAX_PRODUCTS_PER_SEARCH) {
            const flexiblePatterns = [
                // Pattern with role="listitem"
                /<div[^>]*role="listitem"[^>]*data-asin="([^"]+)"[^>]*data-component-type="s-search-result"[^>]*>([\s\S]*?)(?=<div[^>]*role="listitem"|$)/gi,
                // Very flexible pattern - any div with both attributes
                /<div[^>]*data-asin="([^"]+)"[^>]*data-component-type="s-search-result"[^>]*>([\s\S]*?)(?=<div[^>]*data-asin=|$)/gi,
            ];

            for (const pattern of flexiblePatterns) {
                pattern.lastIndex = 0; // Reset regex state

                while (
                    (match = pattern.exec(htmlContent)) !== null &&
                    position <= AMAZON_MAX_PRODUCTS_PER_SEARCH
                ) {
                    const asin = match[1];
                    const containerHtml = match[2];

                    if (!asin || !containerHtml || processedAsins.has(asin))
                        continue;

                    const productData = extractProductDataFromHtml(
                        containerHtml,
                        asin,
                        position,
                        baseUrl,
                    );

                    if (productData) {
                        scrapedProducts.push(productData);
                        processedAsins.add(asin);
                        position++;
                    }
                }
            }
        }

        return scrapedProducts;
    } catch (error) {
        console.error("Error parsing Amazon HTML:", error);
        return [];
    }
};

/**
 * Scrapes a single Amazon search execution result
 */
export const scrapeAmazonSearchResult = (
    searchResult: AmazonSearchResult,
): AmazonScrapedResult | null => {
    try {
        // Extract base URL for relative link resolution
        const baseUrl = new URL(searchResult.searchUrl).origin;

        // Parse HTML and extract products
        const scrapedProducts = parseAmazonSearchHtml(
            searchResult.htmlContent,
            baseUrl,
        );

        return {
            id: searchResult.id,
            searchUrl: searchResult.searchUrl,
            products: scrapedProducts,
            search: searchResult.search,
            searchResult: searchResult,
        };
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown scraping error";
        console.warn(
            `[PauseShop] Failed to scrape search result: ${searchResult.id}`,
            errorMessage,
        );

        return null;
    }
};
