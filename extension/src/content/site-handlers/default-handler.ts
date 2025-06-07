import { SeekingState } from "../../types/video";
import { SiteHandler } from "./site-handler";

export class DefaultHandler implements SiteHandler {
    isApplicable(): boolean {
        // Default handler applies to all sites that don't have specific handlers
        return true;
    }

    handleUserInteraction(_seekingState: SeekingState) {
        return (_event: Event): void => {
            // Default handler doesn't need special interaction detection
            // Most sites work fine with the standard pause/seeking event handling
        };
    }

    shouldIgnorePause(_seekingState: SeekingState): boolean {
        // Default behavior: don't ignore pauses based on interactions
        return false;
    }

    getDebounceTime(_seekingState: SeekingState): number {
        // Default debounce time for all sites
        return 300;
    }

    attachSiteSpecificListeners(
        _seekingState: SeekingState,
    ): (() => void) | null {
        // Default handler doesn't need additional listeners
        return null;
    }
}
