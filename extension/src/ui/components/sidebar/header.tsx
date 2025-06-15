import { motion } from "motion/react";
import { SIDEBAR_HEADER_HEIGHT, SIDEBAR_HEADER_HEIGHT_COMPACT, SIDEBAR_HEADER_ICON_SIZE } from "../../constants";
import "../../css/components/sidebar/header.css";

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
    isLoading: boolean;
    onClose: () => void;
}

const SidebarHeader = ({
    compact,
    position,
    onToggleCompact,
    isLoading,
    onClose,
}: SidebarHeaderProps) => {
    const getToggleButtonIcon = () => {
        return compact ? "expand.png" : "collapse.png";
    };

    return (
        <div
            className="pauseshop-sidebar-header"
            style={{
                height: `${compact ? SIDEBAR_HEADER_HEIGHT_COMPACT : SIDEBAR_HEADER_HEIGHT}px`,
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
                style={{
                    position: 'absolute',
                    top: '12px',
                    left: position === 'right' ? 'auto' : '50%',
                    right: position === 'right' ? '50%' : 'auto',
                    transform: position === 'right' ? 'translateX(50%)' : 'translateX(-50%)',
                    fontSize: '2.5rem'
                }}
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
            {!isLoading && (
                <motion.div
                    className="pauseshop-sidebar-button-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                        duration: 0.4,
                        scale: {
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            bounce: 0.5,
                        },
                    }}
                >
                    <button
                        className="pauseshop-sidebar-close-button"
                        onClick={onClose}
                        title="Close PauseShop"
                    >
                        <img
                            src={chrome.runtime.getURL("icons/close.png")}
                            alt="Close"
                            className="pauseshop-button-icon"
                        />
                    </button>
                    <button
                        className="pauseshop-sidebar-toggle-button"
                        onClick={onToggleCompact}
                    >
                        <img
                            src={chrome.runtime.getURL(`icons/${getToggleButtonIcon()}`)}
                            alt={compact ? "Expand" : "Collapse"}
                            className="pauseshop-button-icon"
                        />
                    </button>
                </motion.div>
            )}
        </div>
    );
};

export default SidebarHeader;
