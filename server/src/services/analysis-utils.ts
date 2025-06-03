/**
 * Analysis Utilities
 * Shared functionality for analysis services
 */

import { promises as fs } from 'fs';
import { resolve } from 'path';
import {
    Product,
    ProductCategory,
    TargetGender
} from '../types/analyze';

// Shared prompt cache
let promptCache: string | null = null;

/**
 * Load the prompt from file (shared cache)
 */
export async function loadPrompt(): Promise<string> {
    if (promptCache) {
        return promptCache;
    }

    try {
        const promptPath = resolve(__dirname, '../prompts/product-analysis.txt');
        const promptContent = await fs.readFile(promptPath, 'utf-8');
        promptCache = promptContent.trim();
        return promptCache;
    } catch (error) {
        console.error('[ANALYSIS_UTILS] Error loading prompt:', error);
        throw new Error('Failed to load image analysis prompt');
    }
}

/**
 * Extract JSON from response, handling potential extra text
 */
export function extractJSONFromResponse(response: string): string {
    const jsonStart = response.indexOf('{');
    if (jsonStart === -1) throw new Error('No JSON found in response');
    
    const jsonEnd = response.lastIndexOf('}');
    if (jsonEnd === -1) throw new Error('Incomplete JSON in response');
    
    return response.substring(jsonStart, jsonEnd + 1);
}

/**
 * Validate and sanitize products array
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateAndSanitizeProducts(products: any[]): Product[] {
    return products
        .filter(product => isValidProduct(product))
        .map(product => sanitizeProduct(product));
}

/**
 * Check if product has all required fields
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValidProduct(product: any): boolean {
    return (
        typeof product === 'object' &&
        typeof product.name === 'string' &&
        typeof product.category === 'string' &&
        typeof product.brand === 'string' &&
        typeof product.primaryColor === 'string' &&
        Array.isArray(product.secondaryColors) &&
        Array.isArray(product.features) &&
        typeof product.targetGender === 'string' &&
        typeof product.searchTerms === 'string'
    );
}

/**
 * Sanitize and normalize product data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeProduct(product: any): Product {
    return {
        name: String(product.name).substring(0, 100).trim(),
        category: validateCategory(product.category),
        brand: String(product.brand).substring(0, 50).trim(),
        primaryColor: String(product.primaryColor).substring(0, 30).trim(),
        secondaryColors: sanitizeStringArray(product.secondaryColors, 30, 3),
        features: sanitizeStringArray(product.features, 50, 5),
        targetGender: validateTargetGender(product.targetGender),
        searchTerms: String(product.searchTerms).substring(0, 200).trim()
    };
}

/**
 * Validate product category, fallback to OTHER if invalid
 */
function validateCategory(category: string): ProductCategory {
    const validCategories = Object.values(ProductCategory);
    return validCategories.includes(category as ProductCategory)
        ? category as ProductCategory
        : ProductCategory.OTHER;
}

/**
 * Validate target gender, fallback to UNISEX if invalid
 */
function validateTargetGender(targetGender: string): TargetGender {
    const validGenders = Object.values(TargetGender);
    return validGenders.includes(targetGender as TargetGender)
        ? targetGender as TargetGender
        : TargetGender.UNISEX;
}

/**
 * Sanitize array of strings with length and count limits
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeStringArray(arr: any[], maxLength: number, maxCount: number): string[] {
    if (!Array.isArray(arr)) return [];
    
    return arr
        .slice(0, maxCount)
        .map(item => String(item).substring(0, maxLength).trim())
        .filter(item => item.length > 0);
}

/**
 * Handle API errors with service-specific prefixes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleAPIError(error: any, servicePrefix: string): never {
    if (error?.status === 401) {
        throw new Error(`${servicePrefix}_AUTH_ERROR`);
    }
    if (error?.status === 429) {
        throw new Error(`${servicePrefix}_RATE_LIMIT`);
    }
    if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
        throw new Error(`${servicePrefix}_TIMEOUT`);
    }
    
    throw new Error(`${servicePrefix}_API_ERROR`);
}