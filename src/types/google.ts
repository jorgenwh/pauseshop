/**
 * Type definitions for Amazon search functionality
 */

import { Category, Product } from "./common";

export interface GoogleSearch {
    id: string;
    searchUrl: string;
    searchTerms: string;
    category: Category;
    product: Product;
}

export interface CategoryNodeMapping {
    [key: string]: string;
}

export interface SearchTermValidationResult {
    isValid: boolean;
    processedTerms: string;
    warnings: string[];
}

export interface GoogleSearchResult {
    id: string;
    searchUrl: string;
    htmlContent: string;
    search: GoogleSearch;
}

export interface GoogleScrapedProduct {
    id: string;
    amazonAsin?: string;
    thumbnailUrl: string;
    productUrl: string;
    position: number;
    price?: number;
}

export interface GoogleScrapedResult {
    id: string;
    searchUrl: string;
    products: GoogleScrapedProduct[];
    search: GoogleSearch;
    searchResult: GoogleSearchResult;
}
