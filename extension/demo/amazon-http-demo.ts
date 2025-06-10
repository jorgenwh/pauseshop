/**
 * Demo for testing Amazon HTTP client functionality
 * This file can be used to test the complete workflow including actual HTTP requests
 */

import {
    constructAmazonSearchBatch,
    constructSingleAmazonSearch,
} from "../src/scraper/amazon-search";
import {
    executeAmazonSearchBatch,
    executeAmazonSearch,
    getDefaultHttpConfig,
} from "../src/scraper/amazon-http-client";
import { Product, ProductCategory, TargetGender } from "../src/types/amazon";

// Sample product data for testing
const sampleProducts: Product[] = [
    {
        name: "Blue Cotton T-Shirt",
        category: ProductCategory.CLOTHING,
        brand: "Nike",
        primaryColor: "blue",
        secondaryColors: ["white"],
        features: ["cotton", "casual", "short sleeve"],
        targetGender: TargetGender.MEN,
        searchTerms: "mens blue cotton t-shirt nike",
    },
    {
        name: "Wireless Bluetooth Headphones",
        category: ProductCategory.ELECTRONICS,
        brand: "Sony",
        primaryColor: "black",
        secondaryColors: ["silver"],
        features: ["wireless", "bluetooth", "noise cancelling"],
        targetGender: TargetGender.UNISEX,
        searchTerms: "wireless bluetooth headphones sony noise cancelling",
    },
    {
        name: "Red Leather Handbag",
        category: ProductCategory.ACCESSORIES,
        brand: "Coach",
        primaryColor: "red",
        secondaryColors: ["gold"],
        features: ["leather", "designer", "medium size"],
        targetGender: TargetGender.WOMEN,
        searchTerms: "womens red leather handbag coach designer",
    },
];

/**
 * Demo function to test the complete Amazon search workflow
 */
