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
    // Primary pattern for Amazon's main image class
    const primaryPatterns = [
        /<img[^>]*class="[^"]*s-image[^"]*"[^>]*src="([^"]+)"/i,
        /<img[^>]*src="([^"]+)"[^>]*class="[^"]*s-image[^"]*"/i
    ];

    for (const pattern of primaryPatterns) {
        const match = htmlContent.match(pattern);
        if (match && match[1] && isValidImageUrl(match[1])) {
            return match[1];
        }
    }

    // Fallback patterns for different Amazon layouts
    const fallbackPatterns = [
        /<img[^>]*data-image-latency[^>]*src="([^"]+)"/i,
        /<img[^>]*src="([^"]*images-amazon[^"]+)"/i,
        /<img[^>]*src="([^"]*ssl-images-amazon[^"]+)"/i
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
        // Primary patterns for Amazon's main product links
        const primaryPatterns = [
            /<h2[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>/i,
            /<a[^>]*class="[^"]*a-link-normal[^"]*"[^>]*href="([^"]+)"/i
        ];

        for (const pattern of primaryPatterns) {
            const match = htmlContent.match(pattern);
            if (match && match[1]) {
                const url = new URL(match[1], baseUrl).href;
                if (isValidProductUrl(url)) {
                    return url;
                }
            }
        }

        // Fallback patterns for any Amazon product link
        const fallbackPatterns = [
            /<a[^>]*href="([^"]*\/dp\/[^"]+)"/i,
            /<a[^>]*href="([^"]*\/gp\/product\/[^"]+)"/i
        ];

        for (const pattern of fallbackPatterns) {
            const match = htmlContent.match(pattern);
            if (match && match[1]) {
                const url = new URL(match[1], baseUrl).href;
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
 * Extracts Amazon ASIN from HTML content using regex
 */
const extractAmazonAsinFromHtml = (htmlContent: string): string | null => {
    // Try data-asin attribute
    const asinPattern = /data-asin="([A-Z0-9]{10})"/i;
    const asinMatch = htmlContent.match(asinPattern);
    
    if (asinMatch && asinMatch[1]) {
        return asinMatch[1];
    }

    // Try to extract from product URL
    const urlPattern = /\/dp\/([A-Z0-9]{10})/i;
    const urlMatch = htmlContent.match(urlPattern);
    
    if (urlMatch && urlMatch[1]) {
        return urlMatch[1];
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

    // Check if it contains image indicators
    return url.includes('images-amazon') || 
           url.includes('ssl-images-amazon') ||
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
        return urlObj.hostname.includes('amazon') && 
               (url.includes('/dp/') || url.includes('/gp/product/'));
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

        // Console log extracted product data for debugging
        console.log(`[PauseShop] Scraped Product ${position}:`, {
            imageUrl: productData.thumbnailUrl,
            productPageUrl: productData.productUrl,
            asin: productData.amazonAsin,
            confidence: productData.confidence
        });

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
        
        // First try the more specific pattern for search results
        const searchResultPattern = /<div[^>]*data-component-type="s-search-result"[^>]*data-asin="([^"]+)"[^>]*>([\s\S]*?)<\/div>/gi;
        let match;
        
        while ((match = searchResultPattern.exec(htmlContent)) !== null && position <= config.maxProductsPerSearch) {
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
        
        // If we haven't found enough products, try the more general pattern
        if (position <= config.maxProductsPerSearch) {
            const generalPattern = /<div[^>]*data-asin="([^"]+)"[^>]*>([\s\S]*?)<\/div>/gi;
            
            while ((match = generalPattern.exec(htmlContent)) !== null && position <= config.maxProductsPerSearch) {
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
                
                // Log summary for this search result
                console.log(`[PauseShop] Search result for product ${executionResult.productId}: ${scrapedResult.products.length} products found`);
                scrapedResult.products.forEach((product, index) => {
                    console.log(`  ${index + 1}. ${product.productUrl}`);
                });
            } else {
                failedScrapes++;
                console.log(`[PauseShop] Search result for product ${executionResult.productId}: FAILED - ${scrapedResult.error}`);
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
    const averageProductsPerSearch = successfulScrapes > 0 ? totalProductsFound / successfulScrapes : 0;

    // Log final batch summary
    console.log(`[PauseShop] Amazon Scraping Complete:`, {
        totalSearches: executionBatch.executionResults.length,
        successfulScrapes,
        failedScrapes,
        totalProductsFound,
        averageProductsPerSearch: Math.round(averageProductsPerSearch * 100) / 100,
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
            averageProductsPerSearch,
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
