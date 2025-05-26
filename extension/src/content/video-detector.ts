import { VideoDetectorConfig } from '../types/video';

interface VideoDetectorState {
  video: HTMLVideoElement | null;
  observer: MutationObserver | null;
  config: VideoDetectorConfig;
}

type CleanupFunction = () => void;

const defaultConfig: VideoDetectorConfig = {
  enableLogging: true,
  logPrefix: 'PauseShop'
};

const log = (config: VideoDetectorConfig, message: string): void => {
  if (config.enableLogging) {
    console.log(`${config.logPrefix}: ${message}`);
  }
};

const handlePause = (config: VideoDetectorConfig) => (event: Event): void => {
  log(config, 'Video paused');
};

const handlePlay = (config: VideoDetectorConfig) => (event: Event): void => {
  log(config, 'Video resumed');
};

const attachVideoListeners = (
  video: HTMLVideoElement, 
  config: VideoDetectorConfig
): CleanupFunction => {
  const pauseHandler = handlePause(config);
  const playHandler = handlePlay(config);

  video.addEventListener('pause', pauseHandler);
  video.addEventListener('play', playHandler);

  return () => {
    video.removeEventListener('pause', pauseHandler);
    video.removeEventListener('play', playHandler);
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
  const config: VideoDetectorConfig = { ...defaultConfig, ...userConfig };
  
  log(config, 'Video detector initializing...');

  let videoCleanup: CleanupFunction | null = null;

  const setVideo = (video: HTMLVideoElement): void => {
    // Clean up previous video if it exists
    if (videoCleanup) {
      videoCleanup();
    }

    // Attach listeners to new video
    videoCleanup = attachVideoListeners(video, config);
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