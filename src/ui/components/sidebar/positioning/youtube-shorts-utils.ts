import { SidebarContentState } from "../../../types";
import { YOUTUBE_SHORTS_POSITIONING, PositionMode, SidebarPosition } from "./youtube-shorts-config";

/**
 * Helper function to detect if we're on YouTube Shorts
 */
export const isYouTubeShorts = (url: string): boolean => {
    return url.includes('youtube.com/shorts/') || url.includes('youtube.com/watch') && url.includes('&shorts=');
};

/**
 * Helper function to get sidebar positioning based on video element and current state
 */
export const getYouTubeShortsPosition = (
    videoElement: HTMLVideoElement | null,
    position: SidebarPosition,
    isCompact: boolean,
    contentState: SidebarContentState
): { left?: number; right?: number; top?: number } => {
    if (!videoElement) {
        return {}; // Fall back to CSS positioning
    }

    const videoRect = videoElement.getBoundingClientRect();
    const config = YOUTUBE_SHORTS_POSITIONING;
    
    // Determine which offset to use based on state
    let offsetKey: PositionMode;
    if (contentState === SidebarContentState.LOADING) {
        offsetKey = 'loading';
    } else if (isCompact) {
        offsetKey = 'compact';
    } else {
        offsetKey = 'expanded';
    }

    const offset = config[position][offsetKey];
    const top = Math.max(videoRect.top + config.verticalOffset, config.minEdgeDistance);

    if (position === 'left') {
        const left = Math.max(videoRect.left + offset, config.minEdgeDistance);
        return { left, top };
    } else {
        const right = Math.max(window.innerWidth - (videoRect.right + offset), config.minEdgeDistance);
        return { right, top };
    }
};