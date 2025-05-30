/**
 * Unit tests for Amazon search URL construction
 */

import { 
    constructAmazonSearchBatch,
    constructSingleAmazonSearch,
    validateAmazonDomain,
    getAvailableAmazonDomains
} from '../src/scraper/amazon-search';
import { Product, ProductCategory, TargetGender } from '../src/types/amazon';

// Mock product data for testing
const mockProducts: Product[] = [
    {
        name: 'Navy Blue Cotton T-Shirt',
        category: ProductCategory.CLOTHING,
        brand: 'Nike',
        primaryColor: 'navy blue',
        secondaryColors: ['white'],
        features: ['cotton', 'short sleeve'],
        targetGender: TargetGender.MEN,
        searchTerms: 'men navy blue cotton t-shirt Nike'
    },
    {
        name: 'Wireless Bluetooth Headphones',
        category: ProductCategory.ELECTRONICS,
        brand: 'Sony',
        primaryColor: 'black',
        secondaryColors: [],
        features: ['wireless', 'noise cancelling', 'bluetooth'],
        targetGender: TargetGender.UNISEX,
        searchTerms: 'wireless bluetooth headphones Sony noise cancelling'
    },
    {
        name: 'Red Running Shoes',
        category: ProductCategory.FOOTWEAR,
        brand: 'Adidas',
        primaryColor: 'red',
        secondaryColors: ['white', 'black'],
        features: ['running', 'athletic', 'mesh'],
        targetGender: TargetGender.WOMEN,
        searchTerms: 'women red running shoes Adidas athletic'
    },
    {
        name: 'Unknown Product',
        category: ProductCategory.OTHER,
        brand: 'unknown',
        primaryColor: 'unknown',
        secondaryColors: [],
        features: [],
        targetGender: TargetGender.UNISEX,
        searchTerms: ''
    }
];

