import { SeekingState } from "../../types/video";

export interface SiteHandler {
    isApplicable(): boolean;
    handleUserInteraction(seekingState: SeekingState): (event: Event) => void;
    shouldIgnorePause(seekingState: SeekingState): boolean;
    getDebounceTime(seekingState: SeekingState): number;
    attachSiteSpecificListeners(
        seekingState: SeekingState,
    ): (() => void) | null;
}
