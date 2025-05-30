/**
 * Type definitions for Amazon search functionality
 */

// Duplicate types from server to avoid cross-module imports
export enum ProductCategory {
    CLOTHING = 'clothing',
    ELECTRONICS = 'electronics',
    FURNITURE = 'furniture',
    ACCESSORIES = 'accessories',
    FOOTWEAR = 'footwear',
    HOME_DECOR = 'home_decor',
    BOOKS_MEDIA = 'books_media',
    SPORTS_FITNESS = 'sports_fitness',
    BEAUTY_PERSONAL_CARE = 'beauty_personal_care',
    KITCHEN_DINING = 'kitchen_dining',
    OTHER = 'other'
}

export enum TargetGender {
    MEN = 'men',
    WOMEN = 'women',
    UNISEX = 'unisex',
    BOY = 'boy',
    GIRL = 'girl'
}

export interface Product {
    name: string;
    category: ProductCategory;
    brand: string;
    primaryColor: string;
    secondaryColors: string[];
    features: string[];
    targetGender: TargetGender;
    searchTerms: string;
}

export interface AmazonSearchConfig {
    /** Amazon domain to search (e.g., 'amazon.com', 'amazon.co.uk') */
    domain: string;
    /** Maximum length for search terms to avoid URL length issues */
    maxSearchTermLength: number;
    /** Whether to enable Amazon category filtering */
    enableCategoryFiltering: boolean;
    /** Whether to fallback to generic search if optimized search fails */
    fallbackToGenericSearch: boolean;
}

export interface AmazonSearchResult {
    /** Unique identifier for tracking this search result */
    productId: string;
    /** Constructed Amazon search URL */
    searchUrl: string;
    /** Final search terms used in the URL */
    searchTerms: string;
    /** Product category for result organization */
    category: ProductCategory;
    /** Confidence score in search term quality (0-1) */
    confidence: number;
    /** Original product data used to construct this search */
    originalProduct: Product;
}

export interface AmazonSearchBatch {
    /** Array of search results for all products */
    searchResults: AmazonSearchResult[];
    /** Configuration used for this batch */
    config: AmazonSearchConfig;
    /** Processing metadata */
    metadata: {
        totalProducts: number;
        successfulSearches: number;
        failedSearches: number;
        processingTime: number;
    };
}

export interface CategoryNodeMapping {
    [key: string]: string;
}

export interface SearchTermValidationResult {
    isValid: boolean;
    processedTerms: string;
    warnings: string[];
}

/**
 * Configuration for Amazon HTTP requests
 */
export interface AmazonHttpConfig {
    /** Maximum number of concurrent requests */
    maxConcurrentRequests: number;
    /** Delay between requests in milliseconds */
    requestDelayMs: number;
    /** Request timeout in milliseconds */
    timeoutMs: number;
    /** Maximum number of retry attempts */
    maxRetries: number;
    /** Whether to rotate user agents */
    userAgentRotation: boolean;
}

/**
 * Result of executing a single Amazon search request
 */
export interface AmazonSearchExecutionResult {
    /** Unique identifier for tracking this search result */
    productId: string;
    /** Amazon search URL that was requested */
    searchUrl: string;
    /** Whether the request was successful */
    success: boolean;
    /** Raw HTML content from Amazon (if successful) */
    htmlContent?: string;
    /** Error message (if failed) */
    error?: string;
    /** HTTP status code */
    statusCode?: number;
    /** Response time in milliseconds */
    responseTime: number;
    /** Number of retry attempts made */
    retryCount: number;
    /** Original search result data */
    originalSearchResult: AmazonSearchResult;
}

/**
 * Batch execution results for multiple Amazon searches
 */
export interface AmazonSearchExecutionBatch {
    /** Array of execution results for all searches */
    executionResults: AmazonSearchExecutionResult[];
    /** Configuration used for this batch */
    config: AmazonHttpConfig;
    /** Processing metadata */
    metadata: {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        totalExecutionTime: number;
        averageResponseTime: number;
    };
}
