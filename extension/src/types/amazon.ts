/**
 * Type definitions for Amazon search functionality
 */

export enum ProductCategory {
    CLOTHING = "clothing",
    ELECTRONICS = "electronics",
    FURNITURE = "furniture",
    ACCESSORIES = "accessories",
    FOOTWEAR = "footwear",
    HOME_DECOR = "home_decor",
    BOOKS_MEDIA = "books_media",
    SPORTS_FITNESS = "sports_fitness",
    BEAUTY_PERSONAL_CARE = "beauty_personal_care",
    KITCHEN_DINING = "kitchen_dining",
    OTHER = "other",
}

export enum TargetGender {
    MEN = "men",
    WOMEN = "women",
    UNISEX = "unisex",
    BOY = "boy",
    GIRL = "girl",
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

export interface AmazonSearch {
    id: string;
    searchUrl: string;
    searchTerms: string;
    category: ProductCategory
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
}

export interface AmazonScrapedResult {
    id: string;
    searchUrl: string;
    products: AmazonScrapedProduct[];
    search: AmazonSearch;
    searchResult: AmazonSearchResult;
}
