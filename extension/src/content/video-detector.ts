import { VideoDetectorConfig, SeekingState, SeekingDetectionConfig } from '../types/video';
import { captureScreenshot, hideUI } from './screenshot-capturer';
import { SiteHandlerRegistry } from './site-handlers/site-handler-registry';

type CleanupFunction = () => void;

const defaultSeekingDetectionConfig: SeekingDetectionConfig = {
    seekingDebounceMs: 500,
    timeJumpThreshold: 1.0,
    enableTimeBasedDetection: true
};

const defaultConfig: VideoDetectorConfig = {
    enableLogging: true,
    logPrefix: 'PauseShop',
    seekingDetection: defaultSeekingDetectionConfig
};

const createInitialSeekingState = (): SeekingState => ({
    isSeeking: false,
    lastSeekTime: 0,
    debounceTimeoutId: null,
    pauseDebounceTimeoutId: null,
    previousCurrentTime: 0,
    userInteractionDetected: false,
    lastInteractionTime: 0,
    currentPauseId: null // Initialize currentPauseId
});


const handlePause = (config: VideoDetectorConfig, seekingState: SeekingState, siteHandlerRegistry: SiteHandlerRegistry) => (_event: Event): void => {
    if (seekingState.isSeeking) {
        return;
    }

    // Generate a unique ID for this pause event
    const newPauseId = Date.now().toString();
    seekingState.currentPauseId = newPauseId;

    // Site-specific: Check for recent user interactions that might indicate seeking
    if (siteHandlerRegistry.shouldIgnorePause(seekingState)) {
        return;
    }

    // Clear any existing pause debounce
    if (seekingState.pauseDebounceTimeoutId !== null) {
        clearTimeout(seekingState.pauseDebounceTimeoutId);
    }

    // Get site-specific debounce time
    const debounceTime = siteHandlerRegistry.getDebounceTime(seekingState);

    // Debounce pause detection to check if seeking follows
    seekingState.pauseDebounceTimeoutId = window.setTimeout(() => {
        const videoElement = document.querySelector('video') as HTMLVideoElement;
        if (videoElement && videoElement.paused) {
            const videoElement = document.querySelector('video') as HTMLVideoElement;
            // Only proceed if the video is still paused AND this is still the active pause event
            if (videoElement && videoElement.paused && seekingState.currentPauseId === newPauseId) {
                if (!seekingState.isSeeking) {
                    // Trigger screenshot capture for intentional pause, passing the pauseId and a function to get the current pause ID
                    captureScreenshot(
                        { pauseId: newPauseId },
                        newPauseId,
                        () => seekingState.currentPauseId // Pass a function to get the current pause ID
                    ).catch(_error => {
                        // Error logging is handled within captureScreenshot
                    });
                }
            }
        }
        seekingState.pauseDebounceTimeoutId = null;
    }, debounceTime);
};

const handlePlay = (config: VideoDetectorConfig, seekingState: SeekingState) => (_event: Event): void => {
    // Invalidate the current pause ID when video resumes
    if (seekingState.currentPauseId !== null) {
        seekingState.currentPauseId = null;
    }

    // Clear any pending pause debounce timeout when video resumes
    if (seekingState.pauseDebounceTimeoutId !== null) {
        clearTimeout(seekingState.pauseDebounceTimeoutId);
        seekingState.pauseDebounceTimeoutId = null;
    }
    // Hide UI when video resumes
    hideUI().catch(_error => {
        // Error logging is handled within hideUI
    });
};

