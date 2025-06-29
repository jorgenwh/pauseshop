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
    // Primary pattern for Amazon's main image class
    const primaryPattern = /<img[^>]*class="[^"]*s-image[^"]*"[^>]*src="([^"]+)"/i;
    let match = htmlContent.match(primaryPattern);
    if (match && match[1]) {
        return match[1];
    }

    // Fallback patterns for different Amazon layouts
    const fallbackPatterns = [
        /<img[^>]*data-image-latency="s-product-image"[^>]*src="([^"]+)"/i,
        /<img[^>]*data-image-index="[^"]*"[^>]*src="([^"]+)"/i,
    ];

    for (const pattern of fallbackPatterns) {
        match = htmlContent.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
};

/**
 * Price Strategy 1: Extracts price from the "a-offscreen" span.
 */
const extractPriceFromOffscreen = (htmlContent: string): number | null => {
    const pattern = /<span[^>]*class="[^"]*a-offscreen[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
    let match;
    while ((match = pattern.exec(htmlContent)) !== null) {
        if (match[1]) {
            const pricePattern = /[$€£¥]?\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)/;
            const priceMatch = match[1].match(pricePattern);

            if (priceMatch && priceMatch[1]) {
                const priceText = priceMatch[1].replace(/,/g, "");
                const price = parseFloat(priceText);
                if (!isNaN(price)) {
                    // console.log(`[PauseShop Scraper] Success with Offscreen strategy.`);
                    return price;
                }
            }
        }
    }
    return null;
};

/**
 * Price Strategy 2: Extracts price by combining whole and fractional parts.
 */
const extractPriceFromWholeAndFraction = (htmlContent: string): number | null => {
    const pattern = /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([\d,]+)[\s\S]*?<\/span>[\s\S]*?<span[^>]*class="[^"]*a-price-fraction[^"]*"[^>]*>(\d+)<\/span>/gi;
    let match;
    while ((match = pattern.exec(htmlContent)) !== null) {
        if (match[1] && match[2]) {
            const wholePartWithoutCommas = match[1].replace(/,/g, "");
            const priceText = `${wholePartWithoutCommas}.${match[2]}`;
            const price = parseFloat(priceText);
            if (!isNaN(price)) {
                console.log(`[PauseShop Scraper] Success with Whole/Fraction strategy.`);
                return price;
            }
        }
    }
    return null;
};

const priceExtractionStrategies = [
    extractPriceFromOffscreen,
    extractPriceFromWholeAndFraction,
];

/**
 * Iterates through price extraction strategies to find a valid price.
 */
const extractPriceFromHtml = (htmlContent: string): number | null => {
    for (const strategy of priceExtractionStrategies) {
        const price = strategy(htmlContent);
        if (price !== null) {
            return price;
        }
    }
    return null;
};

/**
 * Constructs a canonical Amazon product URL using the ASIN.
 */
const constructAmazonProductUrl = (asin: string, baseUrl: string): string => {
    const urlObj = new URL(baseUrl);
    const origin = urlObj.origin;
    return `${origin}/dp/${asin}`;
};

/**
 * Extracts product data from an HTML snippet.
 */
const extractProductDataFromHtml = (
    htmlContent: string,
    asin: string,
    position: number,
    baseUrl: string,
    searchUrl: string,
): AmazonScrapedProduct | null => {
    try {
        const id = `scraped-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        const thumbnailUrl = extractThumbnailUrlFromHtml(htmlContent);
        const productUrl = constructAmazonProductUrl(asin, baseUrl);
        const price = extractPriceFromHtml(htmlContent);

        if (!thumbnailUrl) {
            return null;
        }

        if (price !== null) {
            // console.log(`[PauseShop Scraper] Associated price ${price.toFixed(2)} with ASIN ${asin}.`);
        } else {
            // console.log(`[PauseShop Scraper] No price found for ASIN ${asin} (position ${position}) on search page: ${searchUrl}`);
        }

        return {
            id,
            amazonAsin: asin,
            thumbnailUrl,
            productUrl,
            position,
            price: price ?? undefined,
        };
    } catch (error) {
        console.warn(`Error extracting data for ASIN ${asin}:`, error);
        return null;
    }
};

/**
 * Parses Amazon search results HTML and extracts product data using regex patterns.
 */
const parseAmazonSearchHtml = (
    htmlContent: string,
    baseUrl: string,
    searchUrl: string,
): AmazonScrapedProduct[] => {
    try {
        const searchResultPattern = /<div[^>]*data-asin="([^"]+)"[^>]*data-component-type="s-search-result"[^>]*>([\s\S]*?)(?=<div[^>]*data-component-type="s-search-result"|$)/gi;
        const scrapedProducts: AmazonScrapedProduct[] = [];
        const processedAsins = new Set<string>();
        let position = 1;
        let match;

        while ((match = searchResultPattern.exec(htmlContent)) !== null) {
            if (position > AMAZON_MAX_PRODUCTS_PER_SEARCH) break;

            // Log the search URL every 5 products for easier verification
            if ((position - 1) % 5 === 0) {
                console.log(`[PauseShop Scraper] Checking products on page: ${searchUrl}`);
            }

            const asin = match[1];
            const containerHtml = match[2];

            if (!asin || !containerHtml || processedAsins.has(asin)) {
                continue;
            }

            const productData = extractProductDataFromHtml(
                containerHtml,
                asin,
                position,
                baseUrl,
                searchUrl,
            );

            if (productData) {
                scrapedProducts.push(productData);
                processedAsins.add(asin);
                position++;
            }
        }

        return scrapedProducts;
    } catch (error) {
        console.error("Error parsing Amazon HTML with regex:", error);
        return [];
    }
};

/**
 * Scrapes a single Amazon search execution result.
 */
export const scrapeAmazonSearchResult = (
    searchResult: AmazonSearchResult,
): AmazonScrapedResult | null => {
    try {
        const baseUrl = new URL(searchResult.searchUrl).origin;

        const scrapedProducts = parseAmazonSearchHtml(
            searchResult.htmlContent,
            baseUrl,
            searchResult.searchUrl,
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
