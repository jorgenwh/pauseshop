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

initializeScreenshotCapturer();

const cleanupVideoDetector = initializeVideoDetector();

const uiManagerInstance = UIManager.create();

if (uiManagerInstance) {
    setUIManager(uiManagerInstance); // Pass the initialized UIManager to screenshot-capturer
} else {
    console.error(
        "PauseShop UI: Failed to initialize UIManager in main-content.ts",
    );
}

// Cleanup when page unloads
window.addEventListener("beforeunload", () => {
    cleanupVideoDetector();
    cleanupUI();
});

// Cleanup when the content script is about to be destroyed
window.addEventListener("pagehide", () => {
    cleanupVideoDetector();
    cleanupUI();
});
