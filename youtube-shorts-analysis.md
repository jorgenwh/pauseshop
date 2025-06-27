# YouTube Shorts DOM Analysis

## Common Shorts Container Selectors (based on YouTube's current structure):

### Primary Containers:
- `#shorts-container` - Main shorts container
- `ytd-shorts` - Custom element for shorts
- `[data-shorts-container]` - Data attribute selector
- `.ytd-reel-video-renderer` - Individual short video
- `#player-container-outer` - Player wrapper (in shorts context)

### Content Positioning:
- Shorts are typically centered in viewport
- Video player has specific dimensions (usually 9:16 aspect ratio)
- UI controls overlay the video (like, dislike, share buttons on right side)

### Layout Characteristics:
- Desktop: Shorts container is centered, ~405px wide typically
- Mobile: Full width with different control positioning
- The actual video element is within multiple nested containers

## Positioning Strategy:
1. Find the shorts video container
2. Get its bounding rectangle
3. Calculate sidebar position relative to container edges
4. Add configurable offset (e.g., 20px gap)