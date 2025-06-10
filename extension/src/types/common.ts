/**
 * Common type definitions shared across the extension.
 */

export enum Category {
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
    iconCategory: string;
    category: Category;
    brand: string;
    primaryColor: string;
    secondaryColors: string[];
    features: string[];
    targetGender: TargetGender;
    searchTerms: string;
}