/**
 * Calculator for determining optimal sidebar position relative to content
 */

import { ContentBounds, PositionStrategy, RelativePositionConfig } from './types';

export class RelativePositionCalculator {
    /**
     * Get custom offset for YouTube Shorts based on sidebar state and side
     */
    private getShortsCustomOffset(side: 'left' | 'right', isCompact: boolean, baseOffset: number): number {
        if (side === 'left') {
            if (isCompact) {
                // Left mode compact: 100px to the left (further from video)
                return baseOffset + 50;
            } else {
                // Left mode expanded: 50px to the right (closer to video)
                return baseOffset - 0;
            }
        } else { // right side
            if (isCompact) {
                // Right mode compact: 50px to the right (further from video)
                return baseOffset + 150;
            } else {
                // Right mode expanded: 100px to the right (further from video)
                return baseOffset + 320;
            }
        }
    }

    /**
     * Calculate optimal sidebar position relative to content
     */
    calculatePosition(
        contentBounds: ContentBounds,
        sidebarWidth: number,
        config: RelativePositionConfig
    ): PositionStrategy {
        const { bounds } = contentBounds;
        const { offsetGap, preferredSide, isCompact = true } = config;

        // For YouTube Shorts, use custom offsets based on sidebar state
        let leftOffset = offsetGap;
        let rightOffset = offsetGap;

        if (contentBounds.type === 'youtube-shorts') {
            leftOffset = this.getShortsCustomOffset('left', isCompact, offsetGap);
            rightOffset = this.getShortsCustomOffset('right', isCompact, offsetGap);
        }

        // Calculate both possible positions with custom offsets
        const leftPosition = bounds.left - sidebarWidth - leftOffset;
        const rightPosition = bounds.right + rightOffset;

        // Check which positions are viable (within viewport)
        const viewportWidth = window.innerWidth;
        const leftViable = leftPosition >= 0;
        const rightViable = rightPosition + sidebarWidth <= viewportWidth;

        // Special handling for different content types
        if (contentBounds.type === 'youtube-shorts') {
            return this.calculateShortsPosition(
                bounds, sidebarWidth, config, leftViable, rightViable, leftPosition, rightPosition
            );
        }

        // Default positioning logic
        return this.calculateDefaultPosition(
            bounds, sidebarWidth, config, leftViable, rightViable, leftPosition, rightPosition
        );
    }

    /**
     * Calculate position specifically for YouTube Shorts
     */
    private calculateShortsPosition(
        bounds: DOMRect,
        sidebarWidth: number,
        config: RelativePositionConfig,
        leftViable: boolean,
        rightViable: boolean,
        leftPosition: number,
        rightPosition: number
    ): PositionStrategy {
        const { preferredSide } = config;

        // For shorts, we want to be more aggressive about staying close to content
        // since the content is typically centered and narrower

        if (preferredSide === 'left' && leftViable) {
            return {
                x: leftPosition,
                side: 'left',
                reason: 'shorts-preferred-left'
            };
        } else if (preferredSide === 'right' && rightViable) {
            return {
                x: rightPosition,
                side: 'right',
                reason: 'shorts-preferred-right'
            };
        } else if (preferredSide === 'auto') {
            // For auto mode with shorts, prefer the side with more space
            // but also consider the center position of the content
            const contentCenter = bounds.left + bounds.width / 2;
            const viewportCenter = window.innerWidth / 2;

            // If content is left of center, prefer right side (and vice versa)
            // This creates better visual balance
            if (contentCenter < viewportCenter && rightViable) {
                return {
                    x: rightPosition,
                    side: 'right',
                    reason: 'shorts-auto-balance-right'
                };
            } else if (contentCenter >= viewportCenter && leftViable) {
                return {
                    x: leftPosition,
                    side: 'left',
                    reason: 'shorts-auto-balance-left'
                };
            }

            // Fallback to space-based decision
            const leftSpace = bounds.left;
            const rightSpace = window.innerWidth - bounds.right;

            if (leftSpace >= rightSpace && leftViable) {
                return {
                    x: leftPosition,
                    side: 'left',
                    reason: 'shorts-auto-left-more-space'
                };
            } else if (rightViable) {
                return {
                    x: rightPosition,
                    side: 'right',
                    reason: 'shorts-auto-right-more-space'
                };
            }
        }

        // If preferred position isn't viable, try the other side
        if (!leftViable && rightViable) {
            return {
                x: rightPosition,
                side: 'right',
                reason: 'shorts-fallback-right'
            };
        } else if (!rightViable && leftViable) {
            return {
                x: leftPosition,
                side: 'left',
                reason: 'shorts-fallback-left'
            };
        }

        // Last resort: use fallback position
        return this.getFallbackPosition(config.fallbackPosition, sidebarWidth);
    }

