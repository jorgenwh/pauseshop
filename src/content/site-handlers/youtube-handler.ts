import { SeekingState } from "../../types/video";
import { SiteHandler } from "./site-handler";

export class YouTubeHandler implements SiteHandler {
    isApplicable(): boolean {
        return window.location.hostname.includes("youtube.com");
    }

    handleUserInteraction(seekingState: SeekingState) {
        return (event: Event): void => {
            const target = event.target as HTMLElement;

            if (event.type === "keydown") {
                const keyEvent = event as KeyboardEvent;
                const isSeekingKey = [
                    "ArrowLeft",
                    "ArrowRight",
                    "j",
                    "l",
                ].includes(keyEvent.key);
                if (!isSeekingKey) return;
            } else if (event.type === "mousedown") {
                const isProgressBarInteraction =
                    target &&
                    (target.classList.contains("ytp-progress-bar") ||
                        target.classList.contains("ytp-scrubber-button") ||
                        target.classList.contains("ytp-progress-list") ||
                        (target.closest(".ytp-progress-bar-container") &&
                            !target.closest(".ytp-play-button")) ||
                        (target.closest(".ytp-chrome-bottom") &&
                            target.closest(".ytp-progress-bar")));

                const isPauseButton =
                    target.classList.contains("ytp-play-button") ||
                    target.closest(".ytp-play-button") ||
                    target.classList.contains("ytp-large-play-button");

                if (!isProgressBarInteraction || isPauseButton) {
                    return;
                }
            }

            const now = Date.now();
            seekingState.userInteractionDetected = true;
            seekingState.lastInteractionTime = now;

            // Clear interaction flag after 2 seconds if no seeking occurs
            setTimeout(() => {
                if (
                    seekingState.userInteractionDetected &&
                    Date.now() - seekingState.lastInteractionTime >= 2000
                ) {
                    seekingState.userInteractionDetected = false;
                }
            }, 2000);
        };
    }

    shouldIgnorePause(seekingState: SeekingState): boolean {
        if (seekingState.userInteractionDetected) {
            const timeSinceInteraction =
                Date.now() - seekingState.lastInteractionTime;
            return timeSinceInteraction < 2000; // 2 seconds
        }
        return false;
    }

    getDebounceTime(seekingState: SeekingState): number {
        const hasRecentInteraction =
            seekingState.userInteractionDetected &&
            Date.now() - seekingState.lastInteractionTime < 1000;
        return hasRecentInteraction ? 5000 : 300;
    }

    attachSiteSpecificListeners(seekingState: SeekingState): () => void {
        const interactionHandler = this.handleUserInteraction(seekingState);

        const mouseDownHandler = interactionHandler;
        const keyDownHandler = (event: Event) => {
            const keyEvent = event as KeyboardEvent;
            if (
                ["ArrowLeft", "ArrowRight", "j", "l", "k"].includes(
                    keyEvent.key,
                )
            ) {
                interactionHandler(event);
            }
        };

        document.addEventListener("mousedown", mouseDownHandler);
        document.addEventListener("keydown", keyDownHandler);

        // Return cleanup function
        return () => {
            document.removeEventListener("mousedown", mouseDownHandler);
            document.removeEventListener("keydown", keyDownHandler);
        };
    }
}
