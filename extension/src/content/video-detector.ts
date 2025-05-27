import { VideoDetectorConfig, SeekingState, SeekingDetectionConfig } from '../types/video';
import { captureScreenshot } from './screenshot-capturer';

interface VideoDetectorState {
  video: HTMLVideoElement | null;
  observer: MutationObserver | null;
  config: VideoDetectorConfig;
  seekingState: SeekingState;
}

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
  previousCurrentTime: 0
});

const log = (config: VideoDetectorConfig, message: string): void => {
  if (config.enableLogging) {
    console.log(`${config.logPrefix}: ${message}`);
  }
};

const handlePause = (config: VideoDetectorConfig, seekingState: SeekingState) => (event: Event): void => {
  if (seekingState.isSeeking) {
    log(config, 'Video paused during seeking - ignoring as non-intentional pause');
    return;
  }
  
  // Clear any existing pause debounce
  if (seekingState.pauseDebounceTimeoutId !== null) {
    clearTimeout(seekingState.pauseDebounceTimeoutId);
  }
  
  // Debounce pause detection to check if seeking follows
  seekingState.pauseDebounceTimeoutId = window.setTimeout(() => {
    if (!seekingState.isSeeking) {
      log(config, 'Video paused (intentional user pause detected)');
      // Trigger screenshot capture for intentional pause
      captureScreenshot().catch(error => {
        log(config, `Screenshot capture failed: ${error}`);
      });
    } else {
      log(config, 'Video paused but seeking detected - ignoring as non-intentional pause');
    }
    seekingState.pauseDebounceTimeoutId = null;
  }, 150); // 150ms debounce to detect seeking
};

const handlePlay = (config: VideoDetectorConfig) => (event: Event): void => {
  log(config, 'Video resumed');
};

const handleSeeking = (config: VideoDetectorConfig, seekingState: SeekingState) => (event: Event): void => {
  seekingState.isSeeking = true;
  seekingState.lastSeekTime = Date.now();
  
  // Clear any existing debounce timeouts
  if (seekingState.debounceTimeoutId !== null) {
    clearTimeout(seekingState.debounceTimeoutId);
    seekingState.debounceTimeoutId = null;
  }
  
  if (seekingState.pauseDebounceTimeoutId !== null) {
    clearTimeout(seekingState.pauseDebounceTimeoutId);
    seekingState.pauseDebounceTimeoutId = null;
  }
  
  log(config, 'Seeking started - suppressing pause detection');
};

const handleSeeked = (config: VideoDetectorConfig, seekingState: SeekingState) => (event: Event): void => {
  const seekingConfig = { ...defaultSeekingDetectionConfig, ...config.seekingDetection };
  
  log(config, 'Seeking completed - starting debounce timer');
  
  // Clear any existing timeout
  if (seekingState.debounceTimeoutId !== null) {
    clearTimeout(seekingState.debounceTimeoutId);
  }
  
  // Set debounce timeout to resume normal pause detection
  seekingState.debounceTimeoutId = window.setTimeout(() => {
    seekingState.isSeeking = false;
    seekingState.debounceTimeoutId = null;
    log(config, 'Seeking debounce completed - resuming normal pause detection');
  }, seekingConfig.seekingDebounceMs);
};

const handleTimeUpdate = (config: VideoDetectorConfig, seekingState: SeekingState, video: HTMLVideoElement) => (event: Event): void => {
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
          handleSeeked(config, seekingState)(event);
        }
      }, seekingConfig.seekingDebounceMs);
    }
  }
  
  seekingState.previousCurrentTime = currentTime;
};

const attachVideoListeners = (
  video: HTMLVideoElement,
  config: VideoDetectorConfig,
  seekingState: SeekingState
): CleanupFunction => {
  const pauseHandler = handlePause(config, seekingState);
  const playHandler = handlePlay(config);
  const seekingHandler = handleSeeking(config, seekingState);
  const seekedHandler = handleSeeked(config, seekingState);
  const timeUpdateHandler = handleTimeUpdate(config, seekingState, video);

  video.addEventListener('pause', pauseHandler);
  video.addEventListener('play', playHandler);
  video.addEventListener('seeking', seekingHandler);
  video.addEventListener('seeked', seekedHandler);
  video.addEventListener('timeupdate', timeUpdateHandler);

  return () => {
    video.removeEventListener('pause', pauseHandler);
    video.removeEventListener('play', playHandler);
    video.removeEventListener('seeking', seekingHandler);
    video.removeEventListener('seeked', seekedHandler);
    video.removeEventListener('timeupdate', timeUpdateHandler);
    
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
  log(config, `Found ${videoElements.length} video element(s)`);

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

  log(config, 'DOM observer started');

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
  
  log(config, 'Video detector initializing...');

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
    videoCleanup = attachVideoListeners(video, config, seekingState);
    log(config, 'Video detected and listeners attached');
  };

  // Scan for existing videos
  const initialVideo = scanForVideos(config);
  if (initialVideo) {
    setVideo(initialVideo);
  }

  // Start observing for new videos
  const observerCleanup = createDOMObserver(config, setVideo);

  log(config, 'Video detector initialized');

  // Return cleanup function
  return () => {
    log(config, 'Cleaning up video detector...');
    
    if (videoCleanup) {
      videoCleanup();
    }
    
    observerCleanup();
    
    log(config, 'Video detector cleaned up');
  };
};