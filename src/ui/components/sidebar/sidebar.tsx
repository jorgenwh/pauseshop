import "../../css/components/sidebar/sidebar.css";
import "../../../global.css";
import "../../css/base.css";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AmazonScrapedProduct } from "../../../types/amazon";
import {
    getSidebarCompactState,
    setSidebarCompactState,
} from "../../../storage";

import { ProductStorage, SidebarContentState } from "../../types";
import {
    COMPACT_SIDEBAR_WIDTH,
    EXPANDED_SIDEBAR_WIDTH,
    COMPACT_SIDEBAR_STATIC_HEIGHT,
} from "../../constants";
import Header from "./header";
import Footer from "./footer";
import ExpandedContent from "./expanded-content";
import CompactContent from "./compact-content";
import Divider from "./divider";
import FloatingTooltip from "./floating-tooltip";
import { getIconCounts, getUniqueIcons } from "../../utils";

// Helper function to format icon text: replace dashes with spaces and capitalize first letter
const formatIconText = (iconText: string): string => {
    // Replace all dashes with spaces
    const textWithSpaces = iconText.replace(/-/g, ' ');
    // Capitalize the first letter
    return textWithSpaces.charAt(0).toUpperCase() + textWithSpaces.slice(1);
};

interface SidebarProps {
    isVisible: boolean;
    contentState: SidebarContentState;
    position: "right" | "left";
    productStorage: ProductStorage;
    onShow: () => void;
    onHide: () => void;
    onProductClick: (product: AmazonScrapedProduct) => void;
    onClose: () => void;
    onRetryAnalysis: () => void;
    errorMessage?: string;
}

const Sidebar = ({
    isVisible,
    contentState,
    position,
    productStorage,
    onShow,
    onHide,
    onClose,
    onRetryAnalysis,
    errorMessage = "Analysis failed",
}: SidebarProps) => {
    const [isCompact, setIsCompact] = useState<boolean>(true);
    const [
        lastUserSelectedCompactState,
        setLastUserSelectedCompactState,
    ] = useState<boolean>(true);
    const [expandedIconCategory, setExpandedIconCategory] = useState<
        string | null
    >(null);
    const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
    const [hoveredIconElement, setHoveredIconElement] = useState<HTMLElement | null>(null);

    useEffect(() => {
        getSidebarCompactState().then((compact) => {
            setIsCompact(compact);
            setLastUserSelectedCompactState(compact);
        });
    }, []);

    useEffect(() => {
        if (
            contentState === SidebarContentState.LOADING ||
            contentState === SidebarContentState.NO_PRODUCTS
        ) {
            setIsCompact(true);
        } else {
            setIsCompact(lastUserSelectedCompactState);
        }

        // Clear tooltip when content state changes, especially to loading
        if (contentState === SidebarContentState.LOADING) {
            setHoveredIcon(null);
            setHoveredIconElement(null);
        }
    }, [contentState, lastUserSelectedCompactState]);

    useEffect(() => {
        setExpandedIconCategory(null);
    }, [productStorage]);

    useEffect(() => {
        if (isVisible) {
            onShow();
        } else {
            onHide();
        }
    }, [isVisible, onShow, onHide]);

    const toggleCompactMode = (iconCategory?: string) => {
        const newCompactState = !isCompact;
        setIsCompact(newCompactState);
        setLastUserSelectedCompactState(newCompactState);
        setSidebarCompactState(newCompactState);
        setExpandedIconCategory(iconCategory || null);
    };

    const handleIconClick = (iconCategory: string) => {
        // Clear the hovered icon state when clicking any icon
        setHoveredIcon(null);
        setHoveredIconElement(null);

        if (contentState === SidebarContentState.NO_PRODUCTS || contentState === SidebarContentState.ERROR) {
            onRetryAnalysis();
        } else {
            toggleCompactMode(iconCategory);
        }
    };

    const getSidebarTransform = () => {
        const currentWidth = isCompact
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

    const iconCounts = getIconCounts(productStorage);
    const iconCategories = getUniqueIcons(productStorage);
    const firstIconCategory = iconCategories.values().next().value;
    const firstIconHasCounter = !!(firstIconCategory && iconCounts[firstIconCategory] > 1);

    const sidebarClasses = [
        "pauseshop-sidebar",
        isCompact && "pauseshop-sidebar-compact",
        `position-${position}`
    ].filter(Boolean).join(" ");

    const sidebarHeight = !isCompact || contentState === SidebarContentState.PRODUCTS ? "auto" : `${COMPACT_SIDEBAR_STATIC_HEIGHT}px`;
 
    return (
        <AnimatePresence mode="sync">
            {isVisible && (
                <motion.div
                    key={isCompact ? "compact-sidebar" : "expanded-sidebar"}
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
                        height: sidebarHeight,
                    }}
                >
                    <Header
                        compact={isCompact}
                        position={position}
                        onToggleCompact={toggleCompactMode}
                        contentState={contentState}
                        onClose={onClose}
                    />
                    <Divider compact={isCompact} />
                    {isCompact ? (
                        <CompactContent
                            productStorage={productStorage}
                            onIconClick={handleIconClick}
                            contentState={contentState}
                            position={position}
                            onRetryAnalysis={onRetryAnalysis}
                            firstIconHasCounter={firstIconHasCounter}
                            onIconHover={(category, element) => {
                                setHoveredIcon(category);
                                setHoveredIconElement(element || null);
                            }}
                        />
                    ) : (
                        <ExpandedContent
                            contentState={contentState}
                            productStorage={productStorage}
                            expandedIconCategory={expandedIconCategory}
                        />
                    )}
                    <Footer />

                    {/* Render floating tooltip outside the sidebar */}
                    {isVisible && isCompact && hoveredIcon && (
                        <FloatingTooltip
                            key={`tooltip-${hoveredIcon}`}
                            text={
                                hoveredIcon === "nothing-found" 
                                    ? "No products found.\nClick to try again." 
                                    : hoveredIcon === "error"
                                        ? `${errorMessage}`
                                        : formatIconText(hoveredIcon)
                            }
                            isVisible={!!hoveredIcon}
                            position={position}
                            iconElement={hoveredIconElement}
                        />
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Sidebar;
