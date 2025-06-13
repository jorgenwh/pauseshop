import "../../global.css";
import "../styles.css";
import { useState, useEffect } from "react";
import { motion } from "motion/react";

import { ProductStorage, SidebarContentState, SidebarState } from "../types";
import { AmazonScrapedProduct } from "../../types/amazon";
import {
    COMPACT_SIDEBAR_WIDTH,
    SIDEBAR_SLIDE_DURATION,
    SIDEBAR_WIDTH,
    SIDEBAR_HEADER_HEIGHT,
} from "../constants";
import SidebarHeader from "./SidebarHeader";
import SidebarFooter from "./SidebarFooter";
import ExpandedSidebarContent from "./ExpandedSidebarContent";
import CompactSidebarContent from "./CompactSidebarContent";
import { countUniqueIcons } from "../utils";

interface SidebarProps {
    isVisible: boolean;
    contentState: SidebarContentState;
    position: "right" | "left";
    compact: boolean;
    productStorage: ProductStorage;
    onShow: () => void;
    onHide: () => void;
    onContentStateChange: (state: SidebarContentState) => void;
    onProductClick: (product: AmazonScrapedProduct) => void; // Keep for future, but not used now
    onError: (error: Error) => void;
    onToggleCompact: () => void;
}

const Sidebar = ({
    isVisible,
    contentState,
    position,
    compact,
    productStorage,
    onShow,
    onHide,
    // onContentStateChange,
    onToggleCompact,
}: SidebarProps) => {
    const [sidebarState, setSidebarState] = useState<SidebarState>(
        SidebarState.HIDDEN,
    );
    const [currentCompact, setCurrentCompact] = useState<boolean>(compact);
    const [lastUserSelectedCompactState, setLastUserSelectedCompactState] =
        useState<boolean>(compact); // Store the last user-selected compact state

    useEffect(() => {
        document.documentElement.style.setProperty(
            "--sidebar-width",
            `${SIDEBAR_WIDTH}px`,
        );
        document.documentElement.style.setProperty(
            "--sidebar-compact-width",
            `${COMPACT_SIDEBAR_WIDTH}px`,
        );
        document.documentElement.style.setProperty(
            "--sidebar-transition-speed",
            `${SIDEBAR_SLIDE_DURATION}s`,
        );
    }, []); // Run once on mount

    useEffect(() => {
        // Update currentCompact when the prop changes, and store it as the last user-selected state
        setCurrentCompact(compact);
        setLastUserSelectedCompactState(compact);
    }, [compact]);

    useEffect(() => {
        if (contentState === SidebarContentState.LOADING) {
            // When loading, always start in compact mode
            setCurrentCompact(true);
        } else {
            // Once loading completes, revert to the last user-selected state
            setCurrentCompact(lastUserSelectedCompactState);
        }
    }, [contentState, lastUserSelectedCompactState]);

    useEffect(() => {
        if (isVisible) {
            if (
                sidebarState === SidebarState.HIDDEN ||
                sidebarState === SidebarState.SLIDING_OUT
            ) {
                setSidebarState(SidebarState.SLIDING_IN);
                const timer = setTimeout(() => {
                    setSidebarState(SidebarState.VISIBLE);
                    onShow();
                }, SIDEBAR_SLIDE_DURATION * 1000); // Convert seconds to milliseconds
                return () => clearTimeout(timer);
            }
        } else {
            if (
                sidebarState === SidebarState.VISIBLE ||
                sidebarState === SidebarState.SLIDING_IN
            ) {
                setSidebarState(SidebarState.SLIDING_OUT);
                const timer = setTimeout(() => {
                    setSidebarState(SidebarState.HIDDEN);
                    onHide();
                }, SIDEBAR_SLIDE_DURATION * 1000); // Convert seconds to milliseconds
                return () => clearTimeout(timer);
            }
        }
    }, [isVisible, sidebarState, onShow, onHide]);

    const toggleCompactMode = () => {
        onToggleCompact();
    };

    const getSidebarTransform = () => {
        const currentWidth = currentCompact
            ? COMPACT_SIDEBAR_WIDTH
            : SIDEBAR_WIDTH;
        if (
            sidebarState === SidebarState.HIDDEN ||
            sidebarState === SidebarState.SLIDING_OUT
        ) {
            // Adjust translation to account for the 20px floating offset and 35px button protrusion (increased to 60px for complete hiding)
            return position === "right"
                ? `translateX(${currentWidth + 60}px)`
                : `translateX(-${currentWidth + 60}px)`;
        }
        return `translateX(0)`;
    };

    const getCompactHeight = () => {
        if (!currentCompact) {
            return {}; // Don't apply height styles if not compact
        }

        const iconCount = countUniqueIcons(productStorage);
        if (contentState === SidebarContentState.LOADING || iconCount === 0) {
            return { maxHeight: "200px" };
        }

        // Calculate height: Header + (Icon Height + Gap) * Num Icons + Bottom Padding
        const newHeight = SIDEBAR_HEADER_HEIGHT + iconCount * (35 + 15) + 20;
        return { maxHeight: `${newHeight}px` };
    };

    return (
        <motion.div
            id="pauseshop-sidebar"
            className={`pauseshop-sidebar ${currentCompact ? "pauseshop-sidebar-compact" : ""} position-${position}`}
            style={{
                transform: getSidebarTransform(),
                pointerEvents:
                    sidebarState === SidebarState.HIDDEN ? "none" : "auto",
                ...getCompactHeight(),
            }}
            animate={currentCompact ? "hidden" : "visible"}
        >
            <SidebarHeader
                compact={currentCompact}
                position={position}
                onToggleCompact={toggleCompactMode}
                isLoading={contentState === SidebarContentState.LOADING}
            />
            {currentCompact ? (
                <CompactSidebarContent
                    productStorage={productStorage}
                    isLoading={contentState === SidebarContentState.LOADING}
                />
            ) : (
                <ExpandedSidebarContent
                    contentState={contentState}
                    // productStorage={productStorage} // Pass productStorage here
                />
            )}
            <SidebarFooter />
        </motion.div>
    );
};

export default Sidebar;
