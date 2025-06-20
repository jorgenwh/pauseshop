/**
 * Type definitions for Amazon search functionality
 */

import { Category, Product } from "./common";

export interface AmazonSearch {
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

export interface AmazonSearchResult {
    id: string;
    searchUrl: string;
    htmlContent: string;
    search: AmazonSearch;
}

export interface AmazonScrapedProduct {
    id: string;
    amazonAsin?: string;
    thumbnailUrl: string;
    productUrl: string;
    position: number;
    price?: number;
}

export interface AmazonScrapedResult {
    id: string;
    searchUrl: string;
    products: AmazonScrapedProduct[];
    search: AmazonSearch;
    searchResult: AmazonSearchResult;
}
