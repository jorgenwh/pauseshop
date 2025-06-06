/**
 * Amazon HTML parser for extracting product data from search results
 * Service worker compatible - uses regex patterns instead of DOMParser
 */

import {
    AmazonSearchExecutionBatch,
    AmazonSearchExecutionResult,
    AmazonScrapedBatch,
    AmazonScrapedResult,
    AmazonScrapedProduct,
    AmazonParserConfig
} from '../types/amazon';

// Default configuration for Amazon HTML parsing
const DEFAULT_PARSER_CONFIG: AmazonParserConfig = {
    maxProductsPerSearch: 5,
    requireThumbnail: true,
    validateUrls: true,
    timeoutMs: 5000
};

/**
 * Extracts thumbnail image URL from HTML content using regex
 */
const extractThumbnailUrlFromHtml = (htmlContent: string): string | null => {
    // Primary pattern for Amazon's main image class (updated for current structure)
    const primaryPatterns = [
        /<img[^>]*class="[^"]*s-image[^"]*"[^>]*src="([^"]+)"/i,
        /<img[^>]*src="([^"]+)"[^>]*class="[^"]*s-image[^"]*"/i,
        // New pattern for current Amazon structure
        /<img[^>]*class="s-image"[^>]*src="([^"]+)"/i
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
        /<img[^>]*src="([^"]*media-amazon[^"]+)"/i
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
 * Extracts product page URL from HTML content using regex
 */
const extractProductUrlFromHtml = (htmlContent: string, baseUrl: string): string | null => {
    try {
        // Primary patterns for Amazon's main product links (updated for current structure)
        const primaryPatterns = [
            // Pattern for links within h2 tags
            /<h2[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>/i,
            // Pattern for a-link-normal class links
            /<a[^>]*class="[^"]*a-link-normal[^"]*"[^>]*href="([^"]+)"/i,
            // New patterns for current Amazon structure
            /<a[^>]*class="a-link-normal s-line-clamp-2 s-link-style a-text-normal"[^>]*href="([^"]+)"/i,
            /<a[^>]*class="a-link-normal s-no-outline"[^>]*href="([^"]+)"/i
        ];

        for (const pattern of primaryPatterns) {
            const match = htmlContent.match(pattern);
            if (match && match[1]) {
                let url = match[1];
                // Handle relative URLs
                if (url.startsWith('/')) {
                    url = new URL(url, baseUrl).href;
                }
                if (isValidProductUrl(url)) {
                    return url;
                }
            }
        }

        // Enhanced fallback patterns for any Amazon product link
        const fallbackPatterns = [
            /<a[^>]*href="([^"]*\/dp\/[^"]+)"/i,
            /<a[^>]*href="([^"]*\/gp\/product\/[^"]+)"/i,
            /<a[^>]*href="([^"]*\/sspa\/click[^"]*\/dp\/[^"]+)"/i,
            // Pattern for sponsored product links
            /<a[^>]*href="([^"]*\/sspa\/click[^"]+)"/i
        ];

        for (const pattern of fallbackPatterns) {
            const match = htmlContent.match(pattern);
            if (match && match[1]) {
                let url = match[1];
                // Handle relative URLs
                if (url.startsWith('/')) {
                    url = new URL(url, baseUrl).href;
                }
                if (isValidProductUrl(url)) {
                    return url;
                }
            }
        }

        return null;
    } catch (error) {
        console.warn('Error extracting product URL:', error);
        return null;
    }
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
    return url.includes('images-amazon') ||
           url.includes('ssl-images-amazon') ||
           url.includes('media-amazon') ||
           url.includes('m.media-amazon') ||
           url.includes('.jpg') ||
           url.includes('.jpeg') ||
           url.includes('.png') ||
           url.includes('.webp');
};

/**
 * Validates if a URL is a valid Amazon product URL
 */
const isValidProductUrl = (url: string): boolean => {
    if (!url || url.length === 0) return false;
    
    try {
        const urlObj = new URL(url);
        const isAmazonDomain = urlObj.hostname.includes('amazon');
        
        // Check for various Amazon product URL patterns
        const hasProductPath = url.includes('/dp/') ||
                              url.includes('/gp/product/') ||
                              url.includes('/sspa/click'); // Sponsored product links
        
        return isAmazonDomain && hasProductPath;
    } catch {
        return false;
    }
};

/**
 * Extracts product data from HTML content using regex patterns
 */
