# Site Handlers

This directory contains site-specific handlers for video detection and seeking behavior customization.

## Architecture

The site handler system allows for platform-specific customizations without cluttering the main video detector logic. Each site can have its own handler that implements the `SiteHandler` interface.

## Files

- **`site-handler.ts`** - Defines the `SiteHandler` interface that all handlers must implement
- **`youtube-handler.ts`** - Handles YouTube-specific seeking detection and interaction patterns
- **`default-handler.ts`** - Fallback handler for sites without specific customizations
- **`site-handler-registry.ts`** - Manages and coordinates all site handlers

## How It Works

1. **Initialization**: The `SiteHandlerRegistry` checks all registered handlers to find one that applies to the current site
2. **Fallback**: If no specific handler matches, the `DefaultHandler` is used
3. **Integration**: The active handler provides site-specific behavior for:
   - User interaction detection
   - Pause event filtering
   - Debounce timing
   - Additional event listeners

## Adding New Site Handlers

To add support for a new video platform:

1. Create a new handler file (e.g., `netflix-handler.ts`)
2. Implement the `SiteHandler` interface
3. Register it in `site-handler-registry.ts`

### Example Handler Structure

```typescript
import { SiteHandler } from './site-handler';

export class NewSiteHandler implements SiteHandler {
    isApplicable(): boolean {
        return window.location.hostname.includes('newsite.com');
    }

    handleUserInteraction(config: VideoDetectorConfig, seekingState: SeekingState) {
        return (event: Event): void => {
            // Site-specific interaction logic
        };
    }

    shouldIgnorePause(seekingState: SeekingState): boolean {
        // Site-specific pause filtering logic
        return false;
    }

    getDebounceTime(seekingState: SeekingState): number {
        // Site-specific debounce timing
        return 300;
    }

    attachSiteSpecificListeners(config: VideoDetectorConfig, seekingState: SeekingState): (() => void) | null {
        // Site-specific event listeners
        return null;
    }
}
```

## YouTube Handler Details

The YouTube handler addresses specific timing issues where:
- Pause events fire before seeking events
- User interactions on the progress bar need to be detected early
- Longer debounce times are needed for seeking operations

This prevents false pause detection during seeking operations while maintaining normal pause functionality.