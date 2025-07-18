import { initializeVideoDetector } from "./video-detector";
import {
    initializeFrameCapturer,
    cleanupUI,
    setUIManager,
} from "./frame-capturer";
import { UIManager } from "../ui/ui-manager";
import { allowedSites } from "./allowed-sites";

// CSS is now automatically injected by WXT via entrypoints/content.css

// Initialize components based on current URL
let cleanupVideoDetector: (() => void) | null = null;
let uiManagerInstance: UIManager | null = null;

const shouldActivateExtension = (): boolean => {
    // First check if the current URL matches the manifest patterns
    if (!isUrlAllowed(window.location.href)) {
        return false;
    }

    // Then check if there's a video element on the page
    const videoElement = document.querySelector("video");
    return !!videoElement;
};

const isUrlAllowed = (url: string): boolean => {
    return allowedSites.some(site => url.includes(site));
};

const initializeExtension = (): void => {
    const currentUrl = window.location.href;
    console.log(`[FreezeFrame] Attempting to initialize extension on: ${currentUrl}`);
    
    if (!shouldActivateExtension()) {
        console.warn("[FreezeFrame] Extension activation conditions not met, skipping initialization");
        return;
    }

    console.log("[FreezeFrame] Initializing extension components");
    initializeFrameCapturer();
    cleanupVideoDetector = initializeVideoDetector();

    uiManagerInstance = UIManager.create(currentUrl, null);
    if (uiManagerInstance) {
        setUIManager(uiManagerInstance);
        console.log("[FreezeFrame] Extension successfully initialized");
    } else {
        console.error("FreezeFrame UI: Failed to initialize UIManager in main-content.ts");
    }
};

const initializeExtensionWithRetry = (retryCount = 0, maxRetries = 3): void => {
    if (shouldActivateExtension()) {
        initializeExtension();
    } else if (retryCount < maxRetries) {
        setTimeout(() => {
            initializeExtensionWithRetry(retryCount + 1, maxRetries);
        }, 500);
    }
};

const cleanupExtension = (): void => {
    if (cleanupVideoDetector) {
        cleanupVideoDetector();
        cleanupVideoDetector = null;
    }
    cleanupUI();
    uiManagerInstance = null;
};

// Initialize on page load with retry mechanism
initializeExtensionWithRetry();

// Listen for URL changes (SPA navigation)
let lastUrl = window.location.href;
const checkForUrlChange = (): void => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log(`[FreezeFrame] URL changed to: ${currentUrl}`);

        // Always clean up existing extension when URL changes
        if (cleanupVideoDetector) {
            console.log(`[FreezeFrame] Cleaning up extension due to URL change`);
            cleanupExtension();
        }

        // Reinitialize with retry for SPA content loading
        setTimeout(() => {
            initializeExtensionWithRetry();
        }, 500);
    }
};

// Simple URL change detection for SPA navigation
const urlCheckInterval = setInterval(checkForUrlChange, 1000);

// Cleanup when page unloads
window.addEventListener("beforeunload", () => {
    if (cleanupVideoDetector) {
        cleanupVideoDetector();
    }
    cleanupUI();
    clearInterval(urlCheckInterval);
});

// Cleanup when the content script is about to be destroyed
window.addEventListener("pagehide", () => {
    if (cleanupVideoDetector) {
        cleanupVideoDetector();
    }
    cleanupUI();
    clearInterval(urlCheckInterval);
});

