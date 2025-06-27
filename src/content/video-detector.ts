import { SeekingState } from "../types/video";
import { captureVideoFrame, hideUI } from "./frame-capturer";
import { SiteHandlerRegistry } from "./site-handlers/site-handler-registry";
import { seekingDebounceMs, timeJumpThreshold } from "./constants";

type CleanupFunction = () => void;

const createInitialSeekingState = (): SeekingState => ({
    isSeeking: false,
    lastSeekTime: 0,
    debounceTimeoutId: null,
    pauseDebounceTimeoutId: null,
    previousCurrentTime: 0,
    userInteractionDetected: false,
    lastInteractionTime: 0,
    currentPauseId: null,
});

const handlePause =
    (seekingState: SeekingState, siteHandlerRegistry: SiteHandlerRegistry) =>
        (event: Event): void => {
            if (seekingState.isSeeking) {
                return;
            }

            // Don't trigger extension if video has ended
            const videoElement = event.target as HTMLVideoElement;
            if (videoElement && videoElement.ended) {
                return;
            }

            // Don't trigger extension if video is near the end
            if (videoElement && videoElement.duration - videoElement.currentTime < 0.25) {
                console.warn(`[PauseShop:VideoDetector] Ignoring pause because video is near the end`);
                return;
            }

            const newPauseId = Date.now().toString();
            seekingState.currentPauseId = newPauseId;

            // Register the new pause with the background service worker
            browser.runtime.sendMessage({
                type: "registerPause",
                pauseId: newPauseId
            }).catch((error) => {
                console.error(`[PauseShop:VideoDetector] Failed to register pause for pauseId: ${newPauseId}`, error);
            });

            if (siteHandlerRegistry.shouldIgnorePause(seekingState)) {
                return;
            }

            if (seekingState.pauseDebounceTimeoutId !== null) {
                clearTimeout(seekingState.pauseDebounceTimeoutId);
            }

            const debounceTime = siteHandlerRegistry.getDebounceTime(seekingState);

            seekingState.pauseDebounceTimeoutId = window.setTimeout(() => {
                if (videoElement && videoElement.paused && seekingState.currentPauseId === newPauseId) {
                    if (!seekingState.isSeeking) {
                        captureVideoFrame(newPauseId, videoElement).catch((_error: Error) => {
                            // Error logging is handled within captureVideoFrame
                        });
                    }
                }
                seekingState.pauseDebounceTimeoutId = null;
            }, debounceTime);
        };

const handlePlay =
    (seekingState: SeekingState) =>
        (_event: Event): void => {
            if (seekingState.currentPauseId !== null) {
                const pauseIdToCancel = seekingState.currentPauseId;

                // Cancel the current pause analysis
                browser.runtime.sendMessage({
                    type: "cancelPause",
                    pauseId: pauseIdToCancel
                }).catch((error) => {
                    console.error(`[PauseShop:VideoDetector] Failed to cancel pause for pauseId: ${pauseIdToCancel}`, error);
                });
                seekingState.currentPauseId = null;
            }
            if (seekingState.pauseDebounceTimeoutId !== null) {
                clearTimeout(seekingState.pauseDebounceTimeoutId);
                seekingState.pauseDebounceTimeoutId = null;
            }
            hideUI();
        };

const handleSeeking =
    (seekingState: SeekingState) =>
        (_event: Event): void => {
            seekingState.isSeeking = true;
            seekingState.lastSeekTime = Date.now();

            // Clear user interaction flag since seeking has now started
            if (seekingState.userInteractionDetected) {
                seekingState.userInteractionDetected = false;
            }

            // Clear any existing debounce timeouts
            if (seekingState.debounceTimeoutId !== null) {
                clearTimeout(seekingState.debounceTimeoutId);
                seekingState.debounceTimeoutId = null;
            }

            // The pause debounce timeout is now conditionally executed, so explicit clearing here is not strictly necessary
            // However, we can still clear it to prevent any potential race conditions or unnecessary executions.
            if (seekingState.pauseDebounceTimeoutId !== null) {
                clearTimeout(seekingState.pauseDebounceTimeoutId);
                seekingState.pauseDebounceTimeoutId = null;
            }
        };

const handleSeeked =
    (seekingState: SeekingState, siteHandlerRegistry: SiteHandlerRegistry) =>
        (event: Event): void => {
            const video = event.target as HTMLVideoElement;

            if (seekingState.debounceTimeoutId !== null) {
                clearTimeout(seekingState.debounceTimeoutId);
            }

            seekingState.debounceTimeoutId = window.setTimeout(() => {
                seekingState.isSeeking = false;
                seekingState.debounceTimeoutId = null;

                if (video && video.paused) {
                    if (!siteHandlerRegistry.shouldIgnorePause(seekingState)) {
                        setTimeout(() => {
                            if (video.paused && !seekingState.isSeeking) {
                                handlePause(
                                    seekingState,
                                    siteHandlerRegistry,
                                )(event);
                            }
                        }, 1500);
                    }
                }
            }, seekingDebounceMs);
        };

const handleTimeUpdate =
    (
        seekingState: SeekingState,
        video: HTMLVideoElement,
        siteHandlerRegistry: SiteHandlerRegistry,
    ) =>
        (event: Event): void => {
            const currentTime = video.currentTime;
            const timeDifference = Math.abs(
                currentTime - seekingState.previousCurrentTime,
            );

            if (
                timeDifference > timeJumpThreshold &&
                seekingState.previousCurrentTime > 0
            ) {
                if (!seekingState.isSeeking) {
                    handleSeeking(seekingState)(event);

                    setTimeout(() => {
                        if (seekingState.isSeeking) {
                            handleSeeked(seekingState, siteHandlerRegistry)(event);
                        }
                    }, seekingDebounceMs);
                }
            }

            seekingState.previousCurrentTime = currentTime;
        };