    /**
     * Calculate position for regular content
     */
    private calculateDefaultPosition(
        bounds: DOMRect,
        sidebarWidth: number,
        config: RelativePositionConfig,
        leftViable: boolean,
        rightViable: boolean,
        leftPosition: number,
        rightPosition: number
    ): PositionStrategy {
        const { preferredSide } = config;

        // Choose position based on preference and viability
        if (preferredSide === 'left' && leftViable) {
            return {
                x: leftPosition,
                side: 'left',
                reason: 'preferred-left'
            };
        } else if (preferredSide === 'right' && rightViable) {
            return {
                x: rightPosition,
                side: 'right',
                reason: 'preferred-right'
            };
        } else if (preferredSide === 'auto') {
            // Auto: choose side with more space
            const leftSpace = bounds.left;
            const rightSpace = window.innerWidth - bounds.right;

            if (leftSpace >= rightSpace && leftViable) {
                return {
                    x: leftPosition,
                    side: 'left',
                    reason: 'auto-left-more-space'
                };
            } else if (rightViable) {
                return {
                    x: rightPosition,
                    side: 'right',
                    reason: 'auto-right-more-space'
                };
            }
        }

        // If preferred position isn't viable, try the other side
        if (!leftViable && rightViable) {
            return {
                x: rightPosition,
                side: 'right',
                reason: 'fallback-right'
            };
        } else if (!rightViable && leftViable) {
            return {
                x: leftPosition,
                side: 'left',
                reason: 'fallback-left'
            };
        }

        // Last resort: use fallback position
        return this.getFallbackPosition(config.fallbackPosition, sidebarWidth);
    }

    /**
     * Get fallback position when content-relative positioning fails
     */
    private getFallbackPosition(
        fallbackConfig: { side: 'left' | 'right'; offset: number },
        sidebarWidth: number
    ): PositionStrategy {
        const { side, offset } = fallbackConfig;

        if (side === 'left') {
            return {
                x: offset,
                side: 'left',
                reason: 'fallback-edge-left'
            };
        } else {
            return {
                x: window.innerWidth - sidebarWidth - offset,
                side: 'right',
                reason: 'fallback-edge-right'
            };
        }
    }

    /**
     * Check if a position strategy would result in sidebar being off-screen
     */
    isPositionViable(strategy: PositionStrategy, sidebarWidth: number): boolean {
        if (strategy.side === 'left') {
            return strategy.x >= 0 && strategy.x + sidebarWidth <= window.innerWidth;
        } else {
            return strategy.x >= 0 && strategy.x + sidebarWidth <= window.innerWidth;
        }
    }

    /**
     * Get debug information about position calculation
     */
    getDebugInfo(
        contentBounds: ContentBounds,
        sidebarWidth: number,
        config: RelativePositionConfig
    ): any {
        const strategy = this.calculatePosition(contentBounds, sidebarWidth, config);
        const { bounds } = contentBounds;
        const { offsetGap } = config;

        return {
            contentBounds: {
                left: bounds.left,
                right: bounds.right,
                width: bounds.width,
                height: bounds.height,
                centerX: bounds.left + bounds.width / 2
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            calculations: {
                baseOffsetGap: offsetGap,
                isCompact: config.isCompact || true,
                leftOffset: contentBounds.type === 'youtube-shorts' ?
                    this.getShortsCustomOffset('left', config.isCompact || true, offsetGap) : offsetGap,
                rightOffset: contentBounds.type === 'youtube-shorts' ?
                    this.getShortsCustomOffset('right', config.isCompact || true, offsetGap) : offsetGap,
                leftPosition: bounds.left - sidebarWidth - offsetGap,
                rightPosition: bounds.right + offsetGap,
                leftViable: bounds.left - sidebarWidth - offsetGap >= 0,
                rightViable: bounds.right + offsetGap + sidebarWidth <= window.innerWidth,
                leftSpace: bounds.left,
                rightSpace: window.innerWidth - bounds.right
            },
            strategy,
            config
        };
    }
}