const handleSeeking = (config: VideoDetectorConfig, seekingState: SeekingState) => (_event: Event): void => {
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

const handleSeeked = (config: VideoDetectorConfig, seekingState: SeekingState, siteHandlerRegistry: SiteHandlerRegistry) => (event: Event): void => {
    const seekingConfig = { ...defaultSeekingDetectionConfig, ...config.seekingDetection };
    const video = event.target as HTMLVideoElement;


    // Clear any existing timeout
    if (seekingState.debounceTimeoutId !== null) {
        clearTimeout(seekingState.debounceTimeoutId);
    }

    // Set debounce timeout to resume normal pause detection
    seekingState.debounceTimeoutId = window.setTimeout(() => {
        seekingState.isSeeking = false;
        seekingState.debounceTimeoutId = null;

        if (video && video.paused) {
            // Check if we should ignore this pause (due to recent interactions)
            if (!siteHandlerRegistry.shouldIgnorePause(seekingState)) {
                // Add extra delay when video was paused to allow for multiple arrow key presses
                setTimeout(() => {
                    // Double-check that video is still paused and no new seeking has started
                    if (video.paused && !seekingState.isSeeking) {
                        handlePause(config, seekingState, siteHandlerRegistry)(event);
                    }
                }, 1500); // Additional 1.5 second delay for arrow key seeking
            }
        }
    }, seekingConfig.seekingDebounceMs);
};

const handleTimeUpdate = (config: VideoDetectorConfig, seekingState: SeekingState, video: HTMLVideoElement, siteHandlerRegistry: SiteHandlerRegistry) => (event: Event): void => {
    const seekingConfig = { ...defaultSeekingDetectionConfig, ...config.seekingDetection };
    
    if (!seekingConfig.enableTimeBasedDetection) {
        return;
    }
    
    const currentTime = video.currentTime;
    const timeDifference = Math.abs(currentTime - seekingState.previousCurrentTime);
    
    // Detect large time jumps that might indicate seeking (fallback detection)
    if (timeDifference > seekingConfig.timeJumpThreshold && seekingState.previousCurrentTime > 0) {
        if (!seekingState.isSeeking) {
            handleSeeking(config, seekingState)(event);

            // Auto-clear seeking state after debounce period
            setTimeout(() => {
                if (seekingState.isSeeking) {
                    handleSeeked(config, seekingState, siteHandlerRegistry)(event);
                }
            }, seekingConfig.seekingDebounceMs);
        }
    }
    
    seekingState.previousCurrentTime = currentTime;
};

const attachVideoListeners = (
    video: HTMLVideoElement,
    config: VideoDetectorConfig,
    seekingState: SeekingState,
    siteHandlerRegistry: SiteHandlerRegistry
): CleanupFunction => {
    const pauseHandler = handlePause(config, seekingState, siteHandlerRegistry);
    const playHandler = handlePlay(config, seekingState); // Pass seekingState to handlePlay
    const seekingHandler = handleSeeking(config, seekingState);
    const seekedHandler = handleSeeked(config, seekingState, siteHandlerRegistry);
    const timeUpdateHandler = handleTimeUpdate(config, seekingState, video, siteHandlerRegistry);

    video.addEventListener('pause', pauseHandler);
    video.addEventListener('play', playHandler);
    video.addEventListener('seeking', seekingHandler);
    video.addEventListener('seeked', seekedHandler);
    video.addEventListener('timeupdate', timeUpdateHandler);

    // Site-specific: Add interaction listeners to detect seeking intention
    const siteSpecificCleanup = siteHandlerRegistry.attachSiteSpecificListeners(config, seekingState);

    return () => {
        video.removeEventListener('pause', pauseHandler);
        video.removeEventListener('play', playHandler);
        video.removeEventListener('seeking', seekingHandler);
        video.removeEventListener('seeked', seekedHandler);
        video.removeEventListener('timeupdate', timeUpdateHandler);
        
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
    const videoElements = document.querySelectorAll('video');

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
    config: VideoDetectorConfig,
    onVideoFound: (video: HTMLVideoElement) => void
): CleanupFunction => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node instanceof HTMLElement) {
                    // Check if the added node is a video element
                    if (node.tagName === 'VIDEO' && node instanceof HTMLVideoElement) {
                        onVideoFound(node);
                    }

                    // Check for video elements within the added node
                    const nestedVideos = node.querySelectorAll('video');
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
        subtree: true
    });

    return () => {
        observer.disconnect();
    };
};

export const initializeVideoDetector = (
    userConfig: Partial<VideoDetectorConfig> = {}
): CleanupFunction => {
    const config: VideoDetectorConfig = {
        ...defaultConfig,
        ...userConfig,
        seekingDetection: { ...defaultSeekingDetectionConfig, ...userConfig.seekingDetection }
    };

    // Initialize site handler registry
    const siteHandlerRegistry = new SiteHandlerRegistry();
    siteHandlerRegistry.initialize();

    let videoCleanup: CleanupFunction | null = null;
    let seekingState = createInitialSeekingState();

    const setVideo = (video: HTMLVideoElement): void => {
        // Clean up previous video if it exists
        if (videoCleanup) {
            videoCleanup();
        }

        // Reset seeking state for new video
        seekingState = createInitialSeekingState();
        seekingState.previousCurrentTime = video.currentTime;

        // Attach listeners to new video
        videoCleanup = attachVideoListeners(video, config, seekingState, siteHandlerRegistry);
    };

    // Scan for existing videos
    const initialVideo = scanForVideos();
    if (initialVideo) {
        setVideo(initialVideo);
    }

    // Start observing for new videos
    const observerCleanup = createDOMObserver(config, setVideo);

    // Return cleanup function
    return () => {
        if (videoCleanup) {
            videoCleanup();
        }
        observerCleanup();
    };
};
