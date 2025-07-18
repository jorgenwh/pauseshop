/**
 * Amazon search URL construction functionality
 * Converts OpenAI product analysis results into optimized Amazon search URLs
 */

import { Product, Category, TargetGender } from "../types/common";
import {
    AmazonSearch,
    SearchTermValidationResult,
} from "../types/amazon";
import {
    AMAZON_DOMAIN,
    AMAZON_MAX_SEARCH_TERM_LENGTH,
} from "./constants";

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
        [Category.CLOTHING, Category.FOOTWEAR, Category.ACCESSORIES].includes(
            product.category,
        )
    ) {
        if (product.targetGender !== TargetGender.UNISEX) {
            parts.push(product.targetGender);
        }
    }

    // Add primary color
    if (product.primaryColor && product.primaryColor !== "unknown") {
        parts.push(product.primaryColor);
    }

    // Add product name (remove color if already included and added separately)
    let productName = product.name;
    if (
        product.primaryColor &&
        product.primaryColor !== "unknown" &&
        productName.toLowerCase().includes(product.primaryColor.toLowerCase())
    ) {
        // If color was added separately and is in the name, remove it from the name
        productName = productName
            .toLowerCase()
            .replace(product.primaryColor.toLowerCase(), "")
            .trim();
    }
    if (productName) {
        // Only add if not empty after potential removal
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
 * Constructs an Amazon search URL for a single product
 */
export const constructAmazonSearch = (
    product: Product,
): AmazonSearch | null => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const rawSearchTerms = optimizeSearchTerms(product);
    const validation = validateSearchTerms(
        rawSearchTerms,
        AMAZON_MAX_SEARCH_TERM_LENGTH,
    );

    if (!validation.isValid) {
        return null;
    }

    const searchTerms = validation.processedTerms;

    const baseUrl = `https://www.${AMAZON_DOMAIN}/s`;
    const urlParams = new URLSearchParams();

    // Add search terms
    urlParams.append("k", searchTerms);

    // Add parameters to mimic a manual search from the search bar
    const crid = Math.random().toString(36).substring(2, 15).toUpperCase();
    urlParams.append("crid", crid);

    // The sprefix is the search term, plus a suffix.
    // The suffix seems to indicate the type of search, e.g., 'aps' for all products.
    const sprefix = `${searchTerms},aps,132`;
    urlParams.append("sprefix", sprefix);

    // This ref tag indicates "search bar, no suggestion, submission 1"
    urlParams.append("ref", "nb_sb_noss_1");

    const searchUrl = `${baseUrl}?${urlParams.toString()}`;

    return {
        id,
        searchUrl,
        searchTerms,
        category: product.category,
        product: product,
    };
};

