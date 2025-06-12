import { motion } from "motion/react";
import { SIDEBAR_HEADER_HEIGHT, SIDEBAR_HEADER_ICON_SIZE } from "../constants";

const textVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: "tween",
            ease: "easeOut",
            duration: 0.2,
        },
    },
};

const headerContainerVariants = {
    visible: {
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.05,
        },
    },
};

interface SidebarHeaderProps {
    compact: boolean;
    position: "right" | "left";
    onToggleCompact: () => void;
}

const SidebarHeader = ({
    compact,
    position,
    onToggleCompact,
}: SidebarHeaderProps) => {
    const getToggleButtonIconClass = () => {
        if (compact) {
            return position === "right" ? "arrow-left" : "arrow-right";
        } else {
            return position === "right" ? "arrow-right" : "arrow-left";
        }
    };

    return (
        <div
            className="pauseshop-sidebar-header"
            style={{
                height: `${SIDEBAR_HEADER_HEIGHT}px`,
            }}
        >
            <img
                src={chrome.runtime.getURL("icons/icon-128.png")}
                alt="PauseShop Icon"
                className={`pauseshop-sidebar-header-icon icon`}
                style={{
                    width: `${SIDEBAR_HEADER_ICON_SIZE}px`,
                    height: `${SIDEBAR_HEADER_ICON_SIZE}px`,
                }}
            />
            <motion.div
                className="pauseshop-sidebar-header-title-container"
                variants={headerContainerVariants}
            >
                <motion.h1
                    className="pauseshop-sidebar-header-title-pause"
                    variants={textVariants}
                >
                    Pause
                </motion.h1>
                <motion.h1
                    className="pauseshop-sidebar-header-title-shop"
                    variants={textVariants}
                >
                    Shop
                </motion.h1>
            </motion.div>
            <button
                className="pauseshop-sidebar-toggle-button"
                onClick={onToggleCompact}
            >
                <span
                    className={`arrow-icon ${getToggleButtonIconClass()}`}
                ></span>
            </button>
        </div>
    );
};

export default SidebarHeader;