describe('Amazon Search URL Construction', () => {
    
    describe('constructSingleAmazonSearch', () => {
        
        test('should construct valid URL for clothing product', () => {
            const product = mockProducts[0]; // Navy Blue Cotton T-Shirt
            const result = constructSingleAmazonSearch(product);
            
            expect(result.searchUrl).toContain('amazon.com/s');
            expect(result.searchUrl).toContain('men+navy+blue+cotton+t-shirt+Nike');
            expect(result.searchUrl).toContain('rh=n%3A7141123011'); // Clothing category node (URL encoded)
            expect(result.category).toBe(ProductCategory.CLOTHING);
            expect(result.confidence).toBeGreaterThan(0.5);
            expect(result.originalProduct).toEqual(product);
        });

        test('should construct valid URL for electronics product', () => {
            const product = mockProducts[1]; // Wireless Bluetooth Headphones
            const result = constructSingleAmazonSearch(product);
            
            expect(result.searchUrl).toContain('amazon.com/s');
            expect(result.searchUrl).toContain('wireless+bluetooth+headphones+Sony');
            expect(result.searchUrl).toContain('rh=n%3A172282'); // Electronics category node (URL encoded)
            expect(result.category).toBe(ProductCategory.ELECTRONICS);
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        test('should handle product with empty search terms', () => {
            const product = mockProducts[3]; // Unknown Product
            const result = constructSingleAmazonSearch(product);
            
            expect(result.searchUrl).toContain('amazon.com/s');
            expect(result.searchUrl).toContain('Unknown+Product');
            expect(result.category).toBe(ProductCategory.OTHER);
            expect(result.confidence).toBeLessThan(0.8);
        });

        test('should respect custom configuration', () => {
            const product = mockProducts[0];
            const config = {
                domain: 'amazon.co.uk',
                enableCategoryFiltering: false,
                maxSearchTermLength: 50
            };
            
            const result = constructSingleAmazonSearch(product, config);
            
            expect(result.searchUrl).toContain('amazon.co.uk/s');
            expect(result.searchUrl).not.toContain('rh=n:'); // No category filtering
        });

        test('should truncate very long search terms', () => {
            const longProduct: Product = {
                ...mockProducts[0],
                searchTerms: 'this is a very long search term that exceeds the maximum length limit and should be truncated to prevent URL issues and ensure proper functionality of the Amazon search system'
            };
            
            const config = { maxSearchTermLength: 50 };
            const result = constructSingleAmazonSearch(longProduct, config);
            
            expect(result.searchTerms.length).toBeLessThanOrEqual(50);
            expect(result.searchUrl).toBeDefined();
        });

        test('should handle special characters in search terms', () => {
            const specialProduct: Product = {
                ...mockProducts[0],
                searchTerms: 'product with <special> {characters} [brackets]'
            };
            
            const result = constructSingleAmazonSearch(specialProduct);
            
            expect(result.searchUrl).not.toContain('<');
            expect(result.searchUrl).not.toContain('>');
            expect(result.searchUrl).not.toContain('{');
            expect(result.searchUrl).not.toContain('}');
        });

    });

    describe('constructAmazonSearchBatch', () => {
        
        test('should process multiple products successfully', () => {
            const result = constructAmazonSearchBatch(mockProducts);
            
            expect(result.searchResults).toHaveLength(mockProducts.length);
            expect(result.metadata.totalProducts).toBe(mockProducts.length);
            expect(result.metadata.successfulSearches).toBeGreaterThan(0);
            expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
        });

        test('should handle empty product array', () => {
            const result = constructAmazonSearchBatch([]);
            
            expect(result.searchResults).toHaveLength(0);
            expect(result.metadata.totalProducts).toBe(0);
            expect(result.metadata.successfulSearches).toBe(0);
            expect(result.metadata.failedSearches).toBe(0);
        });

        test('should maintain product order in results', () => {
            const result = constructAmazonSearchBatch(mockProducts);
            
            result.searchResults.forEach((searchResult, index) => {
                expect(searchResult.originalProduct).toEqual(mockProducts[index]);
            });
        });

        test('should apply consistent configuration to all products', () => {
            const config = {
                domain: 'amazon.de',
                enableCategoryFiltering: false
            };
            
            const result = constructAmazonSearchBatch(mockProducts, config);
            
            expect(result.config.domain).toBe('amazon.de');
            expect(result.config.enableCategoryFiltering).toBe(false);
            
            result.searchResults.forEach(searchResult => {
                if (searchResult.searchUrl) {
                    expect(searchResult.searchUrl).toContain('amazon.de');
                    expect(searchResult.searchUrl).not.toContain('rh=n:');
                }
            });
        });

    });

    describe('Domain validation', () => {
        
        test('should validate supported Amazon domains', () => {
            expect(validateAmazonDomain('amazon.com')).toBe(true);
            expect(validateAmazonDomain('amazon.co.uk')).toBe(true);
            expect(validateAmazonDomain('amazon.de')).toBe(true);
            expect(validateAmazonDomain('amazon.fr')).toBe(true);
        });

        test('should reject invalid domains', () => {
            expect(validateAmazonDomain('ebay.com')).toBe(false);
            expect(validateAmazonDomain('amazon.invalid')).toBe(false);
            expect(validateAmazonDomain('')).toBe(false);
        });

        test('should return available domains list', () => {
            const domains = getAvailableAmazonDomains();
            
            expect(domains).toContain('amazon.com');
            expect(domains).toContain('amazon.co.uk');
            expect(domains.length).toBeGreaterThan(5);
        });

    });

    describe('URL structure validation', () => {
        
        test('should generate properly encoded URLs', () => {
            const product = mockProducts[0];
            const result = constructSingleAmazonSearch(product);
            
            // Check that the URL is properly encoded
            expect(() => new URL(result.searchUrl)).not.toThrow();
            
            // Check required parameters
            const url = new URL(result.searchUrl);
            expect(url.searchParams.get('k')).toBeTruthy(); // Search terms
            expect(url.searchParams.get('ref')).toBe('sr_pg_1'); // Reference
            expect(url.searchParams.get('sort')).toBe('relevanceblender'); // Sorting
            expect(url.searchParams.get('qid')).toBeTruthy(); // Query ID
        });

        test('should include category filtering when enabled', () => {
            const product = mockProducts[0]; // Clothing product
            const result = constructSingleAmazonSearch(product, { enableCategoryFiltering: true });
            
            const url = new URL(result.searchUrl);
            expect(url.searchParams.get('rh')).toContain('n:7141123011'); // Clothing category
        });

        test('should exclude category filtering when disabled', () => {
            const product = mockProducts[0];
            const result = constructSingleAmazonSearch(product, { enableCategoryFiltering: false });
            
            const url = new URL(result.searchUrl);
            expect(url.searchParams.get('rh')).toBeNull();
        });

    });

    describe('Fallback behavior', () => {
        
        test('should fallback to product name when searchTerms is empty', () => {
            const productWithoutSearchTerms: Product = {
                ...mockProducts[0],
                searchTerms: ''
            };
            
            const result = constructSingleAmazonSearch(productWithoutSearchTerms);
            
            // Should contain the product name in the fallback search
            expect(result.searchUrl).toContain('Navy+Blue+Cotton+T-Shirt');
            expect(result.confidence).toBeLessThan(0.8); // Lower confidence for fallback
        });

        test('should handle products with minimal information', () => {
            const minimalProduct: Product = {
                name: 'Generic Item',
                category: ProductCategory.OTHER,
                brand: 'unknown',
                primaryColor: 'unknown',
                secondaryColors: [],
                features: [],
                targetGender: TargetGender.UNISEX,
                searchTerms: ''
            };
            
            const result = constructSingleAmazonSearch(minimalProduct);
            
            expect(result.searchUrl).toContain('Generic+Item');
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.searchUrl).toBeDefined();
        });

    });

});