export async function runAmazonHttpDemo(): Promise<void> {
    console.log("🚀 Starting Amazon HTTP Client Demo...\n");

    try {
        // Step 1: Display sample products
        console.log("📦 Sample Products:");
        sampleProducts.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} (${product.category})`);
            console.log(
                `   Brand: ${product.brand}, Color: ${product.primaryColor}`,
            );
            console.log(`   Search Terms: "${product.searchTerms}"\n`);
        });

        // Step 2: Construct Amazon search URLs
        console.log("🔗 Constructing Amazon search URLs...");
        const searchBatch = constructAmazonSearchBatch(sampleProducts, {
            domain: "amazon.com",
            enableCategoryFiltering: true,
            fallbackToGenericSearch: true,
        });

        console.log(
            `✅ URLs constructed: ${searchBatch.metadata.successfulSearches}/${searchBatch.metadata.totalProducts} successful`,
        );
        console.log(
            `⏱️  Processing time: ${searchBatch.metadata.processingTime}ms\n`,
        );

        // Display constructed URLs
        console.log("🔗 Constructed Search URLs:");
        searchBatch.searchResults.forEach((result, index) => {
            console.log(`${index + 1}. Product ID: ${result.productId}`);
            console.log(`   URL: ${result.searchUrl}`);
            console.log(
                `   Confidence: ${(result.confidence * 100).toFixed(1)}%\n`,
            );
        });

        // Step 3: Get default HTTP configuration
        const httpConfig = getDefaultHttpConfig();
        console.log("⚙️  HTTP Configuration:");
        console.log(
            `   Max Concurrent Requests: ${httpConfig.maxConcurrentRequests}`,
        );
        console.log(`   Request Delay: ${httpConfig.requestDelayMs}ms`);
        console.log(`   Timeout: ${httpConfig.timeoutMs}ms`);
        console.log(`   Max Retries: ${httpConfig.maxRetries}`);
        console.log(
            `   User Agent Rotation: ${httpConfig.userAgentRotation}\n`,
        );

        // Step 4: Execute Amazon search requests
        console.log("🌐 Executing Amazon search requests...");
        console.log(
            "⚠️  Note: This will make actual HTTP requests to Amazon.com\n",
        );

        const startTime = Date.now();
        const executionResults = await executeAmazonSearchBatch(searchBatch, {
            maxConcurrentRequests: 2, // Reduced for demo
            requestDelayMs: 2000, // Increased delay for demo
            timeoutMs: 15000, // Longer timeout for demo
            maxRetries: 1, // Reduced retries for demo
            userAgentRotation: true,
        });

        const totalTime = Date.now() - startTime;

        // Step 5: Display results
        console.log("📊 Execution Results:");
        console.log(
            `   Total Requests: ${executionResults.metadata.totalRequests}`,
        );
        console.log(
            `   Successful: ${executionResults.metadata.successfulRequests}`,
        );
        console.log(`   Failed: ${executionResults.metadata.failedRequests}`);
        console.log(
            `   Total Execution Time: ${executionResults.metadata.totalExecutionTime}ms`,
        );
        console.log(
            `   Average Response Time: ${executionResults.metadata.averageResponseTime.toFixed(0)}ms\n`,
        );

        // Display individual results
        console.log("📄 Individual Request Results:");
        executionResults.executionResults.forEach((result, index) => {
            console.log(
                `${index + 1}. Product: ${result.originalSearchResult.originalProduct.name}`,
            );
            console.log(`   Success: ${result.success ? "✅" : "❌"}`);

            if (result.success) {
                console.log(`   Status Code: ${result.statusCode}`);
                console.log(`   Response Time: ${result.responseTime}ms`);
                console.log(
                    `   HTML Size: ${result.htmlContent?.length || 0} characters`,
                );
                console.log(
                    `   Contains "Amazon": ${result.htmlContent?.includes("Amazon") ? "Yes" : "No"}`,
                );
                console.log(
                    `   Contains Products: ${result.htmlContent?.includes('data-component-type="s-search-result"') ? "Yes" : "No"}`,
                );
            } else {
                console.log(`   Error: ${result.error}`);
                console.log(`   Retry Count: ${result.retryCount}`);
            }
            console.log("");
        });

        // Step 6: Test single search function
        console.log("🎯 Testing single search function...");
        if (searchBatch.searchResults.length > 0) {
            const singleResult = await executeAmazonSearch(
                searchBatch.searchResults[0],
                {
                    timeoutMs: 10000,
                    maxRetries: 1,
                },
            );

            console.log(
                `Single search result: ${singleResult.success ? "Success" : "Failed"}`,
            );
            if (singleResult.success) {
                console.log(
                    `HTML preview: ${singleResult.htmlContent?.substring(0, 200)}...`,
                );
            } else {
                console.log(`Error: ${singleResult.error}`);
            }
        }

        console.log("\n🎉 Demo completed successfully!");
    } catch (error) {
        console.error("❌ Demo failed:", error);

        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Stack trace:", error.stack);
        }
    }
}

/**
 * Demo function to test URL construction only (without HTTP requests)
 */
export function runUrlConstructionDemo(): void {
    console.log("🔗 URL Construction Demo (No HTTP Requests)\n");

    // Test single product
    console.log("Testing single product URL construction:");
    const singleProduct = sampleProducts[0];
    const singleSearchResult = constructSingleAmazonSearch(singleProduct);

    console.log(`Product: ${singleProduct.name}`);
    console.log(`Search URL: ${singleSearchResult.searchUrl}`);
    console.log(`Search Terms: "${singleSearchResult.searchTerms}"`);
    console.log(
        `Confidence: ${(singleSearchResult.confidence * 100).toFixed(1)}%\n`,
    );

    // Test batch construction
    console.log("Testing batch URL construction:");
    const batchResult = constructAmazonSearchBatch(sampleProducts);

    console.log(`Total Products: ${batchResult.metadata.totalProducts}`);
    console.log(`Successful URLs: ${batchResult.metadata.successfulSearches}`);
    console.log(`Failed URLs: ${batchResult.metadata.failedSearches}`);
    console.log(`Processing Time: ${batchResult.metadata.processingTime}ms\n`);

    batchResult.searchResults.forEach((result, index) => {
        console.log(`${index + 1}. ${result.originalProduct.name}`);
        console.log(`   URL: ${result.searchUrl.substring(0, 80)}...`);
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    });
}

// Export functions for manual testing
if (typeof window !== "undefined") {
    // Browser environment - attach to window for console testing
    (window as any).amazonHttpDemo = {
        runAmazonHttpDemo,
        runUrlConstructionDemo,
        sampleProducts,
    };

    console.log("🎮 Amazon HTTP Demo loaded! Try:");
    console.log(
        "- amazonHttpDemo.runUrlConstructionDemo() // Safe, no HTTP requests",
    );
    console.log(
        "- amazonHttpDemo.runAmazonHttpDemo() // Makes actual HTTP requests to Amazon",
    );
    console.log("- amazonHttpDemo.sampleProducts // View sample data");
}
