import { initializeVideoDetector } from './video-detector';
import { initializeScreenshotCapturer, cleanupUI } from './screenshot-capturer';

// Initialize screenshot capturer
initializeScreenshotCapturer();

// Initialize video detection
const cleanupVideoDetector = initializeVideoDetector();

// Cleanup when page unloads
window.addEventListener('beforeunload', () => {
    cleanupVideoDetector();
    cleanupUI();
});

// Also cleanup when the content script is about to be destroyed
window.addEventListener('pagehide', () => {
    cleanupVideoDetector();
    cleanupUI();
});

// Cleanup on visibility change (when tab becomes hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cleanupUI();
    }
});
