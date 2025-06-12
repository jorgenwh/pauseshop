import { useState, useEffect } from "react";
import { motion } from "motion/react";

import { SidebarContentState, SidebarState } from "../types";
import { AmazonScrapedProduct } from "../../types/amazon";
import {
    COMPACT_SIDEBAR_WIDTH,
    SIDEBAR_SLIDE_DURATION,
    SIDEBAR_WIDTH,
} from "../constants";
import SidebarHeader from "./SidebarHeader";
import SidebarFooter from "./SidebarFooter";
import ExpandedSidebarContent from "./ExpandedSidebarContent";
import CollapsedSidebarContent from "./CollapsedSidebarContent";

interface SidebarProps {
    isVisible: boolean;
    contentState: SidebarContentState;
    position: "right" | "left";
    compact: boolean;
    aggregatedProductIcons: { [key: string]: number };
    onShow: () => void;
    onHide: () => void;
    onContentStateChange: (state: SidebarContentState) => void;
    onProductClick: (product: AmazonScrapedProduct) => void; // Keep for future, but not used now
    onError: (error: Error) => void;
    onToggleCompact: () => void;
    onTogglePosition: () => void;
}

const Sidebar = ({
    isVisible,
    contentState,
    position,
    compact,
    aggregatedProductIcons, // Destructure the new prop
    onShow,
    onHide,
    // onContentStateChange,
    onToggleCompact,
    onTogglePosition,
}: SidebarProps) => {
    const [sidebarState, setSidebarState] = useState<SidebarState>(
        SidebarState.HIDDEN,
    );
    const [currentCompact, setCurrentCompact] = useState<boolean>(compact);

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
        setCurrentCompact(compact);
    }, [compact]);

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

    return (
        <motion.div
            id="pauseshop-sidebar"
            className={`pauseshop-sidebar ${currentCompact ? "pauseshop-sidebar-compact" : ""} position-${position}`}
            style={{
                transform: getSidebarTransform(),
                pointerEvents:
                    sidebarState === SidebarState.HIDDEN ? "none" : "auto",
            }}
            animate={currentCompact ? "hidden" : "visible"}
        >
            <SidebarHeader
                compact={currentCompact}
                position={position}
                onToggleCompact={toggleCompactMode}
            />
            {currentCompact ? (
                <CollapsedSidebarContent
                    aggregatedProductIcons={aggregatedProductIcons}
                    isLoading={contentState === SidebarContentState.LOADING}
                />
            ) : (
                <ExpandedSidebarContent contentState={contentState} />
            )}
            <SidebarFooter
                position={position}
                onTogglePosition={onTogglePosition}
            />
        </motion.div>
    );
};

export default Sidebar;
