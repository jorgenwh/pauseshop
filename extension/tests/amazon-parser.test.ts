/**
 * Tests for Amazon HTML parser functionality (regex-based, service worker compatible)
 */

import { scrapeAmazonSearchBatch, scrapeSingleAmazonResult, getDefaultParserConfig } from '../src/scraper/amazon-parser';
import {
    AmazonSearchExecutionBatch,
    AmazonSearchExecutionResult,
    AmazonSearchResult,
    AmazonParserConfig,
    ProductCategory,
    TargetGender
} from '../src/types/amazon';

// Mock HTML content for testing (simplified for regex parsing)
const mockAmazonSearchHtml = `
<div data-component-type="s-search-result" data-asin="B08N5WRWNW">
    <img class="s-image" src="https://m.media-amazon.com/images/I/61abc123.jpg" alt="Product 1">
    <h2><a class="a-link-normal" href="/dp/B08N5WRWNW/ref=sr_1_1">Wireless Bluetooth Headphones</a></h2>
</div>
<div data-component-type="s-search-result" data-asin="B07XJ8C8F5">
    <img class="s-image" src="https://m.media-amazon.com/images/I/71def456.jpg" alt="Product 2">
    <h2><a class="a-link-normal" href="/dp/B07XJ8C8F5/ref=sr_1_2">Smart Watch Fitness Tracker</a></h2>
</div>
<div data-component-type="s-search-result" data-asin="B09123GHI7">
    <img class="s-image" src="https://m.media-amazon.com/images/I/81ghi789.jpg" alt="Product 3">
    <h2><a class="a-link-normal" href="/dp/B09123GHI7/ref=sr_1_3">USB-C Cable 6ft</a></h2>
</div>
`;

const mockAmazonMinimalHtml = `
<div data-asin="B08MINIMAL1">
    <img src="https://m.media-amazon.com/images/I/minimal123.jpg" alt="Minimal Product">
    <a href="/dp/B08MINIMAL1/">Minimal Product Link</a>
</div>
`;

const mockAmazonEmptyHtml = `
<div id="s-no-result-section">
    <span>No results found</span>
</div>
`;

// Helper function to create mock search execution result
const createMockExecutionResult = (
    productId: string,
    searchUrl: string,
    htmlContent: string,
    success = true
): AmazonSearchExecutionResult => {
    const mockSearchResult: AmazonSearchResult = {
        productId,
        searchUrl,
        searchTerms: 'test product',
        category: ProductCategory.ELECTRONICS,
        confidence: 0.8,
        originalProduct: {
            name: 'Test Product',
            category: ProductCategory.ELECTRONICS,
            brand: 'TestBrand',
            primaryColor: 'black',
            secondaryColors: [],
            features: ['wireless'],
            targetGender: TargetGender.UNISEX,
            searchTerms: 'test product'
        }
    };

    return {
        productId,
        searchUrl,
        success,
        htmlContent: success ? htmlContent : undefined,
        error: success ? undefined : 'Test error',
        statusCode: success ? 200 : 500,
        responseTime: 1000,
        retryCount: 0,
        originalSearchResult: mockSearchResult
    };
};

