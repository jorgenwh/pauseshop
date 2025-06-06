/**
 * Amazon search URL construction functionality
 * Converts OpenAI product analysis results into optimized Amazon search URLs
 */

import {
    Product,
    ProductCategory,
    TargetGender,
    AmazonSearchConfig,
    AmazonSearchResult,
    AmazonSearchBatch,
    CategoryNodeMapping,
    SearchTermValidationResult,
} from "../types/amazon";

// Default configuration for Amazon searches
const DEFAULT_CONFIG: AmazonSearchConfig = {
    domain: "amazon.com",
    maxSearchTermLength: 200,
    enableCategoryFiltering: true,
    fallbackToGenericSearch: true,
};

// Amazon category node mappings for refined searches
const CATEGORY_NODES: CategoryNodeMapping = {
    [ProductCategory.CLOTHING]: "7141123011", // Clothing, Shoes & Jewelry
    [ProductCategory.FOOTWEAR]: "679255011", // Shoes
    [ProductCategory.ACCESSORIES]: "2475687011", // Accessories
    [ProductCategory.ELECTRONICS]: "172282", // Electronics
    [ProductCategory.FURNITURE]: "1063306", // Home & Kitchen > Furniture
    [ProductCategory.HOME_DECOR]: "1063498", // Home & Kitchen > Home Décor
    [ProductCategory.BOOKS_MEDIA]: "283155", // Books
    [ProductCategory.SPORTS_FITNESS]: "3375251", // Sports & Outdoors
    [ProductCategory.BEAUTY_PERSONAL_CARE]: "3760901", // Beauty & Personal Care
    [ProductCategory.KITCHEN_DINING]: "1063498", // Home & Kitchen
    [ProductCategory.OTHER]: "", // No specific category
};

/**
 * Validates and processes search terms
 */
const validateSearchTerms = (
    terms: string,
    maxLength: number,
): SearchTermValidationResult => {
    const warnings: string[] = [];
    let processedTerms = terms.trim();

    // Check if terms are empty
    if (!processedTerms) {
        return {
            isValid: false,
            processedTerms: "",
            warnings: ["Empty search terms"],
        };
    }

    // Remove special characters that might break Amazon searches
    const originalLength = processedTerms.length;
    processedTerms = processedTerms.replace(/[<>{}[\]\\]/g, "");

    if (processedTerms.length !== originalLength) {
        warnings.push("Removed special characters from search terms");
    }

    // Truncate if too long
    if (processedTerms.length > maxLength) {
        processedTerms = processedTerms.substring(0, maxLength).trim();
        // Try to avoid cutting off in the middle of a word
        const lastSpaceIndex = processedTerms.lastIndexOf(" ");
        if (lastSpaceIndex > maxLength * 0.8) {
            processedTerms = processedTerms.substring(0, lastSpaceIndex);
        }
        warnings.push(`Truncated search terms to ${maxLength} characters`);
    }

    return {
        isValid: true,
        processedTerms,
        warnings,
    };
};

/**
 * Optimizes search terms based on product data
 */
const optimizeSearchTerms = (product: Product): string => {
    // First, try to use the AI-generated search terms
    if (product.searchTerms && product.searchTerms.trim()) {
        return product.searchTerms.trim();
    }

    // Fallback: construct from individual fields
    const parts: string[] = [];

    // Add gender prefix for clothing categories
    if (
        [
            ProductCategory.CLOTHING,
            ProductCategory.FOOTWEAR,
            ProductCategory.ACCESSORIES,
        ].includes(product.category)
    ) {
        if (product.targetGender !== TargetGender.UNISEX) {
            parts.push(product.targetGender);
        }
    }

    // Add primary color
    if (product.primaryColor && product.primaryColor !== "unknown") {
        parts.push(product.primaryColor);
    }

    // Add product name (without color if already included)
    const productName = product.name;
    if (
        product.primaryColor &&
        productName.toLowerCase().includes(product.primaryColor.toLowerCase())
    ) {
        // Color already in name, use as-is
        parts.push(productName);
    } else {
        // Add color and name separately
        parts.push(productName);
    }

    // Add brand if known and not already in name
    if (
        product.brand &&
        product.brand !== "unknown" &&
        !productName.toLowerCase().includes(product.brand.toLowerCase())
    ) {
        parts.push(product.brand);
    }

    // Add key features (limit to most important ones)
    const importantFeatures = product.features.slice(0, 2);
    parts.push(...importantFeatures);

    return parts.join(" ").trim();
};

