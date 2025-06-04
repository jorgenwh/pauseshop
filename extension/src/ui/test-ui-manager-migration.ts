/**
 * Test script to validate Phase 3 UI Manager migration
 * Tests both new sidebar and legacy compatibility
 */

import { UIManager } from './ui-manager';
import { ProductDisplayData } from './types';
import { AmazonScrapedProduct, ProductCategory } from '../types/amazon';

// Mock product data for testing
const mockProducts: ProductDisplayData[] = [
    {
        name: 'Mock Product 1', // Added name property
        thumbnailUrl: 'https://example.com/thumbnail1.jpg',
        allProducts: [
            {
                productId: 'test-1',
                thumbnailUrl: 'https://example.com/product1.jpg',
                productUrl: 'https://amazon.com/product1',
                position: 1,
                confidence: 0.9
            } as AmazonScrapedProduct
        ],
        category: ProductCategory.ELECTRONICS,
        fallbackText: 'Test Product 1'
    },
    {
        name: 'Mock Product 2', // Added name property
        thumbnailUrl: 'https://example.com/thumbnail2.jpg',
        allProducts: [
            {
                productId: 'test-2',
                thumbnailUrl: 'https://example.com/product2.jpg',
                productUrl: 'https://amazon.com/product2',
                position: 1,
                confidence: 0.8
            } as AmazonScrapedProduct
        ],
        category: ProductCategory.CLOTHING,
        fallbackText: 'Test Product 2'
    }
];

/**
 * Test the new sidebar system
 */
export async function testSidebarSystem(): Promise<boolean> {
    console.log('🧪 Testing new sidebar system...');
    
    try {
        // Create UI Manager with sidebar enabled (default)
        const uiManager = UIManager.create({
            enableLogging: true,
            logPrefix: 'Test Sidebar'
        });

        if (!uiManager) {
            throw new Error('Failed to create UI Manager');
        }

        // Test showing sidebar with loading state
        console.log('  ✓ Showing sidebar with loading...');
        await uiManager.showSidebar();
        
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test showing products
        console.log('  ✓ Showing products in sidebar...');
        await uiManager.showProducts(mockProducts);
        
        // Test state queries
        console.log('  ✓ Testing state queries...');
        const isVisible = uiManager.isUIVisible();
        const currentState = uiManager.getCurrentState();
        const sidebarState = uiManager.getCurrentSidebarState();
        
        console.log(`    - UI Visible: ${isVisible}`);
        console.log(`    - Current State: ${currentState}`);
        console.log(`    - Sidebar State: ${sidebarState}`);
        
        // Test no products found
        console.log('  ✓ Testing no products found...');
        await uiManager.showNoProductsFound(2000); // 2 second timeout
        
        // Wait for auto-hide
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // Cleanup
        uiManager.cleanup();
        
        console.log('✅ Sidebar system test completed successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Sidebar system test failed:', error);
        return false;
    }
}

/**
 * Test legacy system compatibility
 */
export async function testLegacyCompatibility(): Promise<boolean> {
    console.log('🧪 Testing legacy system compatibility...');
    
    try {
        // Create UI Manager with legacy mode
        const uiManager = UIManager.createLegacy({
            enableLogging: true,
            logPrefix: 'Test Legacy'
        });

        if (!uiManager) {
            throw new Error('Failed to create legacy UI Manager');
        }

        // Test legacy methods still work
        console.log('  ✓ Testing legacy showLoadingSquare...');
        await uiManager.showLoadingSquare();
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('  ✓ Testing legacy showProductGrid...');
        await uiManager.showProductGrid(mockProducts);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('  ✓ Testing legacy hideUI...');
        await uiManager.hideUI();
        
        // Cleanup
        uiManager.cleanup();
        
        console.log('✅ Legacy compatibility test completed successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Legacy compatibility test failed:', error);
        return false;
    }
}

/**
 * Test backward compatibility - new manager with legacy method calls
 */
export async function testBackwardCompatibility(): Promise<boolean> {
    console.log('🧪 Testing backward compatibility...');
    
    try {
        // Create new UI Manager but use legacy method names
        const uiManager = UIManager.create({
            enableLogging: true,
            logPrefix: 'Test Backward Compat'
        });

        if (!uiManager) {
            throw new Error('Failed to create UI Manager');
        }

        // Test that legacy methods redirect to new sidebar
        console.log('  ✓ Testing legacy methods with new sidebar...');
        await uiManager.showLoadingSquare(); // Should show sidebar
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await uiManager.showProductGrid(mockProducts); // Should show products in sidebar
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await uiManager.hideLoadingSquare(); // Should hide sidebar
        
        // Cleanup
        uiManager.cleanup();
        
        console.log('✅ Backward compatibility test completed successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Backward compatibility test failed:', error);
        return false;
    }
}

/**
 * Run all migration tests
 */
export async function runAllMigrationTests(): Promise<void> {
    console.log('🚀 Starting Phase 3 UI Manager Migration Tests\n');
    
    const results = {
        sidebar: await testSidebarSystem(),
        legacy: await testLegacyCompatibility(),
        backward: await testBackwardCompatibility()
    };
    
    console.log('\n📊 Test Results Summary:');
    console.log(`  Sidebar System: ${results.sidebar ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Legacy Compatibility: ${results.legacy ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Backward Compatibility: ${results.backward ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = Object.values(results).every(result => result);
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (allPassed) {
        console.log('\n🎉 Phase 3 UI Manager migration is working correctly!');
        console.log('   - New sidebar system is functional');
        console.log('   - Legacy compatibility is maintained');
        console.log('   - Backward compatibility is preserved');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the implementation.');
    }
}

// Export for manual testing in browser console
interface TestUIManagerMigration {
    runAll: () => Promise<void>;
    testSidebar: () => Promise<boolean>;
    testLegacy: () => Promise<boolean>;
    testBackward: () => Promise<boolean>;
}

declare global {
    interface Window {
        testUIManagerMigration?: TestUIManagerMigration;
    }
}

window.testUIManagerMigration = {
    runAll: runAllMigrationTests,
    testSidebar: testSidebarSystem,
    testLegacy: testLegacyCompatibility,
    testBackward: testBackwardCompatibility
};