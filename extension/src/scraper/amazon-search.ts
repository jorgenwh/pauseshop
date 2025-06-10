/**
 * Amazon search URL construction functionality
 * Converts OpenAI product analysis results into optimized Amazon search URLs
 */

import { Product, Category, TargetGender } from "../types/common";
import {
    AmazonSearch,
    CategoryNodeMapping,
    SearchTermValidationResult
} from "../types/amazon";
import { AMAZON_DOMAIN, AMAZON_ENABLE_CATEGORT_FILTERING, AMAZON_MAX_SEARCH_TERM_LENGHT } from "./constants";

const CATEGORY_NODES: CategoryNodeMapping = {
    [Category.CLOTHING]: "7141123011", // Clothing, Shoes & Jewelry
    [Category.FOOTWEAR]: "679255011", // Shoes
    [Category.ACCESSORIES]: "2475687011", // Accessories
    [Category.ELECTRONICS]: "172282", // Electronics
    [Category.FURNITURE]: "1063306", // Home & Kitchen > Furniture
    [Category.HOME_DECOR]: "1063498", // Home & Kitchen > Home Décor
    [Category.BOOKS_MEDIA]: "283155", // Books
    [Category.SPORTS_FITNESS]: "3375251", // Sports & Outdoors
    [Category.BEAUTY_PERSONAL_CARE]: "3760901", // Beauty & Personal Care
    [Category.KITCHEN_DINING]: "1063498", // Home & Kitchen
    [Category.OTHER]: "", // No specific category
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
            Category.CLOTHING,
            Category.FOOTWEAR,
            Category.ACCESSORIES,
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
const getCategoryNode = (category: Category): string | null => {
    return CATEGORY_NODES[category] || null;
};

/**
 * Constructs an Amazon search URL for a single product
 */
export const constructAmazonSearch = (
    product: Product,
): AmazonSearch | null => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const rawSearchTerms = optimizeSearchTerms(product);
    const validation = validateSearchTerms(
        rawSearchTerms,
        AMAZON_MAX_SEARCH_TERM_LENGHT,
    );

    if (!validation.isValid) {
        return null;
    }

    const searchTerms = validation.processedTerms;

    const baseUrl = `https://www.${AMAZON_DOMAIN}/s`;
    const urlParams = new URLSearchParams();

    // Add search terms
    urlParams.append("k", searchTerms);

    // Add category filtering if enabled
    if (AMAZON_ENABLE_CATEGORT_FILTERING) {
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

    return {
        id,
        searchUrl,
        searchTerms,
        category: product.category,
        product: product,
    };
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
