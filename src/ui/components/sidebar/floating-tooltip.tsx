import { motion, AnimatePresence } from "motion/react";
import "../../css/components/sidebar/floating-tooltip.css";
import { COMPACT_SIDEBAR_WIDTH } from "../../constants";

interface FloatingTooltipProps {
    text: string;
    isVisible: boolean;
    position: "right" | "left";
    iconElement: HTMLElement | null;
    sidebarPosition?: { left?: number; right?: number; top?: number };
}

const FloatingTooltip = ({ text, isVisible, position, iconElement, sidebarPosition }: FloatingTooltipProps) => {
    // Calculate position based on the icon element's position
    const getTooltipStyle = () => {
        if (!iconElement) return {};

        const rect = iconElement.getBoundingClientRect();
        // Raise the tooltip by 10px from the center
        const top = rect.top + (rect.height / 2) - 12;

        const style: React.CSSProperties = {
            top: `${top}px`,
        };

        // If we have custom sidebar positioning (YouTube Shorts), calculate tooltip position accordingly
        if (sidebarPosition && (sidebarPosition.left !== undefined || sidebarPosition.right !== undefined)) {
            const TOOLTIP_SPACING = 10; // Space between sidebar and tooltip

            if (position === "left" && sidebarPosition.left !== undefined) {
                // Sidebar is positioned at sidebarPosition.left, tooltip goes to the right of it
                style.left = `${sidebarPosition.left + COMPACT_SIDEBAR_WIDTH + TOOLTIP_SPACING}px`;
                style.right = 'auto';
            } else if (position === "right" && sidebarPosition.right !== undefined) {
                // Sidebar is positioned at sidebarPosition.right from the right edge, tooltip goes to the left of it
                style.right = `${sidebarPosition.right + COMPACT_SIDEBAR_WIDTH + TOOLTIP_SPACING}px`;
                style.left = 'auto';
            }
        }

        return style;
    };

    return (
        <AnimatePresence>
            {isVisible && iconElement && (
                <motion.div
                    className={`freezeframe-floating-tooltip position-${position}`}
                    style={getTooltipStyle()}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        bounce: 0.5,
                    }}
                >
                    {text}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FloatingTooltip;
