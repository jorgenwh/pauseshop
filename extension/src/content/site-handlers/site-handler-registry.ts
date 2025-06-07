import { SeekingState } from "../../types/video";
import { SiteHandler } from "./site-handler";
import { YouTubeHandler } from "./youtube-handler";
import { DefaultHandler } from "./default-handler";

export class SiteHandlerRegistry {
    private handlers: SiteHandler[] = [];
    private defaultHandler: SiteHandler;
    private activeHandler: SiteHandler;

    constructor() {
        // Register all site handlers (order matters - first match wins)
        this.handlers = [
            new YouTubeHandler(),
            // Future site handlers can be added here
        ];

        // Default handler as fallback
        this.defaultHandler = new DefaultHandler();
        this.activeHandler = this.defaultHandler;
    }

    initialize(): SiteHandler {
        // Find the first applicable handler for the current site, or use default
        this.activeHandler =
            this.handlers.find((handler) => handler.isApplicable()) ||
            this.defaultHandler;
        return this.activeHandler;
    }

    getActiveHandler(): SiteHandler {
        return this.activeHandler;
    }

    shouldIgnorePause(seekingState: SeekingState): boolean {
        return this.activeHandler.shouldIgnorePause(seekingState);
    }

    getDebounceTime(seekingState: SeekingState): number {
        return this.activeHandler.getDebounceTime(seekingState);
    }

    attachSiteSpecificListeners(
        seekingState: SeekingState,
    ): (() => void) | null {
        return this.activeHandler.attachSiteSpecificListeners(
            seekingState,
        );
    }
}
