import { initializeVideoDetector } from "./video-detector";
import {
    initializeScreenshotCapturer,
    cleanupUI,
    setUIManager,
} from "./screenshot-capturer";
import { UIManager } from "../ui/ui-manager";

// Dynamically inject the content script's CSS
const injectCss = () => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    const cssUrl = chrome.runtime.getURL("content/main-content.css");
    link.href = cssUrl;
    document.head.appendChild(link);
};

injectCss();

// Establish a long-lived port connection with the background script
const backgroundPort = chrome.runtime.connect({
    name: "pauseshop-content-script",
});
backgroundPort.onDisconnect.addListener(() => {
    console.log("[Content Script] Disconnected from background script.");
});

// Initialize components based on current URL
let cleanupVideoDetector: (() => void) | null = null;
let uiManagerInstance: UIManager | null = null;

const shouldActivateExtension = (): boolean => {
    // Simply check if there's a video element on the page
    // This works for any website with video content
    const videoElement = document.querySelector("video");
    return !!videoElement;
};

const initializeExtension = (): void => {
    if (!shouldActivateExtension()) {
        console.log("[PauseShop] No video element found, skipping initialization");
        return;
    }
    
    console.log("[PauseShop] Initializing extension on page with video:", window.location.href);
    
    initializeScreenshotCapturer();
    cleanupVideoDetector = initializeVideoDetector();
    
    uiManagerInstance = UIManager.create();
    if (uiManagerInstance) {
        setUIManager(uiManagerInstance);
    } else {
        console.error("PauseShop UI: Failed to initialize UIManager in main-content.ts");
    }
};

const initializeExtensionWithRetry = (retryCount = 0, maxRetries = 10): void => {
    const videoElement = document.querySelector("video");
    
    if (videoElement) {
        initializeExtension();
    } else if (retryCount < maxRetries) {
        setTimeout(() => {
            initializeExtensionWithRetry(retryCount + 1, maxRetries);
        }, 500);
    } else {
        // Even if no video found after retries, still try to initialize
        // The video might be added dynamically later
        console.log("[PauseShop] No video found after retries, but will monitor for dynamic video elements");
    }
};

const cleanupExtension = (): void => {
    console.log("[PauseShop] Cleaning up extension");
    
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
        console.log(`[PauseShop] URL changed from ${lastUrl} to ${currentUrl}`);
        lastUrl = currentUrl;
        
        // Clean up existing extension if active
        if (cleanupVideoDetector) {
            cleanupExtension();
        }
        
        // Reinitialize if we're now on a supported page
        // Use a delay and retry mechanism for SPA content loading
        setTimeout(() => {
            initializeExtensionWithRetry();
        }, 500); // Delay for SPA content to load
    }
};

// Generic SPA navigation detection
// Listen for common navigation events that various frameworks might use
const COMMON_SPA_EVENTS = [
    // YouTube
    'yt-navigate-start', 'yt-navigate-finish', 'yt-page-data-updated',
    // React Router
    'routeChangeStart', 'routeChangeComplete',
    // Vue Router  
    'route-changed',
    // Angular Router
    'navigationStart', 'navigationEnd',
    // Generic events
    'spa-navigate', 'page-transition', 'navigation-change'
];

const handleSpaNavigation = () => {
    checkForUrlChange();
};

// Listen for all potential SPA navigation events
COMMON_SPA_EVENTS.forEach(eventName => {
    window.addEventListener(eventName, handleSpaNavigation);
});

// Use multiple methods to detect URL changes
const observer = new MutationObserver(checkForUrlChange);
observer.observe(document.body, { childList: true, subtree: true });

// Also listen for popstate events (back/forward navigation)
window.addEventListener("popstate", checkForUrlChange);

// Periodically check for URL changes as a fallback
const urlCheckInterval = setInterval(checkForUrlChange, 1000);

// Cleanup when page unloads
window.addEventListener("beforeunload", () => {
    if (cleanupVideoDetector) {
        cleanupVideoDetector();
    }
    cleanupUI();
    observer.disconnect();
    clearInterval(urlCheckInterval);
    // Clean up SPA navigation event listeners
    COMMON_SPA_EVENTS.forEach(eventName => {
        window.removeEventListener(eventName, handleSpaNavigation);
    });
});

// Cleanup when the content script is about to be destroyed
window.addEventListener("pagehide", () => {
    if (cleanupVideoDetector) {
        cleanupVideoDetector();
    }
    cleanupUI();
    observer.disconnect();
    clearInterval(urlCheckInterval);
    // Clean up SPA navigation event listeners
    COMMON_SPA_EVENTS.forEach(eventName => {
        window.removeEventListener(eventName, handleSpaNavigation);
    });
});
