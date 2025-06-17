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
    const url = window.location.href;
    const hostname = window.location.hostname;
    
    // Check if we're on a supported video page
    if (hostname.includes("youtube.com")) {
        return url.includes("/watch?") || url.includes("/shorts/");
    }
    
    // Add other site checks here as needed
    return (
        url.includes("netflix.com/watch/") ||
        url.includes("hulu.com/watch/") ||
        url.includes("primevideo.com/detail/") ||
        url.includes("disneyplus.com/video/") ||
        url.includes("play.hbomax.com/")
    );
};

const initializeExtension = (): void => {
    if (!shouldActivateExtension()) {
        console.log("[PauseShop] Not on a supported video page, skipping initialization");
        return;
    }
    
    console.log("[PauseShop] Initializing extension on supported video page:", window.location.href);
    
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
    if (!shouldActivateExtension()) {
        console.log("[PauseShop] Not on a supported video page, skipping initialization");
        return;
    }
    
    const videoElement = document.querySelector("video");
    
    if (videoElement) {
        initializeExtension();
    } else if (retryCount < maxRetries) {
        setTimeout(() => {
            initializeExtensionWithRetry(retryCount + 1, maxRetries);
        }, 500);
    } else {
        initializeExtension();
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
        // Use a longer delay and retry mechanism for YouTube's dynamic loading
        setTimeout(() => {
            initializeExtensionWithRetry();
        }, 500); // Longer delay for YouTube's content to load
    }
};

// YouTube-specific navigation detection
// Listen for YouTube's custom navigation events
const handleYouTubeNavigation = () => {
    checkForUrlChange();
};

// YouTube fires these events on navigation
window.addEventListener('yt-navigate-start', handleYouTubeNavigation);
window.addEventListener('yt-navigate-finish', handleYouTubeNavigation);
window.addEventListener('yt-page-data-updated', handleYouTubeNavigation);

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
    // Clean up YouTube event listeners
    window.removeEventListener('yt-navigate-start', handleYouTubeNavigation);
    window.removeEventListener('yt-navigate-finish', handleYouTubeNavigation);
    window.removeEventListener('yt-page-data-updated', handleYouTubeNavigation);
});

// Cleanup when the content script is about to be destroyed
window.addEventListener("pagehide", () => {
    if (cleanupVideoDetector) {
        cleanupVideoDetector();
    }
    cleanupUI();
    observer.disconnect();
    clearInterval(urlCheckInterval);
    // Clean up YouTube event listeners
    window.removeEventListener('yt-navigate-start', handleYouTubeNavigation);
    window.removeEventListener('yt-navigate-finish', handleYouTubeNavigation);
    window.removeEventListener('yt-page-data-updated', handleYouTubeNavigation);
});
