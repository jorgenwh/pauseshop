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
    lastInteractionTime: 0
});

const log = (config: VideoDetectorConfig, message: string): void => {
    if (config.enableLogging) {
        console.log(`${config.logPrefix}: ${message}`);
    }
};

const handlePause = (config: VideoDetectorConfig, seekingState: SeekingState, siteHandlerRegistry: SiteHandlerRegistry) => (_event: Event): void => {
    if (seekingState.isSeeking) {
        log(config, 'Video paused during seeking - ignoring as non-intentional pause');
        return;
    }

    // Site-specific: Check for recent user interactions that might indicate seeking
    if (siteHandlerRegistry.shouldIgnorePause(seekingState)) {
        log(config, 'Video paused but recent seeking interaction detected - likely seeking, ignoring pause');
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
        if (!seekingState.isSeeking) {
            log(config, 'Video paused (intentional user pause detected)');
            // Trigger screenshot capture for intentional pause
            captureScreenshot().catch(error => {
                log(config, `Screenshot capture failed: ${error}`);
            });
        } else {
            log(config, 'Video paused but seeking detected during debounce - ignoring as non-intentional pause');
        }
        seekingState.pauseDebounceTimeoutId = null;
    }, debounceTime);
};

const handlePlay = (config: VideoDetectorConfig) => (_event: Event): void => {
    log(config, 'Video resumed');
    // Hide UI when video resumes
    hideUI().catch(error => {
        log(config, `Failed to hide UI: ${error}`);
    });
};

const handleSeeking = (config: VideoDetectorConfig, seekingState: SeekingState) => (_event: Event): void => {
    seekingState.isSeeking = true;
    seekingState.lastSeekTime = Date.now();

    // Clear user interaction flag since seeking has now started
    if (seekingState.userInteractionDetected) {
        seekingState.userInteractionDetected = false;
    }

    log(config, 'Seeking started - suppressing pause detection');

    // Clear any existing debounce timeouts
    if (seekingState.debounceTimeoutId !== null) {
        clearTimeout(seekingState.debounceTimeoutId);
        seekingState.debounceTimeoutId = null;
    }

    if (seekingState.pauseDebounceTimeoutId !== null) {
        clearTimeout(seekingState.pauseDebounceTimeoutId);
        seekingState.pauseDebounceTimeoutId = null;
    }
};

const handleSeeked = (config: VideoDetectorConfig, seekingState: SeekingState, siteHandlerRegistry: SiteHandlerRegistry) => (event: Event): void => {
    const seekingConfig = { ...defaultSeekingDetectionConfig, ...config.seekingDetection };
    const video = event.target as HTMLVideoElement;

    log(config, 'Seeking completed - starting debounce timer');

    // Clear any existing timeout
    if (seekingState.debounceTimeoutId !== null) {
        clearTimeout(seekingState.debounceTimeoutId);
    }

    // Set debounce timeout to resume normal pause detection
    seekingState.debounceTimeoutId = window.setTimeout(() => {
        seekingState.isSeeking = false;
        seekingState.debounceTimeoutId = null;

        // DIAGNOSTIC: Check if video is paused after seeking completes
        if (video && video.paused) {
            // Check if we should ignore this pause (due to recent interactions)
            if (!siteHandlerRegistry.shouldIgnorePause(seekingState)) {
                log(config, 'DIAGNOSTIC: Video paused after seeking - adding additional delay for multi-key seeking');

                // Add extra delay when video was paused to allow for multiple arrow key presses
                setTimeout(() => {
                    // Double-check that video is still paused and no new seeking has started
                    if (video.paused && !seekingState.isSeeking) {
                        log(config, 'DIAGNOSTIC: Video still paused after extended delay - triggering pause detection');
                        handlePause(config, seekingState, siteHandlerRegistry)(event);
                    } else {
                        log(config, 'DIAGNOSTIC: Video state changed during extended delay - not triggering pause detection');
                    }
                }, 1500); // Additional 1.5 second delay for arrow key seeking
            } else {
                log(config, 'DIAGNOSTIC: Video paused after seeking but ignoring due to recent interaction');
            }
        } else {
            log(config, 'DIAGNOSTIC: Video is playing after seeking completed');
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
            log(config, `Large time jump detected (${timeDifference.toFixed(2)}s) - treating as seeking`);
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
    const playHandler = handlePlay(config);
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

const scanForVideos = (config: VideoDetectorConfig): HTMLVideoElement | null => {
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
        log(config, 'Video detected and listeners attached');
    };

    // Scan for existing videos
    const initialVideo = scanForVideos(config);
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
