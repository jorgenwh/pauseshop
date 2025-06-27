/**
 * Debug utilities for layout-aware positioning
 */

import { ContentDetector } from './content-detector';
import { RelativePositionCalculator } from './relative-position-calculator';
import { RelativePositionConfig } from './types';
import { getCurrentVideo } from '../../content/video-detector';

/**
 * Debug function to test content detection and positioning
 * Call this from browser console: window.pauseShopDebugLayout()
 */
export function debugLayout(): void {
    console.log('=== PauseShop Layout Debug ===');
    
    const detector = new ContentDetector();
    const calculator = new RelativePositionCalculator();
    
    // Test content detection
    console.log('1. Content Detection:');
    const content = detector.detectContent();
    if (content) {
        console.log('✅ Content detected:', content);
    } else {
        console.log('❌ No content detected');
    }
    
    // Test YouTube Shorts specific detection
    console.log('\n2. YouTube Shorts Detection:');
    const shortsContent = detector.detectYouTubeShorts();
    if (shortsContent) {
        console.log('✅ Shorts content detected (will use content-relative positioning):', shortsContent);
    } else {
        console.log('❌ No shorts content detected (will use original edge positioning)');
    }
    
    // Test regular YouTube detection
    console.log('\n3. Regular YouTube Detection:');
    if (window.location.pathname.includes('/watch')) {
        console.log('✅ Regular YouTube video page detected');
        console.log('ℹ️  Regular videos intentionally use original edge positioning');
    } else {
        console.log('❌ Not a regular YouTube video page');
    }
    
    // Test position calculation if content is found
    if (content) {
        console.log('\n4. Position Calculation (Content-Relative):');
        
        const configs: RelativePositionConfig[] = [
            {
                offsetGap: 20,
                preferredSide: 'left',
                fallbackPosition: { side: 'left', offset: 20 }
            },
            {
                offsetGap: 20,
                preferredSide: 'right',
                fallbackPosition: { side: 'right', offset: 20 }
            },
            {
                offsetGap: 20,
                preferredSide: 'auto',
                fallbackPosition: { side: 'left', offset: 20 }
            }
        ];
        
        configs.forEach((config, index) => {
            const strategy = calculator.calculatePosition(content, 280, config);
            console.log(`Config ${index + 1} (${config.preferredSide}):`, strategy);
        });
        
        // Detailed debug info
        console.log('\n5. Detailed Debug Info:');
        const debugInfo = calculator.getDebugInfo(content, 280, configs[0]);
        console.log(debugInfo);
    } else {
        console.log('\n4. Position Calculation:');
        console.log('ℹ️  No content-relative positioning needed - using original edge positioning');
    }
    
    // General debug info
    console.log('\n6. General Debug Info:');
    console.log(detector.getDebugInfo());
    
    // Video detector integration
    console.log('\n7. Video Detector Integration:');
    const currentVideo = getCurrentVideo();
    if (currentVideo) {
        console.log('✅ Current video from video detector:', {
            tagName: currentVideo.tagName,
            src: currentVideo.src || currentVideo.currentSrc,
            dimensions: {
                display: `${currentVideo.clientWidth}x${currentVideo.clientHeight}`,
                video: `${currentVideo.videoWidth}x${currentVideo.videoHeight}`
            },
            bounds: currentVideo.getBoundingClientRect(),
            paused: currentVideo.paused,
            currentTime: currentVideo.currentTime,
            duration: currentVideo.duration
        });
    } else {
        console.log('❌ No current video from video detector');
        console.log('This means the video detector is not active or no video is being monitored');
    }
}

// Make it available globally for testing
declare global {
    interface Window {
        pauseShopDebugLayout: () => void;
    }
}

if (typeof window !== 'undefined') {
    window.pauseShopDebugLayout = debugLayout;
}