const attachVideoListeners = (
    video: HTMLVideoElement,
    seekingState: SeekingState,
    siteHandlerRegistry: SiteHandlerRegistry,
): CleanupFunction => {
    const pauseHandler = handlePause(seekingState, siteHandlerRegistry);
    const playHandler = handlePlay(seekingState);
    const seekingHandler = handleSeeking(seekingState);
    const seekedHandler = handleSeeked(seekingState, siteHandlerRegistry);
    const timeUpdateHandler = handleTimeUpdate(
        seekingState,
        video,
        siteHandlerRegistry,
    );

    video.addEventListener("pause", pauseHandler);
    video.addEventListener("play", playHandler);
    video.addEventListener("seeking", seekingHandler);
    video.addEventListener("seeked", seekedHandler);
    video.addEventListener("timeupdate", timeUpdateHandler);

    // Site-specific: Add interaction listeners to detect seeking intention
    const siteSpecificCleanup =
        siteHandlerRegistry.attachSiteSpecificListeners(seekingState);

    return () => {
        video.removeEventListener("pause", pauseHandler);
        video.removeEventListener("play", playHandler);
        video.removeEventListener("seeking", seekingHandler);
        video.removeEventListener("seeked", seekedHandler);
        video.removeEventListener("timeupdate", timeUpdateHandler);

        // Remove site-specific listeners
        if (siteSpecificCleanup) {
            siteSpecificCleanup();
        }

        // Clean up any pending debounce timeouts
        if (seekingState.debounceTimeoutId !== null) {
            clearTimeout(seekingState.debounceTimeoutId);
            seekingState.debounceTimeoutId = null;
        }

        if (seekingState.pauseDebounceTimeoutId !== null) {
            clearTimeout(seekingState.pauseDebounceTimeoutId);
            seekingState.pauseDebounceTimeoutId = null;
        }
    };
};

const scanForVideos = (): HTMLVideoElement | null => {
    const videoElements = document.querySelectorAll("video");

    let targetVideo: HTMLVideoElement | null = null;
    let maxArea = 0;

    videoElements.forEach((video) => {
        if (video instanceof HTMLVideoElement) {
            const area = video.clientWidth * video.clientHeight;
            if (area > maxArea) {
                maxArea = area;
                targetVideo = video;
            }
        }
    });

    return targetVideo;
};

const createDOMObserver = (
    onVideoFound: (video: HTMLVideoElement) => void,
): CleanupFunction => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node instanceof HTMLElement) {
                    if (
                        node.tagName === "VIDEO" &&
                        node instanceof HTMLVideoElement
                    ) {
                        onVideoFound(node);
                    }

                    const nestedVideos = node.querySelectorAll("video");
                    if (nestedVideos.length > 0) {
                        const video = nestedVideos[0];
                        if (video instanceof HTMLVideoElement) {
                            onVideoFound(video);
                        }
                    }
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    return () => {
        observer.disconnect();
    };
};

// Global variables to access from retry function
let globalSiteHandlerRegistry: SiteHandlerRegistry | null = null;
let globalSeekingState: SeekingState | null = null;
let globalCurrentVideo: HTMLVideoElement | null = null;

export const triggerRetryAnalysis = (): void => {
    console.log("[PauseShop:VideoDetector] Triggering retry analysis");

    const targetVideo = scanForVideos();
    if (!targetVideo || !globalSiteHandlerRegistry || !globalSeekingState) {
        console.warn("[PauseShop:VideoDetector] Cannot retry - video detector not properly initialized");
        return;
    }

    // Create a synthetic pause event and trigger the same pause handling logic
    const syntheticEvent = new Event('pause');
    Object.defineProperty(syntheticEvent, 'target', { value: targetVideo });

    const pauseHandler = handlePause(globalSeekingState, globalSiteHandlerRegistry);
    pauseHandler(syntheticEvent);
};

/**
 * Get the current video element that the video detector is monitoring
 * This is the same video element used for pause detection and frame capture
 */
export const getCurrentVideo = (): HTMLVideoElement | null => {
    return globalCurrentVideo;
};

export const initializeVideoDetector = (): CleanupFunction => {
    const siteHandlerRegistry = new SiteHandlerRegistry();
    siteHandlerRegistry.initialize();
    globalSiteHandlerRegistry = siteHandlerRegistry;

    let videoCleanup: CleanupFunction | null = null;
    let seekingState = createInitialSeekingState();
    globalSeekingState = seekingState;

    const setVideo = (video: HTMLVideoElement): void => {
        // Clean up previous video if it exists
        if (videoCleanup) {
            videoCleanup();
        }

        // Reset seeking state for new video
        seekingState = createInitialSeekingState();
        seekingState.previousCurrentTime = video.currentTime;
        
        // Store the current video globally for layout positioning
        globalCurrentVideo = video;

        // Attach listeners to new video
        videoCleanup = attachVideoListeners(
            video,
            seekingState,
            siteHandlerRegistry,
        );
    };

    // Scan for existing videos
    const initialVideo = scanForVideos();
    if (initialVideo) {
        setVideo(initialVideo);
    }

    // Start observing for new videos
    const observerCleanup = createDOMObserver(setVideo);

    // Return cleanup function
    return () => {
        if (videoCleanup) {
            videoCleanup();
        }
        observerCleanup();

        // Clean up global references
        globalSiteHandlerRegistry = null;
        globalSeekingState = null;
        globalCurrentVideo = null;
    };
};
