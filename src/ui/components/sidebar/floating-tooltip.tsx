import { motion, AnimatePresence } from "motion/react";
import "../../css/components/sidebar/floating-tooltip.css";

interface FloatingTooltipProps {
    text: string;
    isVisible: boolean;
    position: "right" | "left";
    iconElement: HTMLElement | null;
}

const FloatingTooltip = ({ text, isVisible, position, iconElement }: FloatingTooltipProps) => {
    // Calculate position based on the icon element's position
    const getTooltipStyle = () => {
        if (!iconElement) return {};

        const rect = iconElement.getBoundingClientRect();
        // Raise the tooltip by 10px from the center
        const top = rect.top + (rect.height / 2) - 12;

        return {
            top: `${top}px`,
        };
    };

    return (
        <AnimatePresence>
            {isVisible && iconElement && (
                <motion.div
                    className={`pauseshop-floating-tooltip position-${position}`}
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
