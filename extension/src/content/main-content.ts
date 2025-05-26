import { initializeVideoDetector } from './video-detector';

console.log('PauseShop content script loaded');

// Initialize video detection
const cleanupVideoDetector = initializeVideoDetector();

// Cleanup when page unloads
window.addEventListener('beforeunload', () => {
  cleanupVideoDetector();
});

// Also cleanup when the content script is about to be destroyed
window.addEventListener('pagehide', () => {
  cleanupVideoDetector();
});