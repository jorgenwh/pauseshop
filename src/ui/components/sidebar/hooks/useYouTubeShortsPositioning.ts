import { useState, useEffect } from "react";
import { SidebarContentState } from "../../../types";
import { isYouTubeShorts, getYouTubeShortsPosition } from "../positioning/youtube-shorts-utils";

/**
 * Custom hook for YouTube Shorts positioning logic
 */
export const useYouTubeShortsPositioning = (
    currentPageUrl: string,
    videoElement: HTMLVideoElement | null,
    position: "left" | "right",
    isCompact: boolean,
    contentState: SidebarContentState,
    isVisible: boolean
) => {
    const [, forceUpdate] = useState({});

    // Check if we're on YouTube Shorts
    const isOnYouTubeShorts = isYouTubeShorts(currentPageUrl);
    const effectivePosition = isOnYouTubeShorts ? (position === "left" ? "right" : "left") : position;

    // Get positioning if applicable
    const youTubeShortsPosition = isOnYouTubeShorts 
        ? getYouTubeShortsPosition(videoElement, position, isCompact, contentState)
        : {};

    // Update positioning when video element, state, or position changes (for YouTube Shorts)
    useEffect(() => {
        if (isOnYouTubeShorts && videoElement && isVisible) {
            const handleScroll = () => {
                // Force re-render to update positioning when video moves due to scrolling
                forceUpdate({});
            };

            window.addEventListener('scroll', handleScroll, { passive: true });
            window.addEventListener('resize', handleScroll, { passive: true });

            return () => {
                window.removeEventListener('scroll', handleScroll);
                window.removeEventListener('resize', handleScroll);
            };
        }
    }, [videoElement, isCompact, contentState, position, isOnYouTubeShorts,
        effectivePosition, isVisible]);

    return {
        isOnYouTubeShorts,
        effectivePosition,
        youTubeShortsPosition,
    };
};