/**
 * Unit tests for Amazon HTTP client
 */

import { executeAmazonSearchBatch, executeAmazonSearch, getDefaultHttpConfig } from '../src/scraper/amazon-http-client';
import {
    AmazonSearchBatch,
    AmazonSearchResult,
    ProductCategory,
    TargetGender,
    AmazonHttpConfig
} from '../src/types/amazon';

// Mock fetch for testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Amazon HTTP Client', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFetch.mockClear();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('getDefaultHttpConfig', () => {
        it('should return valid default configuration', () => {
            const config = getDefaultHttpConfig();
            
            expect(config).toBeDefined();
            expect(config.maxConcurrentRequests).toBe(3);
            expect(config.requestDelayMs).toBe(1500);
            expect(config.timeoutMs).toBe(10000);
            expect(config.maxRetries).toBe(2);
            expect(config.userAgentRotation).toBe(true);
        });
    });

    describe('executeAmazonSearch', () => {
        const mockSearchResult: AmazonSearchResult = {
            productId: 'test-product-1',
            searchUrl: 'https://www.amazon.com/s?k=test+product',
            searchTerms: 'test product',
            category: ProductCategory.CLOTHING,
            confidence: 0.8,
            originalProduct: {
                name: 'Test Product',
                category: ProductCategory.CLOTHING,
                brand: 'TestBrand',
                primaryColor: 'blue',
                secondaryColors: [],
                features: ['cotton'],
                targetGender: TargetGender.UNISEX,
                searchTerms: 'test product'
            }
        };

        it('should successfully execute search and return HTML content', async () => {
            const mockHtmlContent = '<html><body>Amazon search results</body></html>';
            
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: () => Promise.resolve(mockHtmlContent)
            });

            const result = await executeAmazonSearch(mockSearchResult);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.productId).toBe('test-product-1');
            expect(result.searchUrl).toBe('https://www.amazon.com/s?k=test+product');
            expect(result.htmlContent).toBe(mockHtmlContent);
            expect(result.statusCode).toBe(200);
            expect(result.retryCount).toBe(0);
            expect(result.responseTime).toBeGreaterThan(0);
        });

        it('should handle HTTP errors gracefully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });

            const result = await executeAmazonSearch(mockSearchResult);

            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toContain('HTTP 404');
            expect(result.statusCode).toBeUndefined();
            expect(result.htmlContent).toBeUndefined();
        });

        it('should detect Amazon anti-bot protection', async () => {
            const mockCaptchaContent = '<html><body>Enter the characters you see below</body></html>';
            
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: () => Promise.resolve(mockCaptchaContent)
            });

            const result = await executeAmazonSearch(mockSearchResult);

            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toContain('Amazon anti-bot protection detected');
        });

        it('should handle network timeouts', async () => {
            // Mock AbortError
            const abortError = new Error('Network timeout');
            abortError.name = 'AbortError';
            
            mockFetch.mockRejectedValueOnce(abortError);

            const result = await executeAmazonSearch(mockSearchResult, { timeoutMs: 1000 });

            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toContain('Request timeout');
        });

        it('should validate response content length', async () => {
            const mockShortContent = '<html></html>'; // Too short
            
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: () => Promise.resolve(mockShortContent)
            });

            const result = await executeAmazonSearch(mockSearchResult);

            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid or empty response content');
        });

        it('should apply custom configuration', async () => {
            const mockHtmlContent = '<html><body>Amazon search results with custom config</body></html>';
            
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: () => Promise.resolve(mockHtmlContent)
            });

            const customConfig: Partial<AmazonHttpConfig> = {
                timeoutMs: 5000,
                maxRetries: 1,
                userAgentRotation: false
            };

            const result = await executeAmazonSearch(mockSearchResult, customConfig);

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.htmlContent).toBe(mockHtmlContent);
        });
    });

    describe('executeAmazonSearchBatch', () => {
        const mockSearchBatch: AmazonSearchBatch = {
            searchResults: [
                {
                    productId: 'test-product-1',
                    searchUrl: 'https://www.amazon.com/s?k=test+product+1',
                    searchTerms: 'test product 1',
                    category: ProductCategory.CLOTHING,
                    confidence: 0.8,
                    originalProduct: {
                        name: 'Test Product 1',
                        category: ProductCategory.CLOTHING,
                        brand: 'TestBrand',
                        primaryColor: 'blue',
                        secondaryColors: [],
                        features: ['cotton'],
                        targetGender: TargetGender.UNISEX,
                        searchTerms: 'test product 1'
                    }
                },
                {
                    productId: 'test-product-2',
                    searchUrl: 'https://www.amazon.com/s?k=test+product+2',
                    searchTerms: 'test product 2',
                    category: ProductCategory.ELECTRONICS,
                    confidence: 0.9,
                    originalProduct: {
                        name: 'Test Product 2',
                        category: ProductCategory.ELECTRONICS,
                        brand: 'TechBrand',
                        primaryColor: 'black',
                        secondaryColors: [],
                        features: ['wireless'],
                        targetGender: TargetGender.UNISEX,
                        searchTerms: 'test product 2'
                    }
                }
            ],
            config: {
                domain: 'amazon.com',
                maxSearchTermLength: 200,
                enableCategoryFiltering: true,
                fallbackToGenericSearch: true
            },
            metadata: {
                totalProducts: 2,
                successfulSearches: 2,
                failedSearches: 0,
                processingTime: 100
            }
        };

        it('should execute batch searches successfully', async () => {
            const mockHtmlContent1 = '<html><body>Search results 1</body></html>';
            const mockHtmlContent2 = '<html><body>Search results 2</body></html>';
            
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: () => Promise.resolve(mockHtmlContent1)
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: () => Promise.resolve(mockHtmlContent2)
                });

            const result = await executeAmazonSearchBatch(mockSearchBatch);

            expect(result).toBeDefined();
            expect(result.executionResults).toHaveLength(2);
            expect(result.metadata.totalRequests).toBe(2);
            expect(result.metadata.successfulRequests).toBe(2);
            expect(result.metadata.failedRequests).toBe(0);
            expect(result.metadata.averageResponseTime).toBeGreaterThan(0);
            
            // Check individual results
            expect(result.executionResults[0].success).toBe(true);
            expect(result.executionResults[0].htmlContent).toBe(mockHtmlContent1);
            expect(result.executionResults[1].success).toBe(true);
            expect(result.executionResults[1].htmlContent).toBe(mockHtmlContent2);
        });

        it('should handle mixed success/failure results', async () => {
            const mockHtmlContent = '<html><body>Search results</body></html>';
            
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    statusText: 'OK',
                    text: () => Promise.resolve(mockHtmlContent)
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    statusText: 'Internal Server Error'
                });

            const result = await executeAmazonSearchBatch(mockSearchBatch);

            expect(result).toBeDefined();
            expect(result.executionResults).toHaveLength(2);
            expect(result.metadata.successfulRequests).toBe(1);
            expect(result.metadata.failedRequests).toBe(1);
            
            expect(result.executionResults[0].success).toBe(true);
            expect(result.executionResults[1].success).toBe(false);
        });

        it('should handle empty search batch', async () => {
            const emptyBatch: AmazonSearchBatch = {
                ...mockSearchBatch,
                searchResults: []
            };

            const result = await executeAmazonSearchBatch(emptyBatch);

            expect(result).toBeDefined();
            expect(result.executionResults).toHaveLength(0);
            expect(result.metadata.totalRequests).toBe(0);
            expect(result.metadata.successfulRequests).toBe(0);
            expect(result.metadata.failedRequests).toBe(0);
        });

        it('should filter out invalid search results', async () => {
            const batchWithInvalidResults: AmazonSearchBatch = {
                ...mockSearchBatch,
                searchResults: [
                    mockSearchBatch.searchResults[0], // Valid
                    {
                        ...mockSearchBatch.searchResults[1],
                        searchUrl: '' // Invalid empty URL
                    }
                ]
            };

            const mockHtmlContent = '<html><body>Search results</body></html>';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                statusText: 'OK',
                text: () => Promise.resolve(mockHtmlContent)
            });

            const result = await executeAmazonSearchBatch(batchWithInvalidResults);

            expect(result).toBeDefined();
            expect(result.executionResults).toHaveLength(1); // Only valid result processed
            expect(result.metadata.totalRequests).toBe(1);
            expect(result.metadata.successfulRequests).toBe(1);
        });
    });
});