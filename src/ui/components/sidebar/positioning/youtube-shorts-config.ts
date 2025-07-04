/**
 * Configuration for YouTube Shorts sidebar positioning
 * Easily adjustable values for fine-tuning sidebar positioning
 */

export const YOUTUBE_SHORTS_POSITIONING = {
    // Offset from video edge (positive = away from video, negative = towards video)
    left: {
        compact: -60,      // Compact sidebar when in left mode
        expanded: -300,    // Expanded sidebar when in left mode
        loading: -60,      // Loading state when in left mode
    },
    right: {
        compact: 60,       // Compact sidebar when in right mode
        expanded: 300,     // Expanded sidebar when in right mode
        loading: 60,       // Loading state when in right mode
    },
    // Vertical offset from video top
    verticalOffset: 80,
    // Minimum distance from screen edges
    minEdgeDistance: 20,
};

import { SidebarPosition } from '../../../types';

export type PositionMode = 'compact' | 'expanded' | 'loading';
