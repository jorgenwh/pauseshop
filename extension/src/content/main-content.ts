import { initializeVideoDetector } from "./video-detector";
import {
    initializeScreenshotCapturer,
    cleanupUI,
} from "./screenshot-capturer";

// Establish a long-lived port connection with the background script
const backgroundPort = chrome.runtime.connect({
    name: "pauseshop-content-script",
});
backgroundPort.onDisconnect.addListener(() => {
    console.log("[Content Script] Disconnected from background script.");
});

initializeScreenshotCapturer();

const cleanupVideoDetector = initializeVideoDetector();

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
