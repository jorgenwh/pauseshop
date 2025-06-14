import "../../global.css";
import "../styles.css";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

import { ProductStorage, SidebarContentState } from "../types";
import { AmazonScrapedProduct } from "../../types/amazon";
import {
    COMPACT_SIDEBAR_WIDTH,
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
    onProductClick: (product: AmazonScrapedProduct) => void;
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
            `0s`, // Set transition speed to 0 for snapping
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
            onShow();
        } else {
            onHide();
        }
    }, [isVisible, onShow, onHide]);

    const toggleCompactMode = () => {
        onToggleCompact();
    };

    const getSidebarTransform = () => {
        const currentWidth = currentCompact
            ? COMPACT_SIDEBAR_WIDTH
            : SIDEBAR_WIDTH;
        if (!isVisible) {
            // Adjust translation to account for the 20px floating offset and 35px button protrusion (increased to 60px for complete hiding)
            return position === "right"
                ? `translateX(${currentWidth + 60}px)`
                : `translateX(-${currentWidth + 60}px)`;
        }
        return `translateX(0)`;
    };

    const iconCount = countUniqueIcons(productStorage);
    const calculatedContentCompactHeight =
        SIDEBAR_HEADER_HEIGHT + iconCount * (35 + 15) + 20;

    return (
        <AnimatePresence mode="sync">
            {isVisible && (
                <motion.div
                    key={currentCompact ? "compact-sidebar" : "expanded-sidebar"}
                    id="pauseshop-sidebar"
                    className={`pauseshop-sidebar ${currentCompact ? "pauseshop-sidebar-compact" : ""} position-${position}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 600,
                        mass: .5,
                        damping: 35,
                        bounce: 0.4,
                        duration: 0.1,
                    }}
                    style={{
                        transform: getSidebarTransform(),
                        pointerEvents: isVisible ? "auto" : "none",
                        maxHeight: !currentCompact
                            ? "100vh"
                            : contentState === SidebarContentState.LOADING
                                ? "200px"
                                : `${calculatedContentCompactHeight}px`,
                    }}
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
                            productStorage={productStorage}
                        />
                    )}
                    <SidebarFooter />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Sidebar;



