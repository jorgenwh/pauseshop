/**
 * Content detector for identifying video content containers on various platforms
 */

import { ContentBounds } from './types';
import { getCurrentVideo } from '../../content/video-detector';

export class ContentDetector {
    /**
     * Detect YouTube Shorts using the same video element logic as the pause detection
     */
    detectYouTubeShorts(): ContentBounds | null {
        // Only proceed if we're actually on a Shorts page
        if (!window.location.pathname.includes('/shorts/')) {
            return null;
        }

        // Use the exact same video element that the video detector is monitoring
        const videoElement = getCurrentVideo();
        if (videoElement && this.isValidShortsVideo(videoElement)) {
            return {
                element: videoElement,
                bounds: videoElement.getBoundingClientRect(),
                type: 'youtube-shorts'
            };
        }

        return null;
    }


    /**
     * Detect regular YouTube video - but we don't want to change positioning for regular videos
     * This method exists for completeness but returns null to preserve original edge positioning
     */
    detectYouTubeRegular(): ContentBounds | null {
        // For regular YouTube videos, we want to keep the original edge positioning
        // So we intentionally return null here to fall back to edge positioning
        return null;
    }

    /**
     * Detect content that should use content-relative positioning
     * Currently only YouTube Shorts - regular videos use original edge positioning
     */
    detectContent(): ContentBounds | null {
        // Only YouTube Shorts should use content-relative positioning
        const shortsContent = this.detectYouTubeShorts();
        if (shortsContent) {
            return shortsContent;
        }

        // For all other content (regular YouTube videos, generic videos, etc.)
        // we return null to preserve the original edge positioning behavior
        return null;
    }

    /**
     * Validate that a video element is a valid shorts video
     */
    private isValidShortsVideo(videoElement: HTMLVideoElement): boolean {
        const bounds = videoElement.getBoundingClientRect();

        // Must have visible dimensions
        if (bounds.width <= 0 || bounds.height <= 0) {
            return false;
        }

        // Must be within viewport
        if (bounds.bottom < 0 || bounds.top > window.innerHeight) {
            return false;
        }

        // Should be reasonably sized (not tiny thumbnails)
        const minSize = 200;
        if (bounds.width < minSize || bounds.height < minSize) {
            return false;
        }

        // For shorts, we can check the video's intrinsic dimensions if available
        if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
            const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
            // Shorts are typically in portrait mode (9:16 ratio = 0.5625)
            // Allow some flexibility but prefer portrait videos
            if (videoAspectRatio <= 1.0) {
                return true; // Portrait or square video, likely a short
            }
        }

        // If we can't determine from video dimensions, check the display size
        const displayAspectRatio = bounds.width / bounds.height;
        
        // On shorts pages, even if the video is landscape, it's likely a short
        // The key is that we're on a shorts URL
        return true; // If we're on shorts page and found a valid video, assume it's the short
    }

    /**
     * Validate that a video element is a valid video for positioning
     */
    private isValidVideoContainer(videoElement: HTMLVideoElement): boolean {
        const bounds = videoElement.getBoundingClientRect();

        // Must have visible dimensions
        if (bounds.width <= 0 || bounds.height <= 0) {
            return false;
        }

        // Must be within viewport
        if (bounds.bottom < 0 || bounds.top > window.innerHeight) {
            return false;
        }

        // Should be reasonably sized (not tiny thumbnails)
        const minSize = 200;
        if (bounds.width < minSize || bounds.height < minSize) {
            return false;
        }

        return true;
    }

    /**
     * Get debug information about detected content
     */
    getDebugInfo(): any {
        const shortsContent = this.detectYouTubeShorts();
        const regularContent = this.detectYouTubeRegular();

        return {
            url: window.location.href,
            pathname: window.location.pathname,
            shortsDetected: !!shortsContent,
            regularDetected: !!regularContent,
            shortsContent: shortsContent ? {
                elementTag: shortsContent.element.tagName,
                elementClass: shortsContent.element.className,
                bounds: shortsContent.bounds,
                type: shortsContent.type
            } : null,
            regularContent: regularContent ? {
                elementTag: regularContent.element.tagName,
                elementClass: regularContent.element.className,
                bounds: regularContent.bounds,
                type: regularContent.type
            } : null,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }
}
