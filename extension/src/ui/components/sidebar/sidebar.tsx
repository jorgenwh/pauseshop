import "../../css/components/sidebar/sidebar.css";
import "../../../global.css";
import "../../css/base.css";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AmazonScrapedProduct } from "../../../types/amazon";

import { ProductStorage, SidebarContentState } from "../../types";
import {
    COMPACT_SIDEBAR_WIDTH,
    EXPANDED_SIDEBAR_WIDTH,
    SIDEBAR_HEADER_HEIGHT,
} from "../../constants";
import Header from "./header";
import Footer from "./footer";
import ExpandedContent from "./expanded-content";
import CompactContent from "./compact-content";
import { countUniqueIcons } from "../../utils";

interface SidebarProps {
    isVisible: boolean;
    contentState: SidebarContentState;
    position: "right" | "left";
    compact: boolean;
    productStorage: ProductStorage;
    onShow: () => void;
    onHide: () => void;
    onContentStateChange: (state: SidebarContentState) => void;
    onError: (error: Error) => void;
    onProductClick: (product: AmazonScrapedProduct) => void;
    onToggleCompact: () => void;
    onClose: () => void;
}

const Sidebar = ({
    isVisible,
    contentState,
    position,
    compact,
    productStorage,
    onShow,
    onHide,
    onToggleCompact,
    onClose,
}: SidebarProps) => {
    const [currentCompact, setCurrentCompact] = useState<boolean>(compact);
    const [lastUserSelectedCompactState, setLastUserSelectedCompactState] =
        useState<boolean>(compact); // Store the last user-selected compact state
    const [expandedIconCategory, setExpandedIconCategory] = useState<string | null>(null);


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
        // Reset expandedIconCategory when productStorage changes (new pause session)
        setExpandedIconCategory(null);
    }, [productStorage]);

    useEffect(() => {
        if (isVisible) {
            onShow();
        } else {
            onHide();
        }
    }, [isVisible, onShow, onHide]);

    const toggleCompactMode = () => {
        onToggleCompact();
        setExpandedIconCategory(null); // Reset when toggling via button
    };

    const handleIconClick = (iconCategory: string) => {
        setExpandedIconCategory(iconCategory);
        onToggleCompact();
    };

    const getSidebarTransform = () => {
        const currentWidth = currentCompact
            ? COMPACT_SIDEBAR_WIDTH
            : EXPANDED_SIDEBAR_WIDTH;
        if (!isVisible) {
            // Adjust translation to account for the 20px floating offset and 75px button protrusion (increased to 100px for complete hiding)
            return position === "right"
                ? `translateX(${currentWidth + 100}px)`
                : `translateX(-${currentWidth + 100}px)`;
        }
        return `translateX(0)`;
    };

    const iconCount = countUniqueIcons(productStorage);
    const calculatedContentCompactHeight =
        SIDEBAR_HEADER_HEIGHT + iconCount * (35 + 15) + 20;

    const sidebarClasses = [
        "pauseshop-sidebar",
        currentCompact && "pauseshop-sidebar-compact",
        `position-${position}`
    ].filter(Boolean).join(" ");

    return (
        <AnimatePresence mode="sync">
            {isVisible && (
                <motion.div
                    key={currentCompact ? "compact-sidebar" : "expanded-sidebar"}
                    id="pauseshop-sidebar"
                    className={sidebarClasses}
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
                            ? "none" // Height controlled by CSS
                            : contentState === SidebarContentState.LOADING
                                ? "200px"
                                : `${calculatedContentCompactHeight}px`,
                    }}
                >
                    <Header
                        compact={currentCompact}
                        position={position}
                        onToggleCompact={toggleCompactMode}
                        isLoading={contentState === SidebarContentState.LOADING}
                        onClose={onClose}
                    />
                    {currentCompact ? (
                        <CompactContent
                            productStorage={productStorage}
                            isLoading={contentState === SidebarContentState.LOADING}
                            onIconClick={handleIconClick}
                            position={position}
                        />
                    ) : (
                        <ExpandedContent
                            contentState={contentState}
                            productStorage={productStorage}
                            expandedIconCategory={expandedIconCategory}
                        />
                    )}
                    <Footer />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Sidebar;
