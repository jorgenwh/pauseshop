/**
 * Demonstration script for Amazon search functionality
 * Shows how to use the Amazon search URL construction
 */

import {
    constructAmazonSearchBatch,
    constructSingleAmazonSearch,
} from "../src/scraper/amazon-search";
import { Product, ProductCategory, TargetGender } from "../src/types/amazon";

// Example products from OpenAI analysis
const exampleProducts: Product[] = [
    {
        name: "Black Leather Jacket",
        category: ProductCategory.CLOTHING,
        brand: "unknown",
        primaryColor: "black",
        secondaryColors: ["silver"],
        features: ["leather", "zipper", "biker style"],
        targetGender: TargetGender.MEN,
        searchTerms: "men black leather jacket biker style",
    },
    {
        name: "Wireless Earbuds",
        category: ProductCategory.ELECTRONICS,
        brand: "Apple",
        primaryColor: "white",
        secondaryColors: [],
        features: ["wireless", "noise cancelling", "bluetooth"],
        targetGender: TargetGender.UNISEX,
        searchTerms: "Apple AirPods wireless earbuds noise cancelling",
    },
    {
        name: "Red Running Shoes",
        category: ProductCategory.FOOTWEAR,
        brand: "Nike",
        primaryColor: "red",
        secondaryColors: ["white", "black"],
        features: ["running", "athletic", "mesh"],
        targetGender: TargetGender.WOMEN,
        searchTerms: "women red Nike running shoes athletic",
    },
];

console.log("=== Amazon Search URL Construction Demo ===\n");

// Demo 1: Single product search
console.log("1. Single Product Search:");
const singleResult = constructSingleAmazonSearch(exampleProducts[0]);
console.log(`Product: ${singleResult.originalProduct.name}`);
console.log(`Search Terms: ${singleResult.searchTerms}`);
console.log(`Confidence: ${singleResult.confidence.toFixed(2)}`);
console.log(`Amazon URL: ${singleResult.searchUrl}\n`);

// Demo 2: Batch product search
console.log("2. Batch Product Search:");
const batchResult = constructAmazonSearchBatch(exampleProducts);
console.log(`Total Products: ${batchResult.metadata.totalProducts}`);
console.log(`Successful Searches: ${batchResult.metadata.successfulSearches}`);
console.log(`Processing Time: ${batchResult.metadata.processingTime}ms\n`);

batchResult.searchResults.forEach((result, index) => {
    console.log(`Product ${index + 1}: ${result.originalProduct.name}`);
    console.log(`  Category: ${result.category}`);
    console.log(`  Search Terms: ${result.searchTerms}`);
    console.log(`  Confidence: ${result.confidence.toFixed(2)}`);
    console.log(`  URL: ${result.searchUrl}\n`);
});

// Demo 3: Custom configuration
console.log("3. Custom Configuration (Amazon UK):");
const ukConfig = {
    domain: "amazon.co.uk",
    enableCategoryFiltering: false,
    maxSearchTermLength: 100,
};

const ukResult = constructSingleAmazonSearch(exampleProducts[1], ukConfig);
console.log(`Product: ${ukResult.originalProduct.name}`);
console.log(`UK Amazon URL: ${ukResult.searchUrl}\n`);

// Demo 4: Fallback behavior
console.log("4. Fallback Behavior (Empty Search Terms):");
const fallbackProduct: Product = {
    ...exampleProducts[2],
    searchTerms: "", // Empty search terms to trigger fallback
};

const fallbackResult = constructSingleAmazonSearch(fallbackProduct);
console.log(`Product: ${fallbackResult.originalProduct.name}`);
console.log(`Fallback Search Terms: ${fallbackResult.searchTerms}`);
console.log(`Confidence: ${fallbackResult.confidence.toFixed(2)}`);
console.log(`URL: ${fallbackResult.searchUrl}\n`);

console.log("=== Demo Complete ===");