const extractProductDataFromHtml = (
    htmlContent: string,
    asin: string,
    position: number,
    baseUrl: string,
    config: AmazonParserConfig
): AmazonScrapedProduct | null => {
    try {
        const productId = `scraped-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Extract core data using regex patterns
        const thumbnailUrl = extractThumbnailUrlFromHtml(htmlContent);
        const productUrl = extractProductUrlFromHtml(htmlContent, baseUrl);

        // Validate required fields based on configuration
        if (config.requireThumbnail && !thumbnailUrl) {
            return null;
        }

        if (!productUrl) {
            return null;
        }

        // Validate URLs if enabled
        if (config.validateUrls) {
            if (thumbnailUrl && !isValidImageUrl(thumbnailUrl)) {
                return null;
            }

            if (!isValidProductUrl(productUrl)) {
                return null;
            }
        }

        // Calculate confidence score
        let confidence = 0.5; // Base confidence

        if (thumbnailUrl) confidence += 0.2;
        if (productUrl) confidence += 0.3;
        if (asin) confidence += 0.1;

        const productData = {
            productId,
            amazonAsin: asin || undefined,
            thumbnailUrl: thumbnailUrl || '',
            productUrl,
            position,
            confidence: Math.min(confidence, 1.0)
        };

        return productData;

    } catch (error) {
        console.warn('Error extracting product data:', error);
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
    config: AmazonParserConfig
): AmazonScrapedProduct[] => {
    try {
        // Extract product containers using regex patterns (avoid duplicates by prioritizing specific patterns)
        const scrapedProducts: AmazonScrapedProduct[] = [];
        const processedAsins = new Set<string>(); // Track processed ASINs to avoid duplicates
        let position = 1;
        
        // Updated patterns to handle both old and new Amazon HTML structures
        const searchResultPatterns = [
            // New Amazon structure: data-asin comes BEFORE data-component-type
            /<div[^>]*data-asin="([^"]+)"[^>]*data-component-type="s-search-result"[^>]*>([\s\S]*?)(?=<div[^>]*role="listitem"[^>]*data-asin=|$)/gi,
            // Old Amazon structure: data-component-type comes BEFORE data-asin
            /<div[^>]*data-component-type="s-search-result"[^>]*data-asin="([^"]+)"[^>]*>([\s\S]*?)(?=<div[^>]*data-component-type="s-search-result"|$)/gi
        ];
        
        let match;
        
        // Try each pattern until we find products or exhaust all patterns
        for (const pattern of searchResultPatterns) {
            pattern.lastIndex = 0; // Reset regex state
            
            while ((match = pattern.exec(htmlContent)) !== null && position <= config.maxProductsPerSearch) {
                const asin = match[1];
                const containerHtml = match[2];

                if (!asin || !containerHtml || processedAsins.has(asin)) continue;

                const productData = extractProductDataFromHtml(containerHtml, asin, position, baseUrl, config);

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
        if (position <= config.maxProductsPerSearch) {
            const flexiblePatterns = [
                // Pattern with role="listitem"
                /<div[^>]*role="listitem"[^>]*data-asin="([^"]+)"[^>]*data-component-type="s-search-result"[^>]*>([\s\S]*?)(?=<div[^>]*role="listitem"|$)/gi,
                // Very flexible pattern - any div with both attributes
                /<div[^>]*data-asin="([^"]+)"[^>]*data-component-type="s-search-result"[^>]*>([\s\S]*?)(?=<div[^>]*data-asin=|$)/gi
            ];
            
            for (const pattern of flexiblePatterns) {
                pattern.lastIndex = 0; // Reset regex state
                
                while ((match = pattern.exec(htmlContent)) !== null && position <= config.maxProductsPerSearch) {
                    const asin = match[1];
                    const containerHtml = match[2];

                    if (!asin || !containerHtml || processedAsins.has(asin)) continue;

                    const productData = extractProductDataFromHtml(containerHtml, asin, position, baseUrl, config);

                    if (productData) {
                        scrapedProducts.push(productData);
                        processedAsins.add(asin);
                        position++;
                    }
                }
                
                // If we found products with this pattern, no need to try others
                if (scrapedProducts.length > 0) break;
            }
        }

        return scrapedProducts;

    } catch (error) {
        console.error('Error parsing Amazon HTML:', error);
        return [];
    }
};

/**
 * Validates a scraped product for completeness and quality
 */
const validateScrapedProduct = (product: AmazonScrapedProduct, config: AmazonParserConfig): boolean => {
    // Check required fields
    if (!product.productUrl) return false;
    
    if (config.requireThumbnail && !product.thumbnailUrl) return false;

    // Check URL validity if enabled
    if (config.validateUrls) {
        if (product.thumbnailUrl && !isValidImageUrl(product.thumbnailUrl)) return false;
        if (!isValidProductUrl(product.productUrl)) return false;
    }

    // Check confidence threshold
    if (product.confidence < 0.3) return false;

    return true;
};

/**
 * Scrapes a single Amazon search execution result
 */
const scrapeAmazonSearchResult = (
    executionResult: AmazonSearchExecutionResult,
    config: AmazonParserConfig
): AmazonScrapedResult => {
    const startTime = Date.now();

    if (!executionResult.success || !executionResult.htmlContent) {
        return {
            productId: executionResult.productId,
            searchUrl: executionResult.searchUrl,
            success: false,
            products: [],
            error: executionResult.error || 'No HTML content available',
            scrapingTime: Date.now() - startTime,
            originalSearchResult: executionResult.originalSearchResult,
            originalExecutionResult: executionResult
        };
    }

    try {
        // Extract base URL for relative link resolution
        const baseUrl = new URL(executionResult.searchUrl).origin;

        // Parse HTML and extract products
        const scrapedProducts = parseAmazonSearchHtml(
            executionResult.htmlContent, 
            baseUrl, 
            config
        );

        // Validate scraped products
        const validProducts = scrapedProducts.filter(product => 
            validateScrapedProduct(product, config)
        );

        return {
            productId: executionResult.productId,
            searchUrl: executionResult.searchUrl,
            success: validProducts.length > 0,
            products: validProducts,
            error: validProducts.length === 0 ? 'No valid products found' : undefined,
            scrapingTime: Date.now() - startTime,
            originalSearchResult: executionResult.originalSearchResult,
            originalExecutionResult: executionResult
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown scraping error';

        return {
            productId: executionResult.productId,
            searchUrl: executionResult.searchUrl,
            success: false,
            products: [],
            error: errorMessage,
            scrapingTime: Date.now() - startTime,
            originalSearchResult: executionResult.originalSearchResult,
            originalExecutionResult: executionResult
        };
    }
};

/**
 * Scrapes Amazon search results from an execution batch
 */
export const scrapeAmazonSearchBatch = (
    executionBatch: AmazonSearchExecutionBatch,
    config: Partial<AmazonParserConfig> = {}
): AmazonScrapedBatch => {
    const startTime = Date.now();
    const fullConfig: AmazonParserConfig = { ...DEFAULT_PARSER_CONFIG, ...config };

    const scrapedResults: AmazonScrapedResult[] = [];
    let successfulScrapes = 0;
    let failedScrapes = 0;
    let totalProductsFound = 0;

    for (const executionResult of executionBatch.executionResults) {
        try {
            const scrapedResult = scrapeAmazonSearchResult(executionResult, fullConfig);
            scrapedResults.push(scrapedResult);

            if (scrapedResult.success) {
                successfulScrapes++;
                totalProductsFound += scrapedResult.products.length;
            } else {
                failedScrapes++;
            }

        } catch (error) {
            failedScrapes++;
            console.warn('Failed to scrape execution result:', executionResult.productId, error);

            // Add failed result for tracking
            scrapedResults.push({
                productId: executionResult.productId,
                searchUrl: executionResult.searchUrl,
                success: false,
                products: [],
                error: error instanceof Error ? error.message : 'Unknown error',
                scrapingTime: 0,
                originalSearchResult: executionResult.originalSearchResult,
                originalExecutionResult: executionResult
            });
        }
    }

    const totalScrapingTime = Date.now() - startTime;

    // Log final batch summary
    console.log(`[PauseShop] Amazon Scraping Complete:`, {
        totalSearches: executionBatch.executionResults.length,
        successfulScrapes,
        failedScrapes,
        totalProductsFound,
        totalScrapingTime: `${totalScrapingTime}ms`
    });

    return {
        scrapedResults,
        config: fullConfig,
        metadata: {
            totalSearches: executionBatch.executionResults.length,
            successfulScrapes,
            failedScrapes,
            totalProductsFound,
            totalScrapingTime
        }
    };
};

/**
 * Gets the default parser configuration
 */
export const getDefaultParserConfig = (): AmazonParserConfig => {
    return { ...DEFAULT_PARSER_CONFIG };
};

/**
 * Scrapes a single Amazon search execution result (convenience function)
 */
export const scrapeSingleAmazonResult = (
    executionResult: AmazonSearchExecutionResult,
    config: Partial<AmazonParserConfig> = {}
): AmazonScrapedResult => {
    const fullConfig: AmazonParserConfig = { ...DEFAULT_PARSER_CONFIG, ...config };
    return scrapeAmazonSearchResult(executionResult, fullConfig);
};
