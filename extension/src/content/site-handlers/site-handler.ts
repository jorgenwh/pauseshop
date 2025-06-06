import { VideoDetectorConfig, SeekingState } from "../../types/video";

export interface SiteHandler {
    isApplicable(): boolean;
    handleUserInteraction(
        config: VideoDetectorConfig,
        seekingState: SeekingState,
    ): (event: Event) => void;
    shouldIgnorePause(seekingState: SeekingState): boolean;
    getDebounceTime(seekingState: SeekingState): number;
    attachSiteSpecificListeners(
        config: VideoDetectorConfig,
        seekingState: SeekingState,
    ): (() => void) | null;
}
