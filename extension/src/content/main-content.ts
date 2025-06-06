import { initializeVideoDetector } from './video-detector';
import { initializeScreenshotCapturer, cleanupUI, setUIManager } from './screenshot-capturer'; // Import setUIManager
import { UIManager } from '../ui/ui-manager'; // Import UIManager
 
// Establish a long-lived port connection with the background script
const backgroundPort = chrome.runtime.connect({ name: 'pauseshop-content-script' });
backgroundPort.onDisconnect.addListener(() => {
    console.log('[Content Script] Disconnected from background script.');
});
 
// Initialize screenshot capturer
initializeScreenshotCapturer();
 
// Initialize video detection
const cleanupVideoDetector = initializeVideoDetector();
 
// Initialize UI Manager immediately when content script loads
const uiManagerInstance = UIManager.create({
    enableLogging: false,
    logPrefix: 'PauseShop UI'
}, {}, {});
 
if (uiManagerInstance) {
    console.log('PauseShop UI: UIManager initialized in main-content.ts');
    setUIManager(uiManagerInstance); // Pass the initialized UIManager to screenshot-capturer
} else {
    console.error('PauseShop UI: Failed to initialize UIManager in main-content.ts');
}

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
