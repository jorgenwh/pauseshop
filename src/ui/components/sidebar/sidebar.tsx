import "../../css/components/sidebar/sidebar.css";
import "../../../global.css";
import "../../css/base.css";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AmazonScrapedProduct } from "../../../types/amazon";
import {
    sidebarCompactState,
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
import { getIconCounts, getUniqueIcons, formatIconText } from "../../utils";
import { useYouTubeShortsPositioning, useProximityDetection } from "./hooks";
import { browser } from "wxt/browser";
import { safeTranslate } from "../../../utils/language";
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
    currentPageUrl: string;
    videoElement: HTMLVideoElement | null;
}

const Sidebar = ({
    isVisible,
    contentState,
    position,
    productStorage,
    onShow,
    onHide,
    onProductClick,
    onClose,
    onRetryAnalysis,
    errorMessage = "Analysis failed",
    currentPageUrl,
    videoElement,
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

    // Use refs to access current state values in event handlers
    const isHoveringRef = useRef(false);
    const isCompactRef = useRef(true);
    const isVisibleRef = useRef(false);

    useEffect(() => {
        sidebarCompactState.getValue().then((compact) => {
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
            // Reset hover state when forcing compact mode
            isHoveringRef.current = false;
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

    useEffect(() => {
        isCompactRef.current = isCompact;
    }, [isCompact]);

    useEffect(() => {
        isVisibleRef.current = isVisible;
    }, [isVisible]);

    useEffect(() => {
        if (videoElement) {
            console.log("[FreezeFrame] Video element rect:", videoElement.getBoundingClientRect());
        }
    }, [videoElement]);

    // YouTube Shorts positioning logic
    const { isOnYouTubeShorts, youTubeShortsPosition, effectivePosition } = useYouTubeShortsPositioning(
        currentPageUrl,
        videoElement,
        position,
        isCompact,
        contentState,
        isVisible
    );

    // Proximity detection for compact mode button visibility
    const { isNearby: isMouseNearby, elementRef: sidebarRef } = useProximityDetection(
        70, // 100 pixels proximity distance
        isCompact && isVisible // Only enable when in compact mode and visible
    );

    // Handle scroll prevention when hovering over expanded sidebar
    useEffect(() => {
        const handleDocumentWheel = (e: WheelEvent) => {
            // Use refs to get current values (avoids stale closure issues)
            if (isHoveringRef.current && !isCompactRef.current && isVisibleRef.current) {
                const sidebarElement = document.getElementById('freezeframe-sidebar');
                if (!sidebarElement) return;

                // Check if the event target is within the sidebar
                if (!sidebarElement.contains(e.target as Node)) return;

                // Check if the sidebar content can scroll
                const expandedContent = sidebarElement.querySelector('.freezeframe-expanded-sidebar-content');
                if (expandedContent) {
                    const { scrollTop, scrollHeight, clientHeight } = expandedContent;
                    const isScrollable = scrollHeight > clientHeight;
                    const isAtTop = scrollTop === 0;
                    const isAtBottom = Math.abs(scrollTop + clientHeight - scrollHeight) < 1; // Small tolerance for rounding

                    // Allow scrolling within sidebar if it's scrollable and not at boundaries
                    if (isScrollable && ((e.deltaY > 0 && !isAtBottom) || (e.deltaY < 0 && !isAtTop))) {
                        // Let the sidebar handle the scroll, don't prevent it
                        return;
                    }
                }
                // Prevent the event from bubbling to the document (prevents page scroll)
                e.preventDefault();
                e.stopPropagation();
            }
        };

        // Add event listener to document to catch all wheel events
        document.addEventListener('wheel', handleDocumentWheel, { passive: false });

        // Cleanup function to remove event listeners
        return () => {
            document.removeEventListener('wheel', handleDocumentWheel);
        };
    }, []); // Empty dependency array - event listener is stable

    const toggleCompactMode = (iconCategory?: string) => {
        const newCompactState = !isCompact;
        setIsCompact(newCompactState);
        setLastUserSelectedCompactState(newCompactState);
        sidebarCompactState.setValue(newCompactState);
        setExpandedIconCategory(iconCategory || null);

        // Reset hover state when switching modes to ensure clean state
        if (newCompactState) {
            // setIsHoveringExpandedSidebar(false);
            isHoveringRef.current = false;
        }
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
        "freezeframe-sidebar",
        isCompact && "freezeframe-sidebar-compact",
        `position-${position}`,
        isOnYouTubeShorts && "youtube-shorts"
    ].filter(Boolean).join(" ");

    const sidebarHeight = !isCompact || contentState === SidebarContentState.PRODUCTS ? "auto" : `${COMPACT_SIDEBAR_STATIC_HEIGHT}px`;

    // Combine default styles with YouTube Shorts positioning
    const sidebarStyle: React.CSSProperties = {
        transform: getSidebarTransform(),
        pointerEvents: isVisible ? "auto" : "none",
        height: sidebarHeight,
        ...youTubeShortsPosition, // Override position if on YouTube Shorts
    };

    return (
        <AnimatePresence mode="sync">
            {isVisible && (
                <motion.div
                    key={isCompact ? "compact-sidebar" : "expanded-sidebar"}
                    id="freezeframe-sidebar"
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
                    style={sidebarStyle}
                    ref={sidebarRef}
                    onMouseEnter={() => isHoveringRef.current = true}
                    onMouseLeave={() => isHoveringRef.current = false}
                >
                    <Header
                        compact={isCompact}
                        position={effectivePosition}
                        onToggleCompact={toggleCompactMode}
                        contentState={contentState}
                        onClose={onClose}
                        showButtonsInCompact={isMouseNearby}
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
                            onProductClick={onProductClick}
                        />
                    )}
                    <Footer />

                    {/* Render floating tooltip outside the sidebar */}
                    {isVisible && isCompact && hoveredIcon && (
                        <FloatingTooltip
                            key={`tooltip-${hoveredIcon}`}
                            text={
                                hoveredIcon === "nothing-found"
                                     ? safeTranslate('sidebar_content_noProductsFound', 'No products found')                                    : hoveredIcon === "error"
                                        ? `${errorMessage}`
                                        : formatIconText(hoveredIcon)
                            }
                            isVisible={!!hoveredIcon}
                            position={position}
                            iconElement={hoveredIconElement}
                            sidebarPosition={youTubeShortsPosition}
                        />
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Sidebar;