/**
 * Gets Amazon category node for filtering
 */
const getCategoryNode = (category: ProductCategory): string | null => {
    return CATEGORY_NODES[category] || null;
};

/**
 * Constructs an Amazon search URL for a single product
 */
const constructSearchUrl = (
    product: Product,
    config: AmazonSearchConfig = DEFAULT_CONFIG,
): AmazonSearchResult => {
    // Generate unique product ID
    const productId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Optimize search terms
    const rawSearchTerms = optimizeSearchTerms(product);
    const validation = validateSearchTerms(
        rawSearchTerms,
        config.maxSearchTermLength,
    );

    if (!validation.isValid) {
        // Return failed result
        return {
            productId,
            searchUrl: "",
            searchTerms: rawSearchTerms,
            category: product.category,
            confidence: 0,
            originalProduct: product,
        };
    }

    const searchTerms = validation.processedTerms;

    // Build base URL
    const baseUrl = `https://www.${config.domain}/s`;
    const urlParams = new URLSearchParams();

    // Add search terms
    urlParams.append("k", searchTerms);

    // Add category filtering if enabled
    if (config.enableCategoryFiltering) {
        const categoryNode = getCategoryNode(product.category);
        if (categoryNode) {
            urlParams.append("rh", `n:${categoryNode}`);
        }
    }

    // Add sorting for relevance
    urlParams.append("sort", "relevanceblender");

    // Add reference for tracking
    urlParams.append("ref", "sr_pg_1");

    // Add query ID for tracking
    urlParams.append("qid", Date.now().toString());

    const searchUrl = `${baseUrl}?${urlParams.toString()}`;

    // Calculate confidence score based on data quality
    let confidence = 0.5; // Base confidence

    // Higher confidence if we have AI-generated search terms
    if (product.searchTerms && product.searchTerms.trim()) {
        confidence += 0.3;
    }

    // Higher confidence if we have brand info
    if (product.brand && product.brand !== "unknown") {
        confidence += 0.1;
    }

    // Higher confidence if we have color info
    if (product.primaryColor && product.primaryColor !== "unknown") {
        confidence += 0.1;
    }

    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);

    return {
        productId,
        searchUrl,
        searchTerms,
        category: product.category,
        confidence,
        originalProduct: product,
    };
};

/**
 * Constructs Amazon search URLs for multiple products
 */
export const constructAmazonSearchBatch = (
    products: Product[],
    config: Partial<AmazonSearchConfig> = {},
): AmazonSearchBatch => {
    const startTime = Date.now();
    const fullConfig: AmazonSearchConfig = { ...DEFAULT_CONFIG, ...config };

    const searchResults: AmazonSearchResult[] = [];
    let successfulSearches = 0;
    let failedSearches = 0;

    for (const product of products) {
        try {
            const result = constructSearchUrl(product, fullConfig);
            searchResults.push(result);

            if (result.searchUrl) {
                successfulSearches++;
            } else {
                failedSearches++;
            }
        } catch (error) {
            failedSearches++;
            console.warn(
                "Failed to construct search URL for product:",
                product.name,
                error,
            );

            // Add failed result for tracking
            searchResults.push({
                productId: `failed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                searchUrl: "",
                searchTerms: product.name || "unknown",
                category: product.category,
                confidence: 0,
                originalProduct: product,
            });
        }
    }

    const processingTime = Date.now() - startTime;

    return {
        searchResults,
        config: fullConfig,
        metadata: {
            totalProducts: products.length,
            successfulSearches,
            failedSearches,
            processingTime,
        },
    };
};

/**
 * Constructs a single Amazon search URL (convenience function)
 */
export const constructSingleAmazonSearch = (
    product: Product,
    config: Partial<AmazonSearchConfig> = {},
): AmazonSearchResult => {
    const fullConfig: AmazonSearchConfig = { ...DEFAULT_CONFIG, ...config };
    return constructSearchUrl(product, fullConfig);
};

/**
 * Gets available Amazon domains
 */
export const getAvailableAmazonDomains = (): string[] => {
    return [
        "amazon.com",
        "amazon.co.uk",
        "amazon.de",
        "amazon.fr",
        "amazon.it",
        "amazon.es",
        "amazon.ca",
        "amazon.com.au",
        "amazon.co.jp",
    ];
};

/**
 * Validates Amazon domain
 */
export const validateAmazonDomain = (domain: string): boolean => {
    return getAvailableAmazonDomains().includes(domain);
};
