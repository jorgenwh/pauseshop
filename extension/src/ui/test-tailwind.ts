/**
 * Test file to verify Tailwind CSS integration
 * This file can be removed after Phase 2 is complete
 */

// Import the base CSS to test Tailwind processing
import './base.css';

export function createTestElement(): HTMLElement {
    const testDiv = document.createElement('div');
    testDiv.className = 'pauseshop-glass p-4 rounded-lg text-white font-inter';
    testDiv.innerHTML = `
        <div class="flex items-center space-x-2">
            <div class="w-4 h-4 bg-pauseshop-primary rounded-full"></div>
            <span class="text-sm font-medium">Tailwind CSS is working!</span>
        </div>
    `;
    return testDiv;
}

// Test function to verify glassmorphic styles
export function testGlassmorphicStyles(): boolean {
    try {
        const testElement = createTestElement();
        document.body.appendChild(testElement);
        
        // Check if Tailwind classes are applied
        const computedStyle = window.getComputedStyle(testElement);
        const hasGlassEffect = computedStyle.backdropFilter.includes('blur');
        
        // Clean up
        document.body.removeChild(testElement);
        
        return hasGlassEffect;
    } catch (error) {
        console.error('Tailwind test failed:', error);
        return false;
    }
}