describe('Amazon Parser', () => {
    describe('getDefaultParserConfig', () => {
        it('should return default configuration', () => {
            const config = getDefaultParserConfig();
            
            expect(config.maxProductsPerSearch).toBe(5);
            expect(config.requireThumbnail).toBe(true);
            expect(config.validateUrls).toBe(true);
            expect(config.timeoutMs).toBe(5000);
        });
    });

    describe('scrapeSingleAmazonResult', () => {
        it('should scrape products from valid HTML', () => {
            const executionResult = createMockExecutionResult(
                'test-product-1',
                'https://www.amazon.com/s?k=headphones',
                mockAmazonSearchHtml
            );

            const scrapedResult = scrapeSingleAmazonResult(executionResult);

            expect(scrapedResult.success).toBe(true);
            expect(scrapedResult.products).toHaveLength(3);
            expect(scrapedResult.error).toBeUndefined();

            // Check first product
            const firstProduct = scrapedResult.products[0];
            expect(firstProduct.amazonAsin).toBe('B08N5WRWNW');
            expect(firstProduct.thumbnailUrl).toBe('https://m.media-amazon.com/images/I/61abc123.jpg');
            expect(firstProduct.productUrl).toContain('/dp/B08N5WRWNW');
            expect(firstProduct.position).toBe(1);
            expect(firstProduct.confidence).toBeGreaterThan(0.5);
        });

        it('should handle minimal HTML structure', () => {
            const executionResult = createMockExecutionResult(
                'test-product-2',
                'https://www.amazon.com/s?k=minimal',
                mockAmazonMinimalHtml
            );

            const scrapedResult = scrapeSingleAmazonResult(executionResult);

            // The minimal HTML structure without data-component-type should fail validation
            // because it doesn't match the primary search result pattern
            expect(scrapedResult.success).toBe(false);
            expect(scrapedResult.products).toHaveLength(0);
            expect(scrapedResult.error).toBe('No valid products found');
        });

        it('should handle empty search results', () => {
            const executionResult = createMockExecutionResult(
                'test-product-3',
                'https://www.amazon.com/s?k=empty',
                mockAmazonEmptyHtml
            );

            const scrapedResult = scrapeSingleAmazonResult(executionResult);

            expect(scrapedResult.success).toBe(false);
            expect(scrapedResult.products).toHaveLength(0);
            expect(scrapedResult.error).toBe('No valid products found');
        });

        it('should handle failed execution results', () => {
            const executionResult = createMockExecutionResult(
                'test-product-4',
                'https://www.amazon.com/s?k=failed',
                '',
                false
            );

            const scrapedResult = scrapeSingleAmazonResult(executionResult);

            expect(scrapedResult.success).toBe(false);
            expect(scrapedResult.products).toHaveLength(0);
            expect(scrapedResult.error).toBe('Test error');
        });

        it('should respect maxProductsPerSearch configuration', () => {
            const executionResult = createMockExecutionResult(
                'test-product-5',
                'https://www.amazon.com/s?k=headphones',
                mockAmazonSearchHtml
            );

            const config: Partial<AmazonParserConfig> = {
                maxProductsPerSearch: 2
            };

            const scrapedResult = scrapeSingleAmazonResult(executionResult, config);

            expect(scrapedResult.success).toBe(true);
            expect(scrapedResult.products).toHaveLength(2);
        });

        it('should handle requireThumbnail configuration', () => {
            const htmlWithoutImages = `
                <div data-component-type="s-search-result" data-asin="B08NOIMAGE1">
                    <h2><a href="/dp/B08NOIMAGE1/">Product without image</a></h2>
                </div>
            `;

            const executionResult = createMockExecutionResult(
                'test-product-6',
                'https://www.amazon.com/s?k=noimage',
                htmlWithoutImages
            );

            // With requireThumbnail = true (default)
            const strictResult = scrapeSingleAmazonResult(executionResult);
            expect(strictResult.success).toBe(false);

            // With requireThumbnail = false
            const lenientResult = scrapeSingleAmazonResult(executionResult, {
                requireThumbnail: false
            });
            expect(lenientResult.success).toBe(true);
            expect(lenientResult.products).toHaveLength(1);
        });
    });

    describe('scrapeAmazonSearchBatch', () => {
        it('should process multiple execution results', () => {
            const executionResults: AmazonSearchExecutionResult[] = [
                createMockExecutionResult('product-1', 'https://amazon.com/s?k=test1', mockAmazonSearchHtml),
                createMockExecutionResult('product-2', 'https://amazon.com/s?k=test2', mockAmazonMinimalHtml),
                createMockExecutionResult('product-3', 'https://amazon.com/s?k=test3', mockAmazonEmptyHtml)
            ];

            const executionBatch: AmazonSearchExecutionBatch = {
                executionResults,
                config: {
                    maxConcurrentRequests: 3,
                    requestDelayMs: 1500,
                    timeoutMs: 10000,
                    maxRetries: 2,
                    userAgentRotation: true
                },
                metadata: {
                    totalRequests: 3,
                    successfulRequests: 3,
                    failedRequests: 0,
                    totalExecutionTime: 3000,
                    averageResponseTime: 1000
                }
            };

            const scrapedBatch = scrapeAmazonSearchBatch(executionBatch);

            expect(scrapedBatch.scrapedResults).toHaveLength(3);
            expect(scrapedBatch.metadata.totalSearches).toBe(3);
            expect(scrapedBatch.metadata.successfulScrapes).toBe(1); // Only first has valid products
            expect(scrapedBatch.metadata.failedScrapes).toBe(2);
            expect(scrapedBatch.metadata.totalProductsFound).toBe(3); // 3 from first result only
        });

        it('should handle batch with mixed success/failure results', () => {
            const executionResults: AmazonSearchExecutionResult[] = [
                createMockExecutionResult('product-1', 'https://amazon.com/s?k=test1', mockAmazonSearchHtml, true),
                createMockExecutionResult('product-2', 'https://amazon.com/s?k=test2', '', false),
                createMockExecutionResult('product-3', 'https://amazon.com/s?k=test3', mockAmazonMinimalHtml, true)
            ];

            const executionBatch: AmazonSearchExecutionBatch = {
                executionResults,
                config: {
                    maxConcurrentRequests: 3,
                    requestDelayMs: 1500,
                    timeoutMs: 10000,
                    maxRetries: 2,
                    userAgentRotation: true
                },
                metadata: {
                    totalRequests: 3,
                    successfulRequests: 2,
                    failedRequests: 1,
                    totalExecutionTime: 3000,
                    averageResponseTime: 1000
                }
            };

            const scrapedBatch = scrapeAmazonSearchBatch(executionBatch);

            expect(scrapedBatch.scrapedResults).toHaveLength(3);
            expect(scrapedBatch.metadata.successfulScrapes).toBe(1);
            expect(scrapedBatch.metadata.failedScrapes).toBe(2);
            expect(scrapedBatch.metadata.totalProductsFound).toBe(3); // 3 from successful scrape only
        });

        it('should use custom configuration', () => {
            const executionResults: AmazonSearchExecutionResult[] = [
                createMockExecutionResult('product-1', 'https://amazon.com/s?k=test1', mockAmazonSearchHtml)
            ];

            const executionBatch: AmazonSearchExecutionBatch = {
                executionResults,
                config: {
                    maxConcurrentRequests: 1,
                    requestDelayMs: 1000,
                    timeoutMs: 5000,
                    maxRetries: 1,
                    userAgentRotation: false
                },
                metadata: {
                    totalRequests: 1,
                    successfulRequests: 1,
                    failedRequests: 0,
                    totalExecutionTime: 1000,
                    averageResponseTime: 1000
                }
            };

            const customConfig: Partial<AmazonParserConfig> = {
                maxProductsPerSearch: 2,
                requireThumbnail: false
            };

            const scrapedBatch = scrapeAmazonSearchBatch(executionBatch, customConfig);

            expect(scrapedBatch.config.maxProductsPerSearch).toBe(2);
            expect(scrapedBatch.config.requireThumbnail).toBe(false);
            expect(scrapedBatch.scrapedResults[0].products).toHaveLength(2); // Limited by maxProductsPerSearch
        });
    });

    describe('URL validation', () => {
        it('should validate image URLs correctly', () => {
            const validImageHtml = `
                <div data-component-type="s-search-result" data-asin="B08VALID1">
                    <img class="s-image" src="https://m.media-amazon.com/images/I/valid123.jpg">
                    <a href="/dp/B08VALID1/">Valid Product</a>
                </div>
            `;

            const invalidImageHtml = `
                <div data-component-type="s-search-result" data-asin="B08INVALID1">
                    <img class="s-image" src="invalid-url">
                    <a href="/dp/B08INVALID1/">Invalid Product</a>
                </div>
            `;

            const validResult = scrapeSingleAmazonResult(
                createMockExecutionResult('valid', 'https://amazon.com/s?k=valid', validImageHtml),
                { validateUrls: true }
            );

            const invalidResult = scrapeSingleAmazonResult(
                createMockExecutionResult('invalid', 'https://amazon.com/s?k=invalid', invalidImageHtml),
                { validateUrls: true }
            );

            expect(validResult.success).toBe(true);
            expect(invalidResult.success).toBe(false);
        });

        it('should validate product URLs correctly', () => {
            const validUrlHtml = `
                <div data-component-type="s-search-result" data-asin="B08VALID1">
                    <img class="s-image" src="https://m.media-amazon.com/images/I/valid123.jpg">
                    <a href="/dp/B08VALID1/ref=sr_1_1">Valid Product</a>
                </div>
            `;

            const invalidUrlHtml = `
                <div data-component-type="s-search-result" data-asin="B08INVALID1">
                    <img class="s-image" src="https://m.media-amazon.com/images/I/valid123.jpg">
                    <a href="javascript:void(0)">Invalid Product</a>
                </div>
            `;

            const validResult = scrapeSingleAmazonResult(
                createMockExecutionResult('valid', 'https://amazon.com/s?k=valid', validUrlHtml),
                { validateUrls: true }
            );

            const invalidResult = scrapeSingleAmazonResult(
                createMockExecutionResult('invalid', 'https://amazon.com/s?k=invalid', invalidUrlHtml),
                { validateUrls: true }
            );

            expect(validResult.success).toBe(true);
            expect(invalidResult.success).toBe(false);
        });
    });

    describe('error handling', () => {
        it('should handle malformed HTML gracefully', () => {
            const malformedHtml = '<div><img><a href=""><span>Broken HTML';

            const executionResult = createMockExecutionResult(
                'malformed',
                'https://amazon.com/s?k=malformed',
                malformedHtml
            );

            const result = scrapeSingleAmazonResult(executionResult);
            
            expect(result.success).toBe(false);
            expect(result.products).toHaveLength(0);
        });

        it('should handle empty HTML content', () => {
            const executionResult = createMockExecutionResult(
                'empty',
                'https://amazon.com/s?k=empty',
                ''
            );

            const result = scrapeSingleAmazonResult(executionResult);
            
            expect(result.success).toBe(false);
            expect(result.products).toHaveLength(0);
        });

        it('should measure scraping time', () => {
            const executionResult = createMockExecutionResult(
                'timing',
                'https://amazon.com/s?k=timing',
                mockAmazonSearchHtml
            );

            const result = scrapeSingleAmazonResult(executionResult);
            
            expect(result.scrapingTime).toBeGreaterThanOrEqual(0);
            expect(typeof result.scrapingTime).toBe('number');
        });
    